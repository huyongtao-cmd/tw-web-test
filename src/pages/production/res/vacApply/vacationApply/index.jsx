import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import Link from 'umi/link';
import { Input } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';
import { getUrl } from '@/utils/flowToRouter';
import { stringify } from 'qs';

const DOMAIN = 'vacationApply';

@connect(({ loading, vacationApply, user }) => ({
  // loading,
  vacationApply,
  user,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
class VacationApply extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;

    const { _refresh } = fromQs();
    !(_refresh === '0') && dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    !(_refresh === '0') &&
      dispatch({
        type: `${DOMAIN}/updateSearchForm`,
      });
    !(_refresh === '0') &&
      this.fetchData({
        offset: 0,
        limit: 10,
        sortBy: 'id',
        sortDirection: 'DESC',
      });
  }

  fetchData = params => {
    const {
      dispatch,
      user: {
        user: {
          extInfo: { resId },
        },
      },
    } = this.props;
    dispatch({ type: `${DOMAIN}/query`, payload: { ...params, resId } });
  };

  render() {
    const {
      loading,
      dispatch,
      vacationApply: { list, total, searchForm },
    } = this.props;

    const tableProps = {
      rowKey: 'detailId',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: 1350 },
      loading,
      total,
      dataSource: list,
      enableSelection: false,
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
          title: '????????????',
          dataIndex: 'applyNo',
          options: {
            initialValue: searchForm.applyNo || '',
          },
          tag: <Input placeholder="?????????????????????" />,
        },
        {
          title: '????????????',
          dataIndex: 'date',
          options: {
            initialValue: searchForm.date,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
        {
          title: '??????',
          dataIndex: 'apprStatus',
          options: {
            initialValue: searchForm.apprStatus,
          },
          tag: <Selection.UDC code="COM:APPR_STATUS" placeholder="???????????????" />,
        },
        {
          title: '????????????',
          dataIndex: 'vacationType',
          options: {
            initialValue: searchForm.vacationType,
          },
          tag: <Selection.UDC code="COM:VACATION_TYPE" placeholder="?????????????????????" />,
        },
      ],
      columns: [
        {
          title: '????????????',
          dataIndex: 'applyNo',
          width: 150,
          align: 'center',
          render: (value, row) => {
            const href = `/user/center/myVacation/vacationApply/view?id=${row.id}`;
            return (
              <Link className="tw-link" to={href}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '????????????',
          dataIndex: 'detailVDate',
          align: 'center',
          width: 100,
        },
        {
          title: '????????????',
          dataIndex: 'vacationTypeDesc',
          align: 'center',
          width: 100,
        },
        {
          title: '????????????',
          dataIndex: 'detailVDays',
          align: 'center',
          width: 100,
        },
        {
          title: '??????',
          dataIndex: 'apprStatusDesc',
          align: 'center',
          width: 100,
        },
        {
          title: '?????????',
          dataIndex: 'resName',
          align: 'center',
          width: 100,
        },
        {
          title: '????????????',
          dataIndex: 'apprDate',
          align: 'center',
          width: 150,
        },
      ],
      leftButtons: [
        {
          key: 'myVacation',
          title: '????????????',
          type: 'primary',
          icon: 'detail',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows) => {
            const urls = getUrl();
            const from = stringify({ from: urls });
            router.push(`/user/center/info?${from}`);
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper title="????????????">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default VacationApply;
