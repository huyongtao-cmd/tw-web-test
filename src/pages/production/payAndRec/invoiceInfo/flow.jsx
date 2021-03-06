import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil } from 'ramda';
import update from 'immutability-helper';
import { Form, Cascader } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import EditTable from '@/components/production/business/EditTable';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import createMessage from '@/components/core/AlertMessage';
import { getUrl } from '@/utils/flowToRouter';
import { createConfirm } from '@/components/core/Confirm';
import { pushFlowTask } from '@/services/gen/flow';
import { closeThenGoto } from '@/layouts/routerControl';
import PageWrapper from '@/components/production/layout/PageWrapper';
import DataTable from '@/components/production/business/DataTable';
import {
  ProductFormItemBlockConfig,
  ProductTableColumnsBlockConfig,
} from '@/utils/pageConfigUtils';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import { fromQs } from '@/utils/production/stringUtil';
import { genFakeId } from '@/utils/mathUtils';

const DOMAIN = 'invoiceApplyFlow';

@connect(({ loading, invoiceApplyFlow, dispatch }) => ({
  loading,
  ...invoiceApplyFlow,
  dispatch,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      if (Array.isArray(tempValue) && key !== 'invItemId') {
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
class indexCom extends Component {
  state = {};

  componentDidMount() {
    const { dispatch } = this.props;

    const { id, taskId, mode } = fromQs();
    this.setState(
      {
        taskId,
        mode,
      },
      () => {
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            formMode: mode === 'edit' ? 'EDIT' : 'DESCRIPTION',
          },
        });

        // ????????????????????????
        dispatch({
          type: `${DOMAIN}/getInvoiceItemList`,
        });

        if (id) {
          dispatch({
            type: `${DOMAIN}/queryDetail`,
            payload: { id },
          }).then(res => {
            const { custId } = res;
            custId &&
              dispatch({
                type: `${DOMAIN}/fetchAsyncSelectList`,
                payload: { custId },
              });
          });
        }

        // ??????????????????
        taskId &&
          dispatch({
            type: `${DOMAIN}/fetchConfig`,
            payload: taskId,
          }).then(res => {
            const { taskKey } = res;
            if (taskKey) {
              // ??????????????????
              dispatch({
                type: `${DOMAIN}/getPageConfig`,
                payload: { pageNo: `SALES_INVOICE_EDIT:${taskKey}` },
              });
            } else {
              dispatch({
                type: `${DOMAIN}/getPageConfig`,
                payload: { pageNo: `SALES_INVOICE_EDIT:detail` },
              });
            }
          });
      }
    );
  }

  componentWillUnmount() {
    // ?????????????????????model???state,?????????????????????????????????
    this.callModelEffects('cleanState');
  }

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  handleSave = isSubmit => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      formData: { invItemId, detialList, ...newFormData },
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/submit`,
          payload: {
            ...newFormData,
            ...values,
            ...isSubmit,
            invItemId:
              Array.isArray(invItemId) && (invItemId[0] && invItemId[1]) ? invItemId[1] : null,
            detialList,
          },
        });
      }
    });
  };

  // ????????????????????????
  renderPage = () => {
    const {
      dispatch,
      formData,
      formMode,
      pageConfig,
      form,
      invoiceItemList = [],
      selectList = [],
    } = this.props;

    const fields = [
      <BusinessFormTitle title="??????????????????" />,
      <FormItem
        label="???????????????"
        key="batchNo"
        fieldKey="batchNo"
        fieldType="BaseInput"
        initialValue={formData.batchNo}
        disabled
        placeholder="??????????????????"
      />,
      <FormItem
        label="????????????"
        fieldKey="batchStatus"
        key="batchStatus"
        fieldType="BaseCustomSelect"
        parentKey="FUNCTION:SALE:SALE_INV_BATCH_STATUS"
        initialValue={formData.batchStatus}
        disabled
      />,
      <FormItem
        label="????????????"
        fieldKey="payMethod"
        key="payMethod"
        fieldType="BaseCustomSelect"
        parentKey="CUS:PAYMENT_METHOD"
        initialValue={formData.payMethod}
      />,
      <FormItem
        label="??????????????????"
        key="invAmt"
        fieldKey="invAmt"
        fieldType="BaseInputAmt"
        initialValue={formData.invAmt}
        disabled
        plcaeholder="??????????????????"
      />,
      <FormItem
        label="??????????????????"
        key="antiRecvDate"
        fieldKey="antiRecvDate"
        fieldType="BaseDatePicker"
        required
        initialValue={formData.antiRecvDate}
      />,
      <FormItem
        label="????????????"
        key="batchDate"
        fieldKey="batchDate"
        fieldType="BaseDatePicker"
        required
        initialValue={formData.batchDate}
      />,
      <BusinessFormTitle title="????????????" />,
      <FormItem
        label="????????????"
        key="invinfoId"
        fieldKey="invinfoId"
        fieldType="BaseSelect"
        initialValue={formData.invinfoId}
        descList={selectList}
        required
        allowClear={false}
        onChange={e => {
          this.invInfoChange(e);
        }}
      />,
      <FormItem
        label="??????"
        key="taxNo"
        fieldKey="taxNo"
        fieldType="BaseInput"
        initialValue={formData.taxNo}
        disabled
      />,
      <FormItem
        label="??????"
        key="invAddr"
        fieldKey="invAddr"
        fieldType="BaseInput"
        initialValue={formData.invAddr}
        disabled
      />,
      <FormItem
        label="?????????"
        key="bankName"
        fieldKey="bankName"
        fieldType="BaseInput"
        initialValue={formData.bankName}
        disabled
      />,
      <FormItem
        label="??????"
        key="accountNo"
        fieldKey="accountNo"
        fieldType="BaseInput"
        initialValue={formData.accountNo}
        disabled
      />,
      <FormItem
        label="??????"
        key="invTel"
        fieldKey="invTel"
        fieldType="BaseInput"
        initialValue={formData.invTel}
        disabled
      />,
      <FormItem fieldType="Group" label="????????????/??????" key="invType" required>
        <FormItem
          key="invType"
          fieldKey="invType"
          fieldType="BaseCustomSelect"
          parentKey="COM:INV_TYPE"
          initialValue={formData.invType}
        />
        <FormItem
          key="taxRate"
          fieldKey="taxRate"
          fieldType="BaseCustomSelect"
          parentKey="CUS:DEDUCT_TAX_RATE"
          initialValue={formData.taxRate}
        />
      </FormItem>,
      <FormItem
        label="??????"
        fieldKey="currCode"
        key="currCode"
        fieldType="BaseSelect"
        parentKey="COMMON_CURRENCY"
        initialValue={formData.currCode}
        disabled
      />,
      <FormItem
        label="????????????"
        key="invItemId"
        fieldKey="invItemId"
        fieldType="Custom"
        initialValue={formData.invItemId}
        descriptionField="invItemIdDesc"
      >
        <Cascader
          style={{ width: '100%' }}
          options={invoiceItemList}
          showSearch
          matchInputWidth
          placeholder="?????????????????????"
        />
      </FormItem>,
      <BusinessFormTitle title="????????????" />,
      <FormItem
        label="????????????"
        fieldKey="deliMethod"
        key="deliMethod"
        fieldType="BaseCustomSelect"
        parentKey="COM:DELI_METHOD"
        initialValue={formData.deliMethod}
        required
      />,
      <FormItem
        label="?????????"
        key="recvPerson"
        fieldKey="recvPerson"
        fieldType="BaseInput"
        initialValue={formData.recvPerson}
      />,
      <FormItem
        label="???????????????"
        key="recvEmail"
        fieldKey="recvEmail"
        fieldType="BaseInput"
        required
        initialValue={formData.recvEmail}
      />,
      <FormItem
        label="???????????????"
        key="recvAddr"
        fieldKey="recvAddr"
        fieldType="BaseInput"
        initialValue={formData.recvAddr}
      />,
      <FormItem
        label="?????????????????????"
        key="recvTel"
        fieldKey="recvTel"
        fieldType="BaseInput"
        initialValue={formData.recvTel}
      />,
      <FormItem
        fieldType="BaseFileManagerEnhance"
        label="??????"
        key="attach"
        fieldKey="attach"
        dataKey={fromQs().id}
        api="/api/production/invBatchs/sfs/token"
        listType="text"
        attach
      />,
      <FormItem
        label="?????????"
        fieldKey="createUserId"
        key="createUserId"
        fieldType="UserSimpleSelect"
        initialValue={formData.createUserId}
        disabled
      />,
      <FormItem
        label="????????????"
        fieldKey="createTime"
        key="createTime"
        fieldType="BaseDatePicker"
        initialValue={formData.createTime}
        disabled
      />,
      <FormItem
        label="????????????"
        fieldKey="invDesc"
        key="invDesc"
        fieldType="BaseInputTextArea"
        initialValue={formData.invDesc}
      />,
    ];

    const fieldsConfig = ProductFormItemBlockConfig(pageConfig, 'blockKey', 'FORM', fields);

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={12}>
        {fieldsConfig}
      </BusinessForm>
    );
  };

  invInfoChange = value => {
    const { dispatch } = this.props;
    if (!isNil(value)) {
      dispatch({
        type: `${DOMAIN}/invInfoDetail`,
        payload: {
          id: value,
        },
      });
    }
  };

  renderColumns = () => {
    const { form, pageConfig, fieldsConfig } = this.props;

    const { taskKey } = fieldsConfig;

    const tableInputDisabled = taskKey !== 'SAL02_03_INVOICE_CONFIRM';

    const fields = [
      {
        title: '??????????????????',
        dataIndex: 'invStatus',
        align: 'center',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseCustomSelect"
            parentKey="COM:INV_TYPE"
            fieldKey={`detialList[${index}].invStatus`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '?????????',
        align: 'center',
        dataIndex: 'invNo',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`detialList[${index}].invNo`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '?????????',
        align: 'center',
        dataIndex: 'deliveryNo',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`detialList[${index}].deliveryNo`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '????????????',
        align: 'center',
        dataIndex: 'deliveryDate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`detialList[${index}].deliveryDate`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '????????????',
        align: 'center',
        dataIndex: 'invAmt',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`detialList[${index}].invAmt`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'netAmt',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`detialList[${index}].netAmt`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'taxAmt',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`detialList[${index}].taxAmt`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '????????????',
        align: 'center',
        dataIndex: 'downloadUrl',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`detialList[${index}].downloadUrl`}
            disabled={tableInputDisabled}
          />
        ),
      },
    ];
    // const fieldsConfig = ProductTableColumnsBlockConfig(
    //   pageConfig,
    //   'blockKey',
    //   'EXPENSE_QUOTA_D_TABLT',
    //   fields
    // );

    return fields;
  };

  renderColumnsView = () => {
    const { dispatch, form, pageConfig } = this.props;

    const fields = [
      {
        title: '??????????????????',
        dataIndex: 'invStatusDesc',
        align: 'center',
      },
      {
        title: '?????????',
        align: 'center',
        dataIndex: 'invNo',
      },
      {
        title: '?????????',
        align: 'center',
        dataIndex: 'deliveryNo',
      },
      {
        title: '????????????',
        align: 'center',
        dataIndex: 'deliveryDate',
      },
      {
        title: '????????????',
        align: 'right',
        dataIndex: 'invAmt',
        render: text => (text ? text.toFixed(2) : '0.00'),
      },
      {
        title: '??????',
        align: 'right',
        dataIndex: 'netAmt',
        render: text => (text ? text.toFixed(2) : '0.00'),
      },
      {
        title: '??????',
        align: 'right',
        dataIndex: 'taxAmt',
        render: text => (text ? text.toFixed(2) : '0.00'),
      },
      {
        title: '????????????',
        align: 'center',
        dataIndex: 'downloadUrl',
      },
    ];
    // const fieldsConfig = ProductTableColumnsBlockConfig(
    //   pageConfig,
    //   'blockKey',
    //   'EXPENSE_QUOTA_D_TABLT',
    //   fields
    // );

    return fields;
  };

  render() {
    const {
      dispatch,
      loading,
      form,
      formData,
      formMode,
      detailDelViews,
      fieldsConfig,
      flowForm,
    } = this.props;
    const { detialList = [] } = formData;
    const { taskId, mode } = this.state;
    const { taskKey } = fieldsConfig;

    const disabledBtn =
      loading.effects[`${DOMAIN}/queryDetail`] || loading.effects[`${DOMAIN}/submit`];

    return (
      <PageWrapper>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          buttonLoading={disabledBtn}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { branch, remark } = bpmForm;
            const { key } = operation;

            if (key === 'FLOW_COUNTERSIGN') {
              return Promise.resolve(true);
            }

            if (key === 'FLOW_RETURN') {
              createConfirm({
                content: '??????????????????????????????',
                onOk: () =>
                  pushFlowTask(taskId, {
                    remark,
                    result: 'REJECTED',
                    branch,
                    taskKey,
                  }).then(({ status, response }) => {
                    if (status === 200) {
                      createMessage({ type: 'success', description: '????????????' });
                      const url = getUrl().replace('edit', 'view');
                      closeThenGoto(url);
                    }
                    return Promise.resolve(false);
                  }),
              });
            }

            if (key === 'FLOW_PASS' || key === 'FLOW_COMMIT') {
              // TODO:???????????????????????????
              if (taskKey === 'SAL02_03_INVOICE_CONFIRM' && isEmpty(detialList)) {
                createMessage({ type: 'warn', description: '???????????????????????????!' });
                return Promise.resolve(false);
              }
              this.handleSave({
                result: 'APPROVED',
                procTaskId: taskId,
                taskId,
                procRemark: remark,
                branch,
                submit: true,
                procTaskKey: taskKey,
                taskKey,
              });
            }
            return Promise.resolve(false);
          }}
        >
          {this.renderPage()}
          {// eslint-disable-next-line no-nested-ternary
          mode === 'view' ? (
            <DataTable
              title="??????????????????"
              columns={this.renderColumnsView()}
              dataSource={detialList}
              prodSelection
              rowSelection={null}
            />
          ) : taskKey === 'SAL02_03_INVOICE_CONFIRM' ? (
            <EditTable
              title="??????????????????"
              form={form}
              columns={this.renderColumns()}
              dataSource={detialList}
              onAddClick={() => {
                dispatch({
                  type: `${DOMAIN}/updateForm`,
                  payload: {
                    detialList: update(detialList, {
                      $push: [
                        {
                          id: genFakeId(-1),
                          saleId: fromQs().id,
                        },
                      ],
                    }),
                  },
                });
              }}
              onDeleteConfirm={keys => {
                const newDataSource = detialList.filter(row => keys.indexOf(row.id) < 0);
                dispatch({
                  type: `${DOMAIN}/updateForm`,
                  payload: {
                    detialList: newDataSource,
                  },
                });
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: {
                    detailDelViews: [...detailDelViews, ...keys],
                  },
                });
              }}
            />
          ) : (
            <EditTable
              title="??????????????????"
              form={form}
              columns={this.renderColumns()}
              dataSource={detialList}
              footer={null}
              rowSelection={null}
            />
          )}
        </BpmWrapper>
      </PageWrapper>
    );
  }
}

export default indexCom;
