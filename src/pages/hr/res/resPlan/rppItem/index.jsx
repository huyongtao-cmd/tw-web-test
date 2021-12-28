import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Radio } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';

import { Selection } from '@/pages/gen/field';
import { isEmpty } from 'ramda';
import styleTemp from './style.less';

const DOMAIN = 'rppItemDomain';

// 动态列属性初始化
const columnTemp = {
  title: '',
  dataIndex: 'itemDetailViewList',
  align: 'center',
  // width: 50,
  render: '',
};
// 动态列数组初始化
let extraCols = [];
@connect(({ loading, rppItemDomain }) => ({
  rppItemDomain,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
class RppItemDomain extends PureComponent {
  componentDidMount() {
    const {
      dispatch,
      rppItemDomain: { taskList = [] },
    } = this.props;
    dispatch({ type: `${DOMAIN}/selectTaskList`, payload: { state: 'OK' } });
    dispatch({
      type: `${DOMAIN}/mainCapasetLevelNameList`,
      payload: { taskNo: taskList.length > 0 ? taskList[0].taskNo : '' },
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    // 刷新任务
    dispatch({ type: `${DOMAIN}/selectTaskList`, payload: { state: 'OK' } });
    // 查询列表数据
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
      },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      rppItemDomain: {
        list = [],
        total = 0,
        taskList = [],
        mainCapasetLevelNameList = [],
        columnNum = 0,
        searchForm,
      },
    } = this.props;
    const styles = {
      cursor: 'pointer',
    };
    styles.color = '#008FDB'; // 蓝色
    const temp = [];
    // 动态列数量
    const columnNumTemp = list.length > 0 ? list[0].itemDetailViewList.length : 0;
    for (let index = 0; index < columnNumTemp; index += 1) {
      temp.push({
        ...columnTemp,
        title: (
          <span style={styles}>
            {list.length > 0 ? list[0].itemDetailViewList[index].yearWeek : ''}
          </span>
        ),
        dataIndex: columnTemp.dataIndex + '[' + index + '].days',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          if (row.rppType === 'CAPACITY_SHORTAGE') {
            if (value > 0) {
              obj.props.className = styleTemp.OrangeRed;
            }
          }
          if (row.rppType === 'OVERCAPACITY_MAIN' || row.rppType === 'OVERCAPACITY_SECOND') {
            if (value > 0) {
              obj.props.className = styleTemp.Gold;
            }
          }
          return obj;
        },
      });
    }
    extraCols = !isEmpty(list)
      ? temp
      : [
          {
            title: '',
            dataIndex: 'itemDetailViewList1',
            align: 'center',
            render: '',
          },
        ];

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: {
        x: 'max-content',
      },
      loading,
      total,
      dataSource: list,
      enableSelection: false,
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
          title: '行类型', //QUERY_ALL 全部 QUERY_SHORTAGE 资源缺口 QUERY_OVERCAPACITY 主能力过剩\副能力过剩
          dataIndex: 'rppTypeEnum',
          options: {
            initialValue: searchForm.rppTypeEnum || undefined,
          },
          tag: (
            <Radio.Group>
              <Radio value="QUERY_ALL">全部</Radio>
              <Radio value="QUERY_SHORTAGE">资源缺口</Radio>
              <Radio value="QUERY_OVERCAPACITY">资源过剩</Radio>
            </Radio.Group>
          ),
        },
        {
          title: '复合能力',
          dataIndex: 'mainCapasetLevelName',
          options: {
            initialValue: searchForm.mainCapasetLevelName || undefined,
          },
          tag: (
            <Selection.Columns
              source={mainCapasetLevelNameList}
              columns={[{ dataIndex: 'mainCapasetLevelName', title: '复合能力', span: 14 }]}
              transfer={{
                key: 'mainCapasetLevelName',
                code: 'mainCapasetLevelName',
                name: 'mainCapasetLevelName',
              }}
              placeholder="请选择任务"
              showSearch
            />
          ),
        },
      ],
      columns: [
        {
          title: '复合能力',
          key: 'mainCapasetLevelName',
          dataIndex: 'mainCapasetLevelName',
          align: 'left',
          fixed: 'left',
          width: 300,
          // render: (value, row, index) => {
          //   if (list.length > 0 && list[0].rppType === 'REQUIREMENT_SUM') {
          //     const obj = {
          //       children: value,
          //       props: {},
          //     };
          //     if (row.rppType === 'REQUIREMENT_SUM') {
          //       obj.props.rowSpan = 3;
          //     }
          //     if (row.rppType === 'ALLOCATE') {
          //       obj.props.rowSpan = 0;
          //     }
          //     if (row.rppType === 'CAPACITY_SHORTAGE') {
          //       obj.props.rowSpan = 0;
          //     }
          //     return obj;
          //   }
          //   return value;
          // },
        },
        {
          title: '',
          key: 'rppTypeName',
          dataIndex: 'rppTypeName',
          align: 'left',
          fixed: 'left',
          width: 100,
        },
        ...extraCols,
      ],
      leftButtons: [],
    };

    return (
      <PageHeaderWrapper title="资源规划批处理查询">
        <DataTable
          rowClassName={record => {
            // 总需求 （资源总需求）
            if (record.rppType === 'REQUIREMENT_SUM') {
              return styleTemp.Honeydew;
            }
            // 供给（资源匹配）
            if (record.rppType === 'ALLOCATE') {
              return styleTemp.LightSkyBlue;
            }
            if (record.rppType === 'CAPACITY_SHORTAGE') {
              return styleTemp.LavenderBlush;
            }
            if (
              record.rppType === 'OVERCAPACITY_MAIN' ||
              record.rppType === 'OVERCAPACITY_SECOND'
            ) {
              return styleTemp.LightYellow;
            }
            return null;
          }}
          {...tableProps}
        />
      </PageHeaderWrapper>
    );
  }
}

export default RppItemDomain;
