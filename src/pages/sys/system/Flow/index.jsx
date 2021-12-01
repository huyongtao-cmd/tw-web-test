import React, { Component } from 'react';
import { formatMessage } from 'umi/locale';
import router from 'umi/router';
import Link from 'umi/link';
import { connect } from 'dva';
import { has } from 'ramda';
import { Upload, Button } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import DataTable from '@/components/common/DataTable';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { getCsrfToken, serverUrl } from '@/utils/networkUtils';
import api from '@/api';

const DOMAIN = 'flowMgmt';
const { procs } = api.bpm;
const hasStartTime = has('startTime');

@connect(({ dispatch, loading, flowMgmt }) => ({
  dispatch,
  flowMgmt,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
class Todo extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    this.fetchData({ sortBy: 'id', sortDirection: 'ASC' });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/query`, payload: params });
  };

  tableCfg = () => {
    const { loading, flowMgmt, dispatch } = this.props;
    const { searchForm, list, total } = flowMgmt;
    const tableProps = {
      rowKey: 'id',
      scroll: {
        // y: 330,
      },
      columnsCache: DOMAIN,
      dispatch,
      loading,
      expirys: 0,
      total,
      dataSource: list,
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
      searchBarForm: [
        {
          title: '流程类型',
          dataIndex: 'keyLike',
          options: {
            initialValue: searchForm.keyLike,
          },
        },
        {
          title: '流程名称',
          dataIndex: 'nameLike',
          options: {
            initialValue: searchForm.nameLike,
          },
        },
      ],
      columns: [
        {
          title: '流程定义ID',
          dataIndex: 'id',
          width: '40%',
        },
        {
          title: '流程定义Key',
          dataIndex: 'key',
          className: 'text-center',
          width: '15%',
        },
        {
          title: '流程定义名',
          dataIndex: 'name',
          width: '20%',
        },
        {
          title: '流程版本',
          dataIndex: 'versionTag',
          width: '10%',
        },
        {
          title: '定义版本',
          dataIndex: 'version',
          className: 'text-center',
          width: '8%',
        },
        {
          title: '上架时间',
          dataIndex: 'deployTime',
          width: '17%',
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
        },
        {
          title: '流程规则说明',
          dataIndex: 'detailInfo',
          width: '20%',
          render: (_key, { key, name }, index) => (
            <Link to={`/sys/flowMen/Flow/flowVersion?key=${key}&name=${name}`}>
              <span>查看规则</span>
            </Link>
          ),
        },
      ],
      leftButtons: [
        {
          key: 'config',
          icon: 'setting',
          className: 'tw-btn-primary',
          title: '流程节点配置',
          loading: false,
          hidden: false,
          disable: false,
          minSelections: 1,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const { id, key, name } = selectedRows[0];
            router.push(`/sys/flowMen/flow/managements?defId=${id}&name=${name}&key=${key}`);
          },
        },
        {
          key: 'remove',
          icon: 'file-excel',
          className: 'tw-btn-error',
          title: formatMessage({ id: `misc.delete`, desc: '删除' }),
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 1,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const selected = selectedRows[0];
            dispatch({
              type: `${DOMAIN}/unload`,
              payload: { id: selected.key },
            });
          },
        },
        {
          key: 'deployment',
          icon: 'deployment-unit',
          className: 'tw-btn-info',
          title: '流程部署',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: () => {
            document.getElementById('flow-upload').click();
          },
        },
        {
          key: 'flow',
          icon: 'user',
          className: 'tw-btn-info',
          title: '流程角色管理',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: () => {
            router.push('/sys/flowMen/flow/roles');
          },
        },
      ],
    };
    return tableProps;
  };

  onChange = ({ file, event }) => {
    const { status, error } = file;
    if (status === 'done') {
      this.fetchData({ sortBy: 'id', sortDirection: 'ASC' });
    } else if (status === 'error') {
      const { status: responseStatus } = error;
      createMessage({
        type: 'error',
        description: '部署失败',
      });
    }
  };

  render() {
    return (
      <PageHeaderWrapper title="流程管理">
        <DataTable {...this.tableCfg()} />
        <Upload
          accept="*/*"
          name="bpmnFile"
          action={`${serverUrl}${procs}`}
          headers={{
            'el-xsrf': getCsrfToken(),
          }}
          showUploadList={false}
          withCredentials
          onChange={this.onChange}
        >
          <Button id="flow-upload" style={{ display: 'none' }} />
        </Upload>
      </PageHeaderWrapper>
    );
  }
}

export default Todo;
