import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import Link from 'umi/link';
import moment from 'moment';
import { Input, Select } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import createMessage from '@/components/core/AlertMessage';
import { formatMessage } from 'umi/locale';
import { selectIamUsers } from '@/services/gen/list';
import AsyncSelect from '@/components/common/AsyncSelect';
import { Selection, DatePicker } from '@/pages/gen/field';
import { selectContract } from '@/services/user/Contract/sales';
import Ellipsis from '@/components/common/Ellipsis';
import { selectUsers } from '@/services/sys/user';

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
      enableSelection: false,
      searchBarForm: [
        {
          title: '??????????????????',
          dataIndex: 'contractNo',
          options: {
            initialValue: searchForm.contractNo || undefined,
          },
          tag: <Input placeholder="???????????????????????????" />,
        },
        {
          title: '???????????????',
          dataIndex: 'edemandResId',
          tag: (
            <AsyncSelect
              source={() => selectUsers().then(resp => resp.response)}
              placeholder="??????????????????"
              showSearch
              filterOption={(input, option) =>
                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'demandNo',
          options: {
            initialValue: searchForm.demandNo || undefined,
          },
          tag: <Input placeholder="?????????????????????" />,
        },
        {
          title: '????????????',
          dataIndex: 'demandType',
          tag: <Selection.UDC code="TSK:BUSINESS_TYPE" placeholder="?????????????????????" />,
        },
        {
          title: '????????????',
          dataIndex: 'uploadDate',
          options: {
            initialValue: searchForm.uploadDate,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },

        // {
        //     title: '?????????',
        //     dataIndex: 'supplierLegalNo',
        //     options: {
        //         initialValue: searchForm.supplierLegalNo,
        //     },
        //     tag: <Selection.UDC code="TSK:BUSINESS_TYPE" placeholder="??????????????????" />,
        // },
      ],
      columns: [
        {
          title: '??????????????????',
          dataIndex: 'contractNo',
          align: 'center',
          width: 100,
        },
        {
          title: '????????????',
          dataIndex: 'demandStatusName',
          align: 'center',
          width: 75,
        },
        {
          title: '???????????????',
          dataIndex: 'edemandResIdName',
          align: 'center',
          width: 120,
        },
        {
          title: '????????????',
          dataIndex: 'demandTypeName',
          align: 'center',
          width: 100,
        },

        {
          title: '????????????',
          dataIndex: 'taxAmt',
          align: 'center',
          width: 120,
        },
        {
          title: '??????',
          dataIndex: 'taxRate',
          align: 'center',
          width: 120,
        },
        {
          title: '????????????',
          dataIndex: 'demandData',
          align: 'center',
          width: 120,
        },
        {
          title: '??????',
          dataIndex: 'symbolName',
          align: 'center',
          width: 120,
        },
        {
          title: '????????????',
          dataIndex: 'buProdName',
          align: 'center',
          width: 120,
        },
        {
          title: '??????????????????',
          dataIndex: 'className',
          align: 'center',
          width: 150,
        },
        // {
        //   title: '????????????',
        //   dataIndex: 'createUserName',
        //   align: 'center',
        // },
        {
          title: '??????????????????',
          dataIndex: 'subClassName',
          align: 'center',
          width: 200,
        },
        {
          title: '??????',
          dataIndex: 'demandNum',
          align: 'center',
          width: 100,
        },
      ],
      // leftButtons: [
      //     // {
      //     //     key: 'delete',
      //     //     icon: 'form',
      //     //     className: 'tw-btn-primary',
      //     //     title: '??????',
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
      <PageHeaderWrapper title="??????????????????">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default PayRecordList;
