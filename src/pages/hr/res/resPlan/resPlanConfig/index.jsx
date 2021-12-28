import React, { PureComponent } from 'react';
import { Input, Form } from 'antd';
import { connect } from 'dva';
import router from 'umi/router';
import DataTable from '@/components/common/DataTable';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { Selection, DatePicker } from '@/pages/gen/field';
import createMessage from '@/components/core/AlertMessage';
import { isEmpty } from 'ramda';
import { createConfirm } from '@/components/core/Confirm';
import { formatDT } from '@/utils/tempUtils/DateTime';
import Link from 'umi/link';
import { selectIamUsers } from '@/services/gen/list';

const DOMAIN = 'resPlanConfig';
@connect(({ loading, resPlanConfig, dispatch }) => ({
  loading,
  resPlanConfig,
  dispatch,
  // global,
}))
@Form.create({
  onValuesChange(props, changedValues, allValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
class ResPlanConfig extends PureComponent {
  componentDidMount() {
    this.fetchData({
      sortBy: 'id',
      sortDirection: 'DESC',
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    const { createTime = [], lastRunningTime = [] } = params;
    // eslint-disable-next-line no-param-reassign
    [params.createTimeStart, params.createTimeEnd] = createTime;
    // eslint-disable-next-line no-param-reassign
    [params.lastRunningTimeStart, params.lastRunningTimeEnd] = lastRunningTime;

    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        sortBy: 'id',
        sortDirection: 'DESC',
      },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      resPlanConfig: { searchForm, dataSource = [], total = 0 },
      // global: { userList },
    } = this.props;

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      dispatch,
      loading: loading.effects[`${DOMAIN}/query`],
      total,
      dataSource,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchBarForm: [
        {
          title: '文件编码',
          dataIndex: 'configNo',
          options: {
            initialValue: searchForm.configNo || undefined,
          },
          tag: <Input placeholder="请输入文件编码" />,
        },
        {
          title: '文件名称',
          dataIndex: 'configName',
          options: {
            initialValue: searchForm.configName || undefined,
          },
          tag: <Input placeholder="请输入文件名称" />,
        },
        {
          title: '创建人',
          dataIndex: 'createUserId',
          options: {
            initialValue: searchForm.resId || undefined,
          },
          tag: (
            <Selection.Columns
              // source={userList}
              source={() => selectIamUsers()}
              columns={[
                { dataIndex: 'code', title: '编号', span: 10 },
                { dataIndex: 'name', title: '名称', span: 14 },
              ]}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              placeholder="请选择创建人"
              showSearch
            />
          ),
        },

        {
          title: '创建时间',
          dataIndex: 'createTime',
          options: {
            initialValue: searchForm.createTime || [],
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
        {
          title: '最近运行时间',
          dataIndex: 'lastRunningTime',
          options: {
            initialValue: searchForm.lastRunningTime || [],
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
      ],
      leftButtons: [
        {
          key: 'add',
          className: 'tw-btn-primary',
          title: '新增',
          loading: false,
          hidden: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push('/hr/resPlan/resPlanConfig/edit');
          },
        },
        {
          key: 'edit',
          className: 'tw-btn-primary',
          title: '修改',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push(`/hr/resPlan/resPlanConfig/edit?id=${selectedRows[0].id}`);
          },
        },
        {
          key: 'copy',
          className: 'tw-btn-primary',
          title: '复制',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push(`/hr/resPlan/resPlanConfig/edit?id=${selectedRows[0].id}&copy=true`);
          },
        },
        {
          key: 'remove',
          className: 'tw-btn-error',
          title: '删除',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length < 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            createConfirm({
              content: '确认删除所选记录？',
              onOk: () =>
                dispatch({
                  type: `${DOMAIN}/delete`,
                  payload: { ids: selectedRowKeys.join(',') },
                }),
            });
          },
        },
      ],
      columns: [
        {
          title: '文件编码',
          dataIndex: 'configNo',
          align: 'center',
          render: (value, row) => {
            const { id } = row;
            // const href = `/hr/resPlan/resPlanConfig/view?id=${id}&pageMode=purchase&from=list`;
            const href = `/hr/resPlan/resPlanConfig/detail?id=${id}&pageMode=purchase&from=list`;
            return (
              <Link className="tw-link" to={href}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '文件名称',
          dataIndex: 'configName',
          align: 'center',
        },
        {
          title: '创建人',
          dataIndex: 'createUserName',
          align: 'center',
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          align: 'center',
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
        },
        {
          title: '最近运行时间',
          dataIndex: 'lastRunningTime',
          align: 'center',
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
        },
      ],
    };

    return (
      <PageHeaderWrapper title="资源规划配置">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default ResPlanConfig;
