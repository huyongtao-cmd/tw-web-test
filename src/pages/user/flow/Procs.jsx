import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, has } from 'ramda';
import { DatePicker, Select } from 'antd';
import Link from 'umi/link';
import router from 'umi/router';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { flowToRouter } from '@/utils/flowToRouter';
import { selectIamUsers } from '@/services/gen/list';
import { Selection } from '@/pages/gen/field';
import createMessage from '@/components/core/AlertMessage';
import { request } from '@/utils/networkUtils';
import { toUrl } from '@/utils/stringUtils';
import api from '@/api';

const DOMAIN = 'flowProcs';
const { Option } = Select;
const { revoke } = api.bpm;

const hasStartTime = has('startTime');

@connect(({ dispatch, loading, user, flowProcs }) => ({
  dispatch,
  user,
  flowProcs,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
class Procs extends Component {
  state = {};

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    this.fetchData({ sortBy: 'no', sortDirection: 'DESC', limit: 10 });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/query`, payload: params });
  };

  requestRealType = async rowData => {
    router.push('/');
  };

  renderLink = (value, rowData) => {
    const { defKey, id, taskId, docId, procIden } = rowData;
    // if (defKey === 'TSK_P07') {
    //   return (
    //     <Link className="tw-link" to={`/user/task/subpackDetail?id=${docId}`}>
    //       {value}
    //     </Link>
    //   );
    // }
    if (procIden === 'ACC_A22') {
      return (
        <a className="tw-link" onClick={() => this.requestRealType(rowData)}>
          {value}
        </a>
      );
    }
    const route = flowToRouter(procIden, {
      id,
      taskId,
      docId,
      mode: 'view',
      originalUrl: window.location.origin + '/user/flow/process?type=procs',
    });

    return (
      <Link className="tw-link" to={route}>
        {value}
      </Link>
    );
  };

  handleRevoked = prcId => {
    request.post(toUrl(revoke, { id: prcId })).then(({ response }) => {
      if (response.ok) {
        createMessage({ type: 'success', description: '????????????' });
        const { flowProcs, dispatch } = this.props;
        const { searchForm } = flowProcs;
        dispatch({ type: `${DOMAIN}/updateSearchForm`, payload: { selectedRowKeys: [] } });
        this.fetchData(searchForm);
      } else {
        createMessage({ type: 'error', description: `????????????????????????` });
      }
    });
  };

  tableCfg = () => {
    const { loading, flowProcs, dispatch, user = {} } = this.props;
    const { searchForm, list, total } = flowProcs;
    const tableProps = {
      rowKey: 'no',
      sortBy: 'no',
      sortDirection: 'DESC',
      scroll: {
        // x: '120%',
        // y: 330,
      },
      columnsCache: DOMAIN,
      dispatch,
      loading,
      expirys: 0,
      total,
      dataSource: list,
      searchForm,
      // enableSelection: false,
      onChange: filters => {
        if (hasStartTime(filters)) {
          const { startTime } = filters;
          const convertTime = startTime ? formatDT(startTime) : undefined;
          this.fetchData({ ...filters, startTime: convertTime });
        } else {
          this.fetchData(filters);
        }
      },
      onSearchBarChange: (_, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      leftButtons: [
        {
          key: 'delete',
          title: '??????',
          className: 'tw-btn-error',
          icon: 'warning',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const { id, todoInfo = {} } = selectedRows[0];
            const { workerNames, isInitial } = todoInfo;
            const { info = {}, roles = [] } = user.user || {};
            const { name } = info;
            if (!isInitial && !roles.includes('SYS_ADMIN')) {
              createMessage({ type: 'warn', description: '??????????????????????????????????????????' });
              return;
            }
            if (name === workerNames || roles.includes('SYS_ADMIN')) {
              // ??????????????????????????? ?????????????????????
              dispatch({
                type: `${DOMAIN}/deleteProc`,
                payload: id,
              });
            } else createMessage({ type: 'warn', description: '???????????????????????????' });
          },
        },
        {
          key: 'rollback',
          title: '??????',
          className: 'tw-btn-primary',
          icon: 'rollback',
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            !(
              selectedRows.length === 1 &&
              selectedRows[0].revokable &&
              // A45??????????????????????????????
              selectedRows[0].defKey !== 'ACC_A45'
            ),
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const { id } = selectedRows[0];
            this.handleRevoked(id);
          },
        },
      ],
      searchBarForm: [
        {
          title: '???????????????',
          dataIndex: 'todoAssigneeNameLike',
          options: {
            initialValue: searchForm.todoAssigneeNameLike,
          },
        },
        {
          title: '????????????',
          dataIndex: 'done',
          options: {
            initialValue: searchForm.done || 'all',
          },
          tag: (
            <Select>
              <Option value="all">??????</Option>
              <Option value="true">???</Option>
              <Option value="false">???</Option>
            </Select>
          ),
        },
        {
          title: '????????????',
          // dataIndex: 'defKey',
          dataIndex: 'procIden',
          options: {
            initialValue: searchForm.defKey,
          },
          tag: <Selection.UDC code="COM.WF_DEFINE" placeholder="?????????????????????" />,
        },
        {
          title: '????????????',
          dataIndex: 'no',
          options: {
            initialValue: searchForm.no,
          },
        },
        {
          title: '?????????',
          dataIndex: 'nameLike',
          options: {
            initialValue: searchForm.nameLike,
          },
        },
        {
          title: '????????????',
          dataIndex: 'infoLike',
          options: {
            initialValue: searchForm.infoLike,
          },
        },
        {
          title: '?????????',
          dataIndex: 'initiator',
          options: {
            initialValue: searchForm.initiator,
          },
          tag: <Selection source={() => selectIamUsers()} placeholder="??????????????????" />,
        },
        {
          title: '????????????(???)',
          dataIndex: 'sinceDate',
          options: {
            initialValue: searchForm.sinceDate,
          },
          tag: <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />,
        },
        {
          title: '????????????(???)',
          dataIndex: 'untilDate',
          options: {
            initialValue: searchForm.untilDate,
          },
          tag: <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />,
        },
      ],
      columns: [
        {
          title: '????????????',
          dataIndex: 'no',
          className: 'text-center',
          width: 150,
          render: this.renderLink,
        },
        {
          title: '????????????',
          dataIndex: 'docName',
          render: this.renderLink,
        },
        {
          title: '????????????',
          dataIndex: 'docInfo',
          width: 220,
        },
        {
          title: '????????????',
          dataIndex: 'startTime',
          sorter: true,
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
          // render: value => formatDT(value),
          width: 200,
        },
        {
          title: '?????????',
          dataIndex: 'initiatorName',
          width: 80,
          className: 'text-center',
        },
        {
          title: '???????????????',
          dataIndex: 'currentName',
          width: 80,
          className: 'text-center',
          render: (_, record) => {
            const current = record.todoInfo || {};
            if (isEmpty(current)) return <span>???</span>;
            return <span>{current.workerNames}</span>;
          },
        },
        {
          title: '???????????????',
          dataIndex: 'currentTask',
          width: 200,
          className: 'text-center',
          render: (_, record) => {
            const current = record.todoInfo || {};
            if (isEmpty(current)) return <span>???</span>;
            return <span>{current.taskNames}</span>;
          },
        },
        // {
        //   title: '?????????????????????',
        //   dataIndex: 'nextName',
        //   width: '15%',
        //   render: (_, record) => {
        //     const current = (record.taskInfo || []).filter(task => Number(task.taskSeq) === 1);
        //     if (isEmpty(current)) return <span>???</span>;
        //     return <span>{current[0].taskNames}</span>;
        //   },
        // },
        // {
        //   title: '???????????????',
        //   dataIndex: 'nextTask',
        //   width: '15%',
        //   render: (_, record) => {
        //     const current = (record.taskInfo || []).filter(task => Number(task.taskSeq) === 1);
        //     if (isEmpty(current)) return <span>???</span>;
        //     return <span>{current[0].candidates}</span>;
        //   },
        // },
      ],
    };
    return tableProps;
  };

  render() {
    return (
      <PageHeaderWrapper title="????????????">
        <DataTable {...this.tableCfg()} />
      </PageHeaderWrapper>
    );
  }
}

export default Procs;
