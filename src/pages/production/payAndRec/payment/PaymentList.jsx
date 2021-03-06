import React from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { isNil } from 'ramda';
import SearchFormItem from '@/components/production/business/SearchFormItem.tsx';
import Link from '@/components/production/basic/Link.tsx';
import PageWrapper from '@/components/production/layout/PageWrapper.tsx';
import SearchTable from '@/components/production/business/SearchTable.tsx';
import message from '@/components/production/layout/Message';
// @ts-ignore
import { paymentRequestListPagingUri } from '@/services/production/pur';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { remindString } from '@/components/production/basic/Remind.tsx';
import { handleEmptyProps } from '@/utils/production/objectUtils.ts';

class paymentApplyList extends React.PureComponent {
  componentDidMount() {}

  fetchData = async params => {
    let wrappedParam = { ...params };
    //expectedPaymentDateRange  actualPaymentDateRange createDateRange
    if (params.expectedPaymentDateRange) {
      [
        wrappedParam.expectedPaymentDateFrom,
        wrappedParam.expectedPaymentDateTo,
      ] = params.expectedPaymentDateRange;
      delete wrappedParam.expectedPaymentDateRange;
    }
    if (params.actualPaymentDateRange) {
      [
        wrappedParam.actualPaymentDateFrom,
        wrappedParam.actualPaymentDateTo,
      ] = params.actualPaymentDateRange;
      delete wrappedParam.actualPaymentDateRange;
    }
    if (params.createDateRange) {
      [wrappedParam.createDateFrom, wrappedParam.createDateTo] = params.createDateRange;
      delete wrappedParam.createDateRange;
    }
    wrappedParam = handleEmptyProps(wrappedParam);
    const { data } = await outputHandle(paymentRequestListPagingUri, wrappedParam);
    return data;
  };

  renderSearchForm = () => [
    <SearchFormItem
      key="paymentOrderNameOrNo"
      fieldType="BaseInput"
      label="付款单编号/名称"
      fieldKey="paymentOrderNameOrNo"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="supplierId"
      fieldType="SupplierSimpleSelect"
      label="供应商"
      fieldKey="supplierId"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="paymentRequestStatus"
      fieldType="BaseSelect"
      label="付款申请状态"
      fieldKey="paymentRequestStatus"
      defaultShow
      advanced
      parentKey="PUR:PAYMENT_REQUEST_STATUS"
    />,
    <SearchFormItem
      key="chargeProjectId"
      fieldType="ProjectSimpleSelect"
      label="费用承担项目"
      fieldKey="chargeProjectId"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="chargeBuId"
      fieldType="BuSimpleSelect"
      label="费用承担部门"
      fieldKey="chargeBuId"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="chargeCompany"
      defaultShow
      advanced
      fieldType="BaseCustomSelect"
      label="费用承担公司"
      fieldKey="chargeCompany"
      parentKey="CUS:INTERNAL_COMPANY"
    />,
    <SearchFormItem
      key="originalCurrency"
      fieldType="BaseSelect"
      label="付款币种"
      fieldKey="originalCurrency"
      defaultShow
      advanced
      parentKey="COMMON_CURRENCY"
    />,
    <SearchFormItem
      key="originalCurrencyAmtFrom"
      fieldType="BaseInputAmt"
      label="付款金额起"
      fieldKey="originalCurrencyAmtFrom"
      defaultShow
    />,
    <SearchFormItem
      key="originalCurrencyAmtTo"
      fieldType="BaseInputAmt"
      label="付款金额止"
      fieldKey="originalCurrencyAmtTo"
      defaultShow
    />,
    <SearchFormItem
      key="expectedPaymentDateRange"
      fieldType="BaseDateRangePicker"
      label="期望付款日期"
      fieldKey="expectedPaymentDateRange"
      defaultShow
    />,
    <SearchFormItem
      key="actualPaymentDateRange"
      fieldType="BaseDateRangePicker"
      label="实际付款日期起"
      fieldKey="actualPaymentDateRange"
      defaultShow
    />,
    <SearchFormItem
      key="createUserId"
      fieldType="UserSimpleSelect"
      label="创建人"
      fieldKey="createUserId"
      defaultShow
    />,
    <SearchFormItem
      key="createDateRange"
      fieldType="BaseDateRangePicker"
      label="创建时间"
      fieldKey="createDateRange"
      defaultShow
    />,
  ];

  render() {
    const { form, treeLoading, formData, formMode, selectionList, ...rest } = this.props;

    const columns = [
      {
        title: '付款单编号',
        dataIndex: 'paymentOrderNo',
        ellipsis: true,
        sorter: true,
        render: (value, row, index) => (
          <Link
            onClick={() =>
              router.push(`/workTable/pur/paymentRequestDisplayPage?id=${row.id}&mode=DESCRIPTION`)
            }
          >
            {value}
          </Link>
        ),
      },
      {
        title: '付款单名称',
        dataIndex: 'paymentOrderName',
        ellipsis: true,
        sorter: true,
      },
      {
        title: '付款申请状态',
        dataIndex: 'paymentRequestStatusDesc',
        ellipsis: true,
      },
      {
        title: '付款金额',
        dataIndex: 'originalCurrencyAmt',
        render: (value, record, index) => (isNil(value) ? '' : value.toFixed(2)),
      },
      {
        title: '付款币种',
        dataIndex: 'originalCurrencyDesc',
        ellipsis: true,
      },
      {
        title: '期望付款日期',
        dataIndex: 'expectedPaymentDate',
        ellipsis: true,
      },
      {
        title: '实际付款日期',
        dataIndex: 'actualPaymentDate',
        ellipsis: true,
      },
      {
        title: '供应商',
        dataIndex: 'supplierName',
        ellipsis: true,
      },
      {
        title: '费用承担项目',
        dataIndex: 'chargeProjectName',
        ellipsis: true,
      },
      {
        title: '费用承担部门',
        dataIndex: 'chargeBuName',
        ellipsis: true,
      },
      {
        title: '费用承担公司',
        dataIndex: 'chargeCompanyDesc',
        ellipsis: true,
      },
      {
        title: '创建人',
        dataIndex: 'createUserName',
        ellipsis: true,
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        ellipsis: true,
      },
    ];

    return (
      <PageWrapper>
        <SearchTable
          searchTitle={undefined}
          defaultAdvancedSearch={false}
          showSearchCardTitle={false}
          defaultSortBy="id"
          defaultSortDirection="DESC"
          searchForm={this.renderSearchForm()}
          defaultSearchForm={{}}
          fetchData={this.fetchData}
          columns={columns}
          tableExtraProps={{ scroll: { x: 2400 } }}
          // onAddClick={() => router.push('/workTable/pur/purchaseDisplayPage?mode=EDIT')}
          onEditClick={data => {
            // console.log(data);
            if (data.paymentRequestStatus === 'CREATE') {
              router.push(`/workTable/payAndReceive/paymentApplyDisplay?id=${data.id}&mode=EDIT`);
            } else {
              message({
                type: 'error',
                content: remindString({
                  remindCode: 'COM:E:ALLOW_MODIFY_CHECK',
                  defaultMessage: '仅“新建”状态允许修改',
                }),
              });
            }
          }}
          // deleteData={this.deleteData}
          extraButtons={[
            {
              key: 'paymentRequest',
              title: '关联发票',
              type: 'info',
              size: 'large',
              loading: false,
              cb: internalState => {
                // console.log(internalState);
                const { selectedRows } = internalState;
              },
              disabled: internalState => {
                const { selectedRowKeys } = internalState;
                return selectedRowKeys.length === 0;
              },
            },
          ]}
        />
      </PageWrapper>
    );
  }
}

export default paymentApplyList;
