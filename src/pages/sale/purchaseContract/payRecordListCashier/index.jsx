import React, { PureComponent } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import Link from 'umi/link';
import { Card, Input, InputNumber, Modal, Tooltip } from 'antd';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker } from '@/pages/gen/field';
import { selectAbOus } from '@/services/gen/list';
import createMessage from '@/components/core/AlertMessage';
import { createConfirm } from '@/components/core/Confirm';
import api from '@/api';
import { add as mathAdd } from '@/utils/mathUtils';

const DOMAIN = 'payRecordListCashier';

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

@connect(({ loading, payRecordListCashier, dispatch, global }) => ({
  payRecordListCashier,
  loading,
  dispatch,
  global,
}))
class PayRecordListCashier extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      sumAmt: undefined,
      paySerialsNumValue: undefined,
    };
  }

  componentDidMount() {
    this.fetchData({
      offset: 0,
      limit: 10,
      sortBy: 'id',
      sortDirection: 'DESC',
    });
    //this.selectPaySerialsNum();
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        node: 1,
      },
    });
  };

  // 行编辑触发事件
  onCellChanged = (index, value, name) => {
    const {
      payRecordListCashier: { list },
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

  // 提交按钮事件
  handleSubmit = () => {
    const { paySerialsNumValue } = this.state;
    const {
      payRecordListCashier: { list },
      dispatch,
    } = this.props;
    if (!paySerialsNumValue) {
      createMessage({ type: 'warn', description: '请选择需要提交的流水号' });
      return;
    }
    //entities: selectedRows,
    // list中取流水号等于paySerialsNumValue的数据，提交到后台

    const newList = list.filter(v => {
      return v.paySerialsNum === paySerialsNumValue;
    });
    dispatch({
      type: `${DOMAIN}/submitPro`,
      payload: {
        paySerialsNum: paySerialsNumValue,
        entities: newList,
      },
    });
  };

  // 展示流水号选择弹出框
  showModal = () => {
    this.selectPaySerialsNum();
    const {
      payRecordListCashier: { paySerialsNumVisible },
      dispatch,
    } = this.props;
    if (paySerialsNumVisible) {
      // 如果新打开，初始化操作
    }
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { paySerialsNumVisible: !paySerialsNumVisible },
    });
  };

  // 付款流水号下拉列表
  selectPaySerialsNum = () => {
    const {
      dispatch,
      payRecordListCashier: { searchForm },
    } = this.props;
    dispatch({
      type: `${DOMAIN}/selectPaySerialsNum`,
      payload: {
        ...searchForm,
        node: 1,
      },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      payRecordListCashier: {
        list = [],
        total = 0,
        searchForm,
        selectPaySerialsNumList,
        paySerialsNumVisible,
      },
      global: { userList },
    } = this.props;

    const { sumAmt, paySerialsNumValue } = this.state;

    const tableLoading = loading.effects[`${DOMAIN}/query`];

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
              filters={[{ sphd1: '应付会计' }]}
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
            />
          ),
        },
        {
          title: '应付会计备注',
          dataIndex: 'accountancyRemark',
          align: 'center',
          width: 200,
          render: (value, row, index) => (
            <Input
              placeholder="请输入应付会计备注"
              value={value}
              className="x-fill-100"
              onChange={e => {
                this.onCellChanged(index, e.target.value, 'accountancyRemark');
              }}
            />
          ),
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
          width: 200,
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
        },
        {
          title: '应付会计更新日期',
          dataIndex: 'accountancyTime',
          align: 'center',
          width: 200,
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
        },
        {
          title: '财务经理更新日期',
          dataIndex: 'financeTime',
          align: 'center',
          width: 200,
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
        },
        {
          title: '出纳更新日期',
          dataIndex: 'cashierTime',
          align: 'center',
          width: 200,
          render: (value, row) => (
            <span>{value && moment(value).format('YYYY-MM-DD HH:mm:ss')}</span>
          ),
        },
      ],
      leftButtons: [
        /*{
          key: 'submit',
          icon: 'upload',
          className: 'tw-btn-primary',
          title: '提交',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const tt = selectedRows.filter(v => !v.purchaseDate);
            if (tt.length) {
              const ttIndex = selectedRows.findIndex(v => v.id === tt[0].id);
              createMessage({
                type: 'warn',
                description: `请将所选第${ttIndex + 1}条数据付款日期补全!`,
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
                action: 1,
              },
            });
          },
        },*/
        {
          key: 'submitPro',
          icon: 'upload',
          className: 'tw-btn-primary',
          title: '提交',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys => loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            this.showModal();
          },
        },
        {
          key: 'generateSerialNumber',
          icon: 'monitor',
          className: 'tw-btn-primary',
          title: '生成流水',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys =>
            !selectedRowKeys.length || loading.effects[`${DOMAIN}/query`],
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const rowPaySerialsNum = selectedRows.filter(v => {
              return v.paySerialsNum;
            });
            if (rowPaySerialsNum.length) {
              const paySerialsNumIndex = selectedRows.findIndex(
                v => v.id === rowPaySerialsNum[0].id
              );
              createConfirm({
                content: `选中的第${paySerialsNumIndex +
                  1}条付款记录已经产生流水号，此操作会覆盖原来的流水号，确定吗？`,
                onOk: () => {
                  dispatch({
                    type: `${DOMAIN}/submitApply`,
                    payload: {
                      entities: selectedRows,
                      action: 5,
                    },
                  });
                },
              });
            } else {
              dispatch({
                type: `${DOMAIN}/submitApply`,
                payload: {
                  entities: selectedRows,
                  action: 5,
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

    //提交之前选择流水号 ----

    //确定按钮 loading
    const disabledBtn =
      loading.effects[`${DOMAIN}/query`] || loading.effects[`${DOMAIN}/submitApply`];

    return (
      <PageHeaderWrapper title="付款记录提交列表 ( 应付会计 )">
        {(sumAmt || sumAmt === 0) && (
          <div style={{ padding: '0 24px 0' }}>
            <p style={{ color: 'red' }}>
              合计金额：
              {sumAmt}元
            </p>
          </div>
        )}
        <DataTable {...tableProps} />

        <Modal
          centered
          width="20%"
          destroyOnClose
          title="选择需要提交的流水号"
          visible={paySerialsNumVisible}
          confirmLoading={disabledBtn}
          onOk={this.handleSubmit}
          onCancel={this.showModal}
        >
          <Card className="tw-card-adjust" bordered={false}>
            <Selection
              key="paySerialsNumKey"
              value={paySerialsNumValue}
              className="x-fill-100"
              source={selectPaySerialsNumList}
              transfer={{ key: 'paySerialsNum', code: 'paySerialsNum', name: 'paySerialsNum' }}
              dropdownMatchSelectWidth
              showSearch
              onValueChange={obj => {
                if (obj) {
                  const { paySerialsNum } = obj;
                  this.setState({ paySerialsNumValue: paySerialsNum });
                }
              }}
              placeholder={`请选择需要提交的流水号`}
            />
          </Card>
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default PayRecordListCashier;
