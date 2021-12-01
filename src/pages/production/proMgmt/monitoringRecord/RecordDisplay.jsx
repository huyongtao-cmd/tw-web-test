import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import ButtonCard from '@/components/production/layout/ButtonCard';
import FormItem from '@/components/production/business/FormItem';
import Button from '@/components/production/basic/Button';
import PageWrapper from '@/components/production/layout/PageWrapper';
import message from '@/components/production/layout/Message.tsx';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { isEmpty } from 'ramda';

import { systemSelectionListByKey } from '@/services/production/system';

const DOMAIN = 'monitoringRecordDisplay';

@connect(({ loading, monitoringRecordDisplay, dispatch }) => ({
  loading,
  ...monitoringRecordDisplay,
  dispatch,
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
  // form值发生变化
  onValuesChange(props, changedValues, allValues) {
    const { formData, dispatch } = props;
    if (isEmpty(changedValues)) return;
    // let params = {};
    // const name = Object.keys(changedValues)[0];
    // const value = changedValues[name];
    dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: changedValues,
    });
  },
})
class RecordDisplay extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/getParamsFromRoute`,
    });
    this.callModelEffects('init');
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    this.callModelEffects('cleanState');
  }

  /**
   * 保存
   */
  handleSave = (param, cb) => {
    const { form, formData } = this.props;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        this.callModelEffects('save', {
          formData: {
            ...formData,
            //releteProjectId: formData.releteProject.join(','), //关联项目 string
            ...values,
            ...param,
          },
          cb,
        });
      }
    });
  };

  /**
   * 切换编辑模式
   */
  switchEdit = () => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/updateState`, payload: { formMode: 'EDIT' } });
    this.callModelEffects('init');
  };

  callModelEffects(name, params) {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${name}`,
      payload: params,
    });
  }

  render() {
    const { formData, formMode, loading, form } = this.props;
    const options = [
      { label: '是', value: true },
      {
        label: '否',
        value: false,
      },
    ];
    const fields = [
      <FormItem
        label="接收日期"
        key="recevedDate"
        fieldKey="recevedDate"
        fieldType="BaseDatePicker"
        required
      />,
      <FormItem
        label="类型"
        key="monitorType"
        fieldKey="monitorType"
        fieldType="BaseSelect"
        parentKey="FUNCTION:MONITOR:TYPE"
        required
      />,
      <FormItem
        label="监播公司"
        key="monitorCompany"
        fieldKey="monitorCompany"
        fieldType="BaseInput"
        required
      />,
      <FormItem label="联系人" key="contractName" fieldKey="contractName" fieldType="BaseInput" />,
      <FormItem
        label="接收人"
        key="receivedResId"
        fieldKey="receivedResId"
        fieldType="ResSimpleSelect"
        descriptionField="receivedResName"
        required
      />,

      <FormItem
        label="接收文件存储位置"
        key="fileLocation"
        fieldKey="fileLocation"
        fieldType="BaseInput"
        required
      />,
      <FormItem
        label="是否已发送给客户"
        key="sendFlag"
        fieldKey="sendFlag"
        fieldType="BaseRadioSelect"
        options={options}
      />,
      <FormItem label="发送日期" key="sendDate" fieldKey="sendDate" fieldType="BaseDatePicker" />,
      <FormItem
        label="是否技术处理"
        key="handleFlag"
        fieldKey="handleFlag"
        fieldType="BaseRadioSelect"
        parentKey="COMMON:YES-OR-NO"
        initialValue={formData.handleFlagDesc}
        options={options}
      />,

      <FormItem
        label="客户接收人"
        key="custReceiveName"
        fieldKey="custReceiveName"
        fieldType="BaseInput"
      />,

      <FormItem
        label="处理内容"
        key="handleContent"
        fieldKey="handleContent"
        fieldType="BaseInputTextArea"
      />,

      <FormItem
        label="客户文件存储位置"
        key="custFileLocation"
        fieldKey="custFileLocation"
        fieldType="BaseInputTextArea"
      />,
      <FormItem label="备注" key="remark" fieldKey="remark" fieldType="BaseInputTextArea" />,
    ];
    const disabledBtn = loading.effects[`${DOMAIN}/init`] || loading.effects[`${DOMAIN}/save`];

    return (
      <PageWrapper>
        <ButtonCard>
          {formMode === 'EDIT' && (
            <Button
              icon="save"
              size="large"
              type="primary"
              onClick={() =>
                this.handleSave({}, output => {
                  message({ type: 'success' });
                  this.callModelEffects('updateForm', { id: output.data.id });
                  this.callModelEffects('updateState', {
                    formMode: 'DESCRIPTION',
                  });
                  this.callModelEffects('init', { id: output.data.id });
                })
              }
              disabled={disabledBtn}
            >
              保存
            </Button>
          )}
          {formMode === 'DESCRIPTION' && (
            <Button
              key="edit"
              size="large"
              type="primary"
              onClick={this.switchEdit}
              loading={disabledBtn}
            >
              编辑
            </Button>
          )}
        </ButtonCard>

        <BusinessForm
          title="添加监播记录"
          formData={formData}
          form={form}
          formMode={formMode}
          defaultColumnStyle={12}
        >
          {fields}
        </BusinessForm>
      </PageWrapper>
    );
  }
}

export default RecordDisplay;
