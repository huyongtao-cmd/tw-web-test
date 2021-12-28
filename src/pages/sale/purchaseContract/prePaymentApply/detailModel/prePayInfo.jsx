/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
/* eslint-disable prefer-destructuring */
/* eslint-disable consistent-return */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Form, Input, DatePicker, InputNumber, Button, Divider, Radio } from 'antd';
import moment from 'moment';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import { isEmpty, takeLast, add, isNil, gte, lte } from 'ramda';
import AsyncSelect from '@/components/common/AsyncSelect';
import FieldList from '@/components/layout/FieldList';
import EditableDataTable from '@/components/common/EditableDataTable';
import { UdcSelect, FileManagerEnhance, Selection } from '@/pages/gen/field';
import { fromQs, getGuid } from '@/utils/stringUtils';
import { div } from '@/utils/mathUtils';
import { selectUsers } from '@/services/sys/user';
import Link from 'umi/link';
import { getLink } from '@/pages/sale/purchaseContract/linkConfig';
import {
  selectAbOus,
  selectUsersWithBu,
  selectOus,
  selectCusts,
  selectAllAbOu,
} from '@/services/gen/list';
import {
  selectAccountByNo,
  getPaymentApplyTempds,
} from '@/services/sale/purchaseContract/paymentApplyList';
import { ARRY_NO, CONFIGSCENE, FLOW_NO } from '../../constConfig';
import { payDetailTableProps } from './prePayInfoConfig';
import { payRecordTableProps, paymentPlanAdvPayTableProps } from './payRecordConfig';
import style from '../style.less';

const DOMAIN = 'prePaymentApplyDetail';
const { Field, FieldLine } = FieldList;
const FieldListLayout = {
  labelCol: { span: 9 },
  wrapperCol: { span: 15 },
};
@connect(({ loading, prePaymentApplyDetail, dispatch, user }) => ({
  loading,
  prePaymentApplyDetail,
  dispatch,
  user,
}))
@mountToTab()
class PrePayInfo extends PureComponent {
  handlePaymentCompany1 = (key, data) => {
    const { form, dispatch } = this.props;
    form.setFieldsValue({
      finalPaymentCompany1: key,
      finalPaymentBank: '',
      finalPaymentId: '',
    });
    dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: {
        finalPaymentCompany1: key,
        finalPaymentBank: '',
        finalPaymentId: '',
      },
    });
  };

  // 供应商
  handleSupplier = (key, data) => {
    const { form, dispatch } = this.props;
    form.setFieldsValue({
      receivingUnit: key,
      receivingId: '',
      receivingBank: '',
    });
    dispatch({ type: `${DOMAIN}/selectAccountByNo`, payload: { receivingUnit: key } });
  };

  // 收款单位/人（财务信息）
  handleReceivingUnit = (key, data) => {
    const { dispatch, form } = this.props;
    form.setFieldsValue({
      receivingUnit: key,
      receivingId: '',
      receivingBank: '',
    });
    dispatch({ type: `${DOMAIN}/selectAccountByNo`, payload: { receivingUnit: key } });
  };

  // 收款卡号
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

  // 付款公司
  handleFinalPaymentCompany1 = (key, data) => {
    const { dispatch, form } = this.props;
    form.setFieldsValue({
      finalPaymentCompany1: key,
      finalPaymentBank: '',
      finalPaymentId: '',
    });
    dispatch({ type: `${DOMAIN}/selectFinalAccountByNo`, payload: { finalPaymentCompany1: key } });
  };

  // 付款卡号
  handleFinalPaymentId = (key, data) => {
    const { dispatch, form } = this.props;
    form.setFieldsValue({
      finalPaymentId: key,
      finalPaymentBank: '',
    });
    dispatch({ type: `${DOMAIN}/selectFinalApplyAccounts`, payload: { finalPaymentId: key } }).then(
      res => {
        form.setFieldsValue({
          finalPaymentBank: res,
        });
      }
    );
  };

  // 表单是否可填控制
  pageFieldMode = fieldMode => {
    const { prePaymentApplyDetail } = this.props;
    const { fieldsConfig, formData } = prePaymentApplyDetail;
    const { scene } = formData;
    let sceneval = formData.paymentApplicationType;
    if (ARRY_NO.includes(scene)) {
      sceneval = scene;
    } else {
      sceneval = formData.paymentApplicationType;
    }
    const isEdit =
      fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`
        ? true
        : fieldMode === 'UNEDITABLE';
    return isEdit;
  };

  // 申请单信息
  renderInfoPageConfig = applyEditFlag => {
    const { prePaymentApplyDetail } = this.props;
    const { mode } = fromQs();
    const { pageConfig, formData, fieldsConfig } = prePaymentApplyDetail;
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
            disabled={this.pageFieldMode(pageFieldJson.paymentNo.fieldMode) || mode === 'view'}
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
            disabled={
              this.pageFieldMode(pageFieldJson.paymentApplicationType.fieldMode) || mode === 'view'
            }
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
            disabled={this.pageFieldMode(pageFieldJson.purchaseName.fieldMode) || mode === 'view'}
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
            disabled={
              this.pageFieldMode(pageFieldJson.applicationDate.fieldMode) || mode === 'view'
            }
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
                  message: `请选择${pageFieldJson.paymentCompany1.displayName}`,
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
              disabled={
                (applyEditFlag
                  ? !applyEditFlag
                  : this.pageFieldMode(pageFieldJson.paymentCompany1.fieldMode)) || mode === 'view'
              }
              placeholder={`请选择${pageFieldJson.paymentCompany1.displayName}`}
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
                  message: `请选择${pageFieldJson.paymentCompany1.displayName}`,
                },
              ],
            }}
            wrapperCol={{ span: 23, offset: 1, xxl: 23 }}
          >
            <Input
              disabled={!applyEditFlag || mode === 'view'}
              onChange={this.handlePaymentCompany1}
            />
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
            disabled={
              this.pageFieldMode(pageFieldJson.supplierLegalNo.fieldMode) || mode === 'view'
            }
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
            disabled={this.pageFieldMode(pageFieldJson.acceptanceType.fieldMode) || mode === 'view'}
          />
        </Field>,
        <Field
          name="paymentAmt"
          key="paymentAmt"
          label={pageFieldJson.paymentAmt.displayName}
          sortNo={pageFieldJson.paymentAmt.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.paymentAmt || '',
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
            disabled={this.pageFieldMode(pageFieldJson.paymentAmt.fieldMode) || mode === 'view'}
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
            disabled={this.pageFieldMode(pageFieldJson.currPaymentAmt.fieldMode) || mode === 'view'}
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
            initialValue: formData.currCode || 0,
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
            disabled={this.pageFieldMode(pageFieldJson.currCode.fieldMode) || mode === 'view'}
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
            disabled={
              this.pageFieldMode(pageFieldJson.purchaseInchargeResId.fieldMode) || mode === 'view'
            }
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
            disabled={this.pageFieldMode(pageFieldJson.invoiceState.fieldMode) || mode === 'view'}
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
            disabled={this.pageFieldMode(pageFieldJson.demandNo.fieldMode) || mode === 'view'}
          />
        </Field>,
        // 新增预计核销日期
        <Field
          name="expHexiaoDate"
          key="expHexiaoDate"
          label={pageFieldJson.expHexiaoDate.displayName}
          sortNo={pageFieldJson.expHexiaoDate.sortNo}
          // label='预计核销日期'
          {...FieldListLayout}
          decorator={{
            initialValue: formData.expHexiaoDate ? moment(formData.expHexiaoDate) : '',
            rules: [
              {
                required: pageFieldJson.expHexiaoDate.requiredFlag,
                message: `请输入${pageFieldJson.demandNo.displayName}`,
              },
            ],
          }}
        >
          <DatePicker
            placeholder={`请选择${pageFieldJson.expHexiaoDate.displayName}`}
            format="YYYY-MM-DD"
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.expHexiaoDate.fieldMode)) || mode === 'view'
            }
            className="x-fill-100"
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
            disabled={
              (applyEditFlag ? !applyEditFlag : this.pageFieldMode(pageFieldJson.note.fieldMode)) ||
              mode === 'view'
            }
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
    const { prePaymentApplyDetail } = this.props;
    const { pageConfig, formData, fieldsConfig } = prePaymentApplyDetail;
    const { mode } = fromQs();
    const { scene } = formData;
    let sceneval = formData.paymentApplicationType;
    if (ARRY_NO.includes(scene)) {
      sceneval = scene;
    } else {
      sceneval = formData.paymentApplicationType;
    }
    const readOnly = fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`;
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
                message: `请选择${pageFieldJson.docType.displayName}`,
              },
            ],
          }}
        >
          <Selection.UDC
            code="TSK:DOC_TYPE"
            placeholder="请选择关联单据类型"
            disabled={this.pageFieldMode(pageFieldJson.docType.fieldMode) || mode === 'view'}
          />
        </Field>,
        mode === 'view' && formData.docNo ? (
          <Field
            name="docNo"
            key="docNo"
            label={pageFieldJson.docNo.displayName}
            sortNo={pageFieldJson.docNo.sortNo}
            {...FieldListLayout}
          >
            <Link
              className="tw-link"
              to={getLink('TSK:DOC_TYPE', formData.docType, { id: formData.docId })}
            >
              {formData.docNo}
            </Link>
          </Field>
        ) : (
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
            <Input
              disabled={this.pageFieldMode(pageFieldJson.docNo.fieldMode)}
              placeholder={`请输入${pageFieldJson.docNo.displayName}`}
            />
          </Field>
        ),
        mode === 'view' && formData.relatedSalesContract ? (
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
        mode === 'view' && formData.opportunity ? (
          <Field
            name="opportunity"
            key="opportunity"
            label={pageFieldJson.opportunity.displayName}
            sortNo={pageFieldJson.opportunity.sortNo}
            {...FieldListLayout}
          >
            <Link
              className="tw-link"
              to={getLink('opportunity', null, { id: formData.opportunity })}
            >
              {formData.opportunityName}
            </Link>
          </Field>
        ) : (
          <Field
            name="opportunity"
            key="opportunity"
            label={pageFieldJson.opportunity.displayName}
            sortNo={pageFieldJson.opportunity.sortNo}
            {...FieldListLayout}
            decorator={{
              initialValue: formData.opportunityName || '',
              rules: [
                {
                  required: pageFieldJson.opportunity.requiredFlag,
                  message: `请输入${pageFieldJson.opportunity.displayName}`,
                },
              ],
            }}
          >
            <Input
              disabled={this.pageFieldMode(pageFieldJson.opportunity.fieldMode)}
              placeholder={`请输入${pageFieldJson.opportunity.displayName}`}
            />
          </Field>
        ),
        mode === 'view' && formData.relatedProjectNo ? (
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
        mode === 'view' && formData.relatedTaskName ? (
          <Field
            name="relatedTaskName"
            key="relatedTaskName"
            label={pageFieldJson.relatedTaskName.displayName}
            sortNo={pageFieldJson.relatedTaskName.sortNo}
            {...FieldListLayout}
          >
            <Link className="tw-link" to={getLink('task', null, { id: formData.relatedTaskId })}>
              {formData.relatedTaskName}
            </Link>
          </Field>
        ) : (
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
          </Field>
        ),
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
        </Field>,
      ];
      const filterList = fields
        .filter(field => !field.key || pageFieldJson[field.key].visibleFlag === 1)
        .sort((field1, field2) => field1.props.sortNo - field2.props.sortNo);
      return filterList;
    }
    return '';
  };

  // 财务信息(申请人填写)
  renderApplicantFinancePageConfig = applyEditFlag => {
    const { prePaymentApplyDetail } = this.props;
    const { mode } = fromQs();
    const { pageConfig, formData, receivingIdList, fieldsConfig } = prePaymentApplyDetail;
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
            disabled={this.pageFieldMode(pageFieldJson.invoiceNo.fieldMode) || mode === 'view'}
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
          <Input
            disabled={this.pageFieldMode(pageFieldJson.invoiceAmt.fieldMode) || mode === 'view'}
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
            disabled={this.pageFieldMode(pageFieldJson.rate.fieldMode) || mode === 'view'}
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
            disabled={this.pageFieldMode(pageFieldJson.taxAmount.fieldMode) || mode === 'view'}
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
            placeholder={`请选择${pageFieldJson.payMethod.displayName}`}
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.payMethod.fieldMode)) || mode === 'view'
            }
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
          <InputNumber
            min={0}
            precision={0}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => v.replace(/\$\s?|(,*)/g, '')}
            className="number-left x-fill-100"
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.relatedDays.fieldMode)) || mode === 'view'
            }
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
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.expRelatedDate.fieldMode)) || mode === 'view'
            }
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
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.expHexiaoDate.fieldMode)) || mode === 'view'
            }
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
            onChange={this.handleReceivingUnit}
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.receivingUnit.fieldMode)) || mode === 'view'
            }
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
          <Input
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.receivingBank.fieldMode)) || mode === 'view'
            }
          />
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
            placeholder={`请输入${pageFieldJson.receivingId.displayName}`}
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.receivingId.fieldMode)) || mode === 'view'
            }
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
            disabled={
              (applyEditFlag
                ? !applyEditFlag
                : this.pageFieldMode(pageFieldJson.accountingNote.fieldMode)) || mode === 'view'
            }
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
  renderAccountInfoPageConfig = accountancyFlag => {
    const { prePaymentApplyDetail } = this.props;
    const { pageConfig, formData, fieldsConfig, finalPaymentIdList } = prePaymentApplyDetail;
    const { mode } = fromQs();
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
            onChange={this.handleFinalPaymentCompany1}
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalPaymentCompany1.fieldMode === 'UNEDITABLE'
            }
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
          <Input
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalPaymentBank.fieldMode === 'UNEDITABLE'
            }
          />
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
          <AsyncSelect
            source={finalPaymentIdList || []}
            showSearch
            onChange={this.handleFinalPaymentId}
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalPaymentId.fieldMode === 'UNEDITABLE'
            }
            placeholder={`请选择${pageFieldJson.finalPaymentId.displayName}`}
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
                required: pageFieldJson.finalAccountingSubject.requiredFlag && accountancyFlag,
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
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalAccountingSubject.fieldMode === 'UNEDITABLE'
            }
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
                required: pageFieldJson.finalPayMethod.requiredFlag && accountancyFlag,
                message: `请选择${pageFieldJson.finalPayMethod.displayName}`,
              },
            ],
          }}
        >
          <UdcSelect
            code="ACC:PAY_METHOD"
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalPayMethod.fieldMode === 'UNEDITABLE'
            }
            placeholder={`请选择${pageFieldJson.finalPayMethod.displayName}`}
          />
        </Field>,
        <Field
          name="finalPayDate"
          key="finalPayDate"
          label={pageFieldJson.finalPayDate.displayName}
          sortNo={pageFieldJson.finalPayDate.sortNo}
          {...FieldListLayout}
          decorator={{
            initialValue: formData.finalPayDate ? moment(formData.finalPayDate) : moment(),
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
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalPayDate.fieldMode === 'UNEDITABLE'
            }
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
            format="YYYY-MM-DD"
            className="x-fill-100"
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalHexiaoDate.fieldMode === 'UNEDITABLE'
            }
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
            disabled={
              mode === 'view'
                ? true
                : fieldsConfig.taskKey && fieldsConfig.taskKey.indexOf('ACCOUNTANCY') === -1
                  ? true
                  : pageFieldJson.finalAccountingNote.fieldMode === 'UNEDITABLE'
            }
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
    const { form, loading, prePaymentApplyDetail, dispatch } = this.props;
    const { getFieldDecorator } = form;
    const { formData, receivingIdList, fieldsConfig, pageConfig } = prePaymentApplyDetail;
    const { scene, isEmergencyPayment } = formData;
    let sceneval = formData.paymentApplicationType;
    if (ARRY_NO.includes(scene)) {
      sceneval = scene;
    } else {
      sceneval = formData.paymentApplicationType;
    }
    const readOnly = fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`;
    const { mode } = fromQs();
    let displayPayRecord = true;
    // const flag = false; //暂时隐藏付款单记录
    let accountancyFlag = true; //应付会计 节点取消必填校验
    let applyEditFlag = false; // 申请人修改节点 部分字段可编辑
    if (fieldsConfig.taskKey) {
      displayPayRecord = fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`;
      accountancyFlag = fieldsConfig.taskKey.includes('ACCOUNTANCY');
      applyEditFlag = fieldsConfig.taskKey.includes('APPLY_RES_EDIT');
    }
    return (
      <>
        {!isNil(isEmergencyPayment) && isEmergencyPayment === 1 ? (
          <div className={style.hint}>此单据已经紧急付款！后续财务无需再支付！ </div>
        ) : (
          ''
        )}
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList
            layout="horizontal"
            legend="基本信息"
            getFieldDecorator={getFieldDecorator}
            col={3}
            className={style.fill}
          >
            {this.renderInfoPageConfig(applyEditFlag)}
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
            <Field
              presentational
              label="付款依据"
              {...FieldListLayout}
              decorator={{
                initialValue: null,
                rules: [
                  {
                    required: true,
                    message: '请上传付款依据',
                  },
                ],
              }}
            >
              <FileManagerEnhance
                api="/api/worth/v1/paymentApply/sfs/token"
                dataKey={formData.id}
                listType="text"
                disabled={
                  (applyEditFlag
                    ? !applyEditFlag
                    : fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`) ||
                  mode === 'view'
                }
                required
              />
            </Field>
            <Field
              name="emergencyPayment"
              label="紧急付款凭证"
              {...FieldListLayout}
              decorator={{
                initialValue: null,
                rules: [
                  {
                    message: '请上传紧急付款凭证',
                  },
                ],
              }}
            >
              <FileManagerEnhance
                api="/api/worth/v1/workOrderApply/sfs/emergencyPayment/token"
                dataKey={formData.id}
                listType="text"
                disabled
              />
            </Field>
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
            {this.renderApplicantFinancePageConfig(applyEditFlag)}
          </FieldList>
        </Card>
        {formData.docType === 'CONTRACT' && (
          <>
            <Divider dashed />
            <Card className="tw-card-adjust" bordered={false}>
              <div className="tw-card-title">付款计划参考</div>
              <EditableDataTable
                {...paymentPlanAdvPayTableProps(
                  DOMAIN,
                  dispatch,
                  loading,
                  form,
                  mode,
                  prePaymentApplyDetail
                )}
              />
            </Card>
          </>
        )}
        <Divider dashed />
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">付款明细</div>
          {pageConfig.pageBlockViews &&
            pageConfig.pageBlockViews.length > 1 && (
              <EditableDataTable
                {...payDetailTableProps(
                  DOMAIN,
                  dispatch,
                  loading,
                  form,
                  readOnly,
                  mode,
                  prePaymentApplyDetail
                )}
              />
            )}
        </Card>
        <Divider dashed />
        {pageConfig.pageBlockViews &&
          pageConfig.pageBlockViews.length > 1 && (
            <Card className="tw-card-adjust" bordered={false}>
              <FieldList
                layout="horizontal"
                legend="记账信息(财务填写)"
                getFieldDecorator={getFieldDecorator}
                col={3}
                className={style.fill}
              >
                {this.renderAccountInfoPageConfig(accountancyFlag)}
              </FieldList>
            </Card>
          )}
        {
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
                    prePaymentApplyDetail
                  )}
                />
              )}
          </Card>
        }
      </>
    );
  }
}

export default PrePayInfo;
