/* eslint-disable import/no-unresolved */
/* eslint-disable consistent-return */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Form, Input, DatePicker, InputNumber, Button, Divider, Radio } from 'antd';
import moment from 'moment';
import classnames from 'classnames';
import { formatMessage } from 'umi/locale';
import { isEmpty, takeLast, add, isNil, gte, lte } from 'ramda';
import update from 'immutability-helper';

import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import Title from '@/components/layout/Title';
import AsyncSelect from '@/components/common/AsyncSelect';
import FieldList from '@/components/layout/FieldList';
import EditableDataTable from '@/components/common/EditableDataTable';
import { UdcSelect, FileManagerEnhance, Selection } from '@/pages/gen/field';
import { fromQs, getGuid } from '@/utils/stringUtils';

import DataTable from '@/components/common/DataTable';

import { formatDT } from '@/utils/tempUtils/DateTime';
import { toIsoDate } from '@/utils/timeUtils';
import { add as mathAdd, sub, div, mul, checkIfNumber, genFakeId } from '@/utils/mathUtils';
import router from 'umi/router';
import { payDetailTableProps } from './prePayInfoConfig';
import { selectBu, selectSupplier } from '@/services/user/Contract/sales';
import { selectBus } from '@/services/org/bu/bu';
import { selectUsers } from '@/services/sys/user';
import {
  selectAbOus,
  selectUsersWithBu,
  selectOus,
  selectCusts,
  selectAllAbOu,
} from '@/services/gen/list';
import {
  selectAccountByNo,
  getPaymentApplyOpportunity,
  getPaymentApplyTempds,
} from '@/services/sale/purchaseContract/paymentApplyList';
import { payRecordTableProps } from './payRecordConfig';
import style from '../style.less';

const DOMAIN = 'prePaymentApplyEdit';
const { Field, FieldLine } = FieldList;
const FieldListLayout = {
  labelCol: { span: 9 },
  wrapperCol: { span: 15 },
};

const opportunityColumns = [
  { dataIndex: 'oppoNo', title: '??????', span: 6 },
  { dataIndex: 'oppoName', title: '??????', span: 6 },
  { dataIndex: 'signBuName', title: '??????BU??????', span: 6 },
  { dataIndex: 'salesmanName', title: '???????????????', span: 6 },
];

@connect(({ loading, prePaymentApplyEdit, dispatch, user }) => ({
  loading,
  prePaymentApplyEdit,
  dispatch,
  user,
}))
@mountToTab()
class PrePayInfo extends PureComponent {
  // ????????????
  handlePaymentCompany1 = (key, data) => {
    const { form, dispatch } = this.props;
    form.setFieldsValue({
      finalPaymentCompany1: key,
    });
    dispatch({ type: `${DOMAIN}/updateForm`, payload: { finalPaymentCompany1: key } });
  };

  // ?????????
  handleSupplier = (key, data) => {
    const { form, dispatch } = this.props;
    form.setFieldsValue({
      receivingUnit: key,
      receivingId: '',
      receivingBank: '',
    });
    dispatch({ type: `${DOMAIN}/selectAccountByNo`, payload: { receivingUnit: key } });
  };

  // ????????????/?????????????????????
  handleReceivingUnit = (key, data) => {
    const { dispatch, form } = this.props;
    form.setFieldsValue({
      receivingUnit: key,
      receivingBank: '',
      receivingId: '',
    });
    dispatch({ type: `${DOMAIN}/selectAccountByNo`, payload: { receivingUnit: key } });
  };

  // ????????????
  handleReceivingId = (key, data) => {
    const { dispatch, form } = this.props;
    form.setFieldsValue({
      receivingId: key,
      receivingBank: '',
    });
    dispatch({ type: `${DOMAIN}/selectApplyAccounts`, payload: { accountNo: key } }).then(res => {
      form.setFieldsValue({
        receivingBank: res,
      });
    });
  };

  // ???????????????????????????
  handlePayMethod = (key, data) => {
    const { dispatch, form } = this.props;
    form.setFieldsValue({
      finalPayMethod: key,
    });
    dispatch({ type: `${DOMAIN}/updateForm`, payload: { finalPayMethod: key } });
  };

  // ????????????????????????
  pageFieldMode = fieldMode => {
    const { mode } = this.props;
    const isEdit = mode === 'view' ? true : fieldMode === 'UNEDITABLE';
    return isEdit;
  };

  // ???????????????
  renderInfoPageConfig = () => {
    const { prePaymentApplyEdit } = this.props;
    const { pageConfig, formData } = prePaymentApplyEdit;
    const { mode } = this.props;
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
                message: `?????????${pageFieldJson.paymentNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.paymentNo.fieldMode)}
            placeholder="??????????????????"
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
                message: `?????????${pageFieldJson.paymentApplicationType.displayName}`,
              },
            ],
          }}
        >
          <UdcSelect
            code="TSK:PAYMENT_APPLICATION_TYPE"
            placeholder={`?????????${pageFieldJson.paymentApplicationType.displayName}`}
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
                message: `?????????${pageFieldJson.purchaseName.displayName}`,
              },
            ],
          }}
          {...FieldListLayout}
        >
          <Input
            placeholder={`?????????${pageFieldJson.purchaseName.displayName}`}
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
                message: `?????????${pageFieldJson.applicationDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`?????????${pageFieldJson.applicationDate.displayName}`}
            format="YYYY-MM-DD"
            disabled={this.pageFieldMode(pageFieldJson.applicationDate.fieldMode)}
            className="x-fill-100"
          />
        </Field>,
        <FieldLine
          label={pageFieldJson.paymentCompany1.displayName}
          sortNo={pageFieldJson.paymentCompany1.sortNo}
          required={pageFieldJson.paymentCompany1.requiredFlag}
          {...FieldListLayout}
        >
          <Field
            name="paymentCompany1"
            key="paymentCompany1"
            decorator={{
              initialValue: formData.paymentCompany1 || '',
              rules: [
                {
                  required: pageFieldJson.paymentCompany1.requiredFlag,
                  message: `?????????${pageFieldJson.paymentCompany1.displayName}`,
                },
              ],
            }}
            wrapperCol={{ span: 23, xxl: 23 }}
          >
            <AsyncSelect
              source={() => selectAbOus().then(resp => resp.response)}
              showSearch
              filterOption={(input, option) =>
                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onChange={this.handlePaymentCompany1}
              disabled={this.pageFieldMode(pageFieldJson.paymentCompany1.fieldMode)}
              placeholder={`?????????${pageFieldJson.paymentCompany1.displayName}`}
            />
          </Field>
          <Field
            name="paymentCompany1"
            key="paymentCompany1"
            decorator={{
              initialValue: formData.paymentCompany1 || '',
              rules: [
                {
                  required: pageFieldJson.paymentCompany1.requiredFlag,
                  message: `?????????${pageFieldJson.paymentCompany1.displayName}`,
                },
              ],
            }}
            wrapperCol={{ span: 23, offset: 1, xxl: 23 }}
          >
            <Input disabled onChange={this.handlePaymentCompany1} />
          </Field>
        </FieldLine>,
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
                message: `?????????${pageFieldJson.supplierLegalNo.displayName}`,
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
            placeholder={`?????????${pageFieldJson.supplierLegalNo.displayName}`}
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
                message: `?????????${pageFieldJson.acceptanceType.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="TSK:ACCEPTANCE_TYPE"
            placeholder={`?????????${pageFieldJson.acceptanceType.displayName}`}
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
                message: `?????????${pageFieldJson.paymentAmt.displayName}`,
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
            placeholder={`?????????${pageFieldJson.paymentAmt.displayName}`}
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
                message: `?????????${pageFieldJson.currPaymentAmt.displayName}`,
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
            disabled={this.pageFieldMode(pageFieldJson.currPaymentAmt.fieldMode)}
            placeholder={`?????????${pageFieldJson.currPaymentAmt.displayName}`}
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
                message: `?????????${pageFieldJson.currCode.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="COM:CURRENCY_KIND"
            placeholder={`?????????${pageFieldJson.currCode.displayName}`}
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
                message: `?????????${pageFieldJson.purchaseInchargeResId.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={() => selectUsers().then(resp => resp.response)}
            placeholder={`?????????${pageFieldJson.purchaseInchargeResId.displayName}`}
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
                message: `?????????${pageFieldJson.invoiceState.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="TSK:INVOICE_STATE"
            placeholder={`?????????${pageFieldJson.invoiceState.displayName}`}
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
                message: `?????????${pageFieldJson.demandNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            placeholder={`?????????${pageFieldJson.demandNo.displayName}`}
            className="x-fill-100"
            disabled={this.pageFieldMode(pageFieldJson.demandNo.fieldMode)}
          />
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
                message: `?????????${pageFieldJson.note.displayName}`,
              },
            ],
          }}
          fieldCol={1}
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
        >
          <Input.TextArea
            placeholder={`?????????${pageFieldJson.note.displayName}`}
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

  // ????????????
  renderRelatedPageConfig = () => {
    const { prePaymentApplyEdit } = this.props;
    const { pageConfig, formData, opportunityList } = prePaymentApplyEdit;
    const { mode } = this.props;
    const readOnly = true;
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
                required: pageFieldJson.docType.requiredFlag,
                message: `?????????${pageFieldJson.docType.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="TSK:DOC_TYPE"
            disabled={this.pageFieldMode(pageFieldJson.docType.fieldMode)}
            onChange={this.handleDocType}
            placeholder={`?????????${pageFieldJson.docType.displayName}`}
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
                message: `?????????${pageFieldJson.docNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.docNo.fieldMode)}
            placeholder={`?????????${pageFieldJson.docNo.displayName}`}
          />
        </Field>,
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
                message: `?????????${pageFieldJson.relatedSalesContract.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.relatedSalesContract.fieldMode)}
            placeholder={`?????????${pageFieldJson.relatedSalesContract.displayName}`}
          />
        </Field>,
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
                message: `?????????${pageFieldJson.opportunity.displayName}`,
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
            placeholder={`?????????${pageFieldJson.opportunity.displayName}`}
            limit={20}
            disabled={this.pageFieldMode(pageFieldJson.opportunity.fieldMode)}
          />
        </Field>,
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
                message: `?????????${pageFieldJson.relatedProjectNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.relatedProjectNo.fieldMode)}
            placeholder={`?????????${pageFieldJson.relatedProjectNo.displayName}`}
          />
        </Field>,
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
                message: `?????????${pageFieldJson.relatedTaskName.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.relatedTaskName.fieldMode)}
            placeholder={`?????????${pageFieldJson.relatedTaskName.displayName}`}
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
                message: `?????????${pageFieldJson.attributionPayApply.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.attributionPayApply.fieldMode)}
            placeholder={`?????????${pageFieldJson.attributionPayApply.displayName}`}
          />
        </Field>,
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
                message: `?????????${pageFieldJson.prePaymentNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.prePaymentNo.fieldMode)}
            placeholder={`?????????${pageFieldJson.prePaymentNo.displayName}`}
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

  // ????????????(???????????????)
  renderApplicantFinancePageConfig = () => {
    const { prePaymentApplyEdit } = this.props;
    const { pageConfig, formData, receivingIdList } = prePaymentApplyEdit;
    const { mode } = this.props;
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
                message: `?????????${pageFieldJson.invoiceNo.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.invoiceNo.fieldMode)}
            placeholder={`?????????${pageFieldJson.invoiceNo.displayName}`}
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
                message: `?????????${pageFieldJson.invoiceAmt.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.invoiceAmt.fieldMode)}
            placeholder={`?????????${pageFieldJson.invoiceAmt.displayName}`}
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
                message: `?????????${pageFieldJson.rate.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.rate.fieldMode)}
            placeholder={`?????????${pageFieldJson.rate.displayName}`}
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
                message: `?????????${pageFieldJson.taxAmount.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.taxAmount.fieldMode)}
            placeholder={`?????????${pageFieldJson.taxAmount.displayName}`}
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
                message: `?????????${pageFieldJson.payMethod.displayName}`,
              },
            ],
          }}
        >
          <UdcSelect
            code="ACC:PAY_METHOD"
            disabled={this.pageFieldMode(pageFieldJson.payMethod.fieldMode)}
            onChange={this.handlePayMethod}
            placeholder={`?????????${pageFieldJson.payMethod.displayName}`}
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
                message: `?????????${pageFieldJson.relatedDays.displayName}`,
              },
            ],
          }}
        >
          <Input
            disabled={this.pageFieldMode(pageFieldJson.relatedDays.fieldMode)}
            placeholder={`?????????${pageFieldJson.relatedDays.displayName}`}
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
                message: `?????????${pageFieldJson.expRelatedDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`?????????${pageFieldJson.expRelatedDate.displayName}`}
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
                message: `?????????${pageFieldJson.expHexiaoDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`?????????${pageFieldJson.expHexiaoDate.displayName}`}
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
                message: `?????????${pageFieldJson.receivingUnit.displayName}`,
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
            placeholder={`?????????${pageFieldJson.receivingUnit.displayName}`}
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
                message: `?????????${pageFieldJson.receivingBank.displayName}`,
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
                message: `?????????${pageFieldJson.receivingId.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={receivingIdList}
            showSearch
            onChange={this.handleReceivingId}
            placeholder="?????????????????????"
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
                message: `?????????${pageFieldJson.accountingNote.displayName}`,
              },
            ],
          }}
          fieldCol={1}
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
        >
          <Input.TextArea
            placeholder={`?????????${pageFieldJson.accountingNote.displayName}`}
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

  // ????????????(????????????)
  renderAccountInfoPageConfig = () => {
    const { prePaymentApplyEdit } = this.props;
    const { pageConfig, formData, finalPaymentIdList } = prePaymentApplyEdit;
    const { mode } = this.props;
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
                message: `?????????${pageFieldJson.finalPaymentCompany1.displayName}`,
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
            placeholder={`?????????${pageFieldJson.finalPaymentCompany1.displayName}`}
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
                message: `?????????${pageFieldJson.finalPaymentBank.displayName}`,
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
                message: `?????????${pageFieldJson.finalPaymentId.displayName}`,
              },
            ],
          }}
        >
          <AsyncSelect
            source={finalPaymentIdList || []}
            showSearch
            disabled
            placeholder={`?????????${pageFieldJson.finalPaymentId.displayName}`}
          />
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
                message: `?????????${pageFieldJson.finalAccountingSubject.displayName}`,
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
            placeholder={`?????????${pageFieldJson.finalAccountingSubject.displayName}`}
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
                message: `?????????${pageFieldJson.finalPayMethod.displayName}`,
              },
            ],
          }}
        >
          <UdcSelect
            code="ACC:PAY_METHOD"
            disabled
            placeholder={`?????????${pageFieldJson.finalPayMethod.displayName}`}
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
                message: `?????????${pageFieldJson.finalPayDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`?????????${pageFieldJson.finalPayDate.displayName}`}
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
                message: `?????????${pageFieldJson.finalHexiaoDate.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`?????????${pageFieldJson.finalHexiaoDate.displayName}`}
            format="YYYY-MM-DD"
            disabled
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
                message: `?????????${pageFieldJson.finalAccountingNote.displayName}`,
              },
            ],
          }}
          fieldCol={1}
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 21 }}
        >
          <Input.TextArea
            placeholder={`?????????${pageFieldJson.finalAccountingNote.displayName}`}
            disabled
            rows={3}
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
    const { form, mode, loading, prePaymentApplyEdit, dispatch } = this.props;
    const { getFieldDecorator } = form;
    const { formData, pageConfig } = prePaymentApplyEdit;
    return (
      <>
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList
            layout="horizontal"
            legend="????????????"
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
            legend="????????????"
            getFieldDecorator={getFieldDecorator}
            col={3}
            className={style.fill}
          >
            {this.renderRelatedPageConfig()}
            <Field
              presentational
              label="????????????"
              {...FieldListLayout}
              decorator={{
                initialValue: null,
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <FileManagerEnhance
                api="/api/worth/v1/paymentApply/sfs/token"
                dataKey={formData.id}
                listType="text"
                disabled={mode === 'view'}
              />
            </Field>
          </FieldList>
        </Card>
        <Divider dashed />
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList
            layout="horizontal"
            legend="????????????(???????????????)"
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
                legend="????????????(????????????)"
                getFieldDecorator={getFieldDecorator}
                col={3}
                className={style.fill}
              >
                {this.renderAccountInfoPageConfig()}
              </FieldList>
            </Card>
            <Divider dashed />
            <Card className="tw-card-adjust" bordered={false}>
              <div className="tw-card-title">???????????????</div>
              {pageConfig.pageBlockViews &&
                pageConfig.pageBlockViews.length > 1 && (
                  <EditableDataTable
                    {...payRecordTableProps(
                      DOMAIN,
                      dispatch,
                      loading,
                      form,
                      mode,
                      prePaymentApplyEdit
                    )}
                  />
                )}
            </Card>
          </>
        )}

        <Divider dashed />
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">????????????</div>
          {pageConfig.pageBlockViews &&
            pageConfig.pageBlockViews.length > 1 && (
              <EditableDataTable
                {...payDetailTableProps(DOMAIN, dispatch, loading, form, mode, prePaymentApplyEdit)}
              />
            )}
        </Card>
      </>
    );
  }
}

export default PrePayInfo;
