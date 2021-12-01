import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import ButtonCard from '@/components/production/layout/ButtonCard';
import FormItem from '@/components/production/business/FormItem';
import Button from '@/components/production/basic/Button';
import PageWrapper from '@/components/production/layout/PageWrapper';
import message from '@/components/production/layout/Message.tsx';

import { isEmpty } from 'ramda';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { systemSelectionListByKey } from '@/services/production/system';

const DOMAIN = 'projectTeamDisplay';

@connect(({ loading, projectTeamDisplay, dispatch }) => ({
  loading,
  ...projectTeamDisplay,
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
    let params = {};
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    if (name === 'date') {
      params = { startDate: value[0], endDate: value[1] };
    }
    const payload = { ...changedValues, ...params };

    dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { ...changedValues, ...params },
    });
  },
})
class Index extends PureComponent {
  state = {
    resourceOptions: [],
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/getParamsFromRoute`,
    });
    this.callModelEffects('init');
    this.getResourceType();
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
    const { projectRoles } = formData;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        this.callModelEffects('save', {
          formData: {
            ...formData,
            projectRole: projectRoles.join(','),
            ...values,
            ...param,
          },
          cb,
        });
      }
    });
  };

  // 获取资源类别
  getResourceType = async () => {
    const output = await outputHandle(systemSelectionListByKey, { key: 'FUNCTION:RESOURCE:TYPE' });
    const resourceOptions = output.data.map(item => ({
      ...item,
      value: item.selectionValue,
      label: item.selectionName,
    }));
    this.setState({ resourceOptions });
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
    const { formData, formMode, loading, form, projectRoleOptions } = this.props;
    const { resourceOptions } = this.state;
    const fields = [
      <FormItem
        label="项目角色"
        key="projectRoles"
        fieldKey="projectRoles"
        fieldType="BaseSelect"
        mode="multiple"
        descList={projectRoleOptions}
        descriptionField="projectRoleDesc"
        required
      />,
      <FormItem
        label="姓名"
        key="resId"
        fieldKey="resId"
        descriptionField="resName"
        fieldType="ResSimpleSelect"
        required
      />,

      <FormItem label="联系方式" key="contactWay" fieldKey="contactWay" fieldType="BaseInput" />,

      <FormItem
        label="开始参与日期"
        key="startDate"
        fieldKey="startDate"
        fieldType="BaseDatePicker"
        placeholder="开始参与日期"
        required
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
          title="添加项目成员"
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

export default Index;
