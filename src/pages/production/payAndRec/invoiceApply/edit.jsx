import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, type } from 'ramda';
import { Form, Cascader } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ButtonCard from '@/components/production/layout/ButtonCard';
import DataTable from '@/components/production/business/DataTable';
import Button from '@/components/production/basic/Button';
import {
  ProductFormItemBlockConfig,
  ProductTableColumnsBlockConfig,
} from '@/utils/pageConfigUtils';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import { fromQs } from '@/utils/production/stringUtil';

const DOMAIN = 'invoiceApplyEdit';
@connect(({ loading, invoiceApplyEdit, dispatch, user, payAndReceiveList }) => ({
  loading,
  ...invoiceApplyEdit,
  dispatch,
  user,
  payAndReceiveList,
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
      type: `${DOMAIN}/updateForm`,
      payload: newFieldData,
    });
  },
})
class InvoiceApplyEdit extends Component {
  state = {};

  componentDidMount() {
    const {
      dispatch,
      payAndReceiveList: { selectedRows },
    } = this.props;

    const { custId, invId } = fromQs();
    // TODO获取商品信息下拉
    // dispatch({
    //   type: `${DOMAIN}/getInvoiceItemList`,
    // });

    // 可配置化信息
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'SALES_INVOICE_EDIT' },
    });
    if (custId) {
      // 有invId获取发票表详情
      if (invId) {
        dispatch({
          type: `${DOMAIN}/salesInvoiceApplyDetail`,
          payload: { id: invId },
        });
      } else {
        // 无开票Id，新增，处理收付款数据
        dispatch({
          type: `${DOMAIN}/payAndReceiveDetail`,
          payload: { selectedRows },
        });
      }
      dispatch({
        type: `${DOMAIN}/fetchAsyncSelectList`,
        payload: { custId },
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

  handleSave = isSubmit => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      formData: { invItemId, ...newFormData }, // TODO关联的收付款单id
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const { invId } = fromQs();
        // todo修改
        if (invId) {
          dispatch({
            type: `${DOMAIN}/invoiceApplySave`,
            payload: {
              ...newFormData,
              ...values,
              invItemId:
                Array.isArray(invItemId) && (invItemId[0] && invItemId[1]) ? invItemId[1] : null,
              submit: isSubmit,
            },
          });
        } else {
          const {
            payAndReceiveList: { selectedRows },
          } = this.props;
          // todo 取出供应商和对应应收应付id
          // 新增
          dispatch({
            type: `${DOMAIN}/invoiceApplySave`,
            payload: {
              ...newFormData,
              ...values,
              invItemId:
                Array.isArray(invItemId) && (invItemId[0] && invItemId[1]) ? invItemId[1] : null,
              submit: isSubmit,
              collectionPlanId: newFormData.id,
              id: null,
            },
          });
        }
      }
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
      user: {
        user: { extInfo = {} },
      },
      payAndReceiveList: { selectedRows },
      invoiceItemList = [],
      selectList = [],
    } = this.props;
    const { userId } = extInfo;

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
        initialValue={userId}
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
    // TODO获取配置信息
    const fieldsConfig = ProductFormItemBlockConfig(pageConfig, 'blockKey', 'FORM', fields);

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={12}>
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

  // TODO 关联的首付款列表
  renderColumns = () => [
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
      title: '开票状态',
      dataIndex: 'invoiceStatus',
      align: 'center',
    },
    {
      title: '发票号',
      dataIndex: 'invoiceNo',
      align: 'center',
    },
    {
      title: '开票金额',
      dataIndex: 'invoiceAmt',
      align: 'center',
    },
    {
      title: '开票日期',
      dataIndex: 'invoiceDate',
      align: 'center',
    },
    // TODO
    {
      title: '已收付金额',
      dataIndex: 'invoiceUnRevAmt',
      align: 'center',
    },
    {
      title: '未开票已收款金额',
      dataIndex: 'uninvoiceReceAmt',
      align: 'center',
    },
    {
      title: '未开票已付款金额',
      dataIndex: 'uninvoicePayAmt',
      align: 'center',
    },
    {
      title: '最近收付日期',
      dataIndex: 'recentDate',
      align: 'center',
    },
  ];

  render() {
    const {
      dispatch,
      loading,
      payAndReceiveList: { selectedRows },
      form,
      formData,
      formMode,
    } = this.props;
    const disabledBtn =
      loading.effects[`${DOMAIN}/collectionPlanDetail`] ||
      loading.effects[`${DOMAIN}/invoiceApplySave`] ||
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
            保存
          </Button>
          <Button
            icon="upload"
            size="large"
            type="primary"
            onClick={() => {
              this.handleSave(true);
            }}
            disabled={disabledBtn}
          >
            提交
          </Button>
        </ButtonCard>
        {this.renderPage()}

        <DataTable
          title="关联收付款列表"
          columns={this.renderColumns()}
          dataSource={selectedRows}
          prodSelection={false}
          scroll={{ x: 1800 }}
        />
      </PageWrapper>
    );
  }
}

export default InvoiceApplyEdit;
