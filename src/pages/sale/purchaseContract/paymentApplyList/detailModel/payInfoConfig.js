/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
/* eslint-disable arrow-body-style */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-shadow */
/* eslint-disable array-callback-return */
/* eslint-disable prefer-const */
/* eslint-disable react/jsx-filename-extension */
import React, { Component } from 'react';
import { Card, Form, Input, DatePicker, InputNumber, Button, Divider, Radio, Select } from 'antd';
import { UdcSelect, FileManagerEnhance, Selection } from '@/pages/gen/field';
import AsyncSelect from '@/components/common/AsyncSelect';
import update from 'immutability-helper';
import moment from 'moment';
import createMessage from '@/components/core/AlertMessage';
import { isEmpty, takeLast, add, isNil, gte, lte } from 'ramda';
import { add as mathAdd, sub, div, mul, checkIfNumber, genFakeId } from '@/utils/mathUtils';
import {
  getPaymentApplyInvoices,
  getInvoicesDetail,
} from '@/services/sale/purchaseContract/paymentApplyList';
import { InvoicesSelect } from '../../suggestComponent/index';
import { CONFIGSCENE, FLOW_NO, CalculateRate, ARRY_NO } from '../../constConfig';
import { fromQs } from '@/utils/stringUtils';
import Link from 'umi/link';
import { getLink } from '@/pages/sale/purchaseContract/linkConfig';

const { Option } = Select;
let sceneval = '';
export function writeOffTableProps(DOMAIN, dispatch, loading, form, readOnly, paymentApplyDetail) {
  const { invoiceVerDetail, pageConfig, formData } = paymentApplyDetail;
  const { scene } = formData;
  sceneval = formData.paymentApplicationType;
  console.info('payInfoConfig' + scene + '' + FLOW_NO[scene]);
  if (ARRY_NO.includes(scene)) {
    sceneval = scene;
  } else {
    sceneval = formData.paymentApplicationType;
  }
  const pageFieldJson = {};
  if (pageConfig) {
    if (pageConfig.pageBlockViews && pageConfig.pageBlockViews.length > 1) {
      const currentBlockConfig =
        pageConfig.pageBlockViews &&
        pageConfig.pageBlockViews.filter(item => item.blockKey === 'INVOICES')[0];
      const { pageFieldViews } = currentBlockConfig;
      pageFieldViews.forEach(field => {
        pageFieldJson[field.fieldKey] = field;
      });
    }
  }
  // ??????????????????
  const onCellChanged = (rowIndex, rowField) => rowFieldValue => {
    const val = rowFieldValue && rowFieldValue.target ? rowFieldValue.target.value : rowFieldValue;
    if (rowField === 'invoiceNo') {
      const invoiceNo = val;
      dispatch({
        type: `${DOMAIN}/InvoicesDetail`,
        payload: {
          invoiceNo,
        },
      }).then(res => {
        if (Array.isArray(res)) {
          let Object = {};
          for (let key in res[0]) {
            let name = key;
            let value = { $set: res[0][key] };
            if (name !== 'searchType' && name !== 'id') {
              Object[name] = value;
            }
          }
          // check:??????????????????????????????
          const isEqual = invoiceVerDetail.filter(item => item.invoiceNo === val);
          if (isEqual.length === 0) {
            const newInvoiceVerDetail = update(invoiceVerDetail, {
              [rowIndex]: {
                ...Object,
                theAmt: {
                  $set: 0,
                },
                [rowField]: {
                  $set: val,
                },
              },
            });
            let invoiceAmt = 0;
            let invoiceNo = [];
            let taxAmount = 0;
            newInvoiceVerDetail.map((item, index) => {
              invoiceAmt = add(invoiceAmt, item.theAmt);
              invoiceNo.push(item.invoiceNo);
              taxAmount = add(
                taxAmount,
                ((item.deductTax / item.invoiceAmt).toFixed(10) * item.theAmt).toFixed(2)
              );
            });
            form.setFieldsValue({
              invoiceAmt,
              invoiceNo: invoiceNo.join(','),
              taxAmount,
              taxAmountAmt: sub(formData.currPaymentAmt, taxAmount),
              rate: CalculateRate(newInvoiceVerDetail),
            });
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                formData: {
                  ...formData,
                  invoiceNo: invoiceNo.join(','),
                  invoiceAmt,
                  taxAmount,
                  taxAmountAmt: sub(formData.currPaymentAmt, taxAmount),
                  rate: CalculateRate(newInvoiceVerDetail),
                },
                invoiceVerDetail: newInvoiceVerDetail,
              },
            });
          } else {
            createMessage({ type: 'error', description: '??????????????????????????????' });
          }
        }
      });
    } else if (rowField === 'searchType') {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          invoiceVerDetail: update(invoiceVerDetail, {
            [rowIndex]: {
              [rowField]: {
                $set: val,
              },
            },
          }),
        },
      });
    } else if (rowField === 'theAmt') {
      let invoiceAmt = 0;
      let taxAmount = 0;
      const newVal = val;
      invoiceVerDetail.map((item, index) => {
        if (index === rowIndex) {
          if (typeof newVal === 'number') {
            if (add(item.writtenOffAmt, newVal) > item.invoiceAmt) {
              createMessage({
                type: 'error',
                description: '??????????????????????????????????????????????????????????????????',
              });
            } else {
              let newInvoiceVerDetail = update(invoiceVerDetail, {
                [rowIndex]: {
                  [rowField]: {
                    $set: newVal,
                  },
                },
              });
              newInvoiceVerDetail.map(t => {
                invoiceAmt = mathAdd(invoiceAmt, t.theAmt);
                taxAmount = mathAdd(
                  taxAmount,
                  ((t.deductTax / t.invoiceAmt).toFixed(10) * t.theAmt).toFixed(2)
                );
              });
              form.setFieldsValue({
                invoiceAmt,
                taxAmount,
                taxAmountAmt: sub(formData.currPaymentAmt, taxAmount),
              });
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  formData: {
                    ...formData,
                    invoiceAmt,
                    taxAmount,
                    taxAmountAmt: sub(formData.currPaymentAmt, taxAmount),
                  },
                  invoiceVerDetail: newInvoiceVerDetail,
                },
              });
            }
          }
        }
      });
    } else {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          invoiceVerDetail: update(invoiceVerDetail, {
            [rowIndex]: {
              [rowField]: {
                $set: val,
              },
            },
          }),
        },
      });
    }
  };

  const columnsList = [
    {
      title: '??????',
      dataIndex: 'id',
      className: 'text-center',
      width: 100,
      render: (value, record, index) => index + 1,
    },
    {
      title: `${pageFieldJson.invoiceNo.displayName}`,
      sortNo: `${pageFieldJson.invoiceNo.sortNo}`,
      key: 'invoiceNo',
      dataIndex: 'invoiceNo',
      className: 'text-center',
      width: 300,
      options: {
        rules: [
          {
            required: true,
            message: `?????????${pageFieldJson.invoiceNo.displayName}`,
          },
        ],
      },
      render: (value, row, index) => (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div>
            <Select
              defaultValue={row.searchType}
              disabled={readOnly}
              onChange={onCellChanged(index, 'searchType')}
            >
              <Option value="1">??????</Option>
              <Option value="2">??????</Option>
            </Select>
          </div>
          <div style={{ width: '100%', flex: 1 }}>
            {row.searchType === '1' ? (
              <AsyncSelect
                source={() =>
                  getPaymentApplyInvoices({ type: 1, invoiceNo: '1' }).then(
                    resp => resp.response.datum
                  )
                }
                value={value}
                showSearch
                disabled={readOnly}
                filterOption={(input, option) =>
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                placeholder="??????????????????"
                onChange={onCellChanged(index, 'invoiceNo')}
              />
            ) : (
              <InvoicesSelect
                invoiceNo={row.invoiceNo || '2'}
                value={value}
                disabled={readOnly}
                onChange={onCellChanged(index, 'invoiceNo')}
              />
            )}
          </div>
        </div>
      ),
    },

    {
      title: `${pageFieldJson.theAmt.displayName}`,
      sortNo: `${pageFieldJson.theAmt.sortNo}`,
      dataIndex: 'theAmt',
      key: 'theAmt',
      className: 'text-right',
      width: 200,
      render: (value, row, index) => (
        <Input
          className="x-fill-100"
          disabled={readOnly}
          value={value}
          onChange={onCellChanged(index, 'theAmt')}
        />
      ),
    },
    {
      title: `${pageFieldJson.invoiceAmt.displayName}`,
      sortNo: `${pageFieldJson.invoiceAmt.sortNo}`,
      dataIndex: 'invoiceAmt',
      className: 'text-right',
      key: 'invoiceAmt',
      width: 200,
    },
    {
      title: `${pageFieldJson.writtenOffAmt.displayName}`,
      sortNo: `${pageFieldJson.writtenOffAmt.sortNo}`,
      dataIndex: 'writtenOffAmt',
      key: 'writtenOffAmt',
      className: 'text-right',
      width: 200,
    },
    {
      title: `${pageFieldJson.rate.displayName}`,
      sortNo: `${pageFieldJson.rate.sortNo}`,
      dataIndex: 'rate',
      key: 'rate',
      width: 150,
    },
    {
      title: `${pageFieldJson.invoiceTypeName.displayName}`,
      sortNo: `${pageFieldJson.invoiceTypeName.sortNo}`,
      dataIndex: 'invoiceTypeName',
      className: 'text-center',
      key: 'invoiceTypeName',
      width: 150,
    },
    {
      title: `${pageFieldJson.inspectionName.displayName}`,
      sortNo: `${pageFieldJson.inspectionName.sortNo}`,
      dataIndex: 'inspectionName',
      key: 'inspectionName',
      className: 'text-center',
      width: 200,
    },
    {
      title: `${pageFieldJson.invoiceDate.displayName}`,
      sortNo: `${pageFieldJson.invoiceDate.sortNo}`,
      dataIndex: 'invoiceDate',
      className: 'text-center',
      key: 'invoiceDate',
      width: 200,
    },
    {
      title: `${pageFieldJson.invoiceCode.displayName}`,
      sortNo: `${pageFieldJson.invoiceCode.sortNo}`,
      dataIndex: 'invoiceCode',
      className: 'text-center',
      key: 'invoiceCode',
      width: 200,
    },
  ];
  const columnsFilterList = columnsList.filter(
    field => !field.key || pageFieldJson[field.key].visibleFlag === 1
  );

  const tableProps = {
    readOnly,
    rowKey: 'id',
    showCopy: false,
    // loading: loading.effects[`${DOMAIN}/queryPurchase`],
    pagination: false,
    scroll: {
      x: 1700,
    },
    dataSource: invoiceVerDetail,
    // rowSelection: {
    //   getCheckboxProps: record => ({
    //     disabled: record.lineNo === -1,
    //   }),
    // },
    onAdd: newRow => {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          invoiceVerDetail: [
            ...invoiceVerDetail,
            {
              ...newRow,
              searchType: '1',
              id: genFakeId(-1),
            },
          ],
        },
      });
    },
    onDeleteItems: (_, selectedRows) => {
      const deleteIds = selectedRows.map(row => row.id);
      const newList = invoiceVerDetail.filter(({ id }) => !deleteIds.includes(id));
      let invoiceNo = [];
      let invoiceAmt = 0;
      let taxAmount = 0;
      newList.map((item, index) => {
        invoiceNo.push(item.invoiceNo);
        invoiceAmt = mathAdd(item.theAmt, invoiceAmt);
        taxAmount = mathAdd(
          taxAmount,
          ((item.deductTax / item.invoiceAmt).toFixed(10) * item.theAmt).toFixed(2)
        );
      });
      form.setFieldsValue({
        invoiceNo: invoiceNo.join(','),
        rate: CalculateRate(newList),
        invoiceAmt,
        taxAmount,
        taxAmountAmt: sub(formData.currPaymentAmt, taxAmount),
      });
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          formData: {
            ...formData,
            invoiceAmt,
            invoiceNo: invoiceNo.join(','),
            rate: CalculateRate(newList),
            taxAmount,
            taxAmountAmt: sub(formData.currPaymentAmt, taxAmount),
          },
          invoiceVerDetail: newList,
        },
      });
    },
    columns: columnsFilterList,
  };
  return tableProps;
}

export function payDetailTableProps(
  DOMAIN,
  dispatch,
  loading,
  form,
  docTypeMode, // ??????????????????????????????????????????????????????
  readOnly,
  paymentApplyDetail
) {
  const { payDetailList, pageConfig, fieldsConfig, formData } = paymentApplyDetail;
  const pageFieldJson = {};
  if (pageConfig) {
    if (pageConfig.pageBlockViews && pageConfig.pageBlockViews.length > 1) {
      const currentBlockConfig =
        pageConfig.pageBlockViews &&
        pageConfig.pageBlockViews.filter(item => item.blockKey === 'PAYMENT_PLAN')[0];
      const { pageFieldViews } = currentBlockConfig;
      pageFieldViews.forEach(field => {
        pageFieldJson[field.fieldKey] = field;
      });
    }
  }
  const onCellChanged = (rowIndex, rowField) => rowFieldValue => {
    const val = rowFieldValue && rowFieldValue.target ? rowFieldValue.target.value : rowFieldValue;
    if (rowField === 'currentPaymentAmt') {
      let currPaymentAmt = 0;
      // const newVal = typeof val === 'number' ? val : 0;
      const newVal = val;
      let newPayDetailList = update(payDetailList, {
        [rowIndex]: {
          [rowField]: {
            $set: newVal,
          },
        },
      });
      newPayDetailList.map((item, index) => {
        if (index === rowIndex) {
          if (typeof newVal === 'number') {
            if (formData.docType === 'CONTRACT' && newVal > item.paymentAmt) {
              createMessage({
                type: 'error',
                description: '????????????????????????????????????????????????',
              });
            } else {
              newPayDetailList.map(t => {
                currPaymentAmt = mathAdd(currPaymentAmt, t.currentPaymentAmt);
              });
              form.setFieldsValue({
                currPaymentAmt,
                taxAmountAmt: sub(currPaymentAmt, formData.taxAmount || 0),
                restAmt: sub(sub(currPaymentAmt, formData.taxAmount || 0), formData.depAmt || 0),
              });
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  formData: {
                    ...formData,
                    currPaymentAmt,
                    taxAmountAmt: sub(currPaymentAmt, formData.taxAmount || 0),
                    restAmt: sub(
                      sub(currPaymentAmt, formData.taxAmount || 0),
                      formData.depAmt || 0
                    ),
                  },
                  payDetailList: newPayDetailList,
                },
              });
            }
          }
        }
      });
    } else {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          payDetailList: update(payDetailList, {
            [rowIndex]: {
              [rowField]: {
                $set: val,
              },
            },
          }),
        },
      });
    }
  };
  const pageFieldMode = fieldMode => {
    console.info('pageFieldMode' + sceneval);
    const isEdit =
      fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`
        ? true
        : fieldMode === 'UNEDITABLE';
    return isEdit;
  };
  const columnsList = [
    {
      title: '??????',
      dataIndex: 'id',
      className: 'text-center',
      width: 20,
      render: (value, record, index) => index + 1,
    },
    {
      title: `${pageFieldJson.paymentStage.displayName}`,
      sortNo: `${pageFieldJson.paymentStage.sortNo}`,
      key: 'paymentStage',
      dataIndex: 'paymentStage',
      className: 'text-center',
      width: 200,
      render: (value, row, index) => (
        <Input
          className="x-fill-100"
          value={value}
          disabled={
            fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`
              ? true
              : formData.docType === 'CONTRACT'
                ? true
                : false
          }
          placeholder={`?????????${pageFieldJson.paymentStage.displayName}`}
          onChange={onCellChanged(index, 'paymentStage')}
        />
      ),
    },
    {
      title: `${pageFieldJson.currentPaymentAmt.displayName}`,
      sortNo: `${pageFieldJson.currentPaymentAmt.sortNo}`,
      key: 'currentPaymentAmt',
      dataIndex: 'currentPaymentAmt',
      className: 'text-right',
      width: 200,
      render: (value, row, index) => (
        <InputNumber
          className="x-fill-100"
          value={value}
          disabled={pageFieldMode(pageFieldJson.currentPaymentAmt.fieldMode)}
          placeholder={`?????????${pageFieldJson.currentPaymentAmt.displayName}`}
          onChange={onCellChanged(index, 'currentPaymentAmt')}
        />
      ),
    },
    {
      title: `${pageFieldJson.paymentAmt.displayName}`,
      sortNo: `${pageFieldJson.paymentAmt.sortNo}`,
      key: 'paymentAmt',
      dataIndex: 'paymentAmt',
      className: 'text-center',
      width: 200,
    },
    {
      title: `${pageFieldJson.docTypeName.displayName}`,
      sortNo: `${pageFieldJson.docTypeName.sortNo}`,
      key: 'docTypeName',
      dataIndex: 'docTypeName',
      className: 'text-center',
      width: 200,
    },
    {
      title: `${pageFieldJson.contractNo.displayName}`,
      sortNo: `${pageFieldJson.contractNo.sortNo}`,
      key: 'contractNo',
      dataIndex: 'contractNo',
      className: 'text-center',
      width: 200,
      render: (value, row, index) => {
        return value ? (
          <Link
            className="tw-link"
            to={getLink('TSK:DOC_TYPE', row.docType, { id: row.contractId })}
          >
            {value}
          </Link>
        ) : (
          value
        );
      },
    },
    {
      title: `${pageFieldJson.paymentDate.displayName}`,
      sortNo: `${pageFieldJson.paymentDate.sortNo}`,
      key: 'paymentDate',
      dataIndex: 'paymentDate',
      className: 'text-center',
      width: 200,
      render: (value, row, index) => {
        return (
          <DatePicker
            format="YYYY-MM-DD"
            disabled={pageFieldMode(pageFieldJson.paymentDate.fieldMode)}
            value={value ? moment(value) : ''}
            className="x-fill-100"
            onChange={onCellChanged(index, 'paymentDate')}
            placeholder={`?????????${pageFieldJson.paymentDate.displayName}`}
          />
        );
      },
    },
    {
      title: `${pageFieldJson.milestoneName.displayName}`,
      sortNo: `${pageFieldJson.milestoneName.sortNo}`,
      dataIndex: 'milestoneName',
      className: 'text-center',
      width: 200,
    },
    {
      title: `${pageFieldJson.contractNodeName.displayName}`,
      sortNo: `${pageFieldJson.contractNodeName.sortNo}`,
      dataIndex: 'contractNodeName',
      className: 'text-center',
      width: 200,
    },
  ];
  const columnsFilterList = columnsList.filter(
    field => !field.key || pageFieldJson[field.key].visibleFlag === 1
  );
  const tableProps = {
    readOnly:
      fieldsConfig.taskKey !== `${FLOW_NO[sceneval]}_01_SUBMIT_i`
        ? true
        : formData.docType === 'CONTRACT'
          ? true
          : false,
    rowKey: 'id',
    showCopy: false,
    // loading: loading.effects[`${DOMAIN}/queryPurchase`],
    pagination: false,
    scroll: {
      x: 1500,
    },
    dataSource: payDetailList || [],
    onAdd: newRow => {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          payDetailList: [
            ...payDetailList,
            {
              ...newRow,
              id: genFakeId(-1),
              currentPaymentAmt: 0,
              contractNo: formData.docNo,
            },
          ],
        },
      });
    },
    onDeleteItems: (_, selectedRows) => {
      const deleteIds = selectedRows.map(row => row.id);
      const newList = payDetailList.filter(({ id }) => !deleteIds.includes(id));
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          payDetailList: newList,
        },
      });
    },
    columns: columnsFilterList,
  };
  return tableProps;
}
