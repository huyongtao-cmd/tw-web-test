import React, { Component } from 'react';
import { connect } from 'dva';
import { Switch, Tag, Input, Select, DatePicker, Radio } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { Selection, BuVersion } from '@/pages/gen/field';
import createMessage from '@/components/core/AlertMessage';
import { toQs, toUrl } from '@/utils/stringUtils';

// 采购合同付款计划预期列表
const DOMAIN = 'resPlanLog';

@connect(({ loading, resPlanLog }) => ({
  loading,
  resPlanLog,
}))
@mountToTab()
class ResPlanLog extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    dispatch({ type: `${DOMAIN}/queryAll` });
    dispatch({ type: `${DOMAIN}/selectTaskList` });
    // this.fetchData({ sortBy: 'id', sortDirection: 'ASC', disabled: undefined });
    this.fetchData();
  }

  fetchData = async (params = {}) => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/selectTaskList` });
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        time: undefined,
        startTime: params.time && params.time[0] ? params.time[0].format('YYYY-MM-DD') : undefined,
        endTime: params.time && params.time[1] ? params.time[1].format('YYYY-MM-DD') : undefined,
      },
    });
  };

  downLoad = id => {
    const params = {
      id: id,
    };
    location.href = toQs(`${SERVER_URL}/api/rpp/v1/bpLog/download`, params);
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
    const { loading, resPlanLog, dispatch } = this.props;
    const { list, total, searchForm, selectedRowKeys, bpLogAll, taskList } = resPlanLog;
    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      loading: loading.effects[`${DOMAIN}/query`],
      total,
      scroll: {
        x: 1400,
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
          title: '任务',
          dataIndex: 'taskNo',
          options: {
            initialValue: searchForm.taskNo || undefined,
          },
          tag: (
            <Selection.Columns
              source={taskList}
              columns={[
                { dataIndex: 'taskNo', title: '任务编号', span: 8 },
                { dataIndex: 'remark', title: '任务名称', span: 12 },
                { dataIndex: 'createUserName', title: '执行人', span: 4 },
              ]}
              transfer={{ key: 'taskNo', code: 'taskNo', name: 'remark' }}
              placeholder="请选择任务"
              showSearch
            />
          ),
        },
        {
          title: '批处理代码',
          dataIndex: 'processName',
          options: {
            initialValue: searchForm.processName,
          },
          tag: <Selection.UDC code="RPP:BATCH_CODE" placeholder="请选择批处理代码" />,
        },
        {
          title: '开始时间',
          dataIndex: 'time',
          options: {
            initialValue: searchForm.time,
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
          title: '处理状态',
          dataIndex: 'state',
          options: {
            initialValue: searchForm.state,
          },
          tag: <Selection.UDC code="RPP:BATCH_STATE" placeholder="请选择状态" />,
        },
      ],
      columns: [
        {
          title: '序号',
          dataIndex: 'id',
          className: 'text-center',
          width: 50,
          render: (value, record, index) => index + 1,
        },
        {
          title: '处理编号',
          dataIndex: 'processNo',
          className: 'text-center',
          width: 200,
        },
        {
          title: '处理名称',
          dataIndex: 'name',
          width: 200,
        },
        {
          title: '备注',
          dataIndex: 'remark',
          className: 'text-center',
          width: 150,
        },
        {
          title: '状态',
          dataIndex: 'stateName',
          className: 'text-center',
          width: 100,
        },
        {
          title: '处理件数',
          dataIndex: 'processNumber',
          className: 'text-center',
          width: 100,
        },
        {
          title: '开始时间',
          dataIndex: 'startTime',
          className: 'text-center',
          width: 250,
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
        },
        {
          title: '结束时间',
          dataIndex: 'endTime',
          className: 'text-center',
          width: 250,
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
        },
        {
          title: '日志下载',
          dataIndex: '',
          width: 100,
          render: (value, row, key) => <a onClick={() => this.downLoad(row.id)}>日志下载</a>,
        },
      ],
      leftButtons: [
        // {
        //   key: 'remove',
        //   className: 'tw-btn-error',
        //   title: '删除',
        //   loading: false,
        //   hidden: false,
        //   icon: 'delete',
        //   disabled: selectedRows => selectedRows.length !== 1,
        //   minSelections: 0,
        //   cb: (selectKeys, selectedRows, queryParams) => {
        //     dispatch({
        //       type: `${DOMAIN}/delete`,
        //       payload: {
        //         ids: selectKeys.join(','),
        //       },
        //     }).then(res => {
        //       if (res.ok) {
        //         createMessage({ type: 'success', description: '提交成功' });
        //         this.fetchData();
        //       } else {
        //         createMessage({ type: 'error', description: '提交失败' });
        //       }
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

export default ResPlanLog;
