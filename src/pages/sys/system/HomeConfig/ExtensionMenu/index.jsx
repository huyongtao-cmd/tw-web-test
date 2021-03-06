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

const DOMAIN = 'HomeConfigExtensionMenu';

@connect(({ loading, HomeConfigExtensionMenu }) => ({
  HomeConfigExtensionMenu,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
class ExtensionMenuConfig extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    dispatch({ type: `${DOMAIN}/queryNav` });
    this.fetchData({
      sortBy: 'id',
      sortDirection: 'DESC',
      offset: 0,
      limit: 10,
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/query`, payload: { ...params } });
  };

  render() {
    const { loading, HomeConfigExtensionMenu, dispatch } = this.props;
    const { list, total, searchForm = {}, HomeConfigListNav = [] } = HomeConfigExtensionMenu;
    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: '100%' },
      loading,
      total,
      dataSource: list,
      showExport: false,
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
          title: formatMessage({ id: 'sys.system.menuConfig.name', desc: '????????????' }),
          dataIndex: 'menuName',
          options: {
            initialValue: searchForm.menuName,
          },
          tag: <Input placeholder="?????????????????????" />,
        },
      ],
      columns: [
        {
          title: formatMessage({ id: 'sys.system.menuConfig.name', desc: '????????????' }),
          dataIndex: 'menuName',
          className: 'text-center',
          width: '16%',
        },
        {
          title: formatMessage({ id: 'sys.market.banner.link', desc: '??????' }),
          dataIndex: 'menuLink',
          className: 'text-center',
          width: '30%',
        },
        {
          title: formatMessage({ id: 'sys.system.menuConfig.icon', desc: '??????' }),
          dataIndex: 'imgFile',
          className: 'text-center',
          width: '14%',
          render: (text, record) => (
            <div
              style={{
                background: '#f5f5f5',
              }}
            >
              <img
                src={`data:image/jpeg;base64,${text}`}
                alt=""
                style={{
                  height: '40px',
                  width: '40px',
                }}
              />
            </div>
          ),
        },
        {
          title: formatMessage({ id: 'sys.market.elSound.artSort', desc: '??????' }),
          dataIndex: 'menuSort',
          className: 'text-center',
          width: '14%',
        },
        {
          title: '??????',
          dataIndex: 'menuStatus',
          className: 'text-center',
          width: '10%',
          render: (val, record) => (val === 'YES' ? '??????' : '?????????'),
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
            router.push('/sys/system/homeConfig/extensionMenu/edit');
          },
        },
        {
          key: 'edit',
          icon: 'form',
          className: 'tw-btn-primary',
          title: formatMessage({ id: `misc.update`, desc: '??????' }),
          loading: false,
          hidden: false,
          disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push(`/sys/system/homeConfig/extensionMenu/edit?id=${selectedRows[0].id}`);
          },
        },
        {
          key: 'remove',
          className: 'tw-btn-error',
          title: formatMessage({ id: `misc.delete`, desc: '??????' }),
          loading: false,
          hidden: false,
          disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            dispatch({
              type: `${DOMAIN}/delete`,
              payload: selectedRowKeys[0],
            });
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper title="????????????????????????">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default ExtensionMenuConfig;
