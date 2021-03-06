import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import Link from 'umi/link';
import { Switch, Input, Select } from 'antd';
import { isNil, isEmpty } from 'ramda';
import { injectUdc, mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker, UdcSelect } from '@/pages/gen/field';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { formatMessage } from 'umi/locale';

const DOMAIN = 'sysMarketBanner';

@connect(({ loading, sysMarketBanner }) => ({
  sysMarketBanner,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
class BannerMgmt extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    this.fetchData({
      sortBy: 'id',
      sortDirection: 'DESC',
      offset: 0,
      limit: 10,
      title: '',
      category: 'HOME',
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/query`, payload: { ...params } });
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
    const { loading, sysMarketBanner, dispatch } = this.props;
    const { list, total, searchForm } = sysMarketBanner;
    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: '100%' },
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
          title: formatMessage({ id: 'sys.market.banner.title', desc: '??????' }),
          dataIndex: 'title',
          options: {
            initialValue: searchForm.title,
          },
          tag: <Input placeholder="????????????????????????" />,
        },
        {
          title: formatMessage({ id: 'sys.market.banner.category', desc: '??????' }),
          dataIndex: 'category',
          options: {
            initialValue: searchForm.category || 'HOME',
          },
          tag: <Selection.UDC code="OPE:BANNER_CATEGORY" placeholder="???????????????" />,
        },
      ],
      columns: [
        {
          title: formatMessage({ id: 'sys.market.banner.bannerTitle', desc: 'BANNER??????' }),
          dataIndex: 'title',
          width: '30%',
        },
        {
          title: formatMessage({ id: 'sys.market.banner.link', desc: '??????' }),
          dataIndex: 'url',
          className: 'text-center',
          width: '25%',
        },
        {
          title: formatMessage({ id: 'sys.market.banner.status', desc: '??????' }),
          dataIndex: 'docStatusName',
          width: '10%',
        },
        {
          title: formatMessage({ id: 'sys.market.banner.category', desc: '??????' }),
          dataIndex: 'categoryName',
          className: 'text-center',
          width: '15%',
        },
        {
          title: formatMessage({ id: 'sys.market.banner.remark', desc: '??????' }),
          dataIndex: 'mark',
          width: '20%',
        },
      ],
      leftButtons: [
        {
          key: 'add',
          icon: 'plus-circle',
          className: 'tw-btn-primary',
          title: formatMessage({ id: 'misc.insert', desc: '??????' }),
          loading: false,
          hidden: false,
          disabled: loading,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push('/plat/market/banner/create');
          },
        },
        // {
        //   key: 'details',
        //   icon: 'detail-fill',
        //   className: 'tw-btn-primary',
        //   title: formatMessage({ id: 'misc.details', desc: '????????????' }),
        //   loading: false,
        //   hidden: false,
        //   disabled: false,
        //   minSelections: 1,
        //   cb: (selectedRowKeys, selectedRows, queryParams) => {
        //     router.push(`/plat/market/banner/details?id=${selectedRows[0].id}`);
        //   },
        // },
        {
          key: 'edit',
          icon: 'form',
          className: 'tw-btn-primary',
          title: formatMessage({ id: `misc.update`, desc: '??????' }),
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 1,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push(`/plat/market/banner/Edit?id=${selectedRows[0].id}`);
          },
        },
        {
          key: 'remove',
          className: 'tw-btn-error',
          title: formatMessage({ id: `misc.delete`, desc: '??????' }),
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 2,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            dispatch({
              type: `${DOMAIN}/delete`,
              payload: selectedRowKeys,
            });
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper title="BANNER??????">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default BannerMgmt;
