import React from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, omit } from 'ramda';
import { Form, Input } from 'antd';
import moment from 'moment';

// 产品化组件
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';

import { fromQs } from '@/utils/production/stringUtil';
import { systemLocaleListPaging, systemLocaleLogicalDelete } from '@/services/production/system';
import update from 'immutability-helper';
import { genFakeId } from '@/utils/production/mathUtils.ts';
import EditTable from '@/components/production/business/EditTable.tsx';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import DataTable from '@/components/production/business/DataTable.tsx';
import { closeThenGoto } from '@/layouts/routerControl';
import message from '@/components/production/layout/Message.tsx';
import { getUrl } from '@/utils/flowToRouter';
import { createConfirm } from '@/components/core/Confirm';
import { pushFlowTask } from '@/services/gen/flow';
import createMessage from '@/components/core/AlertMessage';
import { remindString } from '@/components/production/basic/Remind.tsx';
import SearchFormItem from '@/components/production/business/SearchFormItem.tsx';
import styles from '@/pages/production/pur/paymentRequest/index.less';

// namespace声明
const DOMAIN = 'tripManagementClaimDisplayPage';

/**
 * 单表案例 综合展示页面
 */
@connect(
  ({ loading, dispatch, tripManagementClaimDisplayPage, bookingByAdminList, user: { user } }) => ({
    loading: loading.effects[`${DOMAIN}/init`] || loading.effects[`${DOMAIN}/fetchConfig`],
    saveLoading: loading.effects[`${DOMAIN}/save`],
    dispatch,
    ...tripManagementClaimDisplayPage,
    ...bookingByAdminList,
    user,
  })
)
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
class TripManagementClaimDisplay extends React.PureComponent {
  componentDidMount() {
    // 调用页面载入初始化方法,一般是请求页面数据
    // fromQs 方法从url获取路径参数，仅能在组件加载时调用一次，且只能在一级组件调用，后续在组件内部维护自己的url参数。否则多TAB体系可能会出BUG
    const { id, mode, taskId, from } = fromQs();
    const formMode = mode === 'edit' || mode === 'EDIT' ? 'EDIT' : 'DESCRIPTION';
    const {
      formData,
      user: { extInfo = {} }, // 取当前登陆人的resId
      selectedRows,
      baseCurrencyBookTotalAmt,
    } = this.props;
    // 把url的参数保存到state
    this.updateModelState({ formMode, taskId });
    this.callModelEffects('updateForm', { id });
    this.callModelEffects('init');
    if (from === 'bookingByAdminList') {
      this.callModelEffects('updateForm', {
        details: selectedRows,
        baseCurrencyClaimAmt: baseCurrencyBookTotalAmt,
      });
      this.callModelEffects('fetchAccountList', {
        abNo: selectedRows[0].abNo,
        accStatus: 'ACTIVE',
      });
    }
    taskId === undefined && this.callModelEffects('fetchInternalOuList');
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
   * 提交
   */
  handleSubmit = (param, cb) => {
    const { form, formData } = this.props;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        this.callModelEffects('save', {
          formData: {
            ...omit(['applyStatus'], formData),
            ...param,
            ...values,
            submit: true,
            applyStatus: 'APPROVING',
          },
        }).then(data => {
          cb && cb();
        });
      }
    });
  };

  /**
   * 保存
   */
  handleSave = () => {
    const { form, formData } = this.props;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        this.callModelEffects('save', { formData: { ...formData, ...values } });
      }
    });
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
      form,
      formData,
      formMode,
      loading,
      saveLoading,
      fieldsConfig,
      flowForm,
      taskId,
      accountList,
      baseCurrencyBookTotalAmt,
      applyStatus,
      selectedRows,
      user: { extInfo = {} }, // 取当前登陆人的resId
    } = this.props;

    const { details } = formData;

    const { ticketBookSite, supplierId, chargeCompany, tripTicketClaimName } = selectedRows[0];

    const paymentColumns = [
      {
        title: '商品名称',
        dataIndex: 'temName',
        width: '200px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`details[${index}].temName`}
            disabled
          />
        ),
      },
      {
        title: '数量',
        dataIndex: 'qty',
        width: '80px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`details[${index}].qty`}
            initialValue={1}
            disabled
          />
        ),
      },
      {
        title: '单价',
        dataIndex: 'unitPrice',
        width: '180px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`details[${index}].unitPrice`}
            disabled
          />
        ),
      },
      {
        title: '金额',
        dataIndex: 'amt',
        width: '180px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`details[${index}].amt`}
            disabled
          />
        ),
      },
      {
        title: '交付日期',
        dataIndex: 'deliveryDate',
        width: '160px',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`details[${index}].deliveryDate`}
            disabled
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
            fieldKey={`details[${index}].remark`}
            disabled={formMode === 'DESCRIPTION'}
          />
        ),
      },
    ];
    const paymentDescColumns = [
      {
        title: '商品名称',
        dataIndex: 'temName',
        width: '200px',
      },
      {
        title: '数量',
        dataIndex: 'qty',
        width: '50px',
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
            if (key === 'FLOW_COUNTERSIGN') {
              return Promise.resolve(true);
            }
            if (taskKey === 'ADM_M07_01_SUBMIT_i') {
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
                return Promise.resolve(true);
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
            <FormItem
              fieldType="BaseInput"
              label="结算单号"
              fieldKey="tripTicketClaimNo"
              placeholder="系统字段生成"
              disabled
            />

            <FormItem
              fieldType="BaseInput"
              label="结算单名称"
              fieldKey="tripTicketClaimName"
              required
              initialValue={tripTicketClaimName}
            />

            <FormItem
              fieldType="BaseCustomSelect"
              label="订票方"
              fieldKey="ticketBookSite"
              parentKey="CUS:TICKET_BOOK_SITE"
              disabled
              initialValue={ticketBookSite}
            />

            <FormItem
              fieldType="BaseInputAmt"
              label="结算金额（本位币）"
              fieldKey="baseCurrencyClaimAmt"
              disabled
              initialValue={baseCurrencyBookTotalAmt}
            />

            <FormItem
              fieldType="BaseFileManagerEnhance"
              label="附件"
              fieldKey="attachment"
              api="/api/production/adm/tripTicketClaim/sfs/token"
              dataKey={formData.id}
            />

            <FormItem
              fieldType="SupplierSimpleSelect"
              label="供应商"
              fieldKey="supplierId"
              descriptionField="supplierName"
              disabled
              initialValue={supplierId}
              onChange={(value, option, allOptions) => {
                console.log(option);
                this.callModelEffects('fetchAccountList', {
                  abNo: option[0].supplierNo,
                  accStatus: 'ACTIVE',
                });
              }}
            />

            <FormItem
              fieldType="BaseCustomSelect"
              label="费用承担公司"
              fieldKey="chargeCompany"
              parentKey="CUS:INTERNAL_COMPANY"
              disabled
              initialValue={chargeCompany}
            />

            <FormItem
              fieldType="BaseSelect"
              label="状态"
              fieldKey="applyStatus"
              parentKey="COM:APPLY_STATUS"
              disabled
              initialValue={applyStatus}
            />

            <FormItem
              fieldType="ResSimpleSelect"
              label="申请人"
              fieldKey="applyResId"
              descriptionField="applyResName"
              initialValue={extInfo.resId}
              disabled
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="申请日期"
              initialValue={moment().format('YYYY-MM-DD')}
              fieldKey="applyDate"
              descriptionField="applyDate"
              disabled
            />

            <FormItem fieldType="BaseInputTextArea" label="备注" fieldKey="remark" />
          </BusinessForm>

          {formMode === 'DESCRIPTION' && (
            <DataTable
              title="行政订票明细"
              columns={paymentDescColumns}
              dataSource={details}
              prodSelection={false}
            />
          )}

          {formMode === 'EDIT' && (
            <EditTable
              title="行政订票明细"
              form={form}
              columns={paymentColumns}
              dataSource={details}
            />
          )}

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
              fieldType="BaseSelect"
              label="收款账号"
              fieldKey="accountNo"
              descriptionField="accountNo"
              required
              descList={accountList}
              disabled={formMode === 'DESCRIPTION'}
            />

            <FormItem fieldType="Group" label="支付金额">
              <FormItem
                fieldType="BaseInputAmt"
                fieldKey="paymentAmt"
                descriptionField="paymentAmt"
                disabled
                initialValue={baseCurrencyBookTotalAmt}
              />
              <FormItem
                fieldType="BaseSelect"
                fieldKey="originalCurrency"
                parentKey="COMMON_CURRENCY"
                descriptionField="originalCurrencyDesc"
                disabled
              />
            </FormItem>

            <FormItem fieldType="BaseInput" label="户名" fieldKey="holderName" disabled />

            <FormItem fieldType="BaseInput" label="收款银行" fieldKey="bankName" disabled />

            <FormItem fieldType="BaseInput" label="收款银行网点" fieldKey="bankBranch" disabled />
          </BusinessForm>
        </BpmWrapper>
      </PageWrapper>
    );
  }
}

export default TripManagementClaimDisplay;
