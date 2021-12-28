import React from 'react';
import { connect } from 'dva';
import { isEmpty, omit } from 'ramda';
import { Form } from 'antd';
import moment from 'moment';
// 产品化组件
import BusinessForm from '@/components/production/business/BusinessForm.tsx';
import FormItem from '@/components/production/business/FormItem.tsx';
import PageWrapper from '@/components/production/layout/PageWrapper.tsx';
import ButtonCard from '@/components/production/layout/ButtonCard.tsx';
import Button from '@/components/production/basic/Button.tsx';

import { fromQs } from '@/utils/production/stringUtil.ts';
import { systemLocaleListPaging } from '@/services/production/system';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import DataTable from '@/components/production/business/DataTable.tsx';
import { closeThenGoto } from '@/layouts/routerControl';
import message from '@/components/production/layout/Message.tsx';
import { getUrl } from '@/utils/flowToRouter';
import { createConfirm } from '@/components/core/Confirm';
import { pushFlowTask } from '@/services/gen/flow';
import createMessage from '@/components/core/AlertMessage';
import EditTable from '@/components/production/business/EditTable.tsx';
import update from 'immutability-helper';
import { genFakeId } from '@/utils/production/mathUtils.ts';
import styles from './index.less';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';

// namespace声明
const DOMAIN = 'paymentRequestDisplayPage';
const expenseDocType = 'PURCHASE_ORDER';

/**
 *  综合展示页面
 */
@connect(({ loading, dispatch, paymentRequestDisplayPage, paymentPlanList, user: { user } }) => ({
  loading: loading.effects[`${DOMAIN}/init`] || loading.effects[`${DOMAIN}/fetchConfig`],
  saveLoading: loading.effects[`${DOMAIN}/save`],
  dispatch,
  ...paymentRequestDisplayPage,
  ...paymentPlanList,
  user,
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
class PaymentRequestDisplayPage extends React.PureComponent {
  componentDidMount() {
    // 调用页面载入初始化方法,一般是请求页面数据
    // fromQs 方法从url获取路径参数，仅能在组件加载时调用一次，且只能在一级组件调用，后续在组件内部维护自己的url参数。否则多TAB体系可能会出BUG
    const { selectedRows, paymentTotalAmt } = this.props;
    const {
      formData,
      user: { extInfo = {} }, // 取当前登陆人的resId
    } = this.props;
    const { id, mode, taskId, from } = fromQs();
    const formMode = mode === 'edit' || mode === 'EDIT' ? 'EDIT' : 'DESCRIPTION';
    // 把url的参数保存到state
    this.updateModelState({ formMode, taskId, from });
    this.callModelEffects('updateForm', { id });
    this.callModelEffects('init').then(data =>
      this.callModelEffects('fetchBusinessAccItem', {
        docType: expenseDocType,
        buId: data.chargeBuId || extInfo.baseBuId,
      })
    );
    // this.callModelEffects('fetchBudgetType');
    if (from === 'paymentPlayList') {
      this.callModelEffects('updateForm', {
        paymentPlanDetails: selectedRows,
        originalCurrencyAmt: paymentTotalAmt,
        baseCurrencyAmt: paymentTotalAmt,
      });
    }
    formMode !== 'DESCRIPTION' &&
      this.callModelEffects('fetchAccountList', {
        abNo: selectedRows[0].abNo,
        accStatus: 'ACTIVE',
      });
    this.callModelEffects('fetchInternalOuList');
    this.callModelEffects('fetchBudgetList');
    this.callModelEffects('fetchFinancialAccSubjList');

    taskId && this.callModelEffects('fetchConfig', taskId);
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
      selectedRows,
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
    } = selectedRows[0];

    const { paymentPlanDetails, purchaseOrderDetails } = formData;

    // 其他流程1
    const allBpm = [{ docId: formData.id, procDefKey: 'PUR_G02', title: '采购付款流程' }];

    // 页面没有关闭的时候 重新进入页面不会调用生命周期方法重新渲染数据 临时写法改变下面表格
    // if (from === 'paymentPlayList' && selectedRows.length !== paymentPlanDetails.length) {
    //   this.callModelEffects('updateForm', {
    //     paymentPlanDetails: selectedRows,
    //     originalCurrencyAmt: paymentTotalAmt,
    //     baseCurrencyAmt: paymentTotalAmt,
    //   });
    // }

    const finAccSubjIdVisible = fieldsConfig.taskKey === 'PUR_G02_07_FIN_MANAGER_APPROVAL';

    const actualPaymentDateVisible = fieldsConfig.taskKey === 'PUR_G02_09_CASHIER_PAYMENT';

    const paymentColumns = [
      {
        title: '采购单号',
        dataIndex: 'poNo',
        width: '100px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].poNo`}
            disabled
          />
        ),
      },
      {
        title: '付款计划编号',
        dataIndex: 'paymentPlanNo',
        width: '180px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].paymentPlanNo`}
            disabled
          />
        ),
      },
      {
        title: '付款阶段',
        dataIndex: 'paymentStage',
        width: '180px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].paymentStage`}
            disabled
          />
        ),
      },
      {
        title: '预计付款日期',
        dataIndex: 'expectedPaymentDate',
        width: '160px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`paymentPlanDetails[${index}].expectedPaymentDate`}
            disabled
          />
        ),
      },
      {
        title: '付款金额',
        dataIndex: 'paymentAmt',
        width: '120px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`paymentPlanDetails[${index}].paymentAmt`}
            disabled
          />
        ),
      },
      {
        title: '核算项目',
        dataIndex: 'busAccItemId',
        width: '280px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseTreeSelect"
            fieldKey={`paymentPlanDetails[${index}].busAccItemId`}
            options={businessAccItemList}
            optionsKeyField="busAccItemId"
            disabled
          />
        ),
      },
      {
        title: '预算项目',
        dataIndex: 'budgetItemId',
        width: '280px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseTreeSelect"
            fieldKey={`paymentPlanDetails[${index}].budgetItemId`}
            options={budgetList}
            disabled
          />
        ),
      },
      {
        title: '会计科目',
        width: '200px',
        // visible: fieldsConfig.taskKey && fieldsConfig.taskKey === 'PUR_G02_07_FIN_MANAGER_APPROVAL',
        visible: finAccSubjIdVisible || formMode === 'DESCRIPTION',
        dataIndex: 'finAccSubjId',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseTreeSelect"
            fieldKey={`paymentPlanDetails[${index}].finAccSubjId`}
            options={financialAccSubjList}
            disabled={!finAccSubjIdVisible}
            initialValue={null}
          />
        ),
      },
      {
        title: '规则检查说明',
        dataIndex: 'rulesCheckDesc',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].rulesCheckDesc`}
            disabled
            // initialValue="P01-预算项目与模板不符"
          />
        ),
      },
      {
        title: '关联发票',
        dataIndex: 'relatedInvoice',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].relatedInvoice`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
      {
        title: '含税金额',
        dataIndex: 'amtIncludingTax',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`paymentPlanDetails[${index}].amtIncludingTax`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
      {
        title: '不含税金额',
        dataIndex: 'amtExcludingTax',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`paymentPlanDetails[${index}].amtExcludingTax`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
      {
        title: '税额',
        dataIndex: 'taxAmt',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`paymentPlanDetails[${index}].taxAmt`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
      {
        title: '可抵扣税率',
        dataIndex: 'deductTaxRate',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseCustomSelect"
            fieldKey={`paymentPlanDetails[${index}].deductTaxRate`}
            parentKey="CUS:DEDUCT_TAX_RATE"
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
      {
        title: '可抵扣税额',
        dataIndex: 'deductTaxAmt',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`paymentPlanDetails[${index}].deductTaxAmt`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        width: '150px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].remark`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
      {
        title: '付款计划ID',
        dataIndex: 'id',
        width: '0px',
        className: `${styles.button}`,
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`paymentPlanDetails[${index}].id`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
    ].filter(e => e.visible !== false);

    const editDescColumns = [
      {
        title: '商品名称',
        dataIndex: 'itemName',
        width: '250px',
      },
      {
        title: '数量',
        dataIndex: 'qty',
        width: '150px',
      },
      {
        title: '单价',
        dataIndex: 'unitPrice',
        width: '150px',
      },
      {
        title: '金额',
        dataIndex: 'amt',
        width: '150px',
      },
      {
        title: '交付日期',
        dataIndex: 'deliveryDate',
        width: '200px',
      },
      {
        title: '备注',
        dataIndex: 'remark',
      },
    ];

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
            defaultColumnStyle={8}
          >
            <FormItem fieldType="BaseInput" label="付款单编号" fieldKey="paymentOrderNo" disabled />

            <FormItem
              fieldType="BaseInput"
              label="付款单名称"
              fieldKey="paymentOrderName"
              required
              initialValue={paymentRequestName}
            />

            <FormItem
              fieldType="SupplierSimpleSelect"
              label="供应商"
              fieldKey="supplierId"
              descriptionField="supplierName"
              disabled
              initialValue={supplierId}
            />

            <FormItem
              fieldType="ProjectSimpleSelect"
              label="费用承担项目"
              fieldKey="chargeProjectId"
              descriptionField="chargeProjectName"
              initialValue={chargeProjectId}
              disabled
            />

            <FormItem
              fieldType="BuSimpleSelect"
              label="费用承担部门"
              fieldKey="chargeBuId"
              descriptionField="chargeBuName"
              initialValue={chargeBuId}
              disabled
            />

            <FormItem
              fieldType="BaseCustomSelect"
              label="费用承担公司"
              fieldKey="chargeCompany"
              descriptionField="chargeCompanyDesc"
              parentKey="CUS:INTERNAL_COMPANY"
              initialValue={chargeCompany}
              disabled
            />

            <FormItem
              fieldType="BaseSwitch"
              label="外币业务"
              fieldKey="foreignCurrencyFlag"
              descriptionField="foreignCurrencyFlagDesc"
              // parentKey="COMMON:YES-OR-NO"
              required
              initialValue={false}
            />

            <FormItem
              fieldType="Group"
              label="原币/汇率"
              fieldKey="originalCurrencyAndExchangeRate"
              visible={formData.foreignCurrencyFlag}
            >
              <FormItem
                fieldType="BaseSelect"
                fieldKey="originalCurrency"
                parentKey="COMMON_CURRENCY"
                initialValue={originalCurrency}
              />
              <FormItem
                fieldType="BaseInputAmt"
                fieldKey="exchangeRate"
                placeholder="请输入汇率"
                scale={6}
                onChange={(value, option, allOptions) => {
                  if (value && formData.originalCurrencyAmt) {
                    const baseAmt = value * formData.originalCurrencyAmt;
                    this.callModelEffects('updateForm', { baseCurrencyAmt: baseAmt });
                  } else {
                    this.callModelEffects('updateForm', { baseCurrencyAmt: '' });
                  }
                }}
              />
            </FormItem>

            <FormItem
              fieldType="BaseInputAmt"
              label="原币金额"
              fieldKey="originalCurrencyAmt"
              visible={formData.foreignCurrencyFlag}
              disabled
              onChange={(value, option, allOptions) => {
                let tempexchangeRage = 1;
                if (value && formData.exchangeRate) {
                  tempexchangeRage = formData.exchangeRate;
                  const baseAmt = value * tempexchangeRage;
                  this.callModelEffects('updateForm', { baseCurrencyAmt: baseAmt });
                } else {
                  this.callModelEffects('updateForm', { baseCurrencyAmt: '' });
                }
              }}
            />

            <FormItem
              fieldType="BaseInputAmt"
              label="本币金额"
              fieldKey="baseCurrencyAmt"
              disabled
            />

            <FormItem
              fieldType="BaseFileManagerEnhance"
              label="附件"
              fieldKey="attachment"
              api="/api/production/pur/paymentRequest/sfs/token"
              dataKey={formData.id}
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="记账日期"
              fieldKey="accountingDate"
              descriptionField="accountingDate"
              disabled={finAccSubjIdVisible}
            />

            <FormItem
              fieldType="BaseSelect"
              label="付款申请状态"
              fieldKey="paymentRequestStatus"
              descriptionField="paymentRequestStatusDesc"
              parentKey="PUR:PAYMENT_REQUEST_STATUS"
              initialValue="CREATE"
              disabled
            />

            <FormItem
              fieldType="UserSimpleSelect"
              label="创建人"
              fieldKey="createUser"
              descriptionField="createUserName"
              disabled
              initialValue={extInfo.userId}
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="创建日期"
              initialValue={moment().format('YYYY-MM-DD')}
              fieldKey="createDate"
              descriptionField="createTime"
              disabled
            />

            <FormItem fieldType="BaseInputTextArea" label="备注" fieldKey="remark" />
          </BusinessForm>

          <BusinessForm title="支付信息" form={form} formData={formData} defaultColumnStyle={8}>
            <FormItem
              fieldType="BaseCustomSelect"
              label="支付方式"
              fieldKey="paymentMethod"
              descriptionField="paymentMethodDesc"
              parentKey="CUS:PAYMENT_METHOD"
              disabled={formMode === 'DESCRIPTION'}
              required
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="期望付款日期"
              // initialValue={moment().format('YYYY-MM-DD')}
              initialValue={minExpectedPayment}
              fieldKey="expectedPaymentDate"
              descriptionField="expectedPaymentDate"
              disabled={formMode === 'DESCRIPTION'}
              required
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="实际付款日期"
              visible={formMode === 'DESCRIPTION' || actualPaymentDateVisible}
              fieldKey="actualPaymentDate"
              disabled={!actualPaymentDateVisible}
            />

            <FormItem
              fieldType="BaseSelect"
              label="收款账号"
              fieldKey="accountNo"
              descriptionField="accountNo"
              descList={accountList}
              disabled={formMode === 'DESCRIPTION'}
            />

            <FormItem
              fieldType="BaseInput"
              label="户名"
              fieldKey="holderName"
              disabled={formMode === 'DESCRIPTION'}
            />

            <FormItem
              fieldType="BaseInput"
              label="收款银行"
              fieldKey="bankName"
              disabled={formMode === 'DESCRIPTION'}
            />

            <FormItem
              fieldType="BaseInput"
              label="收款银行网点"
              fieldKey="bankBranch"
              disabled={formMode === 'DESCRIPTION'}
            />
          </BusinessForm>

          {formData.poClass1 === 'TEMPORARY' && (
            <DataTable
              title="采购单明细"
              columns={editDescColumns}
              dataSource={purchaseOrderDetails}
              prodSelection={false}
            />
          )}

          <EditTable
            title="关联付款计划区域"
            form={form}
            columns={paymentColumns}
            dataSource={paymentPlanDetails}
            scroll={{ x: 2400 }}
          />
        </BpmWrapper>
        {!taskId && <BpmConnection source={allBpm} />}
      </PageWrapper>
    );
  }
}

export default PaymentRequestDisplayPage;
