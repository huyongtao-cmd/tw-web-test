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
import { fromQs } from '@/utils/stringUtils';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';

const { Field } = FieldList;
const DOMAIN = 'growthCompoundPermission';

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
    this.fetchData();
    const { dispatch } = this.props;
    const { id, taskId } = fromQs();
    taskId && dispatch({ type: `${DOMAIN}/fetchConfig`, payload: taskId });
  }

  fetchData = () => {
    const { dispatch } = this.props;
    const { id } = fromQs();
    dispatch({
      type: `${DOMAIN}/getCapaAccEssViewById`,
      payload: {
        id,
      },
    });
  };

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      growthCompoundPermission: { formData = {} },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      // if (!error) {
      //   dispatch({
      //     type: `${DOMAIN}/saveCapa`,
      //     payload: { ...formData, ...values },
      //   });
      // }
    });
  };

  handleCancel = () => {
    closeThenGoto('/user/center/growth');
  };

  render() {
    const { form, growthCompoundPermission, loading, dispatch } = this.props;
    const { getFieldDecorator } = form;
    const { formData = {}, flowDataSource, fieldsConfig, flowForm } = growthCompoundPermission;
    const abilityIntroTableProps = {
      domain: DOMAIN, // ?????? ????????????????????????????????????
      rowKey: 'id',
      loading,
      // total,
      dataSource: flowDataSource.selectCapaset || [],
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
    //   dataSource: flowDataSource.selectCapasetById ? [flowDataSource.selectCapasetById] : [],
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
        <BpmWrapper
          fieldsConfig={fieldsConfig} // ??????json??????????????????
          flowForm={flowForm}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { key } = operation;
            const {
              form: { validateFieldsAndScroll },
            } = this.props;
            if (key === 'FLOW_RETURN') {
              return Promise.resolve(true);
            }
            validateFieldsAndScroll((error, values) => {
              if (!error) {
                const { accessFlag, applyDesc } = values;
                const { remark, cc, branch } = bpmForm;
                const { id, taskId, prcId, from } = fromQs();
                const flow = {};
                flow.taskId = taskId;
                flow.branch = branch;
                flow.remark = remark;
                flow.ccCrowd = cc;
                flow.result = 'APPROVED';
                // flow.doc = {};
                const {
                  applyResId,
                  applyDate,
                  buId,
                  presId,
                  selectCapaset = [],
                  selectCapasetById,
                } = flowDataSource;
                let newSelectCapaset = [];
                selectCapaset && selectCapaset.forEach(item => newSelectCapaset.push(item.id));
                newSelectCapaset = newSelectCapaset.join(',');
                const obj = {
                  id,
                  applyResId,
                  applyDate,
                  buId,
                  presId,
                  capasetLevelId: newSelectCapaset,
                  capaSetId: selectCapasetById.id,
                  applyDesc,
                };
                dispatch({
                  type: `${DOMAIN}/approve`,
                  payload: {
                    ...obj,
                    accessFlag,
                    flow,
                  },
                }).then(res => {
                  if (res.ok) {
                    closeThenGoto(
                      `/user/center/growth/compoundPermission/view?id=${id}&prcId=${prcId}&taskId=${taskId}&mode=view&from=${from}`
                    );
                  }
                });
              }
            });
            return Promise.resolve(false);
          }}
        >
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
                  initialValue: flowDataSource.applyResName,
                }}
              >
                <Input placeholder="" disabled />
              </Field>

              <Field
                name="applyDate"
                label="????????????"
                decorator={{
                  initialValue: flowDataSource.applyDate,
                }}
              >
                <Input placeholder="" disabled />
              </Field>

              <Field
                name="buName"
                label="BaseBU"
                decorator={{
                  initialValue: flowDataSource.buName,
                }}
              >
                <Input placeholder="" disabled />
              </Field>

              <Field
                name="personName"
                label="??????"
                decorator={{
                  initialValue: flowDataSource.personName,
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
                <span>
                  {flowDataSource.selectCapasetById ? flowDataSource.selectCapasetById.name : null}
                </span>
              </Field>
              <Field
                name="applyDesc"
                label="????????????"
                decorator={{
                  initialValue: flowDataSource.applyDesc,
                }}
                fieldCol={1}
                labelCol={{ span: 3, xxl: 3 }}
                wrapperCol={{ span: 21, xxl: 21 }}
                style={{
                  marginBottom: '20px',
                }}
              >
                <Input.TextArea
                  rows={3}
                  disabled={
                    !(fieldsConfig && fieldsConfig.taskKey === 'ACC_A67_01_ACCESS_SUBMIT_i')
                  }
                  placeholder="?????????????????????"
                />
              </Field>
              {fieldsConfig && fieldsConfig.taskKey === 'ACC_A67_02_APPRESULT' ? (
                <Field
                  name="accessFlag"
                  label="??????????????????"
                  fieldCol={1}
                  labelCol={{ span: 3, xxl: 3 }}
                  wrapperCol={{ span: 21, xxl: 21 }}
                  decorator={{
                    initialValue: formData.accessFlag,
                    rules: [
                      {
                        required: true,
                        message: '???????????????????????????',
                      },
                    ],
                  }}
                >
                  <Radio.Group
                    disabled={!(fieldsConfig && fieldsConfig.taskKey === 'ACC_A67_02_APPRESULT')}
                  >
                    <Radio value="YES">???</Radio>
                    <Radio value="NO">???</Radio>
                  </Radio.Group>
                </Field>
              ) : null}
              {fieldsConfig && fieldsConfig.taskKey !== 'ACC_A67_02_APPRESULT' ? (
                <Field
                  name="accessFlag"
                  label="??????????????????"
                  fieldCol={1}
                  labelCol={{ span: 3, xxl: 3 }}
                  wrapperCol={{ span: 21, xxl: 21 }}
                  decorator={{
                    initialValue: flowDataSource.accessFlag,
                    rules: [
                      // {
                      //   required: true,
                      //   message: '???????????????????????????',
                      // },
                    ],
                  }}
                >
                  <Radio.Group disabled>
                    <Radio value="YES">???</Radio>
                    <Radio value="NO">???</Radio>
                  </Radio.Group>
                </Field>
              ) : null}
            </FieldList>
          </Card>
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default CompoundPermission;
