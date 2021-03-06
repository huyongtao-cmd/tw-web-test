import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { isNil, isEmpty } from 'ramda';
import { injectUdc, mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker } from '@/pages/gen/field';
import { formatDT } from '@/utils/tempUtils/DateTime';
import Link from 'umi/link';

const DOMAIN = 'ticketMgmt';

@connect(({ loading, ticketMgmt }) => ({
  // loading,
  ticketMgmt,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@injectUdc(
  {
    ticketUdcList: 'ACC:USE_STATUS',
    ticketExpTypeList: 'ACC:TICKET_EXP_TYPE',
    reimbursementStatusList: 'ACC.REIM_STATE',
  },
  DOMAIN
)
@mountToTab()
class TicketMgmt extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    this.fetchData({ sortBy: 'id', sortDirection: 'DESC', offset: 0, limit: 10 });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    const { bookingDate, tripDate, ...restParams } = params || {};
    const bookingDateObject = { bookingDateStart: undefined, bookingDateEnd: undefined };
    if (!isNil(bookingDate) && !isEmpty(bookingDate)) {
      const [bookingDateStart, bookingDateEnd] = bookingDate;
      bookingDateObject.bookingDateStart = bookingDateStart;
      bookingDateObject.bookingDateEnd = bookingDateEnd;
    }
    const tripDateObject = { tripDateStart: undefined, tripDateEnd: undefined };
    if (!isNil(tripDate) && !isEmpty(tripDate)) {
      const [tripDateStart, tripDateEnd] = tripDate;
      tripDateObject.tripDateStart = tripDateStart;
      tripDateObject.tripDateEnd = tripDateEnd;
    }
    dispatch({ type: `${DOMAIN}/query`, payload: { ...restParams, ...bookingDateObject } });
  };

  onCellChange = (rowData, rowField) => rowFieldValue => {
    const { dispatch, ticketMgmt } = this.props;
    const { list } = ticketMgmt;
    const newList = list.map(row => {
      if (row.id === rowData.id) {
        return { ...row, [rowField]: rowFieldValue };
      }
      return row;
    });
    dispatch({ type: `${DOMAIN}/updateState`, payload: { list: newList } });
  };

  render() {
    const { loading, ticketMgmt, dispatch } = this.props;
    const { list, total, searchForm } = ticketMgmt;
    const { _udcMap = {} } = this.state;
    const { ticketUdcList = [], ticketExpTypeList = [], reimbursementStatusList = [] } = _udcMap;

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: 2000 },
      loading,
      total,
      dataSource: list,
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
          title: '???????????????',
          dataIndex: 'applyNoOrName',
        },
        {
          title: '??????????????????',
          dataIndex: 'procInfo',
        },
        {
          title: '????????????',
          dataIndex: 'bookingDate',
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
        {
          title: '????????????',
          dataIndex: 'tripDate',
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
        {
          title: '???????????????',
          dataIndex: 'applyResName',
        },
        {
          title: '??????????????????',
          dataIndex: 'useStatus',
          tag: <Selection source={ticketUdcList} placeholder="???????????????????????????" />,
        },
        {
          title: '????????????',
          dataIndex: 'ticketExpType',
          tag: <Selection source={ticketExpTypeList} placeholder="?????????????????????" />,
        },
        {
          title: '????????????',
          dataIndex: 'reimbursementStatus',
          tag: <Selection source={reimbursementStatusList} placeholder="?????????????????????" />,
        },
      ],
      columns: [
        {
          title: '??????????????????',
          dataIndex: 'useStatusDesc',
          width: 100,
          // render: (value, rowData) => (
          //   <Selection
          //     source={ticketUdcList}
          //     value={value}
          //     onChange={this.onCellChange(rowData, 'useStatus')}
          //     placeholder="???????????????????????????"
          //     allowClear={false}
          //   />
          // ),
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'ticketExpTypeDesc',
          width: 100,
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'reimbursementStatusDesc',
          width: 100,
          align: 'center',
        },
        {
          title: '?????????????????????',
          dataIndex: 'applyName',
          // width: 250,
          render: (key, { applyId }, index) => (
            <Link
              to={`/user/center/travel/detail?id=${applyId}&isMy=1&sourceUrl=/plat/adminMgmt/ticketMgmt`}
            >
              {key}
            </Link>
          ),
        },
        {
          title: '??????????????????',
          dataIndex: 'applyNo',
          width: 150,
        },
        {
          title: '????????????',
          dataIndex: 'ticketPurchasingChannelDesc',
          // width: 200,
        },
        {
          title: '????????????',
          dataIndex: 'bookingDate',
          width: 150,
          render: value => formatDT(value),
        },
        {
          title: '????????????',
          dataIndex: 'tripDate',
          width: 150,
          render: value => formatDT(value),
        },
        {
          title: '??????/??????',
          dataIndex: 'vehicleNo',
          width: 100,
        },
        {
          title: '??????',
          dataIndex: 'timespan',
          align: 'right',
          width: 100,
          // render: value => formatDT(value),
        },
        {
          title: '?????????',
          dataIndex: 'fromPlaceDesc',
          width: 100,
          align: 'center',
        },
        {
          title: '?????????',
          dataIndex: 'toPlaceDesc',
          width: 100,
        },
        {
          title: '?????????',
          dataIndex: 'tripResName',
          width: 100,
        },
        {
          title: '??????',
          dataIndex: 'expAmt',
          align: 'right',
          width: 100,
        },

        {
          title: '??????????????????',
          dataIndex: 'procNo',
        },
        {
          title: '????????????',
          dataIndex: 'createTime',
          width: 150,
        },
      ],
      leftButtons: [
        {
          key: 'start',
          icon: 'plus-circle',
          className: 'tw-btn-primary',
          title: '????????????',
          loading: false,
          hidden: false,
          disabled: selectedRows => {
            if (isEmpty(selectedRows) || isNil(selectedRows)) return false;
            // 1. ????????????????????????????????????????????????????????????????????????????????????????????????????????????SEARCHED????????????
            // 2. ??????????????????????????????????????????????????????????????????????????????????????????????????????
            // 3. ????????????????????????????????????????????????????????????????????????

            // step one: filter 1. 3.
            const useStatusApprStatusFilter = selectedRows.filter(
              (
                { useStatus, reimbursementStatus } // 1. useStatus ; 3. reimbursementStatusDesc
              ) =>
                useStatus === 'SEARCHED' ||
                !(
                  isNil(reimbursementStatus) ||
                  isEmpty(reimbursementStatus) ||
                  reimbursementStatus === 'UNREIM'
                )
            );
            const useStatusApprStatusSatisfy = isEmpty(useStatusApprStatusFilter);
            // step one: 2.
            const buyTypeUnique =
              Array.from(
                new Set(selectedRows.map(({ ticketPurchasingChannel }) => ticketPurchasingChannel))
              ).length === 1;
            return !buyTypeUnique || !useStatusApprStatusSatisfy;
          },
          minSelections: 2,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const ids = selectedRows.map(({ id }) => id);
            // dispatch({ type: `${DOMAIN}/batchExpense`, payload: { ids, queryParams } });
            router.push(`/plat/adminMgmt/ticketMgmt/details?idList=${ids.join(',')}`);
          },
        },

        {
          key: 'exportTrip',
          icon: 'export',
          className: 'tw-btn-warning',
          title: '?????????????????????',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows && selectedRows.length < 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const ids = selectedRowKeys.join(',');
            // aLink.download = '';
            window.open(`${SERVER_URL}/api/op/v1/tripTickets/statement/export?ids=${ids}`);
          },
        },
        {
          key: 'export',
          icon: 'export',
          className: 'tw-btn-warning',
          title: '???????????????????????????',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows && selectedRows.length < 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const ids = selectedRowKeys.join(',');
            window.open(`${SERVER_URL}/api/op/v1/tripTickets/reim/export?ids=${ids}`);
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper title="??????????????????">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default TicketMgmt;
