/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
/* eslint-disable array-callback-return */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Form, Input, DatePicker, InputNumber, Button, Divider, Radio, Checkbox } from 'antd';
import moment from 'moment';
import { mountToTab } from '@/layouts/routerControl';
import AsyncSelect from '@/components/common/AsyncSelect';
import FieldList from '@/components/layout/FieldList';
import EditableDataTable from '@/components/common/EditableDataTable';
import { UdcSelect, Selection } from '@/pages/gen/field';

import { div } from '@/utils/mathUtils';
import { selectUsers } from '@/services/sys/user';

import Link from 'umi/link';
import { getLink } from '@/pages/sale/purchaseContract/linkConfig';

import { selectAbOus, selectAllAbOu } from '@/services/gen/list';
import { getPaymentApplyTempds } from '@/services/sale/purchaseContract/paymentApplyList';
import createMessage from '@/components/core/AlertMessage';
import { createConfirm } from '@/components/core/Confirm';

import { writeOffTableProps, payDetailTableProps } from './prePayInfoConfig';
import { payRecordTableProps } from './payRecordConfig';
import style from '../../style.less';

const DOMAIN = 'prePayWriteOffEdit';
const { Field } = FieldList;
const FieldListLayout = {
  labelCol: { span: 9 },
  wrapperCol: { span: 15 },
};

const opportunityColumns = [
  { dataIndex: 'oppoNo', title: '编号', span: 6 },
  { dataIndex: 'oppoName', title: '商机', span: 6 },
  { dataIndex: 'signBuName', title: '签单BU名称', span: 6 },
  { dataIndex: 'salesmanName', title: '签单负责人', span: 6 },
];

const docNoColumns = [
  { dataIndex: 'code', title: '编号', span: 10 },
  { dataIndex: 'name', title: '名称', span: 14 },
];
@connect(({ loading, prePayWriteOffEdit, dispatch, user }) => ({
  loading,
  prePayWriteOffEdit,
  dispatch,
  user,
}))
@mountToTab()
class PrePayInfo extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      docTypeTemp: '',
      docNoTemp: '',
      payDetailListTemp: '',
    };
  }

  // 供应商
  handleSupplier = (key, data) => {
    const { form, dispatch } = this.props;
    form.setFieldsValue({
      receivingUnit: key,
      docNo: '',
      docType: '',
    });
    dispatch({ type: `${DOMAIN}/selectAccountByNo`, payload: { receivingUnit: key } });
  };

  // 关联单据类型
  handleDocType = (key, data) => {
    const { form, dispatch, prePayWriteOffEdit } = this.props;
    const { formData } = prePayWriteOffEdit;
    if (formData.supplierLegalNo !== '') {
      form.setFieldsValue({
        docType: key,
        docNo: '',
        relatedSalesContract: '',
        relatedProjectNo: '',
      });
      dispatch({
        type: `${DOMAIN}/docTypeSelect`,
        payload: { docType: key, supplierLegalNo: formData.supplierLegalNo },
      });
    } else {
      createMessage({ type: 'success', description: '供应商不能为空' });
    }
  };

  // 关联单据号详情
  handleDocNoDetail = (key, data) => {
    const { form, dispatch, prePayWriteOffEdit } = this.props;
    const { formData } = prePayWriteOffEdit;
    form.setFieldsValue({
      docNo: key,
      relatedSalesContract: '',
      relatedProjectNo: '',
    });
    dispatch({
      type: `${DOMAIN}/getDocNoDetail`,
      payload: { docNo: key, docType: formData.docType },
    }).then(res => {
      if (res.ok) {
        const { datum } = res;
        form.setFieldsValue({
          relatedSalesContract: datum.twPaymentApplyEntity.relatedSalesContract,
          relatedProjectNo: datum.twPaymentApplyEntity.relatedProjectNo,
          currPaymentAmt: datum.twPaymentApplyEntity.currPaymentAmt || 0,
        });
      }
    });
  };

  // 收款单位/人（财务信息）
  handleReceivingUnit = (key, data) => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/selectAccountByNo`, payload: { receivingUnit: key } });
  };

  // 收款卡号
  handleReceivingId = (key, data) => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/selectApplyAccounts`, payload: { accountNo: key } });
  };

  // 表单是否可填控制
  pageFieldMode = fieldMode => {
    const { mode } = this.props;
    const isEdit = mode === 'view' ? true : fieldMode === 'UNEDITABLE';
    return isEdit;
  };

  // 申请单信息
  renderInfoPageConfig = () => {
    const { prePayWriteOffEdit, mode } = this.props;
    const { pageConfig, formData } = prePayWriteOffEdit;
    const readOnly = true;
    if (pageConfig) {
      if (!pageConfig.pageBlockViews || pageConfig.pageBlockViews.length < 1) {
        return <div />;
      }
      const currentBlockConfig = pageConfig.pageBlockViews.filter(
        item => item.blockKey === 'OVERVIEW'
      )[0];
      const { pageFieldViews } = currentBlockConfig;
      const pageFieldJson = {};
      pageFieldViews.forEach(field => {
        pageFieldJson[field.fieldKey] = field;
      });
      const fields = [
        <Field
          name="paymentNo"
          key="paymentNo"
          label={pageFieldJson.paymentNo.displayName}
          sortNo={pageFieldJson.paymentNo.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.paymentNo || '',
            rules: [
              {
                required: pageFieldJson.paymentNo.requiredFlag,
                message: `请选择${pageFieldJson.paymentNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.paymentNo.fieldMode)}
            placeholder="系统自动生成"
          />
        </Field>,
        <Field
          name="paymentApplicationType"
          key="paymentApplicationType"
          label={pageFieldJson.paymentApplicationType.displayName}
          sortNo={pageFieldJson.paymentApplicationType.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.paymentApplicationType || '',
            rules: [
              {
                required: pageFieldJson.paymentApplicationType.requiredFlag,
                message: `请选择${pageFieldJson.paymentApplicationType.displayName}`,
              },
            ],
          }}
        >
          <UdcSelect
            code="TSK:PAYMENT_APPLICATION_TYPE"
            placeholder={`请选择${pageFieldJson.paymentApplicationType.displayName}`}
            disabled={this.pageFieldMode(pageFieldJson.paymentApplicationType.fieldMode)}
          />
        </Field>,
        <Field
          name="purchaseName"
          key="purchaseName"
          label={pageFieldJson.purchaseName.displayName}
          sortNo={pageFieldJson.purchaseName.sortNo}
          decorator={{
            initialValue: formData.purchaseName || '',
            rules: [
              {
                required: pageFieldJson.purchaseName.requiredFlag,
                message: `请输入${pageFieldJson.purchaseName.displayName}`,
              },
            ],
          }}
          {...FieldListLayout}
        >
          <Input
            placeholder={`请输入${pageFieldJson.purchaseName.displayName}`}
            disabled={this.pageFieldMode(pageFieldJson.purchaseName.fieldMode)}
          />
        </Field>,
        <Field
          name="applicationDate"
          key="applicationDate"
          label={pageFieldJson.applicationDate.displayName}
          sortNo={pageFieldJson.applicationDate.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.applicationDate ? moment(formData.applicationDate) : moment(),
            rules: [
              {
                required: pageFieldJson.applicationDate.requiredFlag,
                message: `请选择${pageFieldJson.applicationDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`请选择${pageFieldJson.applicationDate.displayName}`}
            format="YYYY-MM-DD"
            disabled={this.pageFieldMode(pageFieldJson.applicationDate.fieldMode)}
            className="x-fill-100"
          />
        </Field>,
        <Field
          name="paymentCompany1"
          key="paymentCompany1"
          label={pageFieldJson.paymentCompany1.displayName}
          sortNo={pageFieldJson.paymentCompany1.sortNo}
          required={pageFieldJson.paymentCompany1.requiredFlag}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.paymentCompany1 || '',
            rules: [
              {
                required: pageFieldJson.paymentCompany1.requiredFlag,
                message: `请选择${pageFieldJson.paymentCompany1.displayName}`,
              },
            ],
          }}
          // wrapperCol={{ span: 23, xxl: 23 }}
        >
          <AsyncSelect
            source={() => selectAbOus().then(resp => resp.response)}
            showSearch
            filterOption={(input, option) =>
              option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={this.pageFieldMode(pageFieldJson.paymentCompany1.fieldMode)}
            placeholder={`请选择${pageFieldJson.paymentCompany1.displayName}`}
          />
        </Field>,
        <Field
          name="supplierLegalNo"
          key="supplierLegalNo"
          label={pageFieldJson.supplierLegalNo.displayName}
          sortNo={pageFieldJson.supplierLegalNo.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.supplierLegalNo || '',
            rules: [
              {
                required: pageFieldJson.supplierLegalNo.requiredFlag,
                message: `请选择${pageFieldJson.supplierLegalNo.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={() => selectAllAbOu().then(resp => resp.response)}
            showSearch
            filterOption={(input, option) =>
              option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={this.pageFieldMode(pageFieldJson.supplierLegalNo.fieldMode)}
            placeholder={`请选择${pageFieldJson.supplierLegalNo.displayName}`}
            onChange={this.handleSupplier}
          />
        </Field>,
        <Field
          name="acceptanceType"
          key="acceptanceType"
          label={pageFieldJson.acceptanceType.displayName}
          sortNo={pageFieldJson.acceptanceType.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.acceptanceType || '',
            rules: [
              {
                required: pageFieldJson.acceptanceType.requiredFlag,
                message: `请选择${pageFieldJson.acceptanceType.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="TSK:ACCEPTANCE_TYPE"
            placeholder={`请选择${pageFieldJson.acceptanceType.displayName}`}
            disabled={this.pageFieldMode(pageFieldJson.acceptanceType.fieldMode)}
          />
        </Field>,
        <Field
          name="paymentAmt"
          key="paymentAmt"
          label={pageFieldJson.paymentAmt.displayName}
          sortNo={pageFieldJson.paymentAmt.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.paymentAmt || 0,
            rules: [
              {
                required: pageFieldJson.paymentAmt.requiredFlag,
                message: `请输入${pageFieldJson.paymentAmt.displayName}`,
              },
            ],
          }}
        >
          <InputNumber
            min={0}
            precision={2}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v.replace(/\$\s?|(,*)/g, '')}
            className="number-left x-fill-100"
            disabled={this.pageFieldMode(pageFieldJson.paymentAmt.fieldMode)}
            placeholder={`请输入${pageFieldJson.paymentAmt.displayName}`}
          />
        </Field>,
        <Field
          name="currPaymentAmt"
          key="currPaymentAmt"
          label={pageFieldJson.currPaymentAmt.displayName}
          sortNo={pageFieldJson.currPaymentAmt.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.currPaymentAmt || 0,
            rules: [
              {
                required: pageFieldJson.currPaymentAmt.requiredFlag,
                message: `请输入${pageFieldJson.currPaymentAmt.displayName}`,
              },
            ],
          }}
        >
          <InputNumber
            min={0}
            precision={2}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v.replace(/\$\s?|(,*)/g, '')}
            className="number-left x-fill-100"
            disabled={
              formData.noDocVerification
                ? false
                : this.pageFieldMode(pageFieldJson.currPaymentAmt.fieldMode)
            }
            placeholder={`请输入${pageFieldJson.currPaymentAmt.displayName}`}
          />
        </Field>,
        <Field
          name="currCode"
          key="currCode"
          label={pageFieldJson.currCode.displayName}
          sortNo={pageFieldJson.currCode.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.currCode || '',
            rules: [
              {
                required: pageFieldJson.currCode.requiredFlag,
                message: `请选择${pageFieldJson.currCode.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="COM:CURRENCY_KIND"
            placeholder={`请选择${pageFieldJson.currCode.displayName}`}
            disabled={this.pageFieldMode(pageFieldJson.currCode.fieldMode)}
          />
        </Field>,
        <Field
          name="purchaseInchargeResId"
          key="purchaseInchargeResId"
          label={pageFieldJson.purchaseInchargeResId.displayName}
          sortNo={pageFieldJson.purchaseInchargeResId.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.purchaseInchargeResId || '',
            rules: [
              {
                required: pageFieldJson.purchaseInchargeResId.requiredFlag,
                message: `请选择${pageFieldJson.purchaseInchargeResId.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={() => selectUsers().then(resp => resp.response)}
            placeholder={`请选择${pageFieldJson.purchaseInchargeResId.displayName}`}
            showSearch
            filterOption={(input, option) =>
              option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={this.pageFieldMode(pageFieldJson.purchaseInchargeResId.fieldMode)}
          />
        </Field>,
        <Field
          name="invoiceState"
          key="invoiceState"
          label={pageFieldJson.invoiceState.displayName}
          sortNo={pageFieldJson.invoiceState.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.invoiceState || '',
            rules: [
              {
                required: pageFieldJson.invoiceState.requiredFlag,
                message: `请选择${pageFieldJson.invoiceState.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="TSK:INVOICE_STATE"
            placeholder={`请选择${pageFieldJson.invoiceState.displayName}`}
            disabled={this.pageFieldMode(pageFieldJson.invoiceState.fieldMode)}
          />
        </Field>,
        <Field
          name="demandNo"
          key="demandNo"
          label={pageFieldJson.demandNo.displayName}
          sortNo={pageFieldJson.demandNo.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.demandNo || '',
            rules: [
              {
                required: pageFieldJson.demandNo.requiredFlag,
                message: `请输入${pageFieldJson.demandNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            placeholder={`请输入${pageFieldJson.demandNo.displayName}`}
            className="x-fill-100"
            disabled={this.pageFieldMode(pageFieldJson.demandNo.fieldMode)}
          />
        </Field>,
        // 无发票核销
        <Field
          name="noInvoiceVerification"
          key="noInvoiceVerification"
          label={pageFieldJson.noInvoiceVerification.displayName}
          sortNo={pageFieldJson.noInvoiceVerification.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.noInvoiceVerification || '',
          }}
        >
          <Checkbox
            checked={formData.noInvoiceVerification}
            disabled={this.pageFieldMode(pageFieldJson.noInvoiceVerification.fieldMode)}
            onChange={e => {
              const { dispatch } = this.props;
              let flag = e.target.value;
              if (flag === true) {
                //取消选中无发票核销
                //1 发票核销金额与 本次付款金额校验  2 费用分摊金额校验；
                // see src/pages/sale/purchaseContract/constConfig.js 219
              } else {
                //选中无发票核销
                createConfirm({
                  content: '勾选后，会清空发票核销明细，确认继续吗？',
                  onOk: () => {
                    dispatch({
                      type: `${DOMAIN}/updateState`,
                      payload: {
                        invoiceVerDetail: [],
                      },
                    });
                  },
                });
              }
            }}
          >
            {/*无发票核销*/}
          </Checkbox>
        </Field>,
        // 无单据核销
        <Field
          name="noDocVerification"
          key="noDocVerification"
          label={pageFieldJson.noDocVerification.displayName}
          sortNo={pageFieldJson.noDocVerification.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.noDocVerification || '',
          }}
        >
          <Checkbox
            checked={formData.noDocVerification}
            disabled={this.pageFieldMode(pageFieldJson.noDocVerification.fieldMode)}
            onChange={e => {
              const { prePayWriteOffEdit, dispatch } = this.props;
              const { docTypeTemp, docNoTemp, payDetailListTemp } = this.state;
              const { payDetailList, formData } = prePayWriteOffEdit;
              let flag = e.target.value;
              if (flag === true) {
                //取消选中无单据核销
                //1 本次付款金额不可编辑
                pageFieldJson.currPaymentAmt.fieldMode = 'UNEDITABLE';
                //2 关联单据类型 必选校验
                //3 还原关联单据类型、关联单据号
                let newFormData = formData;
                newFormData.docType = docTypeTemp;
                newFormData.docNo = docNoTemp;
                newFormData.noDocVerification = false;
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: {
                    formData: newFormData,
                    //4、还原 付款明细
                    payDetailList: payDetailListTemp,
                  },
                });
              } else {
                //选中无单据核销
                createConfirm({
                  content: '勾选后，会清空关联单据类型、关联单据号、付款明细，确认继续吗？',
                  onOk: () => {
                    //1、本次付款金额 手动输入
                    pageFieldJson.currPaymentAmt.fieldMode = false;
                    // 清空之前先把旧的数据存起来
                    this.setState({
                      //2、关联单据类型 不必填
                      //3、关联单据类型、关联单据号放空
                      docTypeTemp: formData.docType,
                      docNoTemp: formData.docNo,
                      //4、付款明细清空 非必填
                      payDetailListTemp: payDetailList,
                    });
                    let newFormData = formData;
                    newFormData.docType = '';
                    newFormData.docNo = '';
                    newFormData.noDocVerification = true;
                    dispatch({
                      type: `${DOMAIN}/updateState`,
                      payload: {
                        formData: newFormData,
                        payDetailList: [],
                      },
                    });
                  },
                });
              }
            }}
          >
            {/*无单据核销*/}
          </Checkbox>
        </Field>,
        <Field
          name="note"
          key="note"
          label={pageFieldJson.note.displayName}
          sortNo={pageFieldJson.note.sortNo}
          decorator={{
            initialValue: formData.note,
            rules: [
              {
                required: pageFieldJson.note.requiredFlag,
                message: `请输入${pageFieldJson.note.displayName}`,
              },
            ],
          }}
          fieldCol={1}
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
        >
          <Input.TextArea
            placeholder={`请输入${pageFieldJson.note.displayName}`}
            rows={3}
            disabled={this.pageFieldMode(pageFieldJson.note.fieldMode)}
          />
        </Field>,
      ];
      const filterList = fields
        .filter(field => !field.key || pageFieldJson[field.key].visibleFlag === 1)
        .sort((field1, field2) => field1.props.sortNo - field2.props.sortNo);
      return filterList;
    }
    return '';
  };

  // 相关单据
  renderRelatedPageConfig = () => {
    const { prePayWriteOffEdit, mode } = this.props;

    const { pageConfig, formData, opportunityList, docNoList } = prePayWriteOffEdit;
    if (pageConfig) {
      if (!pageConfig.pageBlockViews || pageConfig.pageBlockViews.length < 1) {
        return <div />;
      }
      const currentBlockConfig = pageConfig.pageBlockViews.filter(
        item => item.blockKey === 'RELATE_DOC'
      )[0];
      const { pageFieldViews } = currentBlockConfig;
      const pageFieldJson = {};
      pageFieldViews.forEach(field => {
        pageFieldJson[field.fieldKey] = field;
      });
      const { noDocVerification } = formData;
      // 无单据核销是否选中
      let noDocVerificationCheck = false;
      if (noDocVerification === true) {
        noDocVerificationCheck = true;
      }
      const fields = [
        <Field
          name="docType"
          key="docType"
          label={pageFieldJson.docType.displayName}
          sortNo={pageFieldJson.docType.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.docType || '',
            rules: [
              {
                required: noDocVerificationCheck ? false : pageFieldJson.docType.requiredFlag,
                message: `请选择${pageFieldJson.docType.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="TSK:DOC_TYPE"
            disabled={this.pageFieldMode(pageFieldJson.docType.fieldMode)}
            placeholder={`请输入${pageFieldJson.docType.displayName}`}
            onChange={this.handleDocType}
          />
        </Field>,
        <Field
          name="docNo"
          key="docNo"
          label={pageFieldJson.docNo.displayName}
          sortNo={pageFieldJson.docNo.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.docNo || '',
            rules: [
              {
                required: pageFieldJson.docNo.requiredFlag,
                message: `请输入${pageFieldJson.docNo.displayName}`,
              },
            ],
          }}
        >
          <Selection.Columns
            className="x-fill-100"
            source={docNoList || []}
            columns={docNoColumns}
            transfer={{ key: 'code', code: 'code', name: 'code' }}
            dropdownMatchSelectWidth={false}
            showSearch
            onChange={this.handleDocNoDetail}
            placeholder={`请输入${pageFieldJson.docNo.displayName}`}
            // limit={20}
            disabled={this.pageFieldMode(pageFieldJson.docNo.fieldMode)}
          />
        </Field>,
        this.pageFieldMode(pageFieldJson.relatedSalesContract.fieldMode) &&
        formData.relatedSalesContract ? (
          <Field
            name="relatedSalesContract"
            key="relatedSalesContract"
            label={pageFieldJson.relatedSalesContract.displayName}
            sortNo={pageFieldJson.relatedSalesContract.sortNo}
            {...FieldListLayout}
          >
            <Link
              className="tw-link"
              to={getLink('salesContract', null, { id: formData.relatedSalesContractId })}
            >
              {formData.relatedSalesContract}
            </Link>
          </Field>
        ) : (
          <Field
            name="relatedSalesContract"
            key="relatedSalesContract"
            label={pageFieldJson.relatedSalesContract.displayName}
            sortNo={pageFieldJson.relatedSalesContract.sortNo}
            {...FieldListLayout}
            decorator={{
              initialValue: formData.relatedSalesContract || '',
              rules: [
                {
                  required: pageFieldJson.relatedSalesContract.requiredFlag,
                  message: `请输入${pageFieldJson.relatedSalesContract.displayName}`,
                },
              ],
            }}
          >
            <Input
              disabled={this.pageFieldMode(pageFieldJson.relatedSalesContract.fieldMode)}
              placeholder={`请输入${pageFieldJson.relatedSalesContract.displayName}`}
            />
          </Field>
        ),
        <Field
          name="opportunity"
          key="opportunity"
          label={pageFieldJson.opportunity.displayName}
          sortNo={pageFieldJson.opportunity.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.opportunity ? parseInt(formData.opportunity, 10) : '',
            rules: [
              {
                required: pageFieldJson.opportunity.requiredFlag,
                message: `请输入${pageFieldJson.opportunity.displayName}`,
              },
            ],
          }}
        >
          <Selection.Columns
            className="x-fill-100"
            source={opportunityList}
            columns={opportunityColumns}
            transfer={{ key: 'id', code: 'id', name: 'oppoName' }}
            dropdownMatchSelectWidth={false}
            showSearch
            onColumnsChange={value => {}}
            placeholder={`请选择${pageFieldJson.opportunity.displayName}`}
            limit={20}
            disabled={this.pageFieldMode(pageFieldJson.opportunity.fieldMode)}
          />
        </Field>,
        this.pageFieldMode(pageFieldJson.relatedProjectNo.fieldMode) &&
        formData.relatedProjectNo ? (
          <Field
            name="relatedProjectNo"
            key="relatedProjectNo"
            label={pageFieldJson.relatedProjectNo.displayName}
            sortNo={pageFieldJson.relatedProjectNo.sortNo}
            {...FieldListLayout}
          >
            <Link
              className="tw-link"
              to={getLink('project', null, { id: formData.relatedProjectId })}
            >
              {formData.relatedProjectNo}
            </Link>
          </Field>
        ) : (
          <Field
            name="relatedProjectNo"
            key="relatedProjectNo"
            label={pageFieldJson.relatedProjectNo.displayName}
            sortNo={pageFieldJson.relatedProjectNo.sortNo}
            {...FieldListLayout}
            decorator={{
              initialValue: formData.relatedProjectNo || '',
              rules: [
                {
                  required: pageFieldJson.relatedProjectNo.requiredFlag,
                  message: `请输入${pageFieldJson.relatedProjectNo.displayName}`,
                },
              ],
            }}
          >
            <Input
              disabled={this.pageFieldMode(pageFieldJson.relatedProjectNo.fieldMode)}
              placeholder={`请输入${pageFieldJson.relatedProjectNo.displayName}`}
            />
          </Field>
        ),
        <Field
          name="relatedTaskName"
          key="relatedTaskName"
          label={pageFieldJson.relatedTaskName.displayName}
          sortNo={pageFieldJson.relatedTaskName.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.relatedTaskName || '',
            rules: [
              {
                required: pageFieldJson.relatedTaskName.requiredFlag,
                message: `请输入${pageFieldJson.relatedTaskName.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.relatedTaskName.fieldMode)}
            placeholder={`请输入${pageFieldJson.relatedTaskName.displayName}`}
          />
        </Field>,
        <Field
          name="attributionPayApply"
          key="attributionPayApply"
          label={pageFieldJson.attributionPayApply.displayName}
          sortNo={pageFieldJson.attributionPayApply.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.attributionPayApply || '',
            rules: [
              {
                required: pageFieldJson.attributionPayApply.requiredFlag,
                message: `请输入${pageFieldJson.attributionPayApply.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.attributionPayApply.fieldMode)}
            placeholder={`请输入${pageFieldJson.attributionPayApply.displayName}`}
          />
        </Field>,
        this.pageFieldMode(pageFieldJson.prePaymentNo.fieldMode) && formData.prePaymentNo ? (
          <Field
            name="prePaymentNo"
            key="prePaymentNo"
            label={pageFieldJson.prePaymentNo.displayName}
            sortNo={pageFieldJson.prePaymentNo.sortNo}
            {...FieldListLayout}
          >
            <Link
              className="tw-link"
              to={getLink('prePayment', null, { id: formData.prePaymentId })}
            >
              {formData.prePaymentNo}
            </Link>
          </Field>
        ) : (
          <Field
            name="prePaymentNo"
            key="prePaymentNo"
            label={pageFieldJson.prePaymentNo.displayName}
            sortNo={pageFieldJson.prePaymentNo.sortNo}
            {...FieldListLayout}
            decorator={{
              initialValue: formData.prePaymentNo || '',
              rules: [
                {
                  required: pageFieldJson.prePaymentNo.requiredFlag,
                  message: `请输入${pageFieldJson.prePaymentNo.displayName}`,
                },
              ],
            }}
          >
            <Input
              disabled={this.pageFieldMode(pageFieldJson.prePaymentNo.fieldMode)}
              placeholder={`请输入${pageFieldJson.prePaymentNo.displayName}`}
            />
          </Field>
        ),
      ];
      const filterList = fields
        .filter(field => !field.key || pageFieldJson[field.key].visibleFlag === 1)
        .sort((field1, field2) => field1.props.sortNo - field2.props.sortNo);
      return filterList;
    }
    return '';
  };

  // 财务信息(申请人填写)
  renderApplicantFinancePageConfig = () => {
    const { prePayWriteOffEdit, mode } = this.props;
    const { pageConfig, formData, receivingIdList } = prePayWriteOffEdit;
    const readOnly = true;
    if (pageConfig) {
      if (!pageConfig.pageBlockViews || pageConfig.pageBlockViews.length < 1) {
        return <div />;
      }
      const currentBlockConfig = pageConfig.pageBlockViews.filter(
        item => item.blockKey === 'FINANCE'
      )[0];
      const { pageFieldViews } = currentBlockConfig;
      const pageFieldJson = {};
      pageFieldViews.forEach(field => {
        pageFieldJson[field.fieldKey] = field;
      });
      const fields = [
        <Field
          name="invoiceNo"
          key="invoiceNo"
          label={pageFieldJson.invoiceNo.displayName}
          sortNo={pageFieldJson.invoiceNo.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.invoiceNo || '',
            rules: [
              {
                required: pageFieldJson.invoiceNo.requiredFlag,
                message: `请输入${pageFieldJson.invoiceNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.invoiceNo.fieldMode)}
            placeholder={`请输入${pageFieldJson.invoiceNo.displayName}`}
          />
        </Field>,
        <Field
          name="invoiceAmt"
          key="invoiceAmt"
          label={pageFieldJson.invoiceAmt.displayName}
          sortNo={pageFieldJson.invoiceAmt.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.invoiceAmt || '',
            rules: [
              {
                required: pageFieldJson.invoiceAmt.requiredFlag,
                message: `请输入${pageFieldJson.invoiceAmt.displayName}`,
              },
            ],
          }}
        >
          <InputNumber
            min={0}
            precision={2}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v.replace(/\$\s?|(,*)/g, '')}
            className="number-left x-fill-100"
            disabled={this.pageFieldMode(pageFieldJson.invoiceAmt.fieldMode)}
            placeholder={`请输入${pageFieldJson.invoiceAmt.displayName}`}
          />
        </Field>,
        <Field
          name="rate"
          key="rate"
          label={pageFieldJson.rate.displayName}
          sortNo={pageFieldJson.rate.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.rate || '',
            rules: [
              {
                required: pageFieldJson.rate.requiredFlag,
                message: `请输入${pageFieldJson.rate.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.rate.fieldMode)}
            placeholder={`请输入${pageFieldJson.rate.displayName}`}
          />
        </Field>,
        <Field
          name="taxAmount"
          key="taxAmount"
          label={pageFieldJson.taxAmount.displayName}
          sortNo={pageFieldJson.taxAmount.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.taxAmount || 0,
            rules: [
              {
                required: pageFieldJson.taxAmount.requiredFlag,
                message: `请输入${pageFieldJson.taxAmount.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.taxAmount.fieldMode)}
            placeholder={`请输入${pageFieldJson.taxAmount.displayName}`}
          />
        </Field>,
        <Field
          name="payMethod"
          key="payMethod"
          label={pageFieldJson.payMethod.displayName}
          sortNo={pageFieldJson.payMethod.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.payMethod || '',
            rules: [
              {
                required: pageFieldJson.payMethod.requiredFlag,
                message: `请选择${pageFieldJson.payMethod.displayName}`,
              },
            ],
          }}
        >
          <UdcSelect
            code="ACC:PAY_METHOD"
            disabled={this.pageFieldMode(pageFieldJson.payMethod.fieldMode)}
            placeholder={`请选择${pageFieldJson.payMethod.displayName}`}
          />
        </Field>,
        <Field
          name="relatedDays"
          key="relatedDays"
          label={pageFieldJson.relatedDays.displayName}
          sortNo={pageFieldJson.relatedDays.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.relatedDays || '',
            rules: [
              {
                required: pageFieldJson.relatedDays.requiredFlag,
                message: `请输入${pageFieldJson.relatedDays.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.relatedDays.fieldMode)}
            placeholder={`请输入${pageFieldJson.relatedDays.displayName}`}
          />
        </Field>,
        <Field
          name="expRelatedDate"
          key="expRelatedDate"
          label={pageFieldJson.expRelatedDate.displayName}
          sortNo={pageFieldJson.expRelatedDate.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.expRelatedDate ? moment(formData.expRelatedDate) : '',
            rules: [
              {
                required: pageFieldJson.expRelatedDate.requiredFlag,
                message: `请输入${pageFieldJson.expRelatedDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`请选择${pageFieldJson.expRelatedDate.displayName}`}
            format="YYYY-MM-DD"
            disabled={this.pageFieldMode(pageFieldJson.expRelatedDate.fieldMode)}
            className="x-fill-100"
          />
        </Field>,
        <Field
          name="expHexiaoDate"
          key="expHexiaoDate"
          label={pageFieldJson.expHexiaoDate.displayName}
          sortNo={pageFieldJson.expHexiaoDate.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.expHexiaoDate ? moment(formData.expHexiaoDate) : '',
            rules: [
              {
                required: pageFieldJson.expHexiaoDate.requiredFlag,
                message: `请输入${pageFieldJson.expHexiaoDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`请选择${pageFieldJson.expHexiaoDate.displayName}`}
            format="YYYY-MM-DD"
            disabled={this.pageFieldMode(pageFieldJson.expHexiaoDate.fieldMode)}
            className="x-fill-100"
          />
        </Field>,
        <Field
          name="receivingUnit"
          key="receivingUnit"
          label={pageFieldJson.receivingUnit.displayName}
          sortNo={pageFieldJson.receivingUnit.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.receivingUnit || '',
            rules: [
              {
                required: pageFieldJson.receivingUnit.requiredFlag,
                message: `请选择${pageFieldJson.receivingUnit.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={() => selectAllAbOu().then(resp => resp.response)}
            showSearch
            filterOption={(input, option) =>
              option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled={this.pageFieldMode(pageFieldJson.receivingUnit.fieldMode)}
            onChange={this.handleReceivingUnit}
            placeholder={`请选择${pageFieldJson.receivingUnit.displayName}`}
          />
        </Field>,
        <Field
          name="receivingBank"
          key="receivingBank"
          label={pageFieldJson.receivingBank.displayName}
          sortNo={pageFieldJson.receivingBank.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.receivingBank || '',
            rules: [
              {
                required: pageFieldJson.receivingBank.requiredFlag,
                message: `请输入${pageFieldJson.receivingBank.displayName}`,
              },
            ],
          }}
        >
          <Input disabled={this.pageFieldMode(pageFieldJson.receivingBank.fieldMode)} />
        </Field>,
        <Field
          name="receivingId"
          key="receivingId"
          label={pageFieldJson.receivingId.displayName}
          sortNo={pageFieldJson.receivingId.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.receivingId || '',
            rules: [
              {
                required: pageFieldJson.receivingId.requiredFlag,
                message: `请输入${pageFieldJson.receivingId.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={receivingIdList}
            showSearch
            onChange={this.handleReceivingId}
            placeholder="请选择收款账号"
            disabled={this.pageFieldMode(pageFieldJson.receivingId.fieldMode)}
          />
        </Field>,
        <Field
          name="accountingNote"
          key="accountingNote"
          label={pageFieldJson.accountingNote.displayName}
          sortNo={pageFieldJson.accountingNote.sortNo}
          decorator={{
            initialValue: formData.accountingNote || '',
            rules: [
              {
                required: pageFieldJson.accountingNote.requiredFlag,
                message: `请输入${pageFieldJson.accountingNote.displayName}`,
              },
            ],
          }}
          fieldCol={1}
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
        >
          <Input.TextArea
            placeholder={`请输入${pageFieldJson.accountingNote.displayName}`}
            rows={3}
            disabled={this.pageFieldMode(pageFieldJson.accountingNote.fieldMode)}
          />
        </Field>,
      ];
      const filterList = fields
        .filter(field => !field.key || pageFieldJson[field.key].visibleFlag === 1)
        .sort((field1, field2) => field1.props.sortNo - field2.props.sortNo);
      return filterList;
    }
    return '';
  };

  // 记账信息(财务填写)
  renderAccountInfoPageConfig = () => {
    const { prePayWriteOffEdit, mode } = this.props;
    const { pageConfig, formData, receivingIdList } = prePayWriteOffEdit;
    if (pageConfig) {
      if (!pageConfig.pageBlockViews || pageConfig.pageBlockViews.length < 1) {
        return <div />;
      }
      const currentBlockConfig = pageConfig.pageBlockViews.filter(
        item => item.blockKey === 'ACCOUNT'
      )[0];
      const { pageFieldViews } = currentBlockConfig;
      const pageFieldJson = {};
      pageFieldViews.forEach(field => {
        pageFieldJson[field.fieldKey] = field;
      });
      const fields = [
        <Field
          name="finalPaymentCompany1"
          key="finalPaymentCompany1"
          label={pageFieldJson.finalPaymentCompany1.displayName}
          sortNo={pageFieldJson.finalPaymentCompany1.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalPaymentCompany1,
            rules: [
              {
                required: pageFieldJson.finalPaymentCompany1.requiredFlag,
                message: `请输入${pageFieldJson.finalPaymentCompany1.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={() => selectAbOus().then(resp => resp.response)}
            showSearch
            filterOption={(input, option) =>
              option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled
            onChange={this.handlePurchaseLegal}
            placeholder={`请输入${pageFieldJson.finalPaymentCompany1.displayName}`}
          />
        </Field>,
        <Field
          name="finalPaymentBank"
          key="finalPaymentBank"
          label={pageFieldJson.finalPaymentBank.displayName}
          sortNo={pageFieldJson.finalPaymentBank.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalPaymentBank,
            rules: [
              {
                required: pageFieldJson.finalPaymentBank.requiredFlag,
                message: `请输入${pageFieldJson.finalPaymentBank.displayName}`,
              },
            ],
          }}
        >
          <Input disabled />
        </Field>,
        <Field
          name="finalPaymentId"
          key="finalPaymentId"
          label={pageFieldJson.finalPaymentId.displayName}
          sortNo={pageFieldJson.finalPaymentId.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalPaymentId,
            rules: [
              {
                required: pageFieldJson.finalPaymentId.requiredFlag,
                message: `请输入${pageFieldJson.finalPaymentId.displayName}`,
              },
            ],
          }}
        >
          <Input disabled />
        </Field>,
        <Field
          name="finalAccountingSubject"
          key="finalAccountingSubject"
          label={pageFieldJson.finalAccountingSubject.displayName}
          sortNo={pageFieldJson.finalAccountingSubject.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalAccountingSubject,
            rules: [
              {
                required: pageFieldJson.finalAccountingSubject.requiredFlag,
                message: `请输入${pageFieldJson.finalAccountingSubject.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={() => getPaymentApplyTempds(20001).then(resp => resp.response.datum)}
            showSearch
            filterOption={(input, option) =>
              option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            disabled
            placeholder={`请输入${pageFieldJson.finalAccountingSubject.displayName}`}
          />
        </Field>,
        <Field
          name="finalPayMethod"
          key="finalPayMethod"
          label={pageFieldJson.finalPayMethod.displayName}
          sortNo={pageFieldJson.finalPayMethod.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalPayMethod,
            rules: [
              {
                required: pageFieldJson.finalPayMethod.requiredFlag,
                message: `请选择${pageFieldJson.finalPayMethod.displayName}`,
              },
            ],
          }}
        >
          <UdcSelect
            code="ACC:PAY_METHOD"
            placeholder={`请选择${pageFieldJson.finalPayMethod.displayName}`}
            disabled
          />
        </Field>,
        <Field
          name="finalPayDate"
          key="finalPayDate"
          label={pageFieldJson.finalPayDate.displayName}
          sortNo={pageFieldJson.finalPayDate.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalPayDate ? moment(formData.finalPayDate) : '',
            rules: [
              {
                required: pageFieldJson.finalPayDate.requiredFlag,
                message: `请选择${pageFieldJson.finalPayDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`请选择${pageFieldJson.finalPayDate.displayName}`}
            format="YYYY-MM-DD"
            disabled
            className="x-fill-100"
          />
        </Field>,
        <Field
          name="finalHexiaoDate"
          key="finalHexiaoDate"
          label={pageFieldJson.finalHexiaoDate.displayName}
          sortNo={pageFieldJson.finalHexiaoDate.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalHexiaoDate ? moment(formData.finalHexiaoDate) : '',
            rules: [
              {
                required: pageFieldJson.finalHexiaoDate.requiredFlag,
                message: `请选择${pageFieldJson.finalHexiaoDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`请选择${pageFieldJson.finalHexiaoDate.displayName}`}
            disabled
            format="YYYY-MM-DD"
            className="x-fill-100"
          />
        </Field>,
        <Field
          name="finalAccountingNote"
          key="finalAccountingNote"
          label={pageFieldJson.finalAccountingNote.displayName}
          sortNo={pageFieldJson.finalAccountingNote.sortNo}
          decorator={{
            initialValue: formData.finalAccountingNote,
            rules: [
              {
                required: pageFieldJson.finalAccountingNote.requiredFlag,
                message: `请选择${pageFieldJson.finalAccountingNote.displayName}`,
              },
            ],
          }}
          fieldCol={1}
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
        >
          <Input.TextArea
            placeholder={`请选择${pageFieldJson.finalAccountingNote.displayName}`}
            rows={3}
            disabled
          />
        </Field>,
      ];
      const filterList = fields
        .filter(field => !field.key || pageFieldJson[field.key].visibleFlag === 1)
        .sort((field1, field2) => field1.props.sortNo - field2.props.sortNo);
      return filterList;
    }
    return '';
  };

  render() {
    const { loading, prePayWriteOffEdit, dispatch, form, mode } = this.props;
    const { getFieldDecorator } = form;
    const { pageConfig, formData } = prePayWriteOffEdit;
    return (
      <>
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList
            layout="horizontal"
            legend="申请单信息"
            getFieldDecorator={getFieldDecorator}
            col={3}
            className={style.fill}
          >
            {this.renderInfoPageConfig()}
          </FieldList>
        </Card>
        <Divider dashed />
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList
            layout="horizontal"
            legend="相关单据"
            getFieldDecorator={getFieldDecorator}
            col={3}
            className={style.fill}
          >
            {this.renderRelatedPageConfig()}
          </FieldList>
        </Card>
        <Divider dashed />
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList
            layout="horizontal"
            legend="财务信息(申请人填写)"
            getFieldDecorator={getFieldDecorator}
            col={3}
            className={style.fill}
          >
            {this.renderApplicantFinancePageConfig()}
          </FieldList>
        </Card>
        {mode === 'view' && (
          <>
            <Divider dashed />
            <Card className="tw-card-adjust" bordered={false}>
              <FieldList
                layout="horizontal"
                legend="记账信息(财务填写)"
                getFieldDecorator={getFieldDecorator}
                col={3}
                className={style.fill}
              >
                {this.renderAccountInfoPageConfig()}
              </FieldList>
            </Card>
            <Divider dashed />
            <Card className="tw-card-adjust" bordered={false}>
              <div className="tw-card-title">付款单记录</div>
              {pageConfig.pageBlockViews &&
                pageConfig.pageBlockViews.length > 1 && (
                  <EditableDataTable
                    {...payRecordTableProps(
                      DOMAIN,
                      dispatch,
                      loading,
                      form,
                      mode,
                      prePayWriteOffEdit
                    )}
                  />
                )}
            </Card>
          </>
        )}

        <Divider dashed />
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">发票核销明细</div>
          {pageConfig.pageBlockViews &&
            pageConfig.pageBlockViews.length > 1 && (
              <EditableDataTable
                {...writeOffTableProps(DOMAIN, dispatch, loading, form, mode, prePayWriteOffEdit)}
              />
            )}
        </Card>
        <Divider dashed />
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">付款明细</div>
          {pageConfig.pageBlockViews &&
            pageConfig.pageBlockViews.length > 1 && (
              <EditableDataTable
                {...payDetailTableProps(DOMAIN, dispatch, loading, form, mode, prePayWriteOffEdit)}
              />
            )}
        </Card>
      </>
    );
  }
}

export default PrePayInfo;
