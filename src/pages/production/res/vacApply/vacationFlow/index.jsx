import React, { Component } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { isEmpty, isNil, hasIn } from 'ramda';
import { Select, Card, Form, Input, Radio, Divider, Modal } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm.tsx';
import FormItem from '@/components/production/business/FormItem.tsx';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import FieldList from '@/components/layout/FieldList';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import { pushFlowTask } from '@/services/gen/flow';
import { createConfirm } from '@/components/core/Confirm';
import { FileManagerEnhance, Selection, DatePicker } from '@/pages/gen/field';
import { selectInternalOus } from '@/services/gen/list';
import { sub, genFakeId } from '@/utils/mathUtils';
import { getUrl } from '@/utils/flowToRouter';
import { fromQs } from '@/utils/stringUtils';
import ResVacationTable from './table/ResVacationTable';
import DetailEntityTable from './table/DetailEntityTable';
import RecentResVacationTable from './table/RecentResVacationTable';
import ViewDetail from './ViewDetail';
import TaskOne from './TaskOne';

const DOMAIN = 'vacationFlowNew';

@connect(({ loading, vacationFlowNew, dispatch }) => ({
  loading: loading.effects[`${DOMAIN}/submit`],
  ...vacationFlowNew,
  dispatch,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      if (Array.isArray(tempValue)) {
        tempValue.forEach((temp, index) => {
          Object.keys(temp).forEach(detailKey => {
            fields[`${key}[${index}].${detailKey}`] = Form.createFormField({
              value: temp[detailKey],
            });
          });
        });
      } else {
        fields[key] = Form.createFormField({ value: tempValue });
      }
    });
    return fields;
  },
  onValuesChange(props, changedValues, allValues) {
    if (isEmpty(changedValues)) return;
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    const newFieldData = { [name]: value };
    switch (name) {
      default:
        break;
    }
    props.dispatch({
      type: `${DOMAIN}/updateFormForEditTable`,
      payload: newFieldData,
    });
  },
})
@mountToTab()
class VacationApplyFlow extends Component {
  componentDidMount() {
    const { id, copy, mode, currentNode = 'create', taskId } = fromQs();
    const formMode = mode === 'edit' || mode === 'EDIT' ? 'EDIT' : 'DESCRIPTION';
    // const {
    //   formData,
    //   user: { extInfo = {} }, // ?????????????????????resId
    // } = this.props;
    taskId && this.callModelEffects('fetchConfig', taskId);
    id && this.callModelEffects('queryDetail', id);
  }

  /**
   * ??????model???state
   * ??????????????????????????????????????????,????????????model???state???????????????????????????dispatch
   * @param params state??????
   */
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  /**
   * ??????model???????????????
   * ??????????????????????????????????????????,??????????????????????????????????????????????????????dispatch
   * @param method ??????????????????
   * @param params ??????????????????
   */
  callModelEffects = async (method, params) => {
    const { dispatch } = this.props;
    return dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  render() {
    const {
      form,
      loading,
      dispatch,
      formData,
      resData,
      baseBuData,
      flowForm,
      fieldsConfig,
      formMode,
      currentNode,
    } = this.props;
    const { taskKey, buttons } = fieldsConfig;
    const { id, taskId, prcId, from, mode } = fromQs();
    return (
      <PageHeaderWrapper>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          buttonLoading={loading}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { remark, branch } = bpmForm;
            const { key, branches } = operation;
            if (key === 'FLOW_PASS') {
              if (taskKey === 'RES_R04_02_HR_APPROVE') {
                form.validateFieldsAndScroll((error, values) => {
                  if (values.addFlag == null) {
                    createMessage({ type: 'warn', description: '?????????????????????????????????' });
                    return;
                  }
                  this.callModelEffects('updateForm', {
                    ...values,
                  });
                });
                const { addFlag, addList, date } = formData;
                if (addFlag && !addList) {
                  form.setFields({
                    addList: {
                      value: undefined,
                      errors: [new Error('???????????????????????????')],
                    },
                  });
                }
                dispatch({
                  type: `${DOMAIN}/submit`,
                  payload: {
                    result: 'APPROVED',
                    taskId,
                    procRemark: remark,
                    branch,
                    dryRunFlag: true,
                    submit: true,
                  },
                });
              } else {
                dispatch({
                  type: `${DOMAIN}/submit`,
                  payload: {
                    result: 'APPROVED',
                    taskId,
                    procRemark: remark,
                    branch,
                    dryRunFlag: true,
                    submit: true,
                  },
                });
              }
            }

            if (key === 'FLOW_RETURN') {
              createConfirm({
                content: '??????????????????????????????',
                onOk: () => {
                  pushFlowTask(taskId, {
                    remark,
                    result: 'REJECTED',
                    branch,
                    submit: true,
                  }).then(({ status, response }) => {
                    if (status === 200) {
                      createMessage({ type: 'success', description: '????????????' });
                      const url = getUrl().replace('edit', 'view');
                      closeThenGoto(url);
                    }
                    return Promise.resolve(false);
                  });
                },
              });
            }
            if (key === 'FLOW_COMMIT') {
              dispatch({
                type: `${DOMAIN}/submit`,
                payload: {
                  result: 'APPROVED',
                  taskId,
                  procRemark: remark,
                  branch,
                  dryRunFlag: true,
                  submit: true,
                },
              });
            }
          }}
        >
          {mode === 'edit' && taskKey === 'RES_R04_01_SUBMIT_i' && <TaskOne />}
          {mode === 'edit' &&
            taskKey !== 'RES_R04_01_SUBMIT_i' && (
              <BusinessForm
                title="????????????"
                form={form}
                formData={formData}
                formMode={formMode}
                defaultColumnStyle={12}
              >
                <FormItem fieldType="BaseInput" label="?????????" fieldKey="apprResName" disabled />
                <FormItem fieldType="BaseInput" label="????????????" fieldKey="apprDate" disabled />
                <FormItem fieldType="BaseInput" label="????????????" fieldKey="applyNo" disabled />
                <FormItem
                  fieldType="BaseInput"
                  label="????????????"
                  fieldKey="vacationTypeDesc"
                  disabled
                />
                <FormItem
                  fieldType="BaseDateRangePicker"
                  label="????????????/?????????"
                  fieldKey="date"
                  disabled
                />
                <FormItem fieldType="BaseInput" label="????????????" fieldKey="vacationDays" disabled />
                <FormItem
                  fieldType="BaseFileManagerEnhance"
                  label="???????????????"
                  fieldKey="attachment"
                  api="/api/production/vac/sfs/token"
                  dataKey={formData.id}
                  disabled
                />
                <FormItem fieldType="BaseInputTextArea" label="??????" fieldKey="reason" disabled />
                <FormItem
                  fieldType="BaseInputTextArea"
                  label="????????????"
                  fieldKey="workPlan"
                  disabled
                />
                <FormItem
                  fieldType="BaseFileManagerEnhance"
                  label="??????????????????"
                  fieldKey="hrAttachment"
                  api="/api/production/vacAdd/sfs/token"
                  dataKey={formData.id}
                  visible={
                    formData.vacationTypeDesc !== '??????' && formData.vacationTypeDesc !== '??????'
                  }
                  disabled={currentNode !== 'hrCheck'}
                />
                <FormItem
                  fieldType="BaseRadioSelect"
                  label="?????????????????????"
                  fieldKey="addFlag"
                  options={[{ label: '???', value: '1' }, { label: '???', value: '0' }]}
                  visible={
                    formData.vacationTypeDesc !== '??????' && formData.vacationTypeDesc !== '??????'
                  }
                  disabled={currentNode !== 'hrCheck'}
                  required
                />
                <FormItem
                  fieldType="BaseInputTextArea"
                  label="??????????????????"
                  fieldKey="addList"
                  visible={
                    formData.vacationTypeDesc !== '??????' && formData.vacationTypeDesc !== '??????'
                  }
                  disabled={currentNode !== 'hrCheck'}
                />
                <FormItem
                  fieldType="BaseFileManagerEnhance"
                  label="????????????"
                  fieldKey="addAttachment"
                  api="/api/production/vacAddAtt/sfs/token"
                  dataKey={formData.id}
                  visible={
                    formData.vacationTypeDesc !== '??????' &&
                    formData.vacationTypeDesc !== '??????' &&
                    currentNode !== 'hrCheck'
                  }
                  disabled={currentNode !== 'addCheck'}
                />
              </BusinessForm>
            )}
          {mode === 'edit' && taskKey !== 'RES_R04_01_SUBMIT_i' && <DetailEntityTable />}
          {mode === 'view' && <ViewDetail />}
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default VacationApplyFlow;
