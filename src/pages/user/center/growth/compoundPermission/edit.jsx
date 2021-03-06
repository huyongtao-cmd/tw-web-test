import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import classnames from 'classnames';
import { Button, Form, Card, Input, List, Row, Col, Radio, DatePicker, Divider, Icon } from 'antd';

import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import { FileManagerEnhance, UdcSelect, Selection } from '@/pages/gen/field';
import DataTable from '@/components/common/DataTable';
import Title from '@/components/layout/Title';
import { selectUsersWithBu } from '@/services/gen/list';
import { fromQs } from '@/utils/stringUtils';
import styles from '../index.less';

const { Field } = FieldList;
const DOMAIN = 'growthCompoundPermission';
const RadioGroup = Radio.Group;

@connect(({ growthCompoundPermission }) => ({ growthCompoundPermission }))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const { name, value } = Object.values(changedFields)[0];
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { [name]: value },
    });
  },
})
@mountToTab()
class CompoundPermission extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/clean`,
    }).then(res => this.fetchData());
  }

  fetchData = () => {
    const { dispatch } = this.props;
    const { id } = fromQs();
    dispatch({
      type: `${DOMAIN}/getCapaAccEssView`,
      payload: {
        id,
      },
    });
  };

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      growthCompoundPermission: { dataSource },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const {
          applyResId,
          applyDate,
          buId,
          presId,
          selectCapaset = [],
          selectCapasetById,
          apprResId: _apprResId,
        } = dataSource;
        const { apprResId, applyDesc } = values;
        let newSelectCapaset = [];
        selectCapaset && selectCapaset.forEach(item => newSelectCapaset.push(item.id));
        newSelectCapaset = newSelectCapaset.join(',');
        const obj = {
          applyResId,
          applyDate,
          buId,
          presId,
          apprResId: apprResId || _apprResId,
          applyDesc,
          capasetLevelId: newSelectCapaset,
          capaSetId: selectCapasetById.id,
        };
        dispatch({
          type: `${DOMAIN}/save`,
          payload: obj,
        });
      }
    });
  };

  handleCancel = () => {
    closeThenGoto('/user/center/growth');
  };

  render() {
    const { form, growthCompoundPermission, loading, dispatch } = this.props;
    const { getFieldDecorator } = form;
    const { formData = {}, dataSource } = growthCompoundPermission;
    const abilityIntroTableProps = {
      domain: DOMAIN, // ?????? ????????????????????????????????????
      rowKey: 'id',
      loading,
      // total,
      dataSource: dataSource.selectCapaset || [],
      pagination: false,
      enableSelection: false,
      showColumn: false,
      showSearch: false,
      showExport: false,
      columns: [
        {
          title: '??????',
          align: 'center',
          dataIndex: 'capasetNo',
          key: 'capasetNo',
          width: '15%',
        },
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'name',
          key: 'name',
          width: '20%',
        },
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'eqvaRatio',
          key: 'eqvaRatio',
          width: '10%',
        },
        // {
        //   title: '????????????',
        //   align: 'center',
        //   dataIndex: 'obtainMethodName',
        //   key: 'obtainMethodName',
        //   width: '15%',
        // },
        // {
        //   title: '????????????',
        //   align: 'center',
        //   dataIndex: 'isHavecapaSet',
        //   key: 'isHavecapaSet',
        //   width: '10%',
        // },
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'obtainDate',
          key: 'obtainDate',
          width: '15%',
        },
        {
          title: '????????????',
          dataIndex: 'ddesc',
          key: 'ddesc',
          // width: '25%',
          render: (value, row, key) => <pre>{row.ddesc}</pre>,
        },
      ],
    };
    // const abilityApplyTableProps = {
    //   domain: DOMAIN, // ?????? ????????????????????????????????????
    //   rowKey: 'id',
    //   loading,
    //   // total,
    //   dataSource: dataSource.selectCapasetById ? [dataSource.selectCapasetById] : [],
    //   pagination: false,
    //   enableSelection: false,
    //   showColumn: false,
    //   showSearch: false,
    //   showExport: false,
    //   columns: [
    //     {
    //       title: '??????',
    //       align: 'center',
    //       dataIndex: 'capasetNo',
    //       key: 'capasetNo',
    //       width: '15%',
    //     },
    //     {
    //       title: '????????????',
    //       align: 'center',
    //       dataIndex: 'name',
    //       key: 'name',
    //       width: '20%',
    //     },
    //     {
    //       title: '????????????',
    //       align: 'center',
    //       dataIndex: 'eqvaRatio',
    //       key: 'eqvaRatio',
    //       width: '10%',
    //     },
    //     {
    //       title: '????????????',
    //       dataIndex: 'ddesc',
    //       key: 'ddesc',
    //       // width: '25%',
    //       render: (value, row, key) => <pre>{row.ddesc}</pre>,
    //     },
    //   ],
    // };
    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            disabled={false}
            onClick={this.handleSave}
          >
            {formatMessage({ id: `misc.submit`, desc: '??????' })}
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={this.handleCancel}
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>
        <Card
          className="tw-card-adjust"
          style={{ marginTop: '6px' }}
          title={<Title icon="profile" text="????????????????????????" />}
          bordered={false}
        >
          <FieldList getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="applyResName"
              label="?????????"
              decorator={{
                initialValue: dataSource.applyResName,
              }}
            >
              <Input placeholder="" disabled />
            </Field>

            <Field
              name="applyDate"
              label="????????????"
              decorator={{
                initialValue: dataSource.applyDate,
              }}
            >
              <Input placeholder="" disabled />
            </Field>

            <Field
              name="buName"
              label="BaseBU"
              decorator={{
                initialValue: dataSource.buName,
              }}
            >
              <Input placeholder="" disabled />
            </Field>

            <Field
              name="personName"
              label="??????"
              decorator={{
                initialValue: dataSource.personName,
              }}
            >
              <Input placeholder="" disabled />
            </Field>
          </FieldList>
          <Divider dashed />
          <div>
            <span style={{ color: '#999', marginLeft: 22 }}>???????????????</span>
            <DataTable {...abilityIntroTableProps} />
          </div>
          <FieldList getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="selectCapasetById"
              label="??????????????????"
              fieldCol={1}
              labelCol={{ span: 3, xxl: 3 }}
              wrapperCol={{ span: 21, xxl: 21 }}
              style={{
                marginBottom: '20px',
              }}
            >
              <span>{dataSource.selectCapasetById ? dataSource.selectCapasetById.name : null}</span>
            </Field>
            <Field
              name="applyDesc"
              label="????????????"
              decorator={{
                initialValue: formData.applyDesc,
              }}
              fieldCol={1}
              labelCol={{ span: 3, xxl: 3 }}
              wrapperCol={{ span: 21, xxl: 21 }}
              style={{
                marginBottom: '20px',
              }}
            >
              <Input.TextArea rows={3} placeholder="?????????????????????" />
            </Field>
            {dataSource.resList && dataSource.resList.length ? (
              <Field
                name="apprResId"
                label="?????????"
                decorator={{
                  initialValue: formData.apprResId,
                  rules: [
                    {
                      required: true,
                      message: '??????????????????',
                    },
                  ],
                }}
                fieldCol={1}
                labelCol={{ span: 3, xxl: 3 }}
                wrapperCol={{ span: 6, xxl: 6 }}
              >
                <Selection.Columns
                  source={dataSource.resList || []}
                  // columns={[
                  //   { dataIndex: 'code', title: '??????', span: 10 },
                  //   { dataIndex: 'name', title: '??????', span: 14 },
                  // ]}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  placeholder="??????????????????"
                  showSearch
                />
              </Field>
            ) : null}
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CompoundPermission;
