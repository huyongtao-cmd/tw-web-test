import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, type } from 'ramda';
import update from 'immutability-helper';
import { Form, Card } from 'antd';
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
import { genFakeId } from '@/utils/production/mathUtils';
import { div, mul } from '@/utils/mathUtils';

const DOMAIN = 'saleOrderFlow';

@connect(({ loading, saleOrderFlow, dispatch }) => ({
  loading,
  ...saleOrderFlow,
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

        // ????????????
        dispatch({
          type: `${DOMAIN}/getCustomerList`,
        });

        if (id) {
          dispatch({
            type: `${DOMAIN}/saleOrderDetail`,
            payload: { id },
          });
        }

        // ??????????????????
        taskId &&
          dispatch({
            type: `${DOMAIN}/fetchConfig`,
            payload: taskId,
          }).then(res => {
            const { taskKey } = res;
            if (taskKey === 'SAL01_01_SUBMIT_i') {
              // ??????????????????
              dispatch({
                type: `${DOMAIN}/getPageConfig`,
                payload: { pageNo: 'SALE_ORDER_EDIT' },
              });
            } else if (taskKey === 'SAL03_01_SUBMIT_i') {
              // ??????????????????
              dispatch({
                type: `${DOMAIN}/getPageConfig`,
                payload: { pageNo: 'SALE_ORDER_ADJUST' },
              });
            } else {
              // ??????????????????
              dispatch({
                type: `${DOMAIN}/getPageConfig`,
                payload: { pageNo: 'SALE_ORDER_EDIT:APPROVE' },
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
      formData: { detailViews, planViews, ...newFormData },
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/submit`,
          payload: {
            ...newFormData,
            ...values,
            detailEntities: detailViews,
            planEntities: planViews,
            ...isSubmit,
          },
        });
      }
    });
  };

  // ????????????????????????
  renderPage = () => {
    const { dispatch, formData, formMode, pageConfig, form, customerList = [] } = this.props;

    const fields = [
      <BusinessFormTitle title="????????????" />,
      <FormItem
        label="???????????????"
        key="soName"
        fieldKey="soName"
        fieldType="BaseInput"
        required
        initialValue={formData.soName}
      />,
      <FormItem
        label="???????????????"
        key="soNo"
        fieldKey="soNo"
        fieldType="BaseInput"
        initialValue={formData.soNo}
        disabled
        plcaeholder="??????????????????"
      />,
      <FormItem
        label="????????????"
        key="custId"
        fieldKey="custId"
        fieldType="BaseSelect"
        initialValue={formData.custId}
        descList={customerList}
      />,
      <FormItem
        label="????????????"
        key="relatedContractId"
        fieldKey="relatedContractId"
        fieldType="ContractSimpleSelect"
        initialValue={formData.relatedContractId}
      />,
      <FormItem
        label="????????????"
        key="relatedProductId"
        fieldKey="relatedProductId"
        fieldType="ProductSimpleSelect"
        initialValue={formData.relatedProductId}
      />,
      <FormItem
        label="????????????"
        key="collectionProjectId"
        fieldKey="collectionProjectId"
        fieldType="ProjectSimpleSelect"
        initialValue={formData.collectionProjectId}
      />,
      <FormItem
        label="????????????"
        key="collectionCompany"
        fieldKey="collectionCompany"
        fieldType="BaseCustomSelect"
        parentKey="CUS:INTERNAL_COMPANY"
        required
        initialValue={formData.collectionCompany}
      />,
      <FormItem
        label="????????????"
        key="collectionBuId"
        fieldKey="collectionBuId"
        fieldType="BuSimpleSelect"
        required
        initialValue={formData.collectionBuId}
      />,
      <FormItem
        label="???????????????"
        key="inchargeSaleId"
        fieldKey="inchargeSaleId"
        fieldType="ResSimpleSelect"
        required
        initialValue={formData.inchargeSaleId}
      />,
      <FormItem
        label="????????????"
        key="foreignCurrencyFlag"
        fieldKey="foreignCurrencyFlag"
        fieldType="BaseRadioSelect"
        options={[{ label: '???', value: true }, { label: '???', value: false }]}
        initialValue={formData.foreignCurrencyFlag}
        required
      />,
      <FormItem fieldType="Group" label="??????/??????" key="originalCurrency" required>
        <FormItem
          key="originalCurrency"
          fieldKey="originalCurrency"
          fieldType="BaseSelect"
          parentKey="COMMON_CURRENCY"
          initialValue={formData.originalCurrency}
        />
        <FormItem
          key="exchangeRate"
          fieldKey="exchangeRate"
          fieldType="BaseInputNumber"
          initialValue={formData.exchangeRate || undefined}
          onChange={e => {
            if (type(e) === 'Number') {
              const { originalCurrencyAmt } = formData;
              const tt =
                !isNil(originalCurrencyAmt) && !isNil(e) ? mul(originalCurrencyAmt, e) : '';
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  baseCurrencyAmt: tt,
                },
              });
            }
          }}
        />
      </FormItem>,
      <FormItem
        label="????????????"
        key="originalCurrencyAmt"
        fieldKey="originalCurrencyAmt"
        fieldType="BaseInputAmt"
        initialValue={formData.originalCurrencyAmt}
        disabled
        plcaeholder="??????????????????"
      />,
      <FormItem
        label="????????????"
        key="baseCurrencyAmt"
        fieldKey="baseCurrencyAmt"
        fieldType="BaseInputAmt"
        initialValue={formData.baseCurrencyAmt}
        disabled
        plcaeholder="??????????????????"
      />,
      <FormItem
        label="??????"
        key="productsaleorder"
        fieldKey="productsaleorder"
        fieldType="BaseFileManagerEnhance"
        dataKey={formData.id}
        api="/api/production/sale/saleOrder/sfs/token"
        listType="text"
        attach
      />,
      <FormItem
        label="??????"
        fieldKey="soStatus"
        key="soStatus"
        fieldType="BaseSelect"
        parentKey="COM:DOC_STATUS"
        initialValue={formData.soStatus}
        disabled
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
        fieldType="BaseInput"
        initialValue={formData.createTime}
        disabled
      />,
      <FormItem
        label="??????"
        fieldKey="remark"
        key="remark"
        fieldType="BaseInputTextArea"
        initialValue={formData.remark}
      />,
    ];

    const fieldsConfig = ProductFormItemBlockConfig(pageConfig, 'blockKey', 'FORM', fields);

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={8}>
        {fieldsConfig}
      </BusinessForm>
    );
  };

  renderColumns = () => {
    const { form, pageConfig, fieldsConfig } = this.props;

    const { taskKey } = fieldsConfig;

    const tableInputDisabled = taskKey !== 'SAL01_01_SUBMIT_i';

    const fields = [
      {
        title: '????????????',
        dataIndex: 'itemName',
        align: 'center',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`detailViews[${index}].itemName`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'qty',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`detailViews[${index}].qty`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'unitPrice',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`detailViews[${index}].unitPrice`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'amt',
        render: (val, row, index) =>
          row.qty && row.unitPrice ? mul(row.qty || 0, row.unitPrice || 0).toFixed(2) : '0.00',
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'taxRate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`detailViews[${index}].taxRate`}
            max={100}
            min={0}
            formatter={value => (value ? `${value}%` : '0%')}
            parser={value => value.replace('%', '')}
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
            fieldKey={`detailViews[${index}].deliveryDate`}
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

  renderColumns1 = () => {
    const { form, pageConfig, fieldsConfig } = this.props;

    const { taskKey } = fieldsConfig;

    const tableInputDisabled = taskKey !== 'SAL01_01_SUBMIT_i';

    const fields = [
      {
        title: '????????????',
        dataIndex: 'collectionStage',
        align: 'center',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`planViews[${index}].collectionStage`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????????????????',
        align: 'center',
        dataIndex: 'collectionAmt',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`planViews[${index}].collectionAmt`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????????????????%',
        align: 'center',
        dataIndex: 'collectionRate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`planViews[${index}].collectionRate`}
            max={100}
            min={0}
            formatter={value => (value ? `${value}%` : '0%')}
            parser={value => value.replace('%', '')}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????????????????',
        align: 'center',
        dataIndex: 'expectedCollectionDate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`planViews[${index}].expectedCollectionDate`}
            disabled={tableInputDisabled}
          />
        ),
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'taxRate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`planViews[${index}].taxRate`}
            max={100}
            min={0}
            formatter={value => (value ? `${value}%` : '0%')}
            parser={value => value.replace('%', '')}
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
        title: '????????????',
        dataIndex: 'itemName',
        align: 'center',
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'qty',
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'unitPrice',
        render: val => val.toFixed(2),
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'amt',
        render: (val, row, index) =>
          row.qty && row.unitPrice ? mul(row.qty || 0, row.unitPrice || 0).toFixed(2) : '0.00',
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'taxRate',
        render: val => (val ? `${val}%` : ''),
      },
      {
        title: '????????????',
        align: 'center',
        dataIndex: 'deliveryDate',
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

  renderColumns1View = () => {
    const { dispatch, form, pageConfig } = this.props;

    const fields = [
      {
        title: '????????????',
        dataIndex: 'collectionStage',
        align: 'center',
      },
      {
        title: '??????????????????',
        align: 'center',
        dataIndex: 'collectionAmt',
        render: val => val.toFixed(2),
      },
      {
        title: '??????????????????%',
        align: 'center',
        dataIndex: 'collectionRate',
        render: val => (val ? `${val}%` : ''),
      },
      {
        title: '??????????????????',
        align: 'center',
        dataIndex: 'expectedCollectionDate',
      },
      {
        title: '??????',
        align: 'center',
        dataIndex: 'taxRate',
        render: val => (val ? `${val}%` : ''),
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
      planDelViews,
      fieldsConfig,
      flowForm,
    } = this.props;
    const { detailViews = [], planViews = [] } = formData;
    const { taskId, mode } = this.state;
    const { taskKey } = fieldsConfig;

    const disabledBtn =
      loading.effects[`${DOMAIN}/saleOrderDetail`] || loading.effects[`${DOMAIN}/submit`];

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
              title="???????????????"
              columns={this.renderColumnsView()}
              dataSource={detailViews}
              prodSelection={false}
            />
          ) : taskKey === 'SAL01_01_SUBMIT_i' ? (
            <EditTable
              title="???????????????"
              form={form}
              columns={this.renderColumns()}
              dataSource={detailViews}
              onAddClick={() => {
                dispatch({
                  type: `${DOMAIN}/updateForm`,
                  payload: {
                    detailViews: update(detailViews, {
                      $push: [
                        {
                          id: genFakeId(-1),
                        },
                      ],
                    }),
                  },
                });
              }}
              onDeleteConfirm={keys => {
                const newDataSource = detailViews.filter(row => keys.indexOf(row.id) < 0);
                dispatch({
                  type: `${DOMAIN}/updateForm`,
                  payload: {
                    detailViews: newDataSource,
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
              title="???????????????"
              form={form}
              columns={this.renderColumns()}
              dataSource={detailViews}
              footer={null}
              rowSelection={null}
            />
          )}
          {// eslint-disable-next-line no-nested-ternary
          mode === 'view' ? (
            <DataTable
              title="????????????"
              columns={this.renderColumns1View()}
              dataSource={planViews}
              prodSelection={false}
            />
          ) : taskKey === 'SAL01_01_SUBMIT_i' ? (
            <EditTable
              title="????????????"
              form={form}
              columns={this.renderColumns1()}
              dataSource={planViews}
              onAddClick={() => {
                dispatch({
                  type: `${DOMAIN}/updateForm`,
                  payload: {
                    planViews: update(planViews, {
                      $push: [
                        {
                          id: genFakeId(-1),
                        },
                      ],
                    }),
                  },
                });
              }}
              onDeleteConfirm={keys => {
                const newDataSource = planViews.filter(row => keys.indexOf(row.id) < 0);
                dispatch({
                  type: `${DOMAIN}/updateForm`,
                  payload: {
                    planViews: newDataSource,
                  },
                });
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: {
                    planDelViews: [...planDelViews, ...keys],
                  },
                });
              }}
            />
          ) : (
            <EditTable
              title="????????????"
              form={form}
              columns={this.renderColumns1()}
              dataSource={planViews}
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
