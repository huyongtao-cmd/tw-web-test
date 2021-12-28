import React, { Component } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import Link from 'umi/link';
import { Switch, Tag, Input, Select, DatePicker, Radio } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { createAlert } from '@/components/core/Confirm';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { Selection, BuVersion } from '@/pages/gen/field';
import { selectUsersWithBu, selectAllAbOu } from '@/services/gen/list';
import createMessage from '@/components/core/AlertMessage';
import BaseDatePicker from '@/components/production/basic/BaseDatePicker';

// 采购合同付款计划预期列表
const DOMAIN = 'purchaseContractPaymentPlan';

const applyColumns = [
  { dataIndex: 'code', title: '编号', span: 10 },
  { dataIndex: 'name', title: '名称', span: 14 },
];

const RadioGroup = Radio.Group;

@connect(({ loading, purchaseContractPaymentPlan }) => ({
  loading,
  purchaseContractPaymentPlan,
}))
@mountToTab()
class PurchaseContractPaymentPlan extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    // this.fetchData({ sortBy: 'id', sortDirection: 'ASC', disabled: undefined });
    this.fetchData();
  }

  fetchData = async (params = {}) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        estimatedPaymentDate: undefined,
        estimatedPaymentDateStart:
          params.estimatedPaymentDate && params.estimatedPaymentDate[0]
            ? params.estimatedPaymentDate[0].format('YYYY-MM-DD')
            : undefined,
        estimatedPaymentDateEnd:
          params.estimatedPaymentDate && params.estimatedPaymentDate[1]
            ? params.estimatedPaymentDate[1].format('YYYY-MM-DD')
            : undefined,
      },
    });
  };

  // 行编辑触发事件
  onCellChanged = (index, value, name) => {
    const {
      // targetEval: { twOkrKeyresultView },
      purchaseContractPaymentPlan: { list },
      dispatch,
    } = this.props;

    // const newDataSource = twOkrKeyresultView;
    const newDataSource = list;
    newDataSource[index] = {
      ...newDataSource[index],
      [name]: value,
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      // payload: { twOkrKeyresultView: newDataSource },
      payload: { list: newDataSource },
    });
  };

  render() {
    const { loading, purchaseContractPaymentPlan, dispatch } = this.props;
    const { list, total, searchForm, selectedRowKeys } = purchaseContractPaymentPlan;

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      loading: loading.effects[`${DOMAIN}/query`],
      total,
      scroll: {
        x: 2250,
      },
      dataSource: list,
      onChange: filters => this.fetchData(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchBarForm: [
        {
          title: '采购合同',
          dataIndex: 'contractNmNo',
          options: {
            initialValue: searchForm.contractNmNo,
          },
          tag: <Input placeholder="采购合同编号或名称" />,
        },
        {
          title: '供应商',
          dataIndex: 'supplierLegalNo',
          options: {
            initialValue: searchForm.supplierLegalNo,
          },
          tag: (
            <Selection.Columns
              columns={applyColumns}
              source={() => selectAllAbOu()}
              placeholder="请选择供应商"
              showSearch
            />
          ),
        },
        // {
        //   title: '付款号',
        //   dataIndex: 'payNo',
        //   options: {
        //     initialValue: searchForm.payNo,
        //   },
        //   tag: <Input placeholder="付款号" />,
        // },
        // {
        //   title: '相关销售合同',
        //   dataIndex: 'salesContract',
        //   options: {
        //     initialValue: searchForm.salesContract,
        //   },
        //   tag: <Input placeholder="销售合同编号或名称" />,
        // },
        // {
        //   title: '客户',
        //   dataIndex: 'custId',
        //   options: {
        //     initialValue: searchForm.custId,
        //   },
        //   tag: <Selection source={() => selectCust()} placeholder="请选择客户" />,
        // },
        // {
        //   title: '交付BU',
        //   dataIndex: 'deliBuId',
        //   options: {
        //     initialValue: searchForm.deliBuId,
        //   },
        //   tag: <BuVersion />,
        // },
        // {
        //   title: '付款状态',
        //   dataIndex: 'payStatus',
        //   options: {
        //     initialValue: searchForm.payStatus,
        //   },
        //   tag: <Selection.UDC code="ACC.PAY_STATUS" placeholder="请选择付款状态" />,
        // },
        {
          title: '采购负责人',
          dataIndex: 'purchaseInchargeResId',
          options: {
            initialValue: searchForm.purchaseInchargeResId,
          },
          tag: (
            <Selection.Columns
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              columns={applyColumns}
              source={() => selectUsersWithBu()}
              placeholder="请选择采购负责人"
              showSearch
            />
          ),
        },
        {
          title: '预计付款日期',
          dataIndex: 'estimatedPaymentDate',
          options: {
            initialValue: searchForm.estimatedPaymentDate,
          },
          tag: (
            <DatePicker.RangePicker
              className="x-fill-100"
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
            />
          ),
        },
        {
          title: '已经预期',
          key: 'isExpected',
          dataIndex: 'isExpected',
          options: {
            initialValue: searchForm.isExpected || '',
          },
          tag: (
            <RadioGroup>
              <Radio value="YES">是</Radio>
              <Radio value="ALL">全部</Radio>
            </RadioGroup>
          ),
        },
      ],
      columns: [
        {
          title: '采购合同号',
          dataIndex: 'contractNo',
          className: 'text-center',
          width: 200,
          render: (value, row, index) => {
            // const href = `/sale/contract/purchasesDetail?pcontractId=${row.contractId}`;
            const href = `/sale/purchaseContract/Detail?id=${
              row.contractId
            }&pageMode=purchase&from=list`;
            return (
              <Link className="tw-link" to={href}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '采购合同名称',
          dataIndex: 'contractName',
          width: 200,
        },
        {
          title: '供应商',
          dataIndex: 'supplierLegalName',
          className: 'text-center',
          width: 150,
        },
        {
          title: '采购负责人',
          dataIndex: 'purchaseInchargeResName',
          width: 100,
        },
        {
          title: '付款阶段',
          dataIndex: 'paymentStage',
          className: 'text-center',
          width: 250,
        },
        {
          title: '付款金额',
          dataIndex: 'paymentAmt',
          className: 'text-center',
          width: 250,
        },
        {
          title: '付款比例',
          dataIndex: 'paymentProportion',
          className: 'text-center',
          width: 250,
          render: (value, row, index) => (value ? `${value}%` : undefined),
        },
        {
          title: '预计付款日期',
          dataIndex: 'estimatedPaymentDate',
          width: 100,
          // render: (value, row, index) => formatDT(value),
          render: (value, row, index) =>
            selectedRowKeys && selectedRowKeys.findIndex(x => x === row.id) > -1 ? (
              <BaseDatePicker
                // disabled={row.id === TOTAL_LABEL || (disabled && !enableAdjustedAmt)}
                value={value}
                // onChange={e => this.onCellChanged(index, 'startDate', e)}
                format="YYYY-MM-DD"
                onChange={e => this.onCellChanged(index, e, 'estimatedPaymentDate')}
              />
            ) : (
              formatDT(value)
            ),
          // formatDT(value)
        },
        {
          title: '备注',
          dataIndex: 'remark',
          className: 'text-center',
          width: 250,
          render: (value, row, index) =>
            selectedRowKeys && selectedRowKeys.findIndex(x => x === row.id) > -1 ? (
              <Input
                value={value}
                onChange={e => {
                  this.onCellChanged(index, e.target.value, 'remark');
                }}
                placeholder="请输入备注"
              />
            ) : (
              value
            ),
        },
        {
          title: '合同节点状态',
          dataIndex: 'recvStatusName',
          className: 'text-center',
          width: 150,
        },
        {
          title: '已收金额',
          dataIndex: 'actualRecvAmt',
          width: 100,
        },
        {
          title: '约束里程碑',
          dataIndex: 'milestoneName',
          width: 200,
        },
        {
          title: '里程碑状态',
          dataIndex: 'milestoneStatusName',
          className: 'text-center',
          width: 200,
        },
      ],
      leftButtons: [
        {
          key: 'submit',
          className: 'tw-btn-primary',
          title: '提交',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length !== 1,
          minSelections: 0,
          cb: (selectKeys, selectedRows, queryParams) => {
            if (
              selectedRows[0].estimatedPaymentDate === null ||
              selectedRows[0].estimatedPaymentDate === undefined
            ) {
              createMessage({
                type: 'warn',
                description: '预计付款时间不能为空',
              });
              return;
            }

            const selectedPayment = list.filter(v => v.id === selectKeys[0]);
            dispatch({
              type: `${DOMAIN}/submit`,
              payload: {
                id: selectKeys[0],
                estimatedPaymentDate: selectedPayment[0].estimatedPaymentDate,
                remark: selectedPayment[0].remark,
              },
            }).then(res => {
              if (res.ok) {
                createMessage({ type: 'success', description: '提交成功' });
                this.fetchData();
              } else {
                createMessage({ type: 'error', description: '提交失败' });
              }
            });
          },
        },
        // {
        //   key: 'request',
        //   icon: 'money-collect',
        //   className: 'tw-btn-info',
        //   title: '发起付款申请',
        //   loading: false,
        //   hidden: false,
        //   disabled: false,
        //   minSelections: 0,
        //   cb: (selectedRowKeys, selectedRows, queryParams) => {
        //     createAlert.info({
        //       content: '该功能尚未开发。',
        //     });
        //   },
        // },
        // {
        //   key: 'money',
        //   icon: 'dollar',
        //   className: 'tw-btn-info',
        //   title: '发起预付款',
        //   loading: false,
        //   hidden: false,
        //   disabled: false,
        //   minSelections: 0,
        //   cb: (selectedRowKeys, selectedRows, queryParams) => {
        //     createAlert.info({
        //       content: '该功能尚未开发。',
        //     });
        //   },
        // },
        // {
        //   key: 'remove',
        //   className: 'tw-btn-error',
        //   icon: 'file-excel',
        //   title: formatMessage({ id: `misc.delete`, desc: '删除' }),
        //   loading: false,
        //   hidden: false,
        //   disabled: false,
        //   minSelections: 2,
        //   cb: (selectedRowKeys, selectedRows, queryParams) => {
        //     dispatch({
        //       type: `${DOMAIN}/delete`,
        //       payload: selectedRowKeys.join(','),
        //     });
        //   },
        // },
      ],
    };

    return (
      <PageHeaderWrapper>
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default PurchaseContractPaymentPlan;
