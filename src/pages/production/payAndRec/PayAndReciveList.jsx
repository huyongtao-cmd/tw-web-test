import React, { PureComponent } from 'react';

import router from 'umi/router';
import { connect } from 'dva';
import { message } from 'antd';
import PageWrapper from '@/components/production/layout/PageWrapper';
import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import Link from '@/components/production/basic/Link';
import createMessage from '@/components/core/AlertMessage';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { isEmpty } from 'ramda';
// TODO:修改接口
import {
  projectTeamPagingRq,
  projectTeamDeleteRq,
} from '@/services/production/projectMgmt/projectTeam';

const DOMAIN = 'payAndReceiveList';
@connect(({ payAndReceiveList, dispatch, paymentDisplay }) => ({
  ...payAndReceiveList,
  dispatch,
  paymentDisplay,
}))
class PayAndReceiveList extends PureComponent {
  state = {
    getInternalState: null,
  };

  componentDidMount() {}

  fetchData = async params => {
    // TODO 修改参数名
    const { date, ...restparams } = params;

    if (Array.isArray(date) && (date[0] || date[1])) {
      [restparams.startDate, restparams.endDate] = date;
    }

    // TODO 修改接口
    const { response } = await projectTeamPagingRq(restparams);
    const result = response.data;
    return result;
  };

  /**
   * 删除数据方法,传给SearchTable组件使用
   * @param keys 要删除的数据主键
   * @returns {Promise<*>} 删除结果,给SearchTable组件使用
   */
  deleteData = async keys =>
    // TODO 修改接口
    outputHandle(projectTeamDeleteRq, { keys: keys.join(',') }, undefined, false);

  /**
   * 组装查询条件
   * @returns {*[]} 查询条件集合
   */
  renderSearchForm = () => [
    <SearchFormItem
      label="归属公司"
      key="projectRole"
      fieldKey="projectRole"
      fieldType="BaseSelect"
      parentKey="FUNCTION:PROJECT:ROLE"
    />,
    <SearchFormItem
      label="日期范围"
      key="resId"
      fieldKey="resId"
      fieldType="BaseDateRangePicker"
    />,
    <SearchFormItem
      label="应收应付对象"
      key="custOrSupplier"
      fieldKey="custOrSupplier"
      fieldType="SupplierSimpleSelect"
    />,
    <SearchFormItem
      label="合同编号/名称"
      key="contractName"
      fieldKey="contractName"
      fieldType="BaseDatePicker"
    />,
    <SearchFormItem
      label="类别"
      key="planClass"
      fieldKey="planClass"
      fieldType="BaseSelect"
      parentKey="FUNCTION:CONTRACT:PLAN:CLASS"
    />,
    <SearchFormItem label="款项" key="endDate" fieldKey="endDate" fieldType="BaseCustomSelect" />,
    <SearchFormItem
      label="款项状态"
      key="endDate"
      fieldKey="endDate"
      fieldType="BaseCustomSelect"
    />,
    <SearchFormItem
      label="开票状态"
      key="endDate"
      fieldKey="endDate"
      fieldType="BaseCustomSelect"
    />,
  ];

  render() {
    const { getInternalState } = this.state;
    const { dispatch, paymentDisplay } = this.props;
    // 获取付款申请的form

    const paymentFormData = paymentDisplay.formData;
    // TODO 修改参数名
    const columns = [
      {
        title: '公司',
        dataIndex: 'ouName',
        align: 'center',
      },
      {
        title: '类别',
        dataIndex: 'planClassDesc',
        align: 'center',
      },
      {
        title: '款项',
        dataIndex: 'clause',
        align: 'center',
      },
      {
        title: '客户/供应商',
        dataIndex: 'supplierName',
        align: 'center',
      },
      {
        title: '合同/订单编号',
        dataIndex: 'contractNo',
        align: 'center',
      },
      {
        title: '名称',
        dataIndex: 'contractName',
        align: 'center',
      },
      {
        title: '阶段',
        dataIndex: 'phase',
        align: 'center',
      },
      {
        title: '当期金额',
        dataIndex: 'amount',
        align: 'center',
      },

      {
        title: '预计收付日期',
        dataIndex: 'expectDate',
        align: 'center',
      },
      // TODO
      {
        title: '款项状态',
        dataIndex: 'resId',
        align: 'center',
      },
      {
        title: '开票状态',
        dataIndex: 'invoiceStatus',
        align: 'center',
      },
      {
        title: '发票号',
        dataIndex: 'invoiceNo',
        align: 'center',
      },
      {
        title: '开票金额',
        dataIndex: 'invoiceAmt',
        align: 'center',
      },
      {
        title: '开票日期',
        dataIndex: 'invoiceDate',
        align: 'center',
      },
      // TODO
      {
        title: '已收付金额',
        dataIndex: 'receOrPay',
        align: 'center',
      },
      {
        title: '未开票已收款金额',
        dataIndex: 'uninvoiceReceAmt',
        align: 'center',
      },
      {
        title: '未开票已付款金额',
        dataIndex: 'uninvoicePayAmt',
        align: 'center',
      },
      {
        title: '最近收付日期',
        dataIndex: 'recentDate',
        align: 'center',
      },
    ];
    const extraButtons = [
      {
        key: 'invoice',
        title: '开票申请',
        type: 'primary',
        size: 'large',
        loading: false,
        cb: internalState => {
          const { selectedRowKeys, selectedRows } = internalState;
          const { custOrSupplier } = selectedRows[0];
          // TODO有开批次号，已经开过票
          const batchFlag = selectedRows.some(
            item => !(!item.batchStatus || item.batchStatus === 'CREATE')
          );
          if (batchFlag) {
            createMessage({
              type: 'warn',
              description: `只有未开过票的数据才能进行开票操作！`,
            });
            return;
          }
          // TODO 所选的必须为同一个公司/供应商

          const companyFlag = selectedRows.some(item => item.custOrSupplier !== custOrSupplier);
          if (companyFlag) {
            createMessage({
              type: 'warn',
              description: `只能对同一公司/供应商进行批量开票操作！`,
            });
            return;
          }

          // TODO 计算待开票的已收款未开票-已付款未开票总和 totalPrice,<0不允许开票
          let totalPrice = 0;
          const rows = Array.from(new Set(selectedRows));
          totalPrice = rows
            .map(item => {
              let currentValue = 0;
              if (item.planClass === 'COLLECTION') {
                currentValue = item.amount;
              } else {
                currentValue = 0 - item.amount;
              }
              return currentValue;
            })
            .reduce((accumulator, currentValue) => accumulator + currentValue);
          if (totalPrice < 0) {
            createMessage({
              type: 'warn',
              description: '开票总金额不能小于0元',
            });
            return;
          }

          dispatch({
            type: `${DOMAIN}/updateState`,
            payload: { selectedRows: rows, invoiceTotalAmt: totalPrice },
          });
          // TODO修改参数 跳转到新增页面
          router.push(
            `/workTable/payAndReceive/invoiceApply/edit?custId=${custOrSupplier}&mode=EDIT`
          );
        },
        disabled: internalState => {
          const { selectedRowKeys } = internalState;
          return selectedRowKeys.length < 1;
        },
      },
      {
        key: 'pay',
        title: '付款申请',
        type: 'primary',
        size: 'large',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          console.log(internalState);
          const { selectedRows } = internalState;
          const { id, custOrSupplier } = selectedRows[0];
          if (paymentFormData.paymentPlanDetails.length > 0) {
            createMessage({ type: 'info', description: '请先关闭已打开的付款申请页面！' });
            return;
          }
          // TODO 所选的必须为同一个公司/供应商
          const companyFlag = selectedRows.some(item => item.custOrSupplier !== custOrSupplier);
          if (companyFlag) {
            createMessage({
              type: 'warn',
              description: `只能对同一公司/供应商进行批量付款申请！`,
            });
            return;
          }
          // TODO 已收款/已付款的不能申请
          const amtFlag = selectedRows.some(
            item => item.status === 'paied' || item.status === 'collected'
          );
          if (amtFlag) {
            createMessage({
              type: 'warn',
              description: `款项状态为'已收款/已付款'不能进行付款申请！`,
            });
            return;
          }
          const rows = Array.from(new Set(selectedRows));
          // TODO 已收/付金额+处于流程中的收款单/付款申请单中本次收/付金额）< 当期金额。

          // TODO 未到款的金额之和小于未付款金额之和才可以付款申请
          let totalPay = 0;
          rows.forEach(item => {
            if (item.planClass === 'PAYMENT') {
              totalPay += item.restAmt;
            } else {
              totalPay -= item.restAmt;
            }
          });
          if (totalPay < 0) {
            createMessage({
              type: 'warn',
              description: `批量处理时,未到款金额之和小于未付款金额之和才能进行付款申请！`,
            });
            return;
          }
          dispatch({ type: `${DOMAIN}/updateState`, payload: { selectedRows: rows } });
          // 修改路由跳转
          router.push(
            `/workTable/payAndReceive/paymentDisplay?id=${id}&mode=EDIT&from=payAndReceiveList`
          );
        },
        disabled: internalState => {
          const { selectedRowKeys } = internalState;
          return selectedRowKeys.length < 1;
        },
      },
      {
        key: 'receive',
        title: '收款',
        type: 'primary',
        size: 'large',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          console.log(internalState);
          const { selectedRows } = internalState;
          const rows = Array.from(new Set(selectedRows));
          const { id, custOrSupplier } = selectedRows[0];
          // TODO 所选的必须为同一个公司/供应商

          const companyFlag = selectedRows.some(item => item.custOrSupplier !== custOrSupplier);
          if (companyFlag) {
            createMessage({
              type: 'warn',
              description: `只能对同一公司/供应商进行批量收款操作！`,
            });
            return;
          }
          // TODO 已收款/已付款的不能申请
          const amtFlag = selectedRows.some(
            item => item.status === 'paied' || item.status === 'collected'
          );
          if (amtFlag) {
            createMessage({
              type: 'warn',
              description: `包含款项状态为'已收款/已付款'不能进行收款申请！`,
            });
            return;
          }
          // TODO 已收/付金额+处于流程中的收款单/付款申请单中本次收/付金额）< 当期金额。

          // TODO 未付款的金额之和小于未到款金额之和才可以收款操作
          let totalCollect = 0;
          rows.forEach(item => {
            if (item.planClass === 'COLLECTION') {
              totalCollect += item.restAmt;
            } else {
              totalCollect -= item.restAmt;
            }
          });
          if (totalCollect < 0) {
            createMessage({
              type: 'warn',
              description: `批量处理时,未付款金额之和小于未到款金额之和才能进行收款！`,
            });
            return;
          }
          dispatch({ type: `${DOMAIN}/updateState`, payload: { selectedRows: rows } });
          // 修改路由
          router.push('/workTable/payAndReceive/receiveDisplay?mode=EDIT');
        },
        disabled: internalState => {
          const { selectedRowKeys } = internalState;
          return selectedRowKeys.length < 1;
        },
      },
    ];
    return (
      <PageWrapper>
        <SearchTable
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          searchForm={this.renderSearchForm()} // 查询条件
          defaultSortBy="id"
          defaultSortDirection="DESC"
          fetchData={this.fetchData} // 获取数据的方法,请注意获取数据的格式
          columns={columns} // 要展示的列
          // onAddClick={() =>
          //   router.push('/workTable/payAndReceive/projectTeam/teamDisplay?mode=EDIT')
          // } // 新增按钮逻辑,不写不展示
          // //deleteData={this.deleteData} // 删除按钮逻辑,不写不显示
          // onEditClick={data =>
          //   router.push(`/workTable/payAndReceive/projectTeam/teamDisplay?id=${data.id}&mode=EDIT`)
          // } // 编辑按钮逻辑,不写不显示
          extraButtons={extraButtons}
          autoSearch // 进入页面默认查询数据
          tableExtraProps={{ scroll: { x: 2800 } }}
        />
      </PageWrapper>
    );
  }
}

export default PayAndReceiveList;
