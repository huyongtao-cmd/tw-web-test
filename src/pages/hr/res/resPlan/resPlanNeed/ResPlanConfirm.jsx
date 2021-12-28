// 框架类
import React, { Component } from 'react';
import { Input } from 'antd';
import moment from 'moment';
import router from 'umi/router';
import { connect } from 'dva';

// 产品化组件
import PageWrapper from '@/components/production/layout/PageWrapper';
import { Selection } from '@/pages/gen/field';
import DataTable from '@/components/common/DataTable';
import { fromQs } from '@/utils/stringUtils';
import createMessage from '@/components/core/AlertMessage';

const DOMAIN = 'resPlanNeed';

/**
 * 资源规划需求处理确认
 */
@connect(({ user, resPlanNeed, dispatch, loading }) => ({
  user,
  resPlanNeed,
  dispatch,
  loading,
}))
class ResPlanConfirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmLoading: false, // 确定按钮loading
      readLoading: false, // 已读按钮loading
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  // 查询列表数据
  fetchData = params => {
    const { ids } = fromQs();
    const { dispatch } = this.props;
    // 查询列表数据
    dispatch({
      type: `${DOMAIN}/resPlanConfirmList`,
      payload: {
        ...params,
        offset: 0,
        limit: 10,
        sortBy: 'id',
        sortDirection: 'DESC',
        flag: '1',
        ids,
      },
    });
  };

  // 确定和已读
  resPlanSubmit = (params, btnLoading) => {
    const { confirmLoading, readLoading } = this.state;
    const { dispatch } = this.props;
    btnLoading === 'confirmLoading'
      ? this.setState({ confirmLoading: true })
      : this.setState({ readLoading: true });
    dispatch({
      type: `${DOMAIN}/confirmOrRecommended`,
      payload: params,
    });
    btnLoading === 'confirmLoading'
      ? this.setState({ confirmLoading: false })
      : this.setState({ readLoading: false });
  };

  render() {
    const { confirmLoading, readLoading } = this.state;
    const { dispatch, resPlanNeed, loading } = this.props;
    const { searchForm, resPlanConfirmList, confirmTotal } = resPlanNeed;
    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: 'max-content' },
      loading: loading.effects[`${DOMAIN}/resPlanConfirmList`],
      confirmTotal,
      dataSource: resPlanConfirmList.length > 0 ? resPlanConfirmList : [], // 存放列表数据
      enableSelection: true, // 是否显示勾选框
      // rowSelection: { type: 'radio' }, // 单选
      showExport: true, // 是否显示导出按钮
      onChange: filters => this.fetchData(filters), // 分页、排序、筛选变化时触发
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchForm,
      searchBarForm: [
        {
          title: '计划类型',
          dataIndex: 'planType',
          options: {
            initialValue: searchForm.planType || undefined,
          },
          tag: <Selection.UDC code="COM:PLAN_TYPE" placeholder="请选择计划类型" allowClear />,
        },
        {
          title: '计划对象',
          dataIndex: 'resName',
          options: {
            initialValue: searchForm.resName || undefined,
          },
          tag: <Input placeholder="请输入计划对象" />,
        },
      ],
      columns: [
        {
          title: '类型',
          align: 'center',
          dataIndex: 'planTypeDesc',
        },
        {
          title: '对象',
          align: 'center',
          dataIndex: 'objName',
        },
        {
          title: '负责人',
          align: 'center',
          dataIndex: 'deliResName',
        },
        {
          title: '角色',
          align: 'center',
          dataIndex: 'role',
        },
        {
          title: '原资源',
          align: 'center',
          dataIndex: 'resName',
        },
        {
          title: '状态',
          align: 'center',
          dataIndex: 'planRoleStatusDesc',
        },
        {
          title: '读取状态',
          align: 'center',
          dataIndex: 'readStatusDesc',
        },
        {
          title: '推荐资源',
          align: 'center',
          dataIndex: 'recommendResName',
        },
        {
          title: '复合能力',
          align: 'center',
          dataIndex: 'capasetLevelName',
        },
        {
          title: '开始日期',
          align: 'center',
          dataIndex: 'startDate',
          render: (value, row, index) => moment(row.startDate).format('YYYY-MM-DD'),
        },
        {
          title: '结束日期',
          align: 'center',
          dataIndex: 'endDate',
        },
        {
          title: '合计人天',
          align: 'center',
          dataIndex: 'totalDays',
        },
        {
          title: '剩余人天',
          align: 'center',
          dataIndex: 'remainingDays',
        },
        {
          title: '当量系数',
          align: 'center',
          dataIndex: 'distributeRate',
        },
      ],
      leftButtons: [
        {
          key: 'confirm',
          title: '确定',
          type: 'primary',
          className: 'tw-btn-primary',
          size: 'large',
          loading: confirmLoading,
          minSelections: 0,
          cb: async (selectedRowKeys, selectedRows, queryParams) => {
            const lists = [];
            selectedRows.forEach((item, index) => {
              lists.push({
                id: item.id,
                resId: item.recommendResId,
                recommendResId: '',
                planRoleStatus: 'CONFIRM',
                readStatus: 'READ',
              });
            });
            await this.resPlanSubmit(lists, 'confirmLoading');
            this.fetchData();
          },
          disabled: selectedRows => selectedRows.length === 0,
        },
        {
          key: 'read',
          title: '已读',
          type: 'primary',
          size: 'large',
          loading: readLoading,
          minSelections: 0,
          cb: async (selectedRowKeys, selectedRows, queryParams) => {
            const lists = [];
            const readErrs = [];
            selectedRows.forEach((item, index) => {
              if (item.readStatus === 'READ') {
                readErrs.push('error');
              } else {
                lists.push({
                  id: item.id,
                  readStatus: 'READ',
                });
              }
            });
            if (readErrs.length) {
              createMessage({
                type: 'error',
                description: '请选择未读数据',
              });
              return;
            }
            await this.resPlanSubmit(lists, 'readLoading');
            this.fetchData();
          },
          disabled: selectedRows => selectedRows.length === 0,
        },
      ],
    };

    return (
      <PageWrapper>
        <DataTable {...tableProps} />
      </PageWrapper>
    );
  }
}

export default ResPlanConfirm;
