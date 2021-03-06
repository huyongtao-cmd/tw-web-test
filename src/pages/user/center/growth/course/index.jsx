import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, hasIn } from 'ramda';
import { Card, Form, Input, Divider, Tooltip, InputNumber, Radio } from 'antd';
import moment from 'moment';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import FieldList from '@/components/layout/FieldList';
import DataTable from '@/components/common/DataTable';
import EditableDataTable from '@/components/common/EditableDataTable';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import { pushFlowTask } from '@/services/gen/flow';
import { createConfirm } from '@/components/core/Confirm';
import { add, genFakeId } from '@/utils/mathUtils';
import { selectUsersWithBu, selectCapasetLevel } from '@/services/gen/list';
import { UdcSelect, Selection } from '@/pages/gen/field';
import { getUrl } from '@/utils/flowToRouter';
import { fromQs } from '@/utils/stringUtils';

const { Field, FieldLine } = FieldList;
const RadioGroup = Radio.Group;

const DOMAIN = 'growthCourse';

@connect(({ loading, growthCourse, dispatch }) => ({
  loading,
  growthCourse,
  dispatch,
}))
@Form.create({
  onValuesChange(props, changedValues, allValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
@mountToTab()
class Course extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
    const { dispatch } = this.props;
    const { id, pid, pcontractId, taskId } = fromQs();
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        id,
      },
    });
    taskId &&
      dispatch({
        type: `${DOMAIN}/fetchConfig`,
        payload: taskId,
      });
  };

  render() {
    const {
      loading,
      dispatch,
      form: { getFieldDecorator, validateFieldsAndScroll },
      growthCourse: { formData, flowForm, fieldsConfig },
    } = this.props;

    const { taskKey, buttons } = fieldsConfig;
    const { id, taskId, prcId, from, mode } = fromQs();

    return (
      <PageHeaderWrapper>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { remark, branch } = bpmForm;
            const { key, branches } = operation;
            const resultParams = {
              FLOW_PASS: 'APPROVED',
              FLOW_COMMIT: 'APPLIED',
              FLOW_RETURN: 'REJECTED',
            };
            validateFieldsAndScroll((error, values) => {
              if (!error) {
                const params = {
                  ...formData,
                  flow: {
                    branch,
                    remark,
                    result: resultParams[key],
                    taskId,
                  },
                };
                dispatch({
                  type: `${DOMAIN}/courseApplyHandle`,
                  payload: params,
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
            <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
              <Field
                name="applyResId"
                label="?????????"
                decorator={{
                  initialValue: formData.applyResId || '',
                }}
              >
                <Selection.Columns
                  source={selectUsersWithBu}
                  columns={[
                    { dataIndex: 'code', title: '??????', span: 10 },
                    { dataIndex: 'name', title: '??????', span: 14 },
                  ]}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  placeholder="?????????"
                  disabled
                />
              </Field>
              <Field
                name="applyDate"
                label="????????????"
                decorator={{
                  initialValue: formData.applyDate || '',
                }}
              >
                <Input disabled placeholder="????????????" />
              </Field>

              <Field
                name="baseBu"
                label="BaseBU"
                decorator={{
                  initialValue: formData.baseBu || '',
                }}
              >
                <Input disabled placeholder="baseBu" />
              </Field>
              <Field
                name="presId"
                label="????????????"
                decorator={{
                  initialValue: formData.presId || '',
                }}
              >
                <Selection.Columns
                  source={selectUsersWithBu}
                  columns={[
                    { dataIndex: 'code', title: '??????', span: 10 },
                    { dataIndex: 'name', title: '??????', span: 14 },
                  ]}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  placeholder="????????????"
                  disabled
                />
              </Field>
              <Field
                name="resTypeName"
                label="????????????"
                decorator={{
                  initialValue: formData.resTypeName || '',
                }}
              >
                <Input disabled placeholder="????????????" />
              </Field>
              <Field
                name="courseNo"
                label="????????????"
                decorator={{
                  initialValue: formData.courseNo || '',
                }}
              >
                <Input disabled placeholder="????????????" />
              </Field>
              <Field
                name="capaLevelName"
                label="????????????"
                decorator={{
                  initialValue: formData.capaLevelName || '',
                }}
              >
                <Input disabled placeholder="????????????" />
              </Field>
              <Field
                name="capaAbilityName"
                label="???????????????"
                decorator={{
                  initialValue: formData.capaAbilityName || '',
                }}
              >
                <Input disabled placeholder="???????????????" />
              </Field>
              <Field
                name="accessFlag"
                label="??????????????????"
                decorator={{
                  initialValue: formData.accessFlag || '',
                  rules: [{ required: mode !== 'view', message: '?????????????????????????????????' }],
                }}
              >
                <RadioGroup disabled={mode === 'view'}>
                  <Radio value="YES">???</Radio>
                  <Radio value="NO">???</Radio>
                </RadioGroup>
              </Field>
            </FieldList>
          </Card>
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default Course;
