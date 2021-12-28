import React from 'react';
import { connect } from 'dva';
import { clone, isEmpty, isNil, omit } from 'ramda';
import { Form, Icon, InputNumber, Tooltip } from 'antd';
// 产品化组件
import BusinessForm from '@/components/production/business/BusinessForm.tsx';
import FormItem from '@/components/production/business/FormItem.tsx';
import PageWrapper from '@/components/production/layout/PageWrapper.tsx';
import ButtonCard from '@/components/production/layout/ButtonCard.tsx';
import Button from '@/components/production/basic/Button.tsx';

import { fromQs } from '@/utils/production/stringUtil.ts';
// service方法
import EditTable from '@/components/production/business/EditTable.tsx';
import DataTable from '@/components/production/business/DataTable.tsx';
import moment from 'moment';
import { createConfirm } from '@/components/core/Confirm';
import { pushFlowTask } from '@/services/gen/flow';
import createMessage from '@/components/core/AlertMessage';
import { getUrl } from '@/utils/flowToRouter';
import { closeThenGoto } from '@/layouts/routerControl';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import update from 'immutability-helper';
import { genFakeId } from '@/utils/production/mathUtils.ts';
import BaseInputAmt from '@/components/production/basic/BaseInputAmt.tsx';
import message from '@/components/production/layout/Message.tsx';

// namespace声明
const DOMAIN = 'loanDisplay';
const TOTAL_ROW_ID = 'TOTAL';

/**
 * 常规报销 综合展示页面
 */
@connect(({ loading, dispatch, loanDisplay, user: { user } }) => ({
  loading: loading.effects[`${DOMAIN}/init`] || loading.effects[`${DOMAIN}/fetchConfig`],
  saveLoading: loading.effects[`${DOMAIN}/save`],
  dispatch,
  ...loanDisplay,
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
class LoanDisplay extends React.PureComponent {
  componentDidMount() {
    // 调用页面载入初始化方法,一般是请求页面数据
    // fromQs 方法从url获取路径参数，仅能在组件加载时调用一次，且只能在一级组件调用，后续在组件内部维护自己的url参数。否则多TAB体系可能会出BUG
    const { id, copy, mode, currentNode = 'create', taskId } = fromQs();
    const formMode = mode === 'edit' || mode === 'EDIT' ? 'EDIT' : 'DESCRIPTION';
    const {
      user: { extInfo = {} }, // 取当前登陆人的resId
    } = this.props;
    // 把url的参数保存到state
    this.updateModelState({ formMode, currentNode, copy, taskId });
    this.callModelEffects('updateForm', { id, chargeBuId: extInfo.baseBuId });
    this.callModelEffects('init').then(data => {
      this.callModelEffects('fetchInternalOuList');
      this.callModelEffects('fetchBusinessAccItem', {
        docType: 'LOAN_APPLY',
        buId: data.chargeBuId || extInfo.baseBuId,
      });
      taskId && this.callModelEffects('fetchConfig', taskId);
    });
    this.callModelEffects('fetchBudgetType');
    this.callModelEffects('fetchBudgetList');
    this.callModelEffects('fetchFinancialAccSubjList');
    this.callModelEffects('fetchCustomSetting');

    this.callModelEffects('fetchAccountList', { abNo: extInfo.abNo, accStatus: 'ACTIVE' });
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    this.callModelEffects('cleanState');
  }

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
   * 保存
   */
  handleSave = (param, cb) => {
    const { form, formData, deleteKeys } = this.props;
    const { details } = formData;

    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        // 费用明细不能为空业务检查
        if (!details || details.length < 1) {
          createMessage({ type: 'error', description: '请填写至少一条费用明细!' });
          return;
        }
        this.callModelEffects('save', {
          formData: {
            ...formData,
            ...omit(['details'], values),
            deleteKeys,
            ...param,
          },
          cb,
        });
      }
    });
  };

  /**
   * 提交
   */
  handleSubmit = (param, cb) => {
    const { form, formData, deleteKeys } = this.props;
    const { details } = formData;

    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        // 费用明细不能为空业务检查
        if (!details || details.length < 1) {
          createMessage({ type: 'error', description: '请填写至少一条费用明细!' });
          return;
        }
        this.callModelEffects('save', {
          formData: {
            ...formData,
            ...omit(['details'], values),
            deleteKeys,
            ...param,
            submit: true,
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
    this.callModelEffects('init');
    this.updateModelState({ formMode: 'EDIT' });
  };

  /**
   * @param changeAmt 变化金额
   * 当明细行金额变化
   */
  handleChangeAmt = changeAmt => {
    const { formData } = this.props;
    if (!Number.isNaN(changeAmt)) {
      const originalCurrencyAmt = (formData.originalCurrencyAmt || 0) + changeAmt;
      const baseCurrencyAmt =
        originalCurrencyAmt * (isNil(formData.exchangeRate) ? 1 : formData.exchangeRate);
      this.callModelEffects('updateForm', {
        originalCurrencyAmt,
        baseCurrencyAmt,
        paymentAmt: baseCurrencyAmt,
      });
    }
  };

  /**
   * 计算总额
   */
  handleTotalAmt = () => {
    const { formData } = this.props;
    const { details = [] } = formData;
    const originalCurrencyAmt = details
      .map(item => item.amt)
      .reduce((a, b) => Number(isNil(a) ? 0 : a) + Number(isNil(b) ? 0 : b), 0);
    const baseCurrencyAmt =
      originalCurrencyAmt * (isNil(formData.exchangeRate) ? 1 : formData.exchangeRate);
    this.callModelEffects('updateForm', {
      originalCurrencyAmt,
      baseCurrencyAmt,
      paymentAmt: baseCurrencyAmt,
    });
  };

  render() {
    const {
      form,
      dispatch,
      formData,
      formMode,
      currentNode,
      internalOuList,
      businessAccItemList,
      budgetList,
      financialAccSubjList,
      accountList,
      budgetTypeList,
      deleteKeys,
      loading,
      saveLoading,
      taskId,
      fieldsConfig,
      flowForm,
      user: { extInfo = {} }, // 取当前登陆人的resId
    } = this.props;

    const busAccItemClearWarnFlag = formData.details.length > 0;

    // 其他流程
    const allBpm = [{ docId: formData.id, procDefKey: 'COS11', title: '借款申请流程' }];

    const { details } = formData;

    const editColumns = [
      {
        title: (
          <span>
            核算项目&nbsp;
            <Tooltip title="只能选择最底级核算项目">
              <Icon type="question-circle" />
            </Tooltip>
          </span>
        ),
        dataIndex: 'busAccItemId',
        required: true,
        render: (text, record, index) =>
          record.id === TOTAL_ROW_ID ? (
            text
          ) : (
            <FormItem
              form={form}
              fieldType="BaseTreeSelect"
              required
              disabled={currentNode !== 'create'}
              fieldKey={`details[${index}].busAccItemId`}
              options={businessAccItemList}
              optionsKeyField="busAccItemId"
              onChange={(value, option) => {
                if (option.length > 0) {
                  const arr = [];
                  arr[index] = {
                    budgetItemId: option[0].budgetItemId,
                    finAccSubjId: option[0].finAccSubjId,
                  };
                  this.callModelEffects('updateFormForEditTable', { details: arr });
                }
              }}
            />
          ),
      },
      {
        title: '预算项目',
        dataIndex: 'budgetItemId',
        required: true,
        render: (text, record, index) =>
          record.id !== TOTAL_ROW_ID && (
            <FormItem
              form={form}
              fieldType="BaseTreeSelect"
              required
              disabled={currentNode !== 'create'}
              fieldKey={`details[${index}].budgetItemId`}
              options={budgetList}
            />
          ),
      },
      {
        title: '会计科目',
        dataIndex: 'finAccSubjId',
        render: (text, record, index) =>
          record.id !== TOTAL_ROW_ID && (
            <FormItem
              form={form}
              fieldType="BaseTreeSelect"
              disabled={currentNode !== 'financeEdit'}
              fieldKey={`details[${index}].finAccSubjId`}
              options={financialAccSubjList}
            />
          ),
      },
      {
        title: '借款说明',
        dataIndex: 'loanRemark',
        required: true,
        render: (text, record, index) =>
          record.id !== TOTAL_ROW_ID && (
            <FormItem
              form={form}
              fieldType="BaseInputTextArea"
              required
              disabled={currentNode !== 'create'}
              fieldKey={`details[${index}].loanRemark`}
            />
          ),
      },
      {
        title: '金额',
        dataIndex: 'amt',
        required: true,
        render: (text, record, index) =>
          record.id === TOTAL_ROW_ID ? (
            <BaseInputAmt value={text} disabled />
          ) : (
            <FormItem
              form={form}
              required
              fieldType="BaseInputAmt"
              fieldKey={`details[${index}].amt`}
              disabled={currentNode !== 'create'}
              // onChange={value => {
              //   this.handleTotalAmt();
              //
              // }}
            />
          ),
      },
    ];

    const descriptionColumns = [
      {
        title: '核算项目',
        dataIndex: 'busAccItemIdDesc',
      },
      {
        title: '预算项目',
        dataIndex: 'budgetItemIdDesc',
      },
      {
        title: '会计科目',
        dataIndex: 'finAccSubjIdDesc',
      },
      {
        title: '借款说明',
        dataIndex: 'loanRemark',
      },
      {
        title: '金额',
        dataIndex: 'amt',
        className: 'prod-number-description',
        render: text => (isNil(text) ? '' : text.toFixed(2)),
      },
    ];
    /* eslint-disable no-nested-ternary */
    const sumAmt = details
      .map(item => item.amt)
      .reduce((a, b) => Number(isNil(a) ? 0 : a) + Number(isNil(b) ? 0 : b), 0);
    /* eslint-enable no-nested-ternary */
    const sumRow = {
      id: TOTAL_ROW_ID,
      busAccItemId: '合计',
      amt: sumAmt,
    };
    const sumWrappedDetails = details.concat(sumRow);

    const detailOperation =
      currentNode !== 'create'
        ? {}
        : {
            onAddClick: () => {
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  details: update(details, {
                    $push: [
                      {
                        id: genFakeId(-1),
                        amt: 0,
                      },
                    ],
                  }),
                },
              });
            },
            onCopyClick: copied => {
              const newDataSource = update(details, {
                $push: copied.map(item => ({
                  ...item,
                  id: genFakeId(-1),
                })),
              });
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  details: newDataSource,
                },
              });
            },
            onDeleteConfirm: keys => {
              const newDataSource = details.filter(row => keys.indexOf(row.id) < 0);
              const originalCurrencyAmt = newDataSource
                .map(item => item.amt)
                .reduce((a, b) => Number(isNil(a) ? 0 : a) + Number(isNil(b) ? 0 : b), 0);
              const baseCurrencyAmt =
                originalCurrencyAmt * (isNil(formData.exchangeRate) ? 1 : formData.exchangeRate);
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  details: newDataSource,
                  originalCurrencyAmt,
                  baseCurrencyAmt,
                  paymentAmt: baseCurrencyAmt,
                },
              });
              this.updateModelState({ deleteKeys: [...deleteKeys, ...keys] });
            },
          };

    return (
      <PageWrapper loading={loading}>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          buttonLoading={saveLoading}
          onBpmChanges={value => {
            this.callModelEffects('updateFlowForm', { value });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { branch, remark } = bpmForm;
            const { key } = operation;
            const { taskKey } = fieldsConfig;
            if (key === 'COUNTERSIGN') {
              return Promise.resolve(true);
            }
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
            if (taskKey === 'COS11_01_SUBMIT_i') {
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
            } else if (key === 'FLOW_PASS') {
              this.handleSubmit(
                {
                  result: 'APPROVED',
                  taskId,
                  procRemark: remark,
                  branch,
                  dryRunFlag: true,
                },
                () => {
                  const url = getUrl().replace('edit', 'view');
                  closeThenGoto(url);
                }
              );
              return Promise.resolve(false);
            }

            return Promise.resolve(false);
          }}
        >
          <ButtonCard>
            {formMode === 'EDIT' && [
              <Button
                key="save"
                size="large"
                type="primary"
                onClick={() => {
                  this.handleSave({}, output => {
                    message({ type: 'success' });
                    this.callModelEffects('updateForm', { id: output.data.id });
                    this.callModelEffects('init', { id: output.data.id });
                  });
                }}
                loading={saveLoading}
              >
                保存
              </Button>,
            ]}
            {formMode === 'EDIT' && (
              <Button
                key="submit"
                size="large"
                type="primary"
                onClick={() =>
                  this.handleSubmit({ result: 'APPROVED' }, () => {
                    closeThenGoto(`/user/flow/process?type=procs`);
                  })
                }
                loading={saveLoading}
              >
                提交
              </Button>
            )}
            {formMode === 'DESCRIPTION' &&
              formData.loanCtatus === 'CREATE' && (
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
            <FormItem fieldType="BaseInput" label="借款单号" fieldKey="loanNo" disabled />

            <FormItem
              fieldType="BaseRadioSelect"
              label="费用归属"
              fieldKey="chargeClassification"
              parentKey="CUS:CHARGE_CLASSIFICATION"
              options={budgetTypeList}
              required
              disabled={currentNode !== 'create'}
              onChange={(value, option) => {
                this.callModelEffects('updateForm', {
                  chargeProjectId: undefined,
                });
              }}
            />

            <FormItem
              fieldType="ResSimpleSelect"
              label="借款人"
              fieldKey="loanResId"
              descriptionField="loanResIdDesc"
              initialValue={extInfo.resId}
              required
              disabled={currentNode !== 'create'}
              descList={[{ value: extInfo.resId, title: extInfo.resName }]}
              onChange={(value, option) => {
                if (option.length > 0) {
                  this.callModelEffects('updateForm', {
                    loanResBuId: option[0].baseBuId,
                    loanResGrade: option[0].jobGrade,
                    loanUserId: option[0].userId,
                  });
                  this.callModelEffects('fetchAccountList', {
                    abNo: option[0].abNo,
                    accStatus: 'ACTIVE',
                  });
                } else {
                  this.callModelEffects('updateForm', {
                    loanResBuId: undefined,
                    loanResGrade: undefined,
                    loanUserId: undefined,
                  });
                }
              }}
            />

            <FormItem
              fieldType="BuSimpleSelect"
              label="借款人部门"
              fieldKey="loanResBuId"
              descriptionField="loanResBuIdDesc"
              disabled
              initialValue={extInfo.baseBuId}
              descList={[{ value: extInfo.baseBuId, title: extInfo.baseBuName }]}
            />

            <FormItem
              fieldType="BaseInput"
              label="借款人职级"
              fieldKey="loanResGrade"
              disabled
              initialValue={extInfo.jobGrade}
            />

            <FormItem
              fieldType="BaseInput"
              label="借款简述"
              fieldKey="loanBrief"
              disabled={currentNode !== 'create'}
              required
            />

            <FormItem
              fieldType="BaseCustomSelect"
              label="借款类型"
              fieldKey="loanType"
              parentKey="COS:LOAN_APPLY:TYPE"
              disabled={currentNode !== 'create'}
              required
            />

            <FormItem
              fieldType="ProjectSimpleSelect"
              label="费用承担项目"
              fieldKey="chargeProjectId"
              queryParam={{
                myProjectResId: formData.loanResId,
                myProjectUserId: formData.loanUserId,
                projectClass1: formData.chargeClassification,
                projectStatus: 'ACTIVE',
              }}
              required={formData.chargeClassification !== 'DAILY'}
              disabled={formData.chargeClassification === 'DAILY' || currentNode !== 'create'}
              onChange={(value, option) => {
                if (option.length > 0) {
                  const buTypeTemp = option[0].inchargeBuType;
                  if (formData.chargeBuType === buTypeTemp) {
                    this.callModelEffects('updateForm', {
                      chargeBuId: option[0].inchargeBuId,
                      chargeCompany: option[0].inchargeCompany,
                    });
                  } else {
                    // buType 切换
                    // eslint-disable-next-line no-lonely-if
                    if (busAccItemClearWarnFlag) {
                      createConfirm({
                        content: '该操作将清空所有核算项目,确认继续吗?',
                        onOk: () => {
                          this.callModelEffects('updateForm', {
                            chargeBuId: option[0].inchargeBuId,
                            chargeCompany: option[0].inchargeCompany,
                          });
                          this.callModelEffects('clearAllBusAccItem');
                          this.callModelEffects('fetchBusinessAccItem', {
                            docType: 'LOAN_APPLY',
                            butmplType: buTypeTemp,
                          });
                        },
                        onCancel: () => {
                          this.callModelEffects('updateForm', {
                            chargeProjectId: formData.chargeProjectId,
                          });
                        },
                      });
                    } else {
                      this.callModelEffects('fetchBusinessAccItem', {
                        docType: 'LOAN_APPLY',
                        butmplType: buTypeTemp,
                      });
                      this.callModelEffects('updateForm', {
                        chargeBuId: option[0].inchargeBuId,
                        chargeCompany: option[0].inchargeCompany,
                      });
                    }
                  }
                }
              }}
              descList={[{ value: formData.chargeProjectId, title: formData.chargeProjectName }]}
            />

            <FormItem
              fieldType="BuSimpleSelect"
              label="费用承担部门"
              fieldKey="chargeBuId"
              required
              disabled={formData.chargeProjectId !== undefined || currentNode !== 'create'}
              // initialValue={extInfo.baseBuId}
              onChange={(value, option) => {
                if (option.length > 0) {
                  const buTypeTemp = option[0].buType;
                  const ouList = internalOuList.filter(
                    item => item.extVarchar1 === option[0].ouAbNo
                  );
                  const chargeCompany = ouList.length > 0 ? ouList[0].value : undefined;
                  if (formData.chargeBuType === buTypeTemp) {
                    this.callModelEffects('updateForm', {
                      chargeCompany,
                      // chargeBuType:option[0].buType,
                    });
                  } else {
                    // buType 切换
                    // eslint-disable-next-line no-lonely-if
                    if (busAccItemClearWarnFlag) {
                      createConfirm({
                        content: '该操作将清空所有核算项目,确认继续吗?',
                        onOk: () => {
                          this.callModelEffects('updateForm', {
                            chargeCompany,
                            chargeBuType: option[0].buType,
                          });
                          this.callModelEffects('clearAllBusAccItem');
                          this.callModelEffects('fetchBusinessAccItem', {
                            docType: 'LOAN_APPLY',
                            butmplType: buTypeTemp,
                          });
                        },
                        onCancel: () => {
                          this.callModelEffects('updateForm', { chargeBuId: formData.chargeBuId });
                        },
                      });
                    } else {
                      this.callModelEffects('updateForm', {
                        chargeCompany,
                      });
                      this.callModelEffects('fetchBusinessAccItem', {
                        docType: 'LOAN_APPLY',
                        butmplType: buTypeTemp,
                      });
                    }
                  }
                } else {
                  // 清空部门
                  // eslint-disable-next-line no-lonely-if
                  if (busAccItemClearWarnFlag) {
                    createConfirm({
                      content: '该操作将清空所有核算项目,确认继续吗?',
                      onOk: () => {
                        this.callModelEffects('updateForm', {
                          chargeBuType: undefined,
                        });
                        this.callModelEffects('clearAllBusAccItem');
                        this.updateModelState({ businessAccItemList: [] });
                      },
                      onCancel: () => {
                        this.callModelEffects('updateForm', { chargeBuId: formData.chargeBuId });
                      },
                    });
                  }
                }
              }}
              descList={[
                { value: extInfo.baseBuId, title: extInfo.baseBuName },
                { value: formData.chargeBuId, title: formData.chargeBuName },
              ]}
            />

            <FormItem
              fieldType="BaseInputHidden"
              label="费用承担部门类型"
              fieldKey="chargeBuType"
            />

            <FormItem
              fieldType="BaseSelect"
              label="费用承担公司"
              fieldKey="chargeCompany"
              required
              disabled={!isNil(formData.chargeProjectId) || currentNode !== 'create'}
              descList={internalOuList}
            />

            <FormItem
              fieldType="BudgetSimpleSelect"
              label="相关预算"
              fieldKey="relatedBudgetId"
              required
              queryParam={{
                chargeBuId: formData.chargeBuId,
                chargeProjectId: formData.chargeProjectId,
                budgetStatus: 'ACTIVE',
              }}
              disabled={currentNode !== 'create'}
              descList={[{ value: formData.relatedBudgetId, title: formData.relatedBudgetIdDesc }]}
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="约定付款期限"
              fieldKey="agreedDate"
              disabled={currentNode !== 'create'}
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="预计核销日期"
              fieldKey="writeOffDate"
              disabled={currentNode !== 'create'}
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="付款日期"
              question="出纳付款节点通过时自动写入当天日期"
              fieldKey="paymentDate"
              disabled
            />

            <FormItem
              fieldType="BaseSwitch"
              label="外币业务"
              fieldKey="foreignCurrencyFlag"
              descriptionField="foreignCurrencyFlagDesc"
              // parentKey="COMMON:YES-OR-NO"
              required
              disabled={currentNode !== 'create'}
            />

            <FormItem
              fieldType="Group"
              label="原币/汇率"
              fieldKey="originalCurrencyAndExchangeRate"
              required={formData.foreignCurrencyFlag}
              visible={formData.foreignCurrencyFlag}
              disabled={currentNode !== 'create'}
            >
              <FormItem
                fieldType="BaseSelect"
                fieldKey="originalCurrency"
                parentKey="COMMON_CURRENCY"
                required={formData.foreignCurrencyFlag}
                disabled={currentNode !== 'create'}
                descList={[
                  { value: formData.originalCurrency, title: formData.originalCurrencyDesc },
                ]}
              />
              <FormItem
                fieldType="BaseInputAmt"
                fieldKey="exchangeRate"
                placeholder="请输入汇率"
                required={formData.foreignCurrencyFlag}
                disabled={currentNode !== 'create'}
                scale={6}
                onChange={(value, option) => {
                  if (formData.originalCurrencyAmt) {
                    const baseAmt = value * formData.originalCurrencyAmt;
                    this.callModelEffects('updateForm', {
                      baseCurrencyAmt: baseAmt,
                      paymentAmt: baseAmt,
                    });
                  }
                }}
              />
            </FormItem>

            <FormItem
              fieldType="BaseInputAmt"
              label="原币金额"
              fieldKey="originalCurrencyAmt"
              disabled
              visible={formData.foreignCurrencyFlag}
              onChange={(value, option) => {
                let tempexchangeRage = 1;
                if (formData.exchangeRate) {
                  tempexchangeRage = formData.exchangeRate;
                }
                const baseAmt = value * tempexchangeRage;
                this.callModelEffects('updateForm', { baseCurrencyAmt: baseAmt });
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
              fieldKey="file"
              api="/api/production/cos/loan/sfs/token"
              dataKey={formData.id}
              disabled={currentNode !== 'create'}
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="记账日期"
              fieldKey="accountingDate"
              required={currentNode === 'financeEdit'}
              disabled={currentNode !== 'financeEdit'}
            />

            <FormItem
              fieldType="BaseSelect"
              label="状态"
              fieldKey="loanStatus"
              parentKey="COS:LOAN_APPLY:STATUS"
              disabled
            />

            <FormItem
              fieldType="BaseSelect"
              label="创建人"
              fieldKey="createUserId"
              descriptionField="createUserName"
              initialValue={extInfo.userId}
              disabled
              descList={[
                { value: extInfo.userId, title: extInfo.resName },
                { value: formData.createUserId, title: formData.createUserName },
              ]}
            />

            <FormItem
              fieldType="BaseDatePicker"
              label="创建日期"
              fieldKey="createTime"
              disabled
              initialValue={moment().format('YYYY-MM-DD')}
            />

            <FormItem
              fieldType="BaseInputTextArea"
              label="备注"
              fieldKey="remark"
              disabled={currentNode !== 'create'}
            />
          </BusinessForm>

          {formMode === 'EDIT' && (
            <EditTable
              title="借款明细"
              form={form}
              columns={editColumns}
              dataSource={sumWrappedDetails}
              rowSelectAble={false}
              {...detailOperation}
            />
          )}

          {formMode === 'DESCRIPTION' && (
            <DataTable
              title="借款明细"
              columns={descriptionColumns}
              dataSource={sumWrappedDetails}
              prodSelection={false}
            />
          )}

          <BusinessForm
            title="支付信息"
            form={form}
            formData={formData}
            formMode={formMode}
            defaultColumnStyle={8}
          >
            <FormItem
              fieldType="BaseCustomSelect"
              label="支付方式"
              fieldKey="paymentMethod"
              parentKey="CUS:PAYMENT_METHOD"
              initialValue="BANK_TRANSFER"
              required
              disabled={currentNode !== 'create' && currentNode !== 'applyEdit'}
            />

            <FormItem
              fieldType="BaseSelect"
              label="收款账户"
              descriptionField="accountNo"
              fieldKey="accountNo"
              descList={accountList}
              required
              disabled={currentNode !== 'create' && currentNode !== 'applyEdit'}
            />

            <FormItem
              fieldType="BaseSelect"
              label="支付币种"
              fieldKey="paymentCurrency"
              parentKey="COMMON_CURRENCY"
              disabled
            />

            <FormItem fieldType="BaseInput" label="户名" fieldKey="holderName" disabled />

            <FormItem fieldType="BaseInput" label="收款银行" fieldKey="bankName" disabled />

            <FormItem fieldType="BaseInput" label="收款银行网点" fieldKey="bankBranch" disabled />
          </BusinessForm>
        </BpmWrapper>
        {!taskId && <BpmConnection source={allBpm} />}
      </PageWrapper>
    );
  }
}

export default LoanDisplay;
