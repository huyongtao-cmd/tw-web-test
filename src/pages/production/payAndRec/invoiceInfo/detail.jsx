import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, type } from 'ramda';
import { Form, Cascader } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import DataTable from '@/components/production/business/DataTable';
import {
  ProductFormItemBlockConfig,
  ProductTableColumnsBlockConfig,
} from '@/utils/pageConfigUtils';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { fromQs } from '@/utils/production/stringUtil';

const DOMAIN = 'invoiceDetail';

@connect(({ loading, invoiceDetail, dispatch }) => ({
  loading,
  ...invoiceDetail,
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
        // invoiceItem ID
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

    const { id } = fromQs();
    this.setState({
      id,
    });
    // 获取商品信息下拉
    dispatch({
      type: `${DOMAIN}/getInvoiceItemList`,
    });

    // 可配置化信息
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'SALES_INVOICE_EDIT:INPUT_INVOICE_INFORMATION' },
    });
    // 获取开票申请详情
    if (id) {
      dispatch({
        type: `${DOMAIN}/salesInvoiceApplyDetail`,
        payload: { id },
      }).then(res => {
        const { custId } = res;
        // 开票信息下拉
        custId &&
          dispatch({
            type: `${DOMAIN}/fetchAsyncSelectList`,
            payload: { custId },
          });
      });
    }
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    this.callModelEffects('cleanState');
  }

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  // 配置所需要的内容
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
      <BusinessFormTitle title="开票基本信息" />,
      <FormItem
        label="开票批次号"
        key="batchNo"
        fieldKey="batchNo"
        fieldType="BaseInput"
        initialValue={formData.batchNo}
        disabled
        placeholder="系统自动生成"
      />,
      <FormItem
        label="批次状态"
        fieldKey="batchStatus"
        key="batchStatus"
        fieldType="BaseCustomSelect"
        parentKey="FUNCTION:SALE:SALE_INV_BATCH_STATUS"
        initialValue={formData.batchStatus}
        disabled
      />,
      <FormItem
        label="付款方式"
        fieldKey="payMethod"
        key="payMethod"
        fieldType="BaseCustomSelect"
        parentKey="CUS:PAYMENT_METHOD"
        initialValue={formData.payMethod}
      />,
      <FormItem
        label="批次开票金额"
        key="invAmt"
        fieldKey="invAmt"
        fieldType="BaseInputAmt"
        initialValue={formData.invAmt}
        disabled
        plcaeholder="系统自动生成"
      />,
      <FormItem
        label="预计到账日期"
        key="antiRecvDate"
        fieldKey="antiRecvDate"
        fieldType="BaseDatePicker"
        required
        initialValue={formData.antiRecvDate}
      />,
      <FormItem
        label="开票日期"
        key="batchDate"
        fieldKey="batchDate"
        fieldType="BaseDatePicker"
        required
        initialValue={formData.batchDate}
      />,
      <BusinessFormTitle title="发票内容" />,
      <FormItem
        label="开票信息"
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
        label="税号"
        key="taxNo"
        fieldKey="taxNo"
        fieldType="BaseInput"
        initialValue={formData.taxNo}
        disabled
      />,
      <FormItem
        label="地址"
        key="invAddr"
        fieldKey="invAddr"
        fieldType="BaseInput"
        initialValue={formData.invAddr}
        disabled
      />,
      <FormItem
        label="开户行"
        key="bankName"
        fieldKey="bankName"
        fieldType="BaseInput"
        initialValue={formData.bankName}
        disabled
      />,
      <FormItem
        label="账户"
        key="accountNo"
        fieldKey="accountNo"
        fieldType="BaseInput"
        initialValue={formData.accountNo}
        disabled
      />,
      <FormItem
        label="电话"
        key="invTel"
        fieldKey="invTel"
        fieldType="BaseInput"
        initialValue={formData.invTel}
        disabled
      />,
      <FormItem fieldType="Group" label="发票类型/税率" key="invType" required>
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
        label="币种"
        fieldKey="currCode"
        key="currCode"
        fieldType="BaseSelect"
        parentKey="COMMON_CURRENCY"
        initialValue={formData.currCode}
        disabled
      />,
      <FormItem
        label="商品信息"
        key="invItemId"
        fieldKey="invItemId"
        fieldType="Custom"
        initialValue={formData.invItemId}
      >
        <Cascader
          style={{ width: '100%' }}
          options={invoiceItemList}
          showSearch
          matchInputWidth
          placeholder="请选择商品信息"
        />
      </FormItem>,
      <BusinessFormTitle title="其他信息" />,
      <FormItem
        label="快递方式"
        fieldKey="deliMethod"
        key="deliMethod"
        fieldType="BaseCustomSelect"
        parentKey="COM:DELI_METHOD"
        initialValue={formData.deliMethod}
        required
      />,
      <FormItem
        label="收件人"
        key="recvPerson"
        fieldKey="recvPerson"
        fieldType="BaseInput"
        initialValue={formData.recvPerson}
      />,
      <FormItem
        label="收件人邮箱"
        key="recvEmail"
        fieldKey="recvEmail"
        fieldType="BaseInput"
        required
        initialValue={formData.recvEmail}
      />,
      <FormItem
        label="收件人地址"
        key="recvAddr"
        fieldKey="recvAddr"
        fieldType="BaseInput"
        initialValue={formData.recvAddr}
      />,
      <FormItem
        label="收件人联系电话"
        key="recvTel"
        fieldKey="recvTel"
        fieldType="BaseInput"
        initialValue={formData.recvTel}
      />,
      <FormItem
        fieldType="BaseFileManagerEnhance"
        label="附件"
        key="attach"
        fieldKey="attach"
        dataKey={fromQs().id}
        api="/api/production/invBatchs/sfs/token"
        listType="text"
        attach
      />,
      <FormItem
        label="创建人"
        fieldKey="createUserId"
        key="createUserId"
        fieldType="UserSimpleSelect"
        initialValue={formData.createUserId}
        disabled
      />,
      <FormItem
        label="创建时间"
        fieldKey="createTime"
        key="createTime"
        fieldType="BaseDatePicker"
        initialValue={formData.createTime}
        disabled
      />,
      <FormItem
        label="开票说明"
        fieldKey="invDesc"
        key="invDesc"
        fieldType="BaseInputTextArea"
        initialValue={formData.invDesc}
      />,
    ];
    // 根据配置展示不同fields
    const fieldsConfig = ProductFormItemBlockConfig(pageConfig, 'blockKey', 'FORM', fields);

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={12}>
        {/* fieldsConfig */}
        {fields}
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

    const fields = [
      {
        title: '发票状态类型',
        dataIndex: 'invStatusDesc',
        align: 'center',
      },
      {
        title: '发票号',
        align: 'center',
        dataIndex: 'invNo',
      },
      {
        title: '快递号',
        align: 'center',
        dataIndex: 'deliveryNo',
      },
      {
        title: '快递时间',
        align: 'center',
        dataIndex: 'deliveryDate',
      },
      {
        title: '开票金额',
        align: 'center',
        dataIndex: 'invAmt',
      },
      {
        title: '净额',
        align: 'center',
        dataIndex: 'netAmt',
      },
      {
        title: '税金',
        align: 'center',
        dataIndex: 'taxAmt',
      },
      {
        title: '下载链接',
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
    const { dispatch, loading, form, formData, formMode } = this.props;
    const { detialList = [] } = formData;
    const { id } = this.state;
    // TODO 修改传入source的procDefKey
    const allBpm = [{ docId: id, procDefKey: 'PAY_AND_REC_INVOICE', title: '收付款开票流程' }];

    return (
      <PageWrapper>
        {this.renderPage()}

        <DataTable
          title="具体发票信息"
          columns={this.renderColumns()}
          dataSource={detialList}
          prodSelection
          rowSelection={null}
        />

        <BpmConnection source={allBpm} />
      </PageWrapper>
    );
  }
}

export default SingleCaseDetailDemo;
