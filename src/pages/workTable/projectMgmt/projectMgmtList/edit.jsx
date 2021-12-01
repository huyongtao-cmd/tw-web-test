import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import { Form, Table } from 'antd';
import moment from 'moment';
import router from 'umi/router';
import BusinessForm from '@/components/production/business/BusinessForm';
import { createConfirm } from '@/components/core/Confirm';
import FormItem from '@/components/production/business/FormItem';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { fromQs } from '@/utils/production/stringUtil';
import createMessage from '@/components/core/AlertMessage';
import Schedle from '@/pages/workTable/Schedule';

const DOMAIN = 'projectMgmtListEdit';

@connect(({ user: { user }, loading, projectMgmtListEdit, dispatch }) => ({
  loading,
  ...projectMgmtListEdit,
  dispatch,
  user,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      fields[key] = Form.createFormField({ value: tempValue });
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
      type: `${DOMAIN}/updateForm`,
      payload: newFieldData,
    });
  },
})
class index extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id, mode, taskId } = fromQs();
    const href = window.location.pathname + window.location.search;
    const formMode =
      mode === 'edit' || mode === 'ADD' || mode === 'EDIT' || !mode ? 'EDIT' : 'DESCRIPTION';
    this.updateModelState({ formMode, id, href, taskId, mode });
    this.callModelEffects('projectRoleSelect');
    this.callModelEffects('quertAddrList', { limit: 10 });
    this.callModelEffects('queryCompanyList', { innerType: 'INTERNAL' });
    // this.callModelEffects('queryRoleList');
    id && this.callModelEffects('queryDetails', { id });
    taskId && this.callModelEffects('fetchConfig', taskId);
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    this.callModelEffects('cleanState');
  }

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  /**
   * 修改model层state
   * 这个方法是仅是封装一个小方法,后续修改model的state时不需要每次都解构dispatch
   * @param params state参数
   */
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  handleSubmit = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      formData: { ...newFormData },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      const { projectStartDate, projectEndDate } = newFormData;
      if (moment(projectStartDate).isAfter(moment(projectEndDate))) {
        createMessage({
          type: 'warn',
          description: `项目结束日期不能早于项目开始日期！`,
        });
        return;
      }
      if (!error) {
        dispatch({
          type: `${DOMAIN}/projectManagementEdit`,
          payload: {
            ...newFormData,
            ...values,
            projectStatus: 'READY',
          },
        });
      }
    });
  };

  handleSave = (flag, procRemark) => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      formData: { ...newFormData },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      const { projectStartDate, projectEndDate, scheduleList } = newFormData;
      const newScheduleList = scheduleList.map(item => {
        if (item.remark === '') {
          return {
            ...item,
            remark: null,
          };
        }
        return item;
      });
      if (moment(projectStartDate).isAfter(moment(projectEndDate))) {
        createMessage({
          type: 'warn',
          description: `项目结束日期不能早于项目开始日期！`,
        });
        return;
      }
      if (!error) {
        dispatch({
          type: `${DOMAIN}/projectManagementEdit`,
          payload: {
            ...newFormData,
            ...values,
            scheduleList: newScheduleList,
            submit: flag,
            procRemark,
          },
        });
      }
    });
  };

  // 配置所需要的内容
  renderPage = () => {
    const {
      formData,
      formMode,
      form,
      user: {
        extInfo: { resId, userId, baseBuId },
      },
      addrList,
      companyList,
      projectRoleOptions,
    } = this.props;
    const fields = [
      <BusinessFormTitle title="基本信息" />,
      <FormItem
        label="项目编号"
        key="projectNo"
        fieldKey="projectNo"
        fieldType="BaseInput"
        initialValue={formData.projectNo}
        placeholder="系统自定生成"
        disabled
      />,
      <FormItem
        label="项目名称"
        key="projectName"
        fieldKey="projectName"
        fieldType="BaseInput"
        initialValue={formData.projectName}
        required
      />,
      <FormItem
        fieldType="BaseSelect"
        label="项目类型"
        key="businessClass1"
        fieldKey="businessClass1"
        parentKey="FUNCTION:CONTRACT:BUSINESS_CLASS1"
        initialValue={formData.businessClass1}
        required
      />,
      <FormItem
        fieldType="BaseSelect"
        label="业务类型"
        key="businessClass2"
        fieldKey="businessClass2"
        parentKey="FUNCTION:CONTRACT:BUSINESS_CLASS2"
        initialValue={formData.businessClass2}
        required
      />,
      <FormItem
        fieldType="BaseSelect"
        label="项目状态"
        key="projectStatus"
        fieldKey="projectStatus"
        parentKey="PRO:PROJECT_STATUS"
        initialValue={formData.projectStatus}
        disabled
      />,
      <FormItem
        label="项目负责人"
        key="projectDutyResId"
        fieldKey="projectDutyResId"
        fieldType="ResSimpleSelect"
        required
      />,
      <FormItem
        label="销售负责人"
        key="salesDutyResId"
        fieldKey="salesDutyResId"
        fieldType="ResSimpleSelect"
        // initialValue={resId}
        required
      />,
      <FormItem
        label="销售负责部门"
        key="salesDutyBuId"
        fieldKey="salesDutyBuId"
        fieldType="BuSimpleSelect"
        // initialValue={baseBuId}
        required
      />,
      <FormItem
        label="归属公司"
        key="ouId"
        fieldKey="ouId"
        fieldType="BaseSelect"
        descList={companyList}
        initialValue={formData.ouId}
      />,
      <FormItem
        label="客户"
        key="customerAbNo"
        fieldKey="customerAbNo"
        fieldType="BaseSelect"
        descList={addrList}
        // fieldType="ResSimpleSelect"
        // initialValue={resId}
        required
      />,
      <FormItem
        label="最终客户"
        key="finalCustomerAbNo"
        fieldKey="finalCustomerAbNo"
        fieldType="BaseSelect"
        descList={addrList}
        // fieldType="ResSimpleSelect"
        // initialValue={resId}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="城市"
        key="city"
        fieldKey="city"
        parentKey="FUNCTION:REGION:NAME"
        initialValue={formData.city}
      />,
      <FormItem
        label="附件"
        key="attachmentIds"
        fieldKey="attachmentIds"
        fieldType="FileUpload"
        fileList={formData.attachments}
        maxFileSize={2}
        accept="*"
        multiple
      />,
      <FormItem
        label="项目开始日期"
        key="startDate"
        fieldKey="startDate"
        fieldType="BaseDatePicker"
        initialValue={formData.startDate}
      />,
      <FormItem
        label="项目结束日期"
        key="endDate"
        fieldKey="endDate"
        fieldType="BaseDatePicker"
        initialValue={formData.endDate}
      />,
      <FormItem fieldType="Group" label="创建人" form={form} required>
        <FormItem
          key="createUserId"
          fieldKey="createUserId"
          fieldType="UserSimpleSelect"
          initialValue={userId}
          disabled
        />
        <FormItem
          key="roleIdList"
          fieldKey="roleIdList"
          fieldType="BaseSelect"
          descList={projectRoleOptions}
          // initialValue={formData.roleIdsDesc}
          mode="multiple"
        />
      </FormItem>,

      <FormItem
        label="备注"
        key="remark"
        fieldKey="remark"
        fieldType="BaseInputTextArea"
        initialValue={formData.remark}
      />,
    ];

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={12}>
        {fields}
      </BusinessForm>
    );
  };

  render() {
    const {
      loading,
      dispatch,
      form,
      formMode,
      formData,
      id,
      fieldsConfig,
      flowForm,
      taskId,
    } = this.props;
    const { projectStatus } = formData;
    const disabledBtn = loading.effects[`${DOMAIN}/projectManagementEdit`];
    const queryDetails =
      loading.effects[`${DOMAIN}/queryDetails`] || loading.effects[`${DOMAIN}/fetchConfig`];
    const fetchConfig = loading.effects[`${DOMAIN}/fetchConfig`];
    const allBpm = [{ docId: formData.id, procDefKey: 'PRO_P02', title: '项目立项流程' }];
    return (
      <PageWrapper loading={queryDetails}>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          buttonLoading={fetchConfig || disabledBtn}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { remark, branch } = bpmForm;
            const { taskKey } = fieldsConfig;
            const { key } = operation;
            // const payload = {
            //   taskId: param.taskId,
            //   remark: bpmForm.remark,
            // };
            // console.log(taskKey,operation)
            if (key === 'FLOW_COMMIT' && taskKey === 'PRO_P02_01_SUBMIT_i') {
              this.handleSave(true, remark);
              return Promise.resolve(false);
            }
            return Promise.resolve(true);
          }}
        >
          <ButtonCard>
            <Button
              icon="save"
              size="large"
              type="primary"
              onClick={() => this.handleSave(false)}
              disabled={disabledBtn}
            >
              保存
            </Button>
            {projectStatus !== 'READY' && (
              <Button
                icon="save"
                size="large"
                type="primary"
                onClick={this.handleSubmit}
                disabled={disabledBtn}
              >
                提交
              </Button>
            )}

            {formMode === 'DESCRIPTION' && (
              <Button
                size="large"
                type="primary"
                onClick={() => {
                  router.push(`/workTable/projectMgmt/projectTeam/teamList?projectId=${id}`);
                }}
                disabled={disabledBtn}
              >
                成员管理
              </Button>
            )}
            {formMode === 'DESCRIPTION' && (
              <Button
                size="large"
                type="primary"
                onClick={() => {
                  router.push(`/workTable/projectMgmt/monitoringRecord/recordList?projectId=${id}`);
                }}
                disabled={disabledBtn}
              >
                监播管理
              </Button>
            )}
          </ButtonCard>

          {this.renderPage()}
          <Schedle formMode={formMode} taskId={taskId} />
        </BpmWrapper>
        {!taskId && <BpmConnection source={allBpm} />}
      </PageWrapper>
    );
  }
}

export default index;
