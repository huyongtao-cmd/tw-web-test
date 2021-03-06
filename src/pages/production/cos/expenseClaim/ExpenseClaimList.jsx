import React from 'react';
import { connect } from 'dva';
import SearchFormItem from '@/components/production/business/SearchFormItem.tsx';
import Link from '@/components/production/basic/Link.tsx';
import PageWrapper from '@/components/production/layout/PageWrapper.tsx';
import SearchTable from '@/components/production/business/SearchTable.tsx';
import message from '@/components/production/layout/Message';
// @ts-ignore
import {
  expenseClaimListPaging,
  expenseClaimLogicalDelete,
  expenseClaimFinishPay,
} from '@/services/production/cos';
import router from 'umi/router';
import { fromQs } from '@/utils/production/stringUtil.ts';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { isEmpty } from 'ramda';
import createMessage from '@/components/core/AlertMessage';
import moment from 'moment';
import { remindString } from '@/components/production/basic/Remind.tsx';
import { Modal } from 'antd';
import FormItem from '@/components/production/business/FormItem.tsx';

const DOMAIN = 'expenseClaimList';
const docTypeMap = { REGULAR: 'regular', WELFARE: 'welfare', TRIP: 'trip', LOAN: 'loan' };

@connect(({ loading, dispatch, expenseClaimList }) => ({
  // treeLoading: loading.effects[`${DOMAIN}/init`],
  dispatch,
  ...expenseClaimList,
}))
class ExpenseClaimList extends React.PureComponent {
  state = {
    payModalVisible: false,
    payBatchNo: undefined,
    date: moment().format('YYYY-MM-DD'),
  };

  componentDidMount() {
    // outputHandle(expenseQuotaFindQuotas, [
    //   { busiAccItemId: 5, quotaDimension1Value: 'L2', quotaDimension2Value: '02' },
    // ]).then(data => {
    //   console.log(data);
    // });
  }

  fetchData = async params => {
    const wrappedParam = { ...params };
    if (params.createTime) {
      [wrappedParam.createTimeStart, wrappedParam.createTimeEnd] = params.createTime;
      delete wrappedParam.createTime;
    }
    if (params.paymentDate) {
      [wrappedParam.paymentDateStart, wrappedParam.paymentDateEnd] = params.paymentDate;
      delete wrappedParam.paymentDate;
    }
    const { data } = await outputHandle(expenseClaimListPaging, wrappedParam);
    return data;
  };

  deleteData = async keys =>
    outputHandle(expenseClaimLogicalDelete, { keys: keys.join(',') }, undefined, false);

  // ??????model???state
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  // ??????model???????????????
  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  renderSearchForm = () => [
    <SearchFormItem key="expenseNo" fieldKey="expenseNo" label="????????????" fieldType="BaseInput" />,
    <SearchFormItem
      key="createTime"
      label="????????????"
      fieldType="BaseDateRangePicker"
      fieldKey="createTime"
    />,
    <SearchFormItem
      key="paymentDate"
      label="????????????"
      fieldType="BaseDateRangePicker"
      fieldKey="paymentDate"
    />,
    <SearchFormItem
      key="chargeClassification"
      label="????????????"
      fieldType="BaseCustomSelect"
      parentKey="CUS:CHARGE_CLASSIFICATION"
      fieldKey="chargeClassification"
    />,
    <SearchFormItem
      key="expenseClaimStatus"
      label="???????????????"
      fieldType="BaseSelect"
      parentKey="COS:EXPENSE_CLAIM_STATUS"
      fieldKey="expenseClaimStatus"
    />,
    <SearchFormItem
      label="????????????"
      fieldKey="expenseDocType"
      key="expenseDocType"
      fieldType="BaseCustomSelect"
      parentKey="CUS:EXPENSE_DOC_TYPE"
    />,
    <SearchFormItem
      label="??????????????????"
      fieldKey="chargeProjectId"
      key="chargeProjectId"
      fieldType="ProjectSimpleSelect"
      parentKey="CUS:PROJECT_CLASS2"
    />,
    <SearchFormItem
      label="??????????????????"
      fieldKey="chargeBuId"
      key="chargeBuId"
      fieldType="BuSimpleSelect"
      parentKey="PRO:PROJECT_STATUS"
    />,
    <SearchFormItem
      label="??????????????????"
      fieldKey="chargeCompany"
      key="chargeCompany"
      fieldType="BaseUdcSelect"
      udcCode="CUS:INTERNAL_COMPANY"
    />,
    <SearchFormItem
      key="relatedBudgetId"
      label="????????????"
      fieldType="BudgetSimpleSelect"
      fieldKey="relatedBudgetId"
    />,
    <SearchFormItem
      key="expenseClaimResId"
      label="?????????"
      fieldType="ResSimpleSelect"
      fieldKey="expenseClaimResId"
    />,
    <SearchFormItem
      key="createUserId"
      label="?????????"
      fieldType="UserSimpleSelect"
      fieldKey="createUserId"
    />,
    <SearchFormItem
      key="paymentBatch"
      label="???????????????"
      fieldType="BaseInput"
      fieldKey="paymentBatch"
    />,
  ];

  handleCancel = () => {
    this.setState({ payModalVisible: false });
  };

  handleOk = async () => {
    const { date, payBatchNo, getInternalState } = this.state;
    this.setState({ payModalVisible: false });
    await outputHandle(expenseClaimFinishPay, { date, payBatchNo });
    getInternalState().refreshData();
    message({ type: 'success', content: '????????????' });
  };

  render() {
    const { form, treeLoading, formData, formMode, selectionList, ...rest } = this.props;
    const { payModalVisible, date, payBatchNo } = this.state;

    const columns = [
      {
        title: '????????????',
        key: 'expenseNo',
        dataIndex: 'expenseNo',
        sorter: true,
        render: (value, row) => (
          <Link
            onClick={() =>
              router.push(
                `/workTable/cos/${docTypeMap[row.expenseDocType]}ExpenseDisplay?id=${
                  row.id
                }&mode=DESCRIPTION`
              )
            }
          >
            {value}
          </Link>
        ),
      },
      {
        title: '???????????????',
        key: 'paymentBatch',
        dataIndex: 'paymentBatch',
      },
      {
        title: '???????????????',
        key: 'expenseClaimStatusDesc',
        dataIndex: 'expenseClaimStatusDesc',
      },
      {
        title: '?????????',
        key: 'expenseClaimResName',
        dataIndex: 'expenseClaimResName',
      },
      {
        title: '????????????',
        key: 'expenseDocTypeDesc',
        dataIndex: 'expenseDocTypeDesc',
      },
      {
        title: '????????????',
        key: 'originalCurrencyAmt',
        dataIndex: 'originalCurrencyAmt',
      },
      {
        title: '????????????',
        key: 'originalCurrencyDesc',
        dataIndex: 'originalCurrencyDesc',
      },
      {
        title: '????????????',
        key: 'paymentAmt',
        dataIndex: 'paymentAmt',
      },
      {
        title: '????????????',
        key: 'paymentCurrencyDesc',
        dataIndex: 'paymentCurrencyDesc',
      },
      {
        title: '????????????',
        key: 'createTime',
        dataIndex: 'createTime',
      },
      {
        title: '????????????',
        key: 'accountingDate',
        dataIndex: 'accountingDate',
      },
      {
        title: '????????????',
        key: 'paymentDate',
        dataIndex: 'paymentDate',
      },
      {
        title: '????????????',
        key: 'chargeClassificationDesc',
        dataIndex: 'chargeClassificationDesc',
      },
      {
        title: '??????????????????',
        key: 'chargeProjectIdDesc',
        dataIndex: 'chargeProjectIdDesc',
      },
      {
        title: '??????????????????',
        key: 'chargeBuIdDesc',
        dataIndex: 'chargeBuIdDesc',
      },
      {
        title: '??????????????????',
        key: 'chargeCompanyDesc',
        dataIndex: 'chargeCompanyDesc',
      },
      {
        title: '????????????',
        key: 'relatedBudgetIdDesc',
        dataIndex: 'relatedBudgetIdDesc',
      },
      {
        title: '?????????',
        key: 'createUserName',
        dataIndex: 'createUserName',
      },
    ];

    return (
      <PageWrapper>
        <SearchTable
          searchTitle={undefined}
          defaultAdvancedSearch={false}
          showSearchCardTitle={false}
          searchForm={this.renderSearchForm()}
          defaultSearchForm={{}}
          defaultSortBy="id"
          defaultSortDirection="DESC"
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          fetchData={this.fetchData}
          columns={columns}
          // deleteData={this.deleteData}
          extraButtons={[
            {
              key: 'paymentExport',
              title: '????????????',
              type: 'primary',
              size: 'large',
              loading: false,
              cb: internalState => {
                const { selectedRowKeys, selectedRows, refreshData } = internalState;
                const findFalseList = selectedRows.filter(
                  v => v.expenseClaimStatus !== 'WAITING_TO_PAY' || !isEmpty(v.paymentBatch)
                );
                if (!isEmpty(findFalseList)) {
                  createMessage({
                    type: 'warn',
                    description: remindString({
                      remindCode: '',
                      defaultMessage: '??????????????????????????????????????????????????????????????????',
                    }),
                  });
                  return;
                }
                // eslint-disable-next-line no-restricted-globals
                location.href = `${SERVER_URL}/api/production/cos/expenseClaim/payExport?keys=${selectedRowKeys.join(
                  ','
                )}`;
                // const myRequest = new Request('http://localhost/api', {method: 'POST', body: '{"foo":"bar"}'});
                //
                // const myURL = myRequest.url; // http://localhost/api
                // const myMethod = myRequest.method; // POST
                // const myCred = myRequest.credentials; // omit
                // const bodyUsed = myRequest.bodyUsed;
              },
              disabled: internalState => {
                const { selectedRowKeys, selectedRows } = internalState;
                return selectedRowKeys.length < 1;
              },
            },
            {
              key: 'completePayment',
              title: '????????????',
              type: 'primary',
              size: 'large',
              loading: false,
              cb: internalState => {
                const { selectedRowKeys, selectedRows } = internalState;
                this.setState({ payModalVisible: true });
                // this.setState({
                //   visible: true,
                // });
              },
            },
            {
              key: 'advancedModification',
              title: '????????????',
              type: 'primary',
              size: 'large',
              loading: false,
              cb: internalState => {
                const { selectedRowKeys } = internalState;
                router.push(
                  `/workTable/cos/regularExpenseDisplay?id=${
                    selectedRowKeys[0]
                  }&mode=EDIT&currentNode=advanceEdit`
                );
              },
              disabled: internalState => {
                const { selectedRowKeys } = internalState;
                return selectedRowKeys.length !== 1;
              },
            },
          ]}
        />
        <Modal
          title="??????????????????"
          visible={payModalVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <FormItem
            label="????????????"
            fieldType="BaseDatePicker"
            value={date}
            onChange={value => {
              this.setState({ date: value });
            }}
          />
          <FormItem
            label="???????????????"
            fieldType="BaseInput"
            value={payBatchNo}
            onChange={value => {
              this.setState({ payBatchNo: value });
            }}
          />
        </Modal>
      </PageWrapper>
    );
  }
}

export default ExpenseClaimList;
