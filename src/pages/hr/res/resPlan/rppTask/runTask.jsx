import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Form, Input, Button } from 'antd';
import { isEmpty } from 'ramda';

import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import { formatDT } from '@/utils/tempUtils/DateTime';
import createMessage from '@/components/core/AlertMessage';
import { createConfirm } from '@/components/core/Confirm';
import { Selection } from '@/pages/gen/field';
import runTask from './models/runTask';

const { Field, FieldLine } = FieldList;

const DOMAIN = 'runTask';
const FieldListLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

// eslint-disable-next-line no-shadow
@connect(({ loading, runTask }) => ({
  loading,
  runTask,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const { name, value } = Object.values(changedFields)[0];
    if (name === 'purchaseLegalName' || name === 'purchaseBuId') return;
    if (name === 'signDate' || name === 'activateDate') {
      // antD 时间组件返回的是moment对象 转成字符串提交
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: formatDT(value) },
      });
    } else {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: value },
      });
    }
  },
})
@mountToTab()
/***
 * 运行RPP，资源计划处理页
 */
class PurchaseEdit extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/clearForm`,
    });
    dispatch({
      type: `${DOMAIN}/selectListRppConfig`,
    });
  }

  handleSave = () => {
    const {
      dispatch,
      form: { validateFieldsAndScroll },
      runTask: { formData },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const { taskNo } = formData;
        if (taskNo !== undefined) {
          createConfirm({
            content: `已执行成功，确定要再次执行吗？`,
            onOk: () => {
              dispatch({
                type: `${DOMAIN}/start`,
                payload: {
                  configId: formData.configId,
                  remark: formData.remark,
                },
              });
            },
          });
        } else {
          dispatch({
            type: `${DOMAIN}/start`,
            payload: {
              configId: formData.configId,
              remark: formData.remark,
            },
          });
        }
        closeThenGoto('/hr/resPlan/rppPlanLog?' + Date.now());
      }
    });
    // createMessage({
    //   type: 'error',
    //   description: '运行需拥有平台资源负责人、平台总体负责人、BU资源负责人权限',
    // });
  };

  // 配置列表选择切换事件
  handleSupplier = obj => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: {
        configId: !obj ? '' : obj.id,
        configNo: !obj ? '' : obj.configNo,
        configName: !obj ? '' : obj.configName,
      },
    });
  };

  render() {
    const {
      loading,
      runTask: { formData, listRppConfig },
      form: { getFieldDecorator, setFieldsValue },
    } = this.props;
    const readOnly = true;
    return (
      <PageHeaderWrapper title="采购合同">
        <Card
          className="tw-card-adjust"
          bordered={false}
          title={<Title icon="profile" text="运行RPP(资源计划处理)" />}
        >
          <FieldList layout="vertical" getFieldDecorator={getFieldDecorator} col={1}>
            <FieldLine label="参考文件" {...FieldListLayout} style={{ margin: '20px' }}>
              <Field
                name="supplierLegalName"
                decorator={{
                  initialValue: formData.configNo,
                }}
                wrapperCol={{ span: 23, xxl: 23 }}
              >
                <Selection.Columns
                  source={listRppConfig}
                  columns={[
                    { dataIndex: 'configNo', title: '文件编号', span: 6 },
                    { dataIndex: 'configName', title: '文件名称', span: 12 },
                    { dataIndex: 'createUserName', title: '创建人', span: 6 },
                  ]}
                  transfer={{ key: 'configNo', code: 'configNo', name: 'configNo' }}
                  placeholder="请选择文件"
                  showSearch
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ width: 400 }}
                  onColumnsChange={obj => {
                    this.handleSupplier(obj);
                  }}
                />
              </Field>
              <Field
                name="supplierLegalNo"
                decorator={{
                  initialValue: formData.configName,
                }}
                wrapperCol={{ span: 23, offset: 1, xxl: 23 }}
              >
                <Input disabled={readOnly} placeholder="配置文件名称" />
              </Field>
            </FieldLine>

            <Field
              name="remark"
              {...FieldListLayout}
              label="任务名称"
              decorator={{
                rules: [
                  {
                    required: true,
                    message: '请输入任务名称',
                  },
                ],
              }}
              style={{ margin: '20px' }}
            >
              <Input.TextArea rows={3} placeholder="请输入任务名称" />
            </Field>
            <Field
              name="taskNo"
              label="任务编号"
              {...FieldListLayout}
              decorator={{
                initialValue: formData.taskNo,
              }}
              style={{ margin: '20px' }}
            >
              <Input disabled={readOnly} placeholder="系统生成" />
            </Field>
            <Button
              className="tw-btn-primary"
              type="primary"
              icon="save"
              size="large"
              loading={loading.effects[`${DOMAIN}/start`]}
              onClick={this.handleSave}
            >
              运行
            </Button>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default PurchaseEdit;
