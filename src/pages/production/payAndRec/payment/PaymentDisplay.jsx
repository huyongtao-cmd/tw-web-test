import React from 'react';
import { connect } from 'dva';
import { isEmpty, omit, equals } from 'ramda';
import { Form } from 'antd';
import moment from 'moment';
// 产品化组件
import BusinessForm from '@/components/production/business/BusinessForm.tsx';
import FormItem from '@/components/production/business/FormItem.tsx';
import PageWrapper from '@/components/production/layout/PageWrapper.tsx';
import ButtonCard from '@/components/production/layout/ButtonCard.tsx';
import Button from '@/components/production/basic/Button.tsx';

import { systemLocaleListPaging } from '@/services/production/system';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import DataTable from '@/components/production/business/DataTable.tsx';
import PayAndRecModal from '../components/PayAndRecModal';
import { closeThenGoto } from '@/layouts/routerControl';
import message from '@/components/production/layout/Message.tsx';
import { getUrl } from '@/utils/flowToRouter';
import { createConfirm } from '@/components/core/Confirm';
import { pushFlowTask } from '@/services/gen/flow';
import createMessage from '@/components/core/AlertMessage';
import EditTable from '@/components/production/business/EditTable.tsx';
import { fromQs } from '@/utils/production/stringUtil.ts';
import styles from './index.less';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';

// namespace声明
const DOMAIN = 'paymentDisplay';
const expenseDocType = 'PURCHASE_ORDER';

/**
 *  综合展示页面
 */
@connect(({ loading, dispatch, paymentDisplay, user: { user }, payAndReceiveList }) => ({
  loading: loading.effects[`${DOMAIN}/init`] || loading.effects[`${DOMAIN}/fetchConfig`],
  saveLoading: loading.effects[`${DOMAIN}/save`],
  dispatch,
  ...paymentDisplay,
  user,
  payAndReceiveList,
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
class paymentDisplay extends React.PureComponent {
  state = {
    addModalVisible: false,
  };

  componentDidMount() {
    // 调用页面载入初始化方法,一般是请求页面数据
    // 取当前登陆人的resId
    // fromQs 方法从url获取路径参数，仅能在组件加载时调用一次，且只能在一级组件调用，后续在组件内部维护自己的url参数。否则多TAB体系可能会出BUG
    const { id, mode, taskId, from } = fromQs();
    const formMode = mode === 'edit' || mode === 'EDIT' ? 'EDIT' : 'DESCRIPTION';
    // 把url的参数保存到state
    this.updateModelState({ formMode, taskId, from });
    this.callModelEffects('updateForm', { id });
    const {
      payAndReceiveList: { selectedRows },
      paymentTotalAmt,
      user: { extInfo = {} },
    } = this.props;
    // this.callModelEffects('init').then(data =>
    //   this.callModelEffects('fetchBusinessAccItem', {
    //     docType: expenseDocType,
    //     buId: data.chargeBuId || extInfo.baseBuId,
    //   })
    // );
    // this.callModelEffects('fetchBudgetType');

    if (from === 'payAndReceiveList') {
      this.callModelEffects('updateForm', {
        originalCurrencyAmt: paymentTotalAmt,
        paymentPlanDetails: selectedRows,
        baseCurrencyAmt: paymentTotalAmt,
      });
    }
    formMode !== 'DESCRIPTION' &&
      this.callModelEffects('fetchAccountList', {
        abNo: selectedRows[0].abNo,
        accStatus: 'ACTIVE',
      });
    // this.callModelEffects('fetchInternalOuList');
    // this.callModelEffects('fetchBudgetList');
    // this.callModelEffects('fetchFinancialAccSubjList');

    // taskId && this.callModelEffects('fetchConfig', taskId);
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    this.callModelEffects('cleanState');
  }

  fetchData = async params => {
    const { response } = await systemLocaleListPaging(params);
    return response.data;
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

  /**
   * 调用model层异步方法
   * 这个方法是仅是封装一个小方法,后续修改调异步方法时不需要每次都解构dispatch
   * @param method 异步方法名称
   * @param params 调用方法参数
   */
  callModelEffects = async (method, params) => {
    const { dispatch } = this.props;
    return dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  /**
   * 指定更新
   */
  handleUpdate = (param, cb) => {
    this.callModelEffects('update', { formData: { ...param, submit: true } }).then(data => {
      cb && cb();
    });
  };

  /**
   * 完成
   */
  handleComplete = (param, cb) => {
    this.callModelEffects('complete', { formData: { ...param, submit: true } }).then(data => {
      cb && cb();
    });
  };

  /**
   * 提交
   */
  handleSubmit = (param, cb) => {
    const { form, formData, selectedRows } = this.props;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        this.callModelEffects('save', { formData: { ...formData, ...values, submit: true } }).then(
          data => {
            cb && cb();
          }
        );
      } else {
        message({ type: 'error', content: '存在必填项未填写！' });
      }
    });
  };

  /**
   * 保存
   */
  handleSave = () => {
    const { form, formData, selectedRows } = this.props;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        this.callModelEffects('save', { formData: { ...formData, ...values } });
      } else {
        message({ type: 'error', content: '存在必填项未填写！' });
      }
    });
  };

  /**
   * 删除
   */
  handleDelete = () => {
    const { form, formData, selectedRows } = this.props;
    const { id } = formData;
    const formDataParam = {};
    // const ids = [];
    // ids.push(id);
    formDataParam.keys = id;
    this.callModelEffects('delete', { formData: { ...formDataParam } });
  };

  /**
   * 切换编辑模式
   */
  switchEdit = () => {
    this.callModelEffects('init');
    this.updateModelState({ formMode: 'EDIT' });
  };

  //弹窗确定
  handleOk = target => {
    this.callModelEffects('updateForm', {
      paymentPlanDetails: target,
    });
    this.handleVisible();
  };

  // 处理弹框的显示与隐藏
  handleVisible = () => {
    const { addModalVisible } = this.state;
    this.setState({
      addModalVisible: !addModalVisible,
    });
  };

  // 删除收付款列表的某一项
  deleteItem = selectedRowKeys => {
    const {
      formData: { paymentPlanDetails },
    } = this.props;
    selectedRowKeys &&
      selectedRowKeys.forEach(key => {
        const index = paymentPlanDetails.findIndex(item => item.id === key);
        if (index > -1) {
          paymentPlanDetails.splice(index, 1);
        }
      });
    this.callModelEffects('updateForm', {
      paymentPlanDetails,
    });
  };
  /**
   * 时间设置为null
   */
  // setTimeNull = () => {
  //   const {
  //     formData: { id },
  //   } = this.props;
  //   this.callModelEffects('setTimeNull', { id, nullFields: ['testTime'] });
  // };

  render() {
    const {
      id,
      form,
      formData,
      formMode,
      loading,
      saveLoading,
      fieldsConfig,
      flowForm,
      taskId,
      from,
      payAndReceiveList: { selectedRows },
      minExpectedPayment,
      paymentTotalAmt,
      paymentRequestName,
      budgetList,
      businessAccItemList,
      financialAccSubjList,
      accountList,
      user: { extInfo = {} }, // 取当前登陆人的resId
    } = this.props;
    const {
      supplierId,
      chargeProjectId,
      chargeBuId,
      chargeCompany,
      originalCurrency,
      custOrSupplier,
    } = selectedRows[0];

    const { paymentPlanDetails, purchaseOrderDetails } = formData;
    const { addModalVisible } = this.state;

    // TODO修改流程相关信息
    const allBpm = [{ docId: formData.id, procDefKey: 'PUR_G02', title: '采购付款流程' }];

    const finAccSubjIdVisible = fieldsConfig.taskKey === 'PUR_G02_07_FIN_MANAGER_APPROVAL';

    const actualPaymentDateVisible = fieldsConfig.taskKey === 'PUR_G02_09_CASHIER_PAYMENT';

    const paymentColumns = [
      {
        title: '公司',
        dataIndex: 'ouName',
        align: 'center',
      },
      {
        title: '类别',
        dataIndex: 'planClassDesc',
        align: 'center',
      },
      {
        title: '款项',
        dataIndex: 'clause',
        align: 'center',
      },
      {
        title: '客户/供应商',
        dataIndex: 'supplierName',
        align: 'center',
      },
      {
        title: '合同/订单编号',
        dataIndex: 'contractNo',
        align: 'center',
      },
      {
        title: '名称',
        dataIndex: 'contractName',
        align: 'center',
      },
      {
        title: '阶段',
        dataIndex: 'phase',
        align: 'center',
      },
      {
        title: '当期金额',
        dataIndex: 'amount',
        align: 'center',
      },

      {
        title: '预计收付日期',
        dataIndex: 'expectDate',
        align: 'center',
      },
      // TODO
      {
        title: '款项状态',
        dataIndex: 'resId',
        align: 'center',
      },
      {
        title: '已收付金额',
        dataIndex: 'receOrPay',
        align: 'center',
      },
      {
        title: '在途',
        dataIndex: 'onWay',
        align: 'center',
      },
      {
        title: '本次收付金额',
        dataIndex: 'poNo',
        width: '100px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].poNo`}
          />
        ),
      },
    ];

    const paymentViewColumns = [
      {
        title: '公司',
        dataIndex: 'ouName',
        align: 'center',
      },
      {
        title: '类别',
        dataIndex: 'planClassDesc',
        align: 'center',
      },
      {
        title: '款项',
        dataIndex: 'clause',
        align: 'center',
      },
      {
        title: '客户/供应商',
        dataIndex: 'supplierName',
        align: 'center',
      },
      {
        title: '合同/订单编号',
        dataIndex: 'contractNo',
        align: 'center',
      },
      {
        title: '名称',
        dataIndex: 'contractName',
        align: 'center',
      },
      {
        title: '阶段',
        dataIndex: 'phase',
        align: 'center',
      },
      {
        title: '当期金额',
        dataIndex: 'amount',
        align: 'center',
      },

      {
        title: '预计收付日期',
        dataIndex: 'expectDate',
        align: 'center',
      },
      // TODO
      {
        title: '款项状态',
        dataIndex: 'resId',
        align: 'center',
      },
      {
        title: '已收付金额',
        dataIndex: 'receOrPay',
        align: 'center',
      },
      {
        title: '在途',
        dataIndex: 'onWay',
        align: 'center',
      },
      {
        title: '本次收付金额',
        dataIndex: 'poNo',
        width: '100px',
      },
    ];
    // 基本信息form
    const basicForm = [
      {
        fieldType: 'BaseInput',
        label: '付款单编号',
        fieldKey: 'paymentOrderNo',
        disabled: true,
      },
      {
        fieldType: 'BaseInput',
        label: '付款单名称',
        fieldKey: 'paymentOrderName',
        required: true,
        initialValue: paymentRequestName,
      },
      {
        fieldType: 'SupplierSimpleSelect',
        label: '客户/供应商',
        fieldKey: 'custOrSupplier',
        descriptionField: 'supplierName',
        disabled: true,
        initialValue: custOrSupplier,
      },
      {
        fieldType: 'BaseDatePicker',
        fieldKey: 'date',
        label: '到款日期',
      },
      {
        fieldType: 'BaseInput',
        fieldKey: 'paymentAmt',
        label: '付款金额',
      },
      {
        fieldType: 'BaseInput',
        fieldKey: 'return',
        label: '返点抵扣',
      },
      {
        fieldType: 'BaseInput',
        fieldKey: 'invoiceNo',
        label: '发票号',
      },
      {
        fieldType: 'BaseInput',
        fieldKey: 'invoiceAmt',
        label: '发票金额',
      },
      {
        fieldType: 'BaseInputTextArea',
        fieldKey: 'remark',
        label: '备注',
      },
    ];
    //底部按钮
    const buttons = [];

    return (
      <PageWrapper loading={loading}>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          buttonLoading={loading || saveLoading}
          onBpmChanges={value => {
            this.callModelEffects('updateFlowForm', { value });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { branch, remark } = bpmForm;
            const { key } = operation;
            const { taskKey } = fieldsConfig;
            if (taskKey === 'PUR_G02_01_SUBMIT_i') {
              if (key === 'FLOW_COMMIT') {
                this.handleSubmit(
                  {
                    result: 'APPROVED',
                    taskId,
                    procRemark: remark,
                    branch,
                  },
                  () => {
                    const url = getUrl().replace('edit', 'view');
                    closeThenGoto(url);
                  }
                );
                return Promise.resolve(false);
              }
            } else {
              if (key === 'FLOW_RETURN') {
                createConfirm({
                  content: '确定要拒绝该流程吗？',
                  onOk: () =>
                    pushFlowTask(taskId, {
                      remark,
                      result: 'REJECTED',
                      branch,
                    }).then(({ status, response }) => {
                      if (status === 200) {
                        createMessage({ type: 'success', description: '操作成功' });
                        const url = getUrl().replace('edit', 'view');
                        closeThenGoto(url);
                      }
                      return Promise.resolve(false);
                    }),
                });
              }
              if (key === 'FLOW_PASS') {
                //1、财务经理可以编辑“会计科目”字段
                if (taskKey === 'PUR_G02_07_FIN_MANAGER_APPROVAL') {
                  const params = [];
                  let financialAccSubjExist = true;
                  paymentPlanDetails.forEach(item => {
                    if (!item.finAccSubjId) {
                      financialAccSubjExist = false;
                      createMessage({ type: 'error', description: '请编辑会计科目！' });
                      return;
                    }
                    const param = {};
                    param.id = item.id;
                    param.finAccSubjId = item.finAccSubjId;
                    params.push(param);
                  });
                  const formDataParam = {};
                  formDataParam.paymentPlanDetails = params;
                  formDataParam.paymentRequestId = formData.id;
                  financialAccSubjExist &&
                    this.handleUpdate(formDataParam, () => {
                      const url = getUrl().replace('edit', 'view');
                      closeThenGoto(url);
                    });
                }
                //“财务负责人”审批节点通过后，付款申请单状态变更成“已批准待付款（WAITING_TO_PAY）”
                else if (taskKey === 'PUR_G02_08_FIN_HEAD_APPROVAL') {
                  this.handleUpdate(
                    {
                      paymentRequestId: formData.id,
                      paymentRequestStatus: 'WAITING_TO_PAY',
                    },
                    () => {
                      const url = getUrl().replace('edit', 'view');
                      closeThenGoto(url);
                    }
                  );
                }
                //1、出纳可以编辑“实际付款日期”字段，且必填，其余项目和其他审批节点相同
                else if (taskKey === 'PUR_G02_09_CASHIER_PAYMENT') {
                  if (!formData.actualPaymentDate) {
                    createMessage({ type: 'error', description: '请选择实际付款日期！' });
                  } else {
                    this.handleComplete(
                      {
                        paymentRequestId: formData.id,
                        actualPaymentDate: formData.actualPaymentDate,
                      },
                      () => {
                        const url = getUrl().replace('edit', 'view');
                        closeThenGoto(url);
                      }
                    );
                  }
                } else {
                  return Promise.resolve(true);
                }
              }
            }

            return Promise.resolve(false);
          }}
        >
          <ButtonCard>
            {formMode === 'EDIT' && [
              <Button size="large" type="primary" onClick={this.handleSave} loading={saveLoading}>
                保存
              </Button>,
              <Button
                size="large"
                type="primary"
                loading={saveLoading}
                onClick={() =>
                  this.handleSubmit({ result: 'APPROVED' }, () => {
                    closeThenGoto(`/user/flow/process?type=procs`);
                  })
                }
              >
                提交
              </Button>,
            ]}
            {formMode === 'EDIT' &&
              formData.id && (
                <Button key="edit" size="large" type="danger" onClick={this.handleDelete}>
                  删除
                </Button>
              )}
            {formMode === 'DESCRIPTION' &&
              formData.budgetStatus === 'CREATE' && (
                <Button key="edit" size="large" type="primary" onClick={this.switchEdit}>
                  编辑
                </Button>
              )}
          </ButtonCard>
          <BusinessForm
            title="基本信息"
            form={form}
            formData={formData}
            formMode={formMode}
            defaultColumnStyle={12}
          >
            {basicForm.map(item => (
              <FormItem key={item.fieldKey} {...item} />
            ))}
          </BusinessForm>
          {formMode === 'DESCRIPTION' ? (
            <DataTable
              title="收付款明细金额分配"
              columns={paymentViewColumns}
              dataSource={paymentPlanDetails}
              prodSelection={false}
              scroll={{ x: 2400 }}
            />
          ) : (
            <EditTable
              title="收付款明细金额分配"
              form={form}
              columns={paymentColumns}
              dataSource={paymentPlanDetails}
              scroll={{ x: 2400 }}
              buttons={buttons}
              onAddClick={() => {
                this.handleVisible();
              }}
              onDeleteConfirm={this.deleteItem}
            />
          )}
          <PayAndRecModal
            selectedRows={paymentPlanDetails}
            visible={addModalVisible}
            from="payment"
            onCancel={this.handleVisible}
            onOk={this.handleOk}
          />
        </BpmWrapper>
        {!taskId && <BpmConnection source={allBpm} />}
      </PageWrapper>
    );
  }
}

export default paymentDisplay;
