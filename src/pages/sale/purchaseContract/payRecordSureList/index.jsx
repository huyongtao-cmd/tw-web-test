import React, { PureComponent } from 'react';
import { connect } from 'dva';
import Link from 'umi/link';
import moment from 'moment';
import { Input, Tooltip } from 'antd';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker } from '@/pages/gen/field';
import { selectAbOus } from '@/services/gen/list';
import createMessage from '@/components/core/AlertMessage';
import { add as mathAdd } from '@/utils/mathUtils';

const DOMAIN = 'payRecordSureList';

const PAYMENT_APPLY_TYPE = {
  CONTRACT: 'paymentApplyList',
  AGREEMENT: 'paymentApplyList',
  ADVANCEPAY: 'prePaymentApply', // 预付款
  ADVANCEPAYWRITEOFF: 'prePayWriteOff', // 付款核销
  SALARYPAYMENT: 'paymentApplyList',
  OTHERPAYMENT: 'paymentApplyList',
};

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];
@connect(({ loading, payRecordSureList, dispatch, global }) => ({
  payRecordSureList,
  loading,
  dispatch,
  global,
}))
class PayRecordListCashier extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sumAmt: undefined,
    };
  }

  componentDidMount() {
    this.fetchData({
      offset: 0,
      limit: 10,
      sortBy: 'id',
      sortDirection: 'DESC',
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        node: 3,
      },
    });
  };

  // 行编辑触发事件
  onCellChanged = (index, value, name) => {
    const {
      payRecordSureList: { list },
      dispatch,
    } = this.props;

    const newDataSource = list;
    newDataSource[index] = {
      ...newDataSource[index],
      [name]: value,
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { list: newDataSource },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      payRecordSureList: { list = [], total = 0, searchForm },
      global: { userList },
    } = this.props;

    const tableLoading = loading.effects[`${DOMAIN}/query`];
    const { sumAmt } = this.state;
    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: {
        x: 4500,
      },
      loading: tableLoading,
      total,
      dataSource: list,
      enableSelection: true,
      onRowChecked: (selectedRowKeys, selectedRows) => {
        const sumPaymentAmt = selectedRows.reduce((sum, row) => mathAdd(sum, row.paymentAmt), 0);
        this.setState({
          sumAmt: sumPaymentAmt,
        });
      },
      onChange: filters => this.fetchData(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchForm,
      searchBarForm: [
        {
          title: '流水号',
          dataIndex: 'paySerialsNum',
          options: {
            initialValue: searchForm.paySerialsNum || undefined,
          },
          tag: <Input placeholder="请输入流水号" />,
        },
        {
          title: '付款申请单编号',
          dataIndex: 'paymentNo',
          options: {
            initialValue: searchForm.paymentNo || undefined,
          },
          tag: <Input placeholder="请输入付款申请单编号" />,
        },
        {
          title: '申请人',
          dataIndex: 'applicationUserId',
          options: {
            initialValue: searchForm.applicationUserId,
          },
          tag: (
            <Selection.Columns
              className="x-fill-100"
              source={userList}
              columns={particularColumns}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              dropdownMatchSelectWidth
              showSearch
              onColumnsChange={value => {}}
              placeholder="请选择创建人"
            />
          ),
        },
        {
          title: '付款公司',
          dataIndex: 'psubjecteCompany',
          options: {
            initialValue: searchForm.psubjecteCompany,
          },
          tag: (
            <Selection
              className="x-fill-100"
              source={() => selectAbOus()}
              transfer={{ key: 'code', code: 'code', name: 'name' }}
              dropdownMatchSelectWidth
              showSearch
              onColumnsChange={value => {}}
              placeholder="请选择付款公司"
            />
          ),
        },
        {
          title: '供应商',
          dataIndex: 'supplierLegalNo',
          options: {
            initialValue: searchForm.supplierLegalNo,
          },
          tag: (
            <Selection
              className="x-fill-100"
              source={() => selectAbOus()}
              transfer={{ key: 'code', code: 'code', name: 'name' }}
              dropdownMatchSelectWidth
              showSearch
              onColumnsChange={value => {}}
              placeholder="请选择付款公司"
            />
          ),
        },
        {
          title: '付款事由',
          dataIndex: 'paymentNote',
          options: {
            initialValue: searchForm.paymentNote || undefined,
          },
          tag: <Input placeholder="请输入付款事由" />,
        },
        {
          title: '付款单备注',
          dataIndex: 'note',
          options: {
            initialValue: searchForm.note || undefined,
          },
          tag: <Input placeholder="请输入付款单备注" />,
        },
        {
          title: '状态',
          dataIndex: 'state',
          options: {
            initialValue: searchForm.state || undefined,
          },
          tag: (
            <Selection.UDC
              code="TSK:PAYMENT_SLIP_STATUS"
              filters={[{ sphd1: '出纳' }]}
              placeholder="请选择付款记录单状态"
            />
          ),
        },
        {
          title: '付款日期',
          dataIndex: 'createTime',
          options: {
            initialValue: searchForm.createTime,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
      ],
      columns: [
        {
          title: '流水号',
          dataIndex: 'paySerialsNum',
          align: 'center',
          width: 150,
        },
        {
          title: '付款申请单',
          dataIndex: 'paymentNo',
          align: 'center',
          width: 150,
          render: (val, row, index) => (
            <Link
              className="tw-link"
              to={`/sale/purchaseContract/${
                PAYMENT_APPLY_TYPE[row.paymentApplicationType]
              }/edit?mode=view&id=${row.paymentApplyId}`}
            >
              {val}
            </Link>
          ),
        },
        {
          title: '付款申请单名称',
          dataIndex: 'purchaseName',
          align: 'left',
          width: 200,
          render: (value, row, key) =>
            value && value.length > 20 ? (
              <Tooltip placement="left" title={<pre>{value}</pre>}>
                <span>{`${value.substr(0, 20)}...`}</span>
              </Tooltip>
            ) : (
              <span>{value}</span>
            ),
        },
        {
          title: '付款事由',
          dataIndex: 'paymentNote',
          align: 'center',
          width: 200,
        },
        {
          title: '付款申请人',
          dataIndex: 'applicationUserName',
          align: 'center',
          width: 100,
        },
        {
          title: '付款金额',
          dataIndex: 'paymentAmt',
          align: 'right',
          width: 100,
        },
        {
          title: '货币',
          dataIndex: 'currCodeName',
          align: 'center',
          width: 100,
        },
        {
          title: '付款日期',
          dataIndex: 'purchaseDate',
          align: 'center',
          width: 150,
          render: (value, row, index) => (
            <DatePicker
              placeholder="请选择付款日期"
              format="YYYY-MM-DD"
              value={value}
              className="x-fill-100"
              onChange={e => {
                this.onCellChanged(index, e, 'purchaseDate');
              }}
              disabled
            />
          ),
        },
        {
          title: '实际付款日期',
          dataIndex: 'actualDate',
          align: 'center',
          width: 150,
          render: (value, row, index) => (
            <DatePicker
              placeholder="请选择付款日期"
              format="YYYY-MM-DD"
              value={value}
              className="x-fill-100"
              onChange={e => {
                this.onCellChanged(index, e, 'actualDate');
              }}
            />
          ),
        },
        {
          title: '应付会计备注',
          dataIndex: 'accountancyRemark',
          align: 'center',
          width: 200,
        },
        {
          title: '财务经理备注',
          dataIndex: 'financeRemark',
          align: 'center',
          width: 200,
        },
        {
          title: '出纳备注',
          dataIndex: 'cashierRemark',
          align: 'center',
          width: 200,
          render: (value, row, index) => (
            <Input
              placeholder="请输入出纳备注"
              value={value}
              className="x-fill-100"
              onChange={e => {
                this.onCellChanged(index, e.target.value, 'cashierRemark');
              }}
            />
          ),
        },
        {
          title: '状态',
          dataIndex: 'stateName',
          align: 'center',
          width: 200,
        },
        {
          title: '收款公司',
          dataIndex: 'collectionCompanyName',
          align: 'center',
          width: 300,
        },
        {
          title: '收款银行',
          dataIndex: 'collectionBank',
          align: 'center',
          width: 200,
        },
        {
          title: '收款账号',
          dataIndex: 'collectionAccNo',
          align: 'center',
          width: 300,
        },
        {
          title: '付款银行',
          dataIndex: 'psubjecteBank',
          align: 'center',
          width: 200,
        },

        {
          title: '付款账号',
          dataIndex: 'paymentAccountNo',
          align: 'center',
          width: 300,
        },
        {
          title: '付款公司',
          dataIndex: 'psubjecteCompanyName',
          align: 'center',
          width: 300,
        },
        {
          title: '科目说明(记账科目)',
          dataIndex: 'psubjecteThatName',
          align: 'center',
          width: 150,
        },
        {
          title: '付款方式',
          dataIndex: 'payMethodName',
          align: 'center',
          width: 100,
        },
        {
          title: '应付会计更新日期',
          dataIndex: 'accountancyTime',
          align: 'center',
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
          width: 200,
        },
        {
          title: '财务经理更新日期',
          dataIndex: 'financeTime',
          align: 'center',
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
          width: 200,
        },
        {
          title: '出纳更新日期',
          dataIndex: 'cashierTime',
          align: 'center',
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
          width: 200,
        },
      ],
      leftButtons: [
        {
          key: 'payment',
          className: 'tw-btn-primary',
          title: '确认付款',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const tt = selectedRows.filter(v => !v.actualDate);
            if (tt.length) {
              const ttIndex = selectedRows.findIndex(v => v.id === tt[0].id);
              createMessage({
                type: 'warn',
                description: `请将所选第${ttIndex + 1}条数据实际付款日期补全!`,
              });
              dispatch({
                type: `${DOMAIN}/updateSearchForm`,
                payload: {
                  selectedRowKeys: [],
                },
              });
              return;
            }
            dispatch({
              type: `${DOMAIN}/submitApply`,
              payload: {
                entities: selectedRows,
                action: 2,
                sourceOfRequest: 'chuNaList',
              },
            });
          },
        },
        {
          key: 'rejectToAccountant',
          className: 'tw-btn-primary',
          title: '驳回至应付会计',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            dispatch({
              type: `${DOMAIN}/submitApply`,
              payload: {
                entities: selectedRows,
                action: 4,
                sourceOfRequest: 'chuNaList',
              },
            });
          },
        },
        {
          key: 'rejectToFinancialManager',
          className: 'tw-btn-primary',
          title: '退回至财务经理',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            dispatch({
              type: `${DOMAIN}/submitApply`,
              payload: {
                entities: selectedRows,
                action: 3,
                sourceOfRequest: 'chuNaList',
              },
            });
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper title="付款记录确认列表 ( 出纳 )">
        {(sumAmt || sumAmt === 0) && (
          <div style={{ padding: '0 24px 0' }}>
            <p style={{ color: 'red' }}>
              合计金额：
              {sumAmt}元
            </p>
          </div>
        )}
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default PayRecordListCashier;
