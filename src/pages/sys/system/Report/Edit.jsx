import React, { PureComponent } from 'react';
import { Button, Form, Card, Input, Switch, Upload, InputNumber } from 'antd';
import { formatMessage } from 'umi/locale';
import { connect } from 'dva';
import update from 'immutability-helper';
import classnames from 'classnames';
import { isEmpty } from 'ramda';

import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import Title from '@/components/layout/Title';
import EditableDataTable from '@/components/common/EditableDataTable';
import { genFakeId } from '@/utils/mathUtils';
import { editParam, addParam, delParam } from '@/utils/urlUtils';
import { Selection } from '@/pages/gen/field';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import { fromQs } from '@/utils/stringUtils';
import { selectReport } from '@/services/sys/system/report';
import { queryUdc } from '@/services/gen/app';

const DOMAIN = 'reportMgtEdit';
const { Field } = FieldList;

@connect(({ loading, reportMgtEdit, dispatch }) => ({
  loading,
  reportMgtEdit,
  dispatch,
}))
@Form.create({
  onValuesChange(props, changedValues, allValues) {
    if (isEmpty(changedValues)) return;
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: changedValues,
    });
  },
})
@mountToTab()
class ReportMgtEdit extends PureComponent {
  state = {
    fileList: [],
    udcData: [],
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const { id } = fromQs();
    dispatch({ type: `${DOMAIN}/clean` });
    queryUdc('TSK:SELECTOR_TYPE').then(({ response }) => this.setState({ udcData: response }));
    if (id) {
      dispatch({
        type: `${DOMAIN}/query`,
        payload: id,
      });
    } else {
      dispatch({
        type: `${DOMAIN}/baseUrl`,
      });
    }
  }

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      reportMgtEdit: { formData, dataList },
      dispatch,
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/save`,
          payload: { formData, dataList },
        });
        // ????????????
        const { fileList } = this.state;
        if (fileList.length) {
          const fileData = new FormData();
          fileList.forEach(file => {
            fileData.append('file', file);
          });
          dispatch({
            type: `${DOMAIN}/upload`,
            payload: fileData,
          });
        }
      }
    });
  };

  onCellChanged = (rowIndex, rowField) => rowFieldValue => {
    const {
      dispatch,
      reportMgtEdit: { formData, dataList, reportUrl },
    } = this.props;

    // ???????????? [????????????] ?????? [????????????]
    if (rowField === 'parameType') {
      dataList[rowIndex].parameDef = null;
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          dataList,
        },
      });
    }

    // ????????????
    let value = null;
    if (rowField === 'showFlag') {
      value = rowFieldValue ? 'YES' : 'NO';
    } else {
      value = rowFieldValue && rowFieldValue.target ? rowFieldValue.target.value : rowFieldValue;
    }

    // ???????????? [????????????] ?????? [?????????]
    if (dataList[rowIndex].parameType === 'SELECTOR' && rowField === 'parameDef') {
      const { udcData } = this.state;
      const { sphd1 } = udcData.filter(v => v.code === value)[0];
      dataList[rowIndex]['sourceKey'] = sphd1;
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          dataList,
        },
      });
    }

    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        dataList: update(dataList, {
          [rowIndex]: {
            [rowField]: {
              $set: value,
            },
          },
        }),
      },
    });

    const val = rowFieldValue && rowFieldValue.target ? rowFieldValue.target.value : rowFieldValue;

    // Key
    if (rowField === 'parameVar') {
      let url = reportUrl;
      dataList.forEach((v, i) => {
        const { parameVar, parameVal, showFlag } = v;
        if (showFlag === 'YES') {
          if (i === rowIndex) {
            url = addParam(url, val, parameVal);
          } else {
            url = addParam(url, parameVar, parameVal);
          }
        }
      });
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: {
          reportUrl: url,
        },
      });
    }
    // value
    if (rowField === 'parameVal') {
      let url = reportUrl;
      dataList.forEach((v, i) => {
        const { parameVar, parameVal, showFlag } = v;
        if (showFlag === 'YES') {
          if (i === rowIndex) {
            url = addParam(url, parameVar, val);
          } else {
            url = addParam(url, parameVar, parameVal);
          }
        }
      });
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: {
          reportUrl: url,
        },
      });
    }
    // ????????????
    if (rowField === 'showFlag') {
      // ??????false ??????url params
      const { parameVar, parameVal } = dataList[rowIndex];
      if (rowFieldValue) {
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            reportUrl: addParam(formData.reportUrl, parameVar, parameVal),
          },
        });
      } else {
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            reportUrl: delParam(formData.reportUrl, parameVar),
          },
        });
      }
    }
  };

  render() {
    const {
      loading,
      dispatch,
      reportMgtEdit: { formData, dataList, reportUrl },
      form: { getFieldDecorator },
    } = this.props;
    const { fileList } = this.state;
    const { id } = fromQs();
    const disabledBtn = id ? loading.effects[`${DOMAIN}/query`] : false;

    const tableProps = {
      sortBy: 'id',
      rowKey: 'id',
      loading: disabledBtn,
      pagination: false,
      dataSource: dataList,
      total: dataList.length || 0,
      onAdd: newRow => {
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataList: update(dataList, {
              $push: [
                {
                  ...newRow,
                  id: genFakeId(-1),
                  showFlag: 'YES',
                },
              ],
            }),
          },
        });
      },
      onDeleteItems: (selectedRowKeys, selectedRows) => {
        const { delParameIds } = formData;
        const newDataList = dataList.filter(
          row => !selectedRowKeys.filter(keyValue => keyValue === row.id).length
        );
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataList: newDataList,
          },
        });
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            delParameIds: selectedRowKeys.filter(row => row > 0).concat(delParameIds),
          },
        });

        let url = reportUrl;
        newDataList.forEach((v, i) => {
          const { parameVar, parameVal, showFlag } = v;
          if (showFlag === 'YES') {
            url = addParam(url, parameVar, parameVal);
          }
        });
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            reportUrl: url,
          },
        });
      },
      onCopyItem: copied => {
        const newDataList = update(dataList, {
          $push: copied.map(item => ({
            ...item,
            id: genFakeId(-1),
          })),
        });
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataList: newDataList,
          },
        });

        let url = reportUrl;
        newDataList.forEach((v, i) => {
          const { parameVar, parameVal, showFlag } = v;
          if (showFlag === 'YES') {
            url = addParam(url, parameVar, parameVal);
          }
        });
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            reportUrl: url,
          },
        });
      },
      columns: [
        {
          title: '????????????',
          dataIndex: 'parameName',
          required: true,
          options: {
            rules: [
              {
                required: true,
                message: '?????????????????????',
              },
            ],
          },
          render: (value, row, index) => (
            <Input value={value} onChange={this.onCellChanged(index, 'parameName')} />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'parameVar',
          required: true,
          options: {
            rules: [
              {
                required: true,
                message: '?????????????????????',
              },
            ],
          },
          render: (value, row, index) => (
            <Input value={value} onChange={this.onCellChanged(index, 'parameVar')} />
          ),
        },
        {
          title: '?????????',
          dataIndex: 'parameVal',
          render: (value, row, index) => (
            <Input value={value} onChange={this.onCellChanged(index, 'parameVal')} />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'parameType',
          align: 'center',
          width: 180,
          required: true,
          options: {
            rules: [
              {
                required: true,
                message: '?????????????????????',
              },
            ],
          },
          render: (value, row, index) => (
            <Selection.UDC
              value={value}
              code="OPE_REPORT_PARAME_TYPE"
              placeholder="?????????????????????"
              onChange={this.onCellChanged(index, 'parameType')}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'parameDef',
          align: 'center',
          width: 180,
          required: true,
          render: (value, row, index) => {
            const { parameType } = row;
            if (parameType === 'UDC') {
              return (
                <Input
                  value={value}
                  onChange={this.onCellChanged(index, 'parameDef')}
                  placeholder="?????????UDC"
                />
              );
            }
            if (parameType === 'SELECTOR') {
              return (
                <Selection.UDC
                  value={value}
                  code="TSK:SELECTOR_TYPE"
                  placeholder="???????????????"
                  onChange={this.onCellChanged(index, 'parameDef')}
                />
              );
            }
            return null;
          },
        },
        {
          title: '????????????',
          dataIndex: 'showFlag',
          align: 'center',
          width: 100,
          render: (value, row, index) => (
            <Switch checked={value === 'YES'} onChange={this.onCellChanged(index, 'showFlag')} />
          ),
        },
      ],
      buttons: [],
    };

    const uploadProps = {
      multiple: true,
      onRemove: file => {
        this.setState(state => {
          const index = state.fileList.indexOf(file);
          const newFileList = state.fileList.slice();
          newFileList.splice(index, 1);
          return {
            fileList: newFileList,
          };
        });
      },
      beforeUpload: file => {
        this.setState(state => ({
          fileList: [...state.fileList, file],
        }));
      },
      fileList,
    };

    return (
      <PageHeaderWrapper title="????????????">
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            disabled={disabledBtn}
            onClick={this.handleSave}
          >
            {formatMessage({ id: `misc.save`, desc: '??????' })}
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            onClick={() => closeThenGoto('/sys/system/report')}
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>

        <Card
          className="tw-card-adjust"
          bordered={false}
          title={<Title icon="profile" text="????????????" />}
        >
          <FieldList
            layout="horizontal"
            getFieldDecorator={getFieldDecorator}
            col={2}
            hasSeparator={1}
          >
            <Field
              name="reportTitle"
              label="????????????"
              decorator={{
                initialValue: formData.reportTitle,
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <Input placeholder="?????????????????????" />
            </Field>

            <Field
              name="showMode"
              label="????????????"
              decorator={{
                initialValue: formData.showMode,
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <Selection.UDC
                code="TSK:REPORT_SHOW_MODE"
                placeholder="?????????????????????"
                onChange={value => {
                  dispatch({
                    type: `${DOMAIN}/updateForm`,
                    payload: {
                      reportUrl: editParam(formData.reportUrl, 'op', value),
                    },
                  });
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      reportUrl: editParam(reportUrl, 'op', value),
                    },
                  });
                }}
              />
            </Field>

            <Field
              name="reportCode"
              label="????????????"
              decorator={{
                initialValue: formData.reportCode,
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <Input placeholder="?????????????????????" />
            </Field>

            <Field
              name="reportStatus"
              label="????????????"
              decorator={{
                initialValue: formData.reportStatus,
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <Selection.UDC code="TSK:SHOW_FLAG" placeholder="?????????????????????" />
            </Field>

            <Field
              name="reportType"
              label="????????????"
              decorator={{
                initialValue: formData.reportType,
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <Selection.UDC code="OPE:REPORT_TYPE" placeholder="?????????????????????" />
            </Field>

            <Field
              name="reportSort"
              label="??????(??????)"
              decorator={{
                initialValue: formData.reportSort,
              }}
            >
              <InputNumber className="x-fill-100" placeholder="???????????????" />
            </Field>

            <Field name="attache" label="????????????">
              <Upload {...uploadProps}>
                <Button className="tw-btn-primary" type="primary" icon="upload">
                  ????????????
                </Button>
              </Upload>
            </Field>

            <Field
              name="reportUrl"
              label="????????????"
              decorator={{
                initialValue: formData.reportUrl,
              }}
              fieldCol={1}
              labelCol={{ span: 4, xxl: 3 }}
              wrapperCol={{ span: 19, xxl: 20 }}
            >
              <Input placeholder="?????????????????????" />
            </Field>

            {/* <Field
              name="remark"
              label="????????????"
              decorator={{
                initialValue: formData.remark,
              }}
              fieldCol={1}
              labelCol={{ span: 4, xxl: 3 }}
              wrapperCol={{ span: 19, xxl: 20 }}
            >
              <Selection.Columns
                transfer={{ code: 'id', name: 'name' }}
                source={() => selectReport()}
                placeholder="?????????????????????"
                mode="multiple"
                columns={[
                  { dataIndex: 'code', title: '??????', span: 10 },
                  { dataIndex: 'name', title: '??????', span: 14 },
                ]}
                showSearch
                allowClear
              />
            </Field> */}

            <Field
              name="reportMark"
              label="??????"
              decorator={{
                initialValue: formData.reportMark,
              }}
              fieldCol={1}
              labelCol={{ span: 4, xxl: 3 }}
              wrapperCol={{ span: 19, xxl: 20 }}
            >
              <Input.TextArea placeholder="???????????????" rows={3} />
            </Field>
          </FieldList>
        </Card>

        {formData.reportType === 'SHOW_ROOM' && (
          <Card
            className="tw-card-adjust"
            bordered={false}
            title={<Title icon="profile" text="????????????" />}
            style={{ marginTop: 6 }}
          >
            <EditableDataTable {...tableProps} />
          </Card>
        )}

        <Card
          className="tw-card-adjust"
          bordered={false}
          title={<Title icon="profile" text="???????????????" />}
          style={{ marginTop: 6 }}
        >
          <FieldList
            layout="horizontal"
            getFieldDecorator={getFieldDecorator}
            col={1}
            hasSeparator={1}
          >
            <Field
              name="relatedIds"
              label="????????????"
              decorator={{
                initialValue: Array.isArray(formData.relatedIds) ? formData.relatedIds : [],
              }}
              labelCol={{ span: 4, xxl: 3 }}
              wrapperCol={{ span: 19, xxl: 20 }}
            >
              <Selection.Columns
                transfer={{ code: 'id', name: 'name' }}
                source={() => selectReport()}
                placeholder="?????????????????????"
                mode="multiple"
                columns={[
                  { dataIndex: 'code', title: '??????', span: 10 },
                  { dataIndex: 'name', title: '??????', span: 14 },
                ]}
                showSearch
                allowClear
              />
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ReportMgtEdit;
