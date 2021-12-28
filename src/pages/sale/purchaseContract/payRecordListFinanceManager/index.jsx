import React, { PureComponent } from 'react';
import Link from 'umi/link';
import { connect } from 'dva';
import moment from 'moment';
import { Card, Col, Input, Row, Tooltip } from 'antd';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker } from '@/pages/gen/field';
import { selectAbOus } from '@/services/gen/list';
import createMessage from '@/components/core/AlertMessage';
import { createConfirm } from '@/components/core/Confirm';
import api from '@/api';

const DOMAIN = 'payRecordListFinanceManager';

const PAYMENT_APPLY_TYPE = {
  CONTRACT: 'paymentApplyList',
  AGREEMENT: 'paymentApplyList',
  ADVANCEPAY: 'prePaymentApply', // 预付款
  ADVANCEPAYWRITEOFF: 'prePayWriteOff', // 付款核销
  SALARYPAYMENT: 'paymentApplyList',
  OTHERPAYMENT: 'paymentApplyList',
};

const {
  paymentSlipExcelExport, // 根据流水号 excel导出付款记录
} = api.sale.purchaseContract;

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];
@connect(({ loading, payRecordListFinanceManager, dispatch, global }) => ({
  payRecordListFinanceManager,
  loading,
  dispatch,
  global,
}))
class PayRecordListCashier extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      batchRemark: '',
      selectedKey: undefined,
    };
  }
  componentDidMount() {
    const param = {
      offset: 0,
      limit: 50,
      sortBy: 'id',
      sortDirection: 'DESC',
    };

    //右侧 业务数据
    this.fetchData(param);
  }

  //流水号统计列表
  fetchDataPaySerialsNum = params => {
    const {
      dispatch,
      //payRecordListFinanceManager: { searchForm },
    } = this.props;
    dispatch({
      type: `${DOMAIN}/selectPaySerialsNum`,
      payload: {
        ...params,
        node: 2,
      },
    });
  };

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        node: 2,
      },
    });
    //左侧 流水号统计列表
    this.fetchDataPaySerialsNum(params);
  };

  // 行编辑触发事件
  onCellChanged = (index, value, name) => {
    const {
      payRecordListFinanceManager: { list },
      dispatch,
    } = this.props;

    const newDataSource = list;
    newDataSource[index] = {
      ...newDataSource[index],
      [name]: value,
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        list: newDataSource,
      },
    });
  };

  // 确认提交
  confirmToSubmit = (selectedRows, batchRemark, action) => {
    const { dispatch } = this.props;
    const temp = selectedRows.filter(v => v.financeRemark);
    if (temp.length) {
      // 有值的 是否全部覆盖
      createConfirm({
        content: `此操作会覆盖已填写财务经理备注，确定吗？`,
        onOk: () => {
          selectedRows.forEach(v => {
            const ttIndex = selectedRows.findIndex(v2 => v.id === v2.id);
            selectedRows[ttIndex].financeRemark = batchRemark;
            this.onCellChanged(ttIndex, batchRemark, 'financeRemark');
          });
          dispatch({
            type: `${DOMAIN}/submitApply`,
            payload: {
              entities: selectedRows,
              action: action,
              sourceOfRequest: 'managerList',
            },
          });
        },
      });
    } else {
      selectedRows.filter(v => !v.financeRemark).forEach(v => {
        const ttIndex = selectedRows.findIndex(v2 => v.id === v2.id);
        selectedRows[ttIndex].financeRemark = batchRemark;
        this.onCellChanged(ttIndex, batchRemark, 'financeRemark');
      });
      dispatch({
        type: `${DOMAIN}/submitApply`,
        payload: {
          entities: selectedRows,
          action: action,
          sourceOfRequest: 'managerList',
        },
      });
    }
  };
  onRowChange = (selectedRowKeys, selectedRows) => {
    const paySerialsNum = selectedRowKeys[0];
    this.setState({ selectedKey: paySerialsNum }, () => {
      this.leftTableClickSearch();
    });
  };
  handleOnRow = record => {
    const { paySerialsNum } = record;
    return {
      // 点击行
      onClick: event => {
        this.onRowChange([paySerialsNum]);
      },
      onDoubleClick: event => {
        this.onRowChange([paySerialsNum]);
      },
    };
  };
  leftTableClickSearch = () => {
    const { selectedKey } = this.state;
    const {
      dispatch,
      payRecordListFinanceManager: { searchForm },
    } = this.props;

    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { searchForm: { paySerialsNum: selectedKey } },
    });
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...searchForm,
        paySerialsNum: selectedKey,
        node: 2,
        reqType: 'paySerialsNumRowClick',
      },
    });
  };
  render() {
    const {
      loading,
      dispatch,
      payRecordListFinanceManager: { list = [], total = 0, searchForm, paySerialsNumTableList },
      global: { userList },
    } = this.props;

    const { batchRemark, selectedKey } = this.state;

    const tableLoading = loading.effects[`${DOMAIN}/query`];

    const tablePropsPaySerialsNum = {
      rowKey: 'paySerialsNum',
      showSearch: false,
      showColumn: false,
      showExport: false,
      pagination: false,
      dataSource: paySerialsNumTableList,
      enableSelection: true,
      rowSelection: {
        type: 'radio',
        selectedRowKeys: [selectedKey],
        onChange: this.onRowChange,
      },
      onRow: this.handleOnRow,
      // onRowChecked: (selectedRowKeys, selectedRows) => {
      //   if (selectedRows.length <= 0) {
      //     return;
      //   }
      //   const { paySerialsNum } = selectedRows[0];
      //   dispatch({
      //     type: `${DOMAIN}/updateState`,
      //     payload: { searchForm: { paySerialsNum: paySerialsNum } },
      //   });
      //   dispatch({
      //     type: `${DOMAIN}/query`,
      //     payload: {
      //       ...searchForm,
      //       paySerialsNum: paySerialsNum,
      //       node: 2,
      //       reqType: 'paySerialsNumRowClick',
      //     },
      //   });
      //   // setTimeout(() => {
      //   //   this.selectAll()
      //   // }, 3000);
      // },
      columns: [
        {
          title: '付款流水号',
          dataIndex: 'paySerialsNum',
          align: 'center',
          width: 150,
        },
        {
          title: '合计金额',
          dataIndex: 'paymentAmtSum',
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
      ],
    };

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
      limit: 50,
      rowSelection: {
        selectedRowKeys: searchForm.selectedRowKeys,
      },
      onChange: filters => this.fetchData(filters),
      onSearchBarChange: (changedValues, allValues) => {
        this.setState({ selectedKey: undefined });
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      // searchForm,
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
              filters={[{ sphd1: '财务经理' }]}
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
          render: (value, row, index) => (
            <Input
              placeholder="请输入财务经理备注"
              value={value}
              className="x-fill-100"
              onChange={e => {
                this.onCellChanged(index, e.target.value, 'financeRemark');
              }}
            />
          ),
        },
        {
          title: '出纳备注',
          dataIndex: 'cashierRemark',
          align: 'center',
          width: 200,
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
          title: '实际付款日期',
          dataIndex: 'actualDate',
          align: 'center',
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
          width: 200,
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
          key: 'submit',
          className: 'tw-btn-primary',
          title: '通过',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            if (batchRemark) {
              this.confirmToSubmit(selectedRows, batchRemark, 2);
            } else {
              createConfirm({
                content: `未填写批注，继续吗？`,
                onOk: () => {
                  this.confirmToSubmit(selectedRows, batchRemark, 2);
                },
              });
            }
          },
        },
        {
          key: 'reject',
          className: 'tw-btn-error',
          title: '驳回',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            if (batchRemark) {
              this.confirmToSubmit(selectedRows, batchRemark, 3);
            } else {
              createConfirm({
                content: `未填写批注，继续吗？`,
                onOk: () => {
                  this.confirmToSubmit(selectedRows, batchRemark, 3);
                },
              });
            }
          },
        },
        {
          key: 'exportExcel',
          icon: 'monitor',
          className: 'tw-btn-primary',
          title: '打印流水号列表',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const rowPaySerialsNum = selectedRows
              .filter(v => {
                return v.paySerialsNum;
              })
              .map(data => {
                const { paySerialsNum } = data;
                return paySerialsNum;
              });
            if (rowPaySerialsNum.length) {
              createConfirm({
                content: `即将下载Excel文件，确定吗？`,
                onOk: () => {
                  window.open(
                    `${SERVER_URL}${paymentSlipExcelExport}?paySerialsNums=${rowPaySerialsNum}`
                  );
                },
              });
            } else {
              createMessage({
                type: 'warn',
                description: `您选择的数据不包含流水号!`,
              });
            }
          },
        },
      ],
    };

    return (
      /*<PageHeaderWrapper title="付款记录批准列表 ( 财务经理 )">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>*/

      <Row title="付款记录批准列表 ( 财务经理 PRO)">
        <Col span={5}>
          <DataTable {...tablePropsPaySerialsNum} />
          批注：
          <Input
            value={batchRemark}
            placeholder="请输入财务经理备注"
            className="x-fill-100"
            onChange={e => {
              this.setState({ batchRemark: e.target.value });
            }}
          />
        </Col>
        <Col span={19}>
          <DataTable {...tableProps} />
        </Col>
      </Row>
    );
  }
}

export default PayRecordListCashier;
