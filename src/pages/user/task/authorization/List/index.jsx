import React from 'react';
import { connect } from 'dva';
import { DatePicker, Input, Select, Radio } from 'antd';
import { formatMessage, FormattedMessage } from 'umi/locale';

import { injectUdc, mountToTab } from '@/layouts/routerControl';
import DataTable from '@/components/common/DataTable';
import SyntheticField from '@/components/common/SyntheticField';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { createAlert } from '@/components/core/Confirm';
import { Selection, BuVersion } from '@/pages/gen/field';
import { TagOpt } from '@/utils/tempUtils';
import router from 'umi/router';
import Link from 'umi/link';
import { fromQs } from '@/utils/stringUtils';
import EvalCommonModal from '@/pages/gen/eval/modal/Common';
import { getBuVersionAndBuParams } from '@/utils/buVersionUtils';
import { selectProjectConditional } from '@/services/user/project/project';
import SelectWithCols from '@/components/common/SelectWithCols';

const DOMAIN = 'authonzation';
const SEL_COL = [
  // span为宽度。 合计不要超过24
  { dataIndex: 'code', title: '编号', span: 12 },
  { dataIndex: 'name', title: '名称', span: 12 },
];
const applyStatusName = [
  { code: 'CREATE', name: '新建' },
  { code: 'DISPATCH', name: '派发中' },
  { code: 'IN PROCESS', name: '处理中' },
  { code: 'CLOSED', name: '关闭' },
];

// --------------- 需要的数据写在这里,或者由数据文件import进来(*.data.js) -----------------

/**
 * 公共空白模版页面
 */
@connect(({ dispatch, loading, authonzation, user }) => ({
  dispatch,
  loading,
  user,
  ...authonzation, // 代表与该组件相关redux的model
}))
@injectUdc(
  {
    taskStatus: 'TSK:TASK_STATUS',
  },
  DOMAIN
)
@mountToTab()
class AuthorizationList extends React.PureComponent {
  /**
   * 页面内容加载之前要做的事情放在这里
   */
  // eslint-disable-next-line
  constructor(props) {
    super(props);
    // this.setState({});
  }

  state = {
    visible: false,
    tableLoading: false,
  };

  /**
   * 渲染完成后要做的事情
   */
  componentDidMount() {
    const { dispatch } = this.props;
    const { taskStatus } = fromQs();
    // 项目列表
    dispatch({
      type: `${DOMAIN}/queryProjList`,
    });
    // 资源列表
    dispatch({
      type: `${DOMAIN}/queryResList`,
    });

    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'TASK_MANAGER_LIST' },
    });

    if (taskStatus === 'CLOSED') {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          searchForm: {
            taskStatus: ['0', 'CLOSED'],
          },
        },
      });
      // this.fetchData({ offset: 0, limit: 10, taskStatus: ['0', 'CLOSED'] });
    }
  }

  // --------------- 剩下的私有函数写在这里 -----------------

  fetchData = params => {
    const { dispatch } = this.props;
    const param = params;
    param.reasonId = params.reasonId?.id;
    param.createTimeStart = formatDT(params.createTimeStart);
    param.createTimeEnd = formatDT(params.createTimeEnd);
    param.receiverResId = params.receiverResId?.id;
    param.disterResId = params.disterResId?.id;
    this.setState({ tableLoading: true });
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        searchForm: {
          ...param,
          ...getBuVersionAndBuParams(params.expenseBuId, 'expenseBuId', 'expenseBuVersionId'),
        },
      },
    });
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...param,
        ...getBuVersionAndBuParams(params.expenseBuId, 'expenseBuId', 'expenseBuVersionId'),
      },
    }).then(response => {
      if (response.ok) {
        this.setState({ tableLoading: false });
      } else {
        createMessage({ type: 'warn', description: '查询失败' });
        this.setState({ tableLoading: false });
      }
    });
  };

  getTableProps = () => {
    const {
      dispatch,
      loading,
      searchForm,
      dataSource,
      total,
      pageConfig,
      resSource,
      taskProjSource,
      taskProjList,
      resList,
      user,
    } = this.props;
    const { _udcMap = {}, visible } = this.state;
    const {
      user: { extInfo, admin },
    } = user;
    const { tableLoading } = this.state;
    return {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      scroll: { x: 1600 },
      columnsCache: DOMAIN,
      loading: tableLoading,
      total,
      dataSource,
      rowSelection: {
        type: 'radio',
      },
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
          title: '任务包授权',
          dataIndex: 'keywords',
          tag: <Input placeholder="请输入任务包授权名称/编号" />,
        },
        {
          title: '项目',
          dataIndex: 'reasonId',
          tag: (
            <SelectWithCols
              labelKey="name"
              className="x-fill-100"
              placeholder="请选择项目"
              columns={SEL_COL}
              dataSource={taskProjSource}
              // onChange={value => {
              //   this.handleChangeReasonId(value);
              // }}
              selectProps={{
                // disabled: fromSubpack,
                showSearch: true,
                onSearch: value => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      taskProjSource: taskProjList.filter(
                        d =>
                          d.code.indexOf(value) > -1 ||
                          d.name.toLowerCase().indexOf(value.toLowerCase()) > -1
                      ),
                    },
                  });
                },
                allowClear: true,
              }}
            />
          ),
        },
        {
          title: '接收资源',
          dataIndex: 'receiverResId',
          tag: (
            <SelectWithCols
              labelKey="name"
              className="x-fill-100"
              columns={SEL_COL}
              dataSource={resSource}
              // onChange={value => {
              //   this.handleChangeReceiverResId(value);
              // }}
              selectProps={{
                // disabled: fromSubpack,
                showSearch: true,
                onSearch: value => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      resSource: resList.filter(
                        d =>
                          d.code.indexOf(value) > -1 ||
                          d.name.toLowerCase().indexOf(value.toLowerCase()) > -1
                      ),
                    },
                  });
                },
                allowClear: true,
              }}
            />
          ),
        },
        {
          title: '派发资源',
          dataIndex: 'disterResId',
          tag: (
            <SelectWithCols
              labelKey="name"
              className="x-fill-100"
              columns={SEL_COL}
              dataSource={resSource}
              // onChange={value => {
              //   this.handleChangeReceiverResId(value);
              // }}
              selectProps={{
                // disabled: fromSubpack,
                showSearch: true,
                onSearch: value => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      resSource: resList.filter(
                        d =>
                          d.code.indexOf(value) > -1 ||
                          d.name.toLowerCase().indexOf(value.toLowerCase()) > -1
                      ),
                    },
                  });
                },
                allowClear: true,
              }}
            />
          ),
        },
        {
          title: '承担费用BU',
          dataIndex: 'expenseBuId',
          tag: <BuVersion />,
        },
        {
          title: '状态',
          dataIndex: 'applyStatusArray',
          tag: (
            <SyntheticField className="tw-field-group">
              <Radio.Group
                className="tw-field-group-filter"
                buttonStyle="solid"
                style={{ width: '30%' }}
              >
                <Radio.Button value="0">=</Radio.Button>
                <Radio.Button value="1">≠</Radio.Button>
              </Radio.Group>
              {/* <Selection.UDC
                className="tw-field-group-field"
                code="TSK:TASK_STATUS"
                placeholder="请选择状态"
                showSearch
              /> */}
              <Select
                className="tw-field-group-filter"
                buttonStyle="solid"
                style={{ width: '70%' }}
              >
                {applyStatusName.map(item => (
                  <Select.Option value={item.code}>{item.name}</Select.Option>
                ))}
              </Select>
            </SyntheticField>
          ),
        },
        {
          title: '创建开始时间',
          dataIndex: 'createTimeStart',
          tag: (
            <DatePicker
              placeholder="请选择创建开始时间"
              format="YYYY-MM-DD"
              className="x-fill-100"
            />
          ),
        },
        {
          title: '创建结束时间',
          dataIndex: 'createTimeEnd',
          tag: (
            <DatePicker
              placeholder="请选择创建结束时间"
              format="YYYY-MM-DD"
              className="x-fill-100"
            />
          ),
        },
      ],
      columns: [
        {
          title: '编码',
          dataIndex: 'authorizedNo',
          align: 'center',
          render: (value, row, index) => (
            <Link className="tw-link" to={`/user/task/authonzation/detail?id=${row.id}`}>
              {value}
            </Link>
          ),
          width: 100,
        },
        {
          title: '任务包授权名称',
          dataIndex: 'name',
          align: 'center',
          render: (value, row, index) => (
            <Link className="tw-link" to={`/user/task/authonzation/detail?id=${row.id}`}>
              {value}
            </Link>
          ),
        },
        {
          title: '派发资源',
          dataIndex: 'disterResName',
          align: 'center',
          width: 100,
        },
        {
          title: '状态',
          dataIndex: 'applyStatus',
          align: 'center',
          render: value => <TagOpt value={value} opts={applyStatusName} palette="red|green" />,
          width: 100,
        },
        {
          title: '接收资源',
          dataIndex: 'receiverResName',
          align: 'center',
          width: 100,
        },

        {
          title: '事由类型',
          align: 'center',
          dataIndex: 'reasonTypeName',
          width: 100,
        },
        {
          title: '事由号',
          align: 'center',
          dataIndex: 'reasonName',
          width: 200,
        },
        {
          title: '费用承担方',
          align: 'center',
          dataIndex: 'expenseBuName',
          width: 160,
        },
        {
          title: '授权总当量',
          dataIndex: 'authEqva',
          align: 'center',
          width: 80,
        },
        {
          title: '已发当量',
          align: 'center',
          dataIndex: 'useEqva',
          width: 80,
        },
        {
          title: '已发任务包数',
          align: 'center',
          dataIndex: 'useCount',
          width: 80,
        },
        {
          title: '创建日期',
          align: 'center',
          dataIndex: 'createTime',
          render: value => formatDT(value, 'YYYY-MM-DD'),
          width: 200,
        },
      ],
      leftButtons: [
        {
          key: 'add',
          title: '新增',
          className: 'tw-btn-primary',
          icon: 'plus-circle',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push('/user/task/authonzation/add?from=/user/task/list');
          },
        },
        {
          key: 'edit',
          className: 'tw-btn-primary',
          title: formatMessage({ id: `misc.update`, desc: '修改' }),
          loading: false,
          icon: 'form',
          hidden: false,
          disabled: selectedRows => {
            let flag = false;
            flag =
              selectedRows[0]?.applyStatus === 'CREATE' &&
              (selectedRows[0]?.pmResId === user.user.extInfo.resId || user.user.admin);
            return !flag;
          },
          minSelections: 1,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            // 只有状态为新建的任务才可以修改
            if (selectedRows[0].applyStatus !== 'CREATE') {
              createMessage({ type: 'warn', description: '只有状态为新建的任务授权才可以修改。' });
              return;
            }
            if (selectedRows[0]?.pmResId !== user.user.extInfo.resId && !user.user.admin) {
              createMessage({
                type: 'warn',
                description: '该授权只有项目经理或者管理员才可以修改。',
              });
              return;
            }
            router.push(
              `/user/task/authonzation/add?id=${selectedRowKeys}&from=/user/authonzation/list`
            );
          },
        },
        {
          key: 'delete',
          className: 'tw-btn-error',
          title: '删除',
          loading: false,
          icon: 'delete',
          hidden: false,
          disabled: selectedRows => {
            let flag = false;
            flag =
              selectedRows[0]?.applyStatus === 'CREATE' &&
              (selectedRows[0]?.pmResId === extInfo.resId || admin);
            return !flag;
          },
          minSelections: 1,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            if (selectedRows[0].applyStatus !== 'CREATE') {
              createMessage({ type: 'warn', description: '只有状态为新建的授权才可以删除。' });
              return;
            }
            if (selectedRows[0]?.pmResId !== extInfo.resId && !admin) {
              createMessage({
                type: 'warn',
                description: '该授权只有项目经理或者管理员才可以删除。',
              });
              return;
            }
            dispatch({
              type: `${DOMAIN}/delete`,
              payload: { keys: selectedRowKeys[0] },
            }).then(response => {
              if (response) {
                dispatch({
                  type: `${DOMAIN}/query`,
                  payload: searchForm,
                });
              }
            });
          },
        },
        {
          key: 'originate',
          // className: 'tw-btn-info',
          className: 'tw-btn-primary',
          title: '变更',
          loading: false,
          icon: 'upload',
          hidden: true,
          disabled: selectedRows => {
            let flag = false;
            flag =
              selectedRows[0]?.applyStatus === 'IN PROCESS' &&
              (selectedRows[0]?.pmResId === extInfo.resId ||
                selectedRows[0]?.deliResId === extInfo.resId ||
                admin);
            return !flag;
          },
          minSelections: 1,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            if (selectedRows[0].applyStatus !== 'IN PROCESS') {
              createMessage({ type: 'warn', description: '只有状态为处理中的授权才可以变更。' });
              return;
            }
            if (
              selectedRows[0]?.pmResId !== extInfo.resId &&
              selectedRows[0]?.deliResId !== extInfo.resId &&
              !admin
            ) {
              createMessage({
                type: 'warn',
                description: '该授权只有项目经理或者交付负责人或者管理员才可以变更。',
              });
              return;
            }
            dispatch({
              type: `${DOMAIN}/checkDist`,
              payload: { reasonId: selectedRowKeys[0], reasonType: 'TASK', id: selectedRowKeys[0] },
            });
          },
        },
        {
          key: 'change',
          // className: 'tw-btn-info',
          className: 'tw-btn-primary',
          title: '打开/关闭',
          loading: false,
          icon: 'branches',
          hidden: false,
          disabled: (selectedRows, filters) => {
            let flag = false;
            flag =
              (selectedRows[0]?.applyStatus === 'IN PROCESS' ||
                selectedRows[0]?.applyStatus === 'CLOSED') &&
              (selectedRows[0]?.pmResId === extInfo.resId ||
                selectedRows[0]?.deliResId === extInfo.resId ||
                admin);
            return !flag;
          },
          minSelections: 1,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            if (
              selectedRows[0].applyStatus !== 'IN PROCESS' &&
              selectedRows[0].applyStatus !== 'CLOSED'
            ) {
              createMessage({
                type: 'warn',
                description: '只有状态为处理中的任务才可以打开/关闭。',
              });
              return;
            }
            if (
              selectedRows[0]?.pmResId !== extInfo.resId &&
              selectedRows[0]?.deliResId !== extInfo.resId &&
              !admin
            ) {
              createMessage({
                type: 'warn',
                description: '该授权只有项目经理或者交付负责人或者管理员才可以打开/关闭。',
              });
              // return;
            }
            dispatch({
              type: `${DOMAIN}/updateAuthStatus`,
              payload: {
                applyStatus: selectedRows[0].applyStatus === 'CLOSED' ? 'IN PROCESS' : 'CLOSED',
                id: selectedRowKeys[0],
              },
            }).then(response => {
              if (response) {
                dispatch({
                  type: `${DOMAIN}/query`,
                  payload: searchForm,
                });
              }
            });
          },
        },
        {
          key: 'pending',
          // className: 'tw-btn-error',
          className: 'tw-btn-primary',
          title: '派发任务包',
          loading: false,
          icon: 'rollback',
          // hidden: true,
          disabled: selectedRows => {
            let flag = false;
            flag =
              selectedRows[0]?.applyStatus === 'IN PROCESS' &&
              selectedRows[0]?.receiverResId === extInfo.resId;
            return !flag;
          },
          minSelections: 1,
          // cb: (selectedRowKeys, selectedRows, queryParams) => {
          //   if (selectedRows[0].applyStatus !== 'IN PROCESS') {
          //     createMessage({ type: 'warn', description: '只能暂挂处理中的任务。' });
          //     return;
          //   }
          //   dispatch({
          //     type: `${DOMAIN}/pending`,
          //     payload: {
          //       id: selectedRowKeys[0],
          //     },
          //   });
          // },
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            router.push(
              `/user/task/edit?authId=${selectedRowKeys[0]}&from=/user/authonzation/list`
            );
          },
        },
      ],
    };
  };

  // --------------- 私有函数区域结束 -----------------

  /**
   * 交给React渲染页面的函数(任何this.state和connect中解构的this.props中监听的对象属性修改都会触发这个操作)
   * @return {React.ReactElement}
   */
  render() {
    // const { dispatch, loading, searchForm, dataSource, total } = this.props;
    const { _udcMap = {}, visible } = this.state;
    const { taskStatus } = _udcMap;
    const { pageConfig, loading } = this.props;
    return (
      <PageHeaderWrapper title="任务授权列表">
        <DataTable {...this.getTableProps()} />
        <EvalCommonModal
          visible={visible}
          toggle={() => this.setState({ visible: !visible })}
          modalLoading={loading.effects[`evalCommonModal/query`]}
        />
      </PageHeaderWrapper>
    );
  }
}

export default AuthorizationList;
