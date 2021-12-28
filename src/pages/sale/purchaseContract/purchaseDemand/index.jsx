import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import Link from 'umi/link';
import moment from 'moment';
import { Input, Select, Tooltip } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import createMessage from '@/components/core/AlertMessage';
import { formatMessage } from 'umi/locale';
import { selectIamUsers } from '@/services/gen/list';
import AsyncSelect from '@/components/common/AsyncSelect';
import { Selection, DatePicker } from '@/pages/gen/field';
import { selectContract, selectCust } from '@/services/user/Contract/sales';
import Ellipsis from '@/components/common/Ellipsis';
import { selectUsers } from '@/services/sys/user';
import { isEmpty, isNil } from 'ramda';
import { formatDT } from '@/utils/tempUtils/DateTime';

const DOMAIN = 'salePurchaseDemandList';

@connect(({ loading, salePurchaseDemandList }) => ({
  salePurchaseDemandList,
  loading: loading.effects[`${DOMAIN}/queryList`],
}))
@mountToTab()
class PayRecordList extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/queryList` });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/queryList`,
      payload: {
        ...params,
        createTime: undefined,
        purchaseDateStart:
          params.createTime && params.createTime[0]
            ? params.createTime[0].format('YYYY-MM-DD')
            : undefined,
        purchaseDateEnd:
          params.createTime && params.createTime[1]
            ? params.createTime[1].format('YYYY-MM-DD')
            : undefined,
      },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      salePurchaseDemandList: { listData = [], total = 0, searchForm },
    } = this.props;

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: {
        x: 3000,
      },
      loading,
      total,
      dataSource: listData,
      onChange: filters => this.fetchData(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchForm,
      // enableSelection: false,
      searchBarForm: [
        // {
        //   title: '采购合同编号',
        //   dataIndex: 'contractNo',
        //   options: {
        //     initialValue: searchForm.contractNo || undefined,
        //   },
        //   tag: <Input placeholder="请输入采购合同编号" />,
        // },
        {
          title: '需求编号',
          dataIndex: 'demandNo',
          options: {
            initialValue: searchForm.demandNo || undefined,
          },
          tag: <Input placeholder="请输入需求编号" />,
        },
        {
          title: '销售合同编号',
          dataIndex: 'saleContractNo',
          options: {
            initialValue: searchForm.saleContractNo || undefined,
          },
          tag: <Input placeholder="请输入销售合同名称/编号" />,
        },
        {
          title: '需求负责人',
          dataIndex: 'edemandResId',
          tag: (
            <AsyncSelect
              source={() => selectUsers().then(resp => resp.response)}
              placeholder="请输入需求负责人"
              showSearch
              filterOption={(input, option) =>
                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            />
          ),
        },
        {
          title: '需求日期',
          dataIndex: 'uploadDate',
          options: {
            initialValue: searchForm.uploadDate,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
        {
          title: '合同号',
          dataIndex: 'userdefinedNo',
          options: {
            initialValue: searchForm.userdefinedNo,
          },
          tag: <Input placeholder="请输入参考合同号" />,
        },
        {
          title: '客户',
          dataIndex: 'custId',
          key: 'custId',
          options: {
            initialValue: searchForm.custId,
          },
          tag: <Selection source={() => selectCust()} placeholder="请输入客户" />,
        },

        {
          title: '需求类别',
          dataIndex: 'demandType',
          tag: <Selection.UDC code="TSK:BUSINESS_TYPE" placeholder="请选择需求类别" />,
        },
        {
          title: '状态',
          dataIndex: 'demandStatus',
          options: {
            initialValue: searchForm.demandStatus,
          },
          tag: <Selection.UDC code="TSK:DEMAND_STATUS" placeholder="请选择状态" />,
        },

        // {
        //     title: '供应商',
        //     dataIndex: 'supplierLegalNo',
        //     options: {
        //         initialValue: searchForm.supplierLegalNo,
        //     },
        //     tag: <Selection.UDC code="TSK:BUSINESS_TYPE" placeholder="请选择供应商" />,
        // },
      ],
      columns: [
        {
          title: '需求编号',
          dataIndex: 'demandNo',
          align: 'center',
          width: 100,
        },
        {
          title: '销售合同编号',
          dataIndex: 'saleContractNo',
          align: 'center',
          width: 100,
        },
        {
          title: '销售合同名称',
          dataIndex: 'saleContractName',
          align: 'center',
          width: 100,
        },
        {
          title: '销售合同号',
          dataIndex: 'userdefinedNo',
          align: 'center',
          width: 100,
        },
        {
          title: '客户名称',
          dataIndex: 'custName',
          align: 'center',
          width: 100,
        },
        {
          title: '需求备注',
          dataIndex: 'demandRem',
          align: 'center',
          width: 100,
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
          title: '采购合同编号',
          dataIndex: 'contractNo',
          align: 'center',
          width: 100,
        },
        {
          title: '需求状态',
          dataIndex: 'demandStatusName',
          align: 'center',
          width: 75,
        },
        {
          title: '需求负责人',
          dataIndex: 'edemandResIdName',
          align: 'center',
          width: 120,
        },
        {
          title: '需求类别',
          dataIndex: 'demandTypeName',
          align: 'center',
          width: 100,
        },

        {
          title: '含税总额',
          dataIndex: 'taxAmt',
          align: 'center',
          width: 120,
        },
        {
          title: '税率',
          dataIndex: 'taxRate',
          align: 'center',
          width: 120,
        },
        {
          title: '需求日期',
          dataIndex: 'demandData',
          align: 'center',
          width: 120,
          render: value => formatDT(value),
        },
        {
          title: '货币',
          dataIndex: 'symbolName',
          align: 'center',
          width: 120,
        },
        {
          title: '关联产品',
          dataIndex: 'buProdName',
          align: 'center',
          width: 120,
        },
        {
          title: '产品大类名称',
          dataIndex: 'className',
          align: 'center',
          width: 150,
        },
        // {
        //   title: '付款金额',
        //   dataIndex: 'createUserName',
        //   align: 'center',
        // },
        {
          title: '产品小类名称',
          dataIndex: 'subClassName',
          align: 'center',
          width: 200,
        },
        {
          title: '数量',
          dataIndex: 'demandNum',
          align: 'center',
          width: 100,
        },
      ],
      leftButtons: [
        {
          key: 'edit',
          className: 'tw-btn-primary',
          title: '生成采购合同',
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            !selectedRows.length || selectedRows.filter(v => v.contractNo).length,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const target = selectedRows[0];
            const index = selectedRows.findIndex(
              item => item.saleContractId !== target.saleContractId
            );
            if (index > -1) {
              createMessage({
                type: 'warn',
                description: '不是同一合同，不可同时生成采购合同！',
              });
              return;
            }

            if (selectedRows.findIndex(item => isNil(item.projectId)) > -1) {
              createMessage({
                type: 'warn',
                description: '合同尚未关联项目，不能生成采购合同！',
              });
              return;
            }

            if (selectedRows.findIndex(item => item.saleContractStatus !== 'ACTIVE') > -1) {
              createMessage({
                type: 'warn',
                description: '合同尚未激活，不能生成采购合同！',
              });
              return;
            }

            if (isEmpty(selectedRowKeys)) {
              createMessage({ type: 'warn', description: '请选择需要生成采购合同的明细！' });
              return;
            }

            const tt = selectedRows.filter(v => v.contractNo);
            if (!isEmpty(tt)) {
              createMessage({
                type: 'warn',
                description:
                  '选择的采购需求明细中含有已经生成的采购合同明细，不能再生成采购合同的明细！',
              });
              return;
            }

            // 选择相同的建议供应商才能生成采购合同
            const tt1 = [...new Set(selectedRows.map(v => Number(v.supplierId)))];
            if (tt1.length > 1) {
              createMessage({
                type: 'warn',
                description: '只能选择相同建议供应商的需求明细提交',
              });
              return;
            }

            const selectedSortNo = selectedRows.map(v => v.sortNo).join(',');
            router.push(
              `/sale/purchaseContract/Edit?mode=edit&purchaseType=CONTRACT&businessType=${
                target.demandType
              }&contractId=${
                target.saleContractId
              }&selectedSortNo=${selectedSortNo}&from=contract&fromTab=PurchaseDemandDeal`
            );
          },
        },
      ],
      // leftButtons: [
      //     // {
      //     //     key: 'delete',
      //     //     icon: 'form',
      //     //     className: 'tw-btn-primary',
      //     //     title: '删除',
      //     //     loading: false,
      //     //     hidden: false,
      //     //     minSelections: 0,
      //     //     disabled: selectedRowKeys => selectedRowKeys.length !== 1,
      //     //     cb: (selectedRowKeys, selectedRows, queryParams) => {
      //     //         const { id } = selectedRows[0];
      //     //         dispatch({
      //     //             type: `${DOMAIN}/delete`,
      //     //             payload: id,
      //     //         });
      //     //     },
      //     // },
      // ],
    };

    return (
      <PageHeaderWrapper title="采购需求列表">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default PayRecordList;
