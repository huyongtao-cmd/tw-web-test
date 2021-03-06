import React from 'react';
import { connect } from 'dva';
import classnames from 'classnames';
import { DatePicker, Input, Select, Radio, Card, Button } from 'antd';
import { formatMessage, FormattedMessage } from 'umi/locale';
import { isEmpty, omit, isNil } from 'ramda';

import { injectUdc, mountToTab, closeThenGoto } from '@/layouts/routerControl';
import DataTable from '@/components/common/DataTable';
import SyntheticField from '@/components/common/SyntheticField';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { createAlert } from '@/components/core/Confirm';
import { UdcSelect } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';
import { TagOpt } from '@/utils/tempUtils';
import router from 'umi/router';
import Link from 'umi/link';

const DOMAIN = 'taskList';

@connect(({ loading, taskList }) => ({
  loading: loading.effects[`${DOMAIN}/query`],
  ...taskList,
}))
@injectUdc(
  {
    taskStatus: 'TSK:TASK_STATUS',
  },
  DOMAIN
)
@mountToTab()
class TaskList extends React.Component {
  componentDidMount() {
    const { resId } = fromQs();
    const { dispatch } = this.props;
    const defaultSearchForm = {
      receiverResId: resId,
    };
    const initialState = {
      searchForm: defaultSearchForm,
      dataSource: [],
      total: undefined,
      detailList: [],
      detailTotal: undefined,
      detailTitle: undefined,
    };
    dispatch({ type: `${DOMAIN}/updateState`, payload: initialState });
    dispatch({ type: `${DOMAIN}/queryResInfo`, payload: resId });
    this.fetchData({
      sortBy: 'id',
      sortDirection: 'DESC',
      ...defaultSearchForm,
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    const { createTime } = params || {};
    const noTime = isEmpty(createTime) || isNil(createTime) || isNil(createTime[0]);
    const time = {
      createStartTime: noTime ? undefined : formatDT(createTime[0]),
      createEndTime: noTime ? undefined : formatDT(createTime[1]),
    };
    const newParams = {
      ...time,
      ...omit(['createTime'], params),
      receiverResId: fromQs().resId,
    };

    dispatch({
      type: `${DOMAIN}/query`,
      payload: newParams,
    });
  };

  getTableProps = () => {
    const { dispatch, loading, searchForm, dataSource, total } = this.props;
    const { _udcMap = {} } = this.state;
    const { taskStatus } = _udcMap;

    return {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      scroll: { x: 2000 },
      columnsCache: DOMAIN,
      loading,
      total,
      dataSource,
      enableSelection: false,
      showClear: false,
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
          title: '????????????',
          dataIndex: 'createTime',
          options: {
            initialValue: searchForm.createTime,
          },
          tag: (
            <DatePicker.RangePicker
              className="x-fill-100"
              placeholder={['??????????????????', '??????????????????']}
              format="YYYY-MM-DD"
            />
          ),
        },
        // {
        //   title: '????????????',
        //   dataIndex: 'receiverResName',
        //   options: {
        //     initialValue: searchForm.receiverResName,
        //   },
        //   tag: <Input disabled />,
        // },
      ],
      columns: [
        {
          title: '??????',
          dataIndex: 'taskNo',
          sorter: true,
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'taskName',
          render: (value, row, index) => {
            const { resId, from } = fromQs();
            const url = from
              ? `/user/task/view?id=${
                  row.id
                }&from=/user/center/myTeam/taskList&resId=${resId}&source=${from}`
              : `/user/task/view?id=${row.id}&from=/user/center/myTeam/taskList&resId=${resId}`;
            return (
              <Link className="tw-link" to={url}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '????????????',
          dataIndex: 'taskStatus',
          align: 'center',
          render: status => <TagOpt value={status} opts={taskStatus} palette="red|green" />,
        },
        {
          title: '????????????',
          dataIndex: 'disterResName',
        },
        {
          title: '????????????',
          dataIndex: 'receiverResName',
        },
        {
          title: '????????????', // jobType1Name + jobType2Name + capasetLeveldName
          dataIndex: 'jobType1Name',
          // align: 'center',
          render: (value, row, index) =>
            [row.jobType1Name, row.jobType2Name, row.capasetLeveldName].join('-'),
        },
        {
          title: '????????????',
          dataIndex: 'reasonTypeName',
          align: 'center',
        },
        {
          title: '?????????',
          dataIndex: 'reasonName',
          // align: 'center',
        },
        {
          title: '???????????????',
          dataIndex: 'expenseBuName',
        },
        {
          title: '?????????BU', // expenseBuId === receiverBuId
          dataIndex: 'expenseBuId',
          align: 'center',
          render: (value, rows) => (
            <TagOpt
              value={+(rows.expenseBuId !== rows.receiverBuId)}
              opts={[{ code: 0, name: '???' }, { code: 1, name: '???' }]}
              palette="red|green"
            />
          ),
        },
        {
          title: '???????????????',
          dataIndex: 'transferFlag',
          align: 'center',
          render: (value, rows) => (
            <TagOpt
              value={value}
              opts={[{ code: 0, name: '???' }, { code: 1, name: '???' }]}
              palette="red|green"
            />
          ),
        },
        {
          title: 'BU?????????',
          dataIndex: 'buSettlePrice',
          align: 'right',
        },
        {
          title: '????????????',
          dataIndex: 'eqvaSalary',
          align: 'right',
        },
        {
          title: '?????????',
          dataIndex: 'eqvaQty',
          align: 'right',
        },
        {
          title: '???????????????',
          dataIndex: 'settledEqva',
          align: 'right',
        },
        {
          title: '????????????',
          dataIndex: 'acceptMethodName',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'pricingMethodName',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'createTime',
          align: 'center',
          render: createTime => formatDT(createTime),
        },
      ],
    };
  };

  render() {
    const { _udcMap = {} } = this.state;
    const { taskStatus } = _udcMap;

    return (
      <PageHeaderWrapper title="????????????">
        <Card className="tw-card-rightLine">
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            onClick={() => {
              const { from } = fromQs();
              from ? closeThenGoto(from) : closeThenGoto(`/user/center/myTeam`);
            }}
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>
        {taskStatus && <DataTable {...this.getTableProps()} />}
      </PageHeaderWrapper>
    );
  }
}

export default TaskList;
