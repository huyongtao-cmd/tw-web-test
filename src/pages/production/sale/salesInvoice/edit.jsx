import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, type } from 'ramda';
import { Form, Cascader } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import EditTable from '@/components/production/business/EditTable';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';
import {
  ProductFormItemBlockConfig,
  ProductTableColumnsBlockConfig,
} from '@/utils/pageConfigUtils';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import { fromQs } from '@/utils/production/stringUtil';
import update from 'immutability-helper';
import { genFakeId } from '@/utils/mathUtils';

const DOMAIN = 'salesInvoiceEdit';
@connect(({ loading, salesInvoiceEdit, dispatch }) => ({
  loading,
  ...salesInvoiceEdit,
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
class SingleCaseDetailDemo extends Component {
  state = {};

  componentDidMount() {
    const { dispatch } = this.props;

    const { id, invId } = fromQs();
    // ????????????????????????
    dispatch({
      type: `${DOMAIN}/getInvoiceItemList`,
    });

    // ??????????????????
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'SALES_INVOICE_EDIT:INPUT_INVOICE_INFORMATION' },
    });

    if (id) {
      dispatch({
        type: `${DOMAIN}/salesInvoiceApplyDetail`,
        payload: { id },
      }).then(res => {
        const { custId } = res;
        // ??????????????????
        custId &&
          dispatch({
            type: `${DOMAIN}/fetchAsyncSelectList`,
            payload: { custId },
          });
      });
    }
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
      detailDelViews,
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/salesInvoiceApplySave`,
          payload: {
            ...newFormData,
            ...values,
            invItemId:
              Array.isArray(invItemId) && (invItemId[0] && invItemId[1]) ? invItemId[1] : null,
            submit: isSubmit,
            delList: detailDelViews.filter(v => v > 0),
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

    const tableInputDisabled = false;

    const fields = [
      {
        title: '????????????',
        dataIndex: 'FUNCTION:SALE:INV_STATUS',
        align: 'center',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseCustomSelect"
            parentKey="INV_STATUS"
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

  render() {
    const { dispatch, loading, form, formData, detailDelViews = [], formMode } = this.props;
    const { detialList = [] } = formData;
    const disabledBtn =
      loading.effects[`${DOMAIN}/salesInvoiceApplySave`] ||
      loading.effects[`${DOMAIN}/salesInvoiceApplyDetail`];

    return (
      <PageWrapper>
        <ButtonCard>
          <Button
            icon="save"
            size="large"
            type="primary"
            onClick={() => {
              this.handleSave();
            }}
            disabled={disabledBtn}
          >
            ??????
          </Button>
        </ButtonCard>
        {this.renderPage()}
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
      </PageWrapper>
    );
  }
}

export default SingleCaseDetailDemo;
