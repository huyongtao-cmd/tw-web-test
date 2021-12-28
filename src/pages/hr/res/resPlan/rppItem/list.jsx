import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Input, Radio } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';

import { Selection } from '@/pages/gen/field';
import { isEmpty } from 'ramda';
import api from '@/api';
import { createConfirm } from '@/components/core/Confirm';
import { toQs } from '@/utils/stringUtils';

const DOMAIN = 'rppItemDomainList';

const {
  rppItemExcelExport, // excel导出
} = api.hr.resPlan;

// 动态列属性初始化
const columnTemp = {
  title: '',
  dataIndex: 'itemDetailViewList',
  align: 'center',
  // width: 50,
  render: '',
};
const rppTypeSearchList = [
  {
    code: '',
    name: '全部',
  },
  {
    code: 'REQUIREMENT',
    name: '资源需求',
  },
  {
    code: 'SUPPLY',
    name: '资源供给',
  },
  {
    code: 'REQUIREMENT_SUM',
    name: '资源需求汇总',
  },
  {
    code: 'ALLOCATE',
    name: '资源分配',
  },
  {
    code: 'CAPACITY_SHORTAGE',
    name: '资源不足',
  },
  {
    code: 'OVERCAPACITY_MAIN',
    name: '主能力过剩',
  },
  {
    code: 'OVERCAPACITY_SECOND',
    name: '辅能力过剩',
  },
];
// 动态列数组初始化
let extraCols = [];

@connect(({ loading, rppItemDomainList }) => ({
  rppItemDomainList,
  loading: loading.effects[`${DOMAIN}/queryList`],
}))
@mountToTab()
class RppItemListDomain extends PureComponent {
  componentDidMount() {
    const {
      dispatch,
      rppItemDomainList: { taskList = [] },
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
      type: `${DOMAIN}/queryList`,
      payload: {
        ...params,
      },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      rppItemDomainList: {
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
        // render: (value, row, index) => {
        //   const obj = {
        //     children: value,
        //     props: {},
        //   };
        //   if (row.rppType === 'CAPACITY_SHORTAGE') {
        //     if (value > 0) {
        //       obj.props.className = styleTemp.OrangeRed;
        //     }
        //   }
        //   if (row.rppType === 'OVERCAPACITY_MAIN' || row.rppType === 'OVERCAPACITY_SECOND') {
        //     if (value > 0) {
        //       obj.props.className = styleTemp.Gold;
        //     }
        //   }
        //   return obj;
        // },
        render: (value, row, index) => {
          return value;
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
            <Selection.Columns
              source={rppTypeSearchList}
              columns={[{ dataIndex: 'name', title: '类型', span: 14 }]}
              transfer={{ key: 'code', code: 'code', name: 'name' }}
              placeholder="请选择行类型"
              showSearch
            />
          ),
        },
        {
          title: '资源姓名',
          dataIndex: 'resName',
          options: {
            initialValue: searchForm.resName || undefined,
          },
          tag: <Input placeholder="请输入资源姓名" />,
        },
        {
          title: '项目商机名称',
          dataIndex: 'docName',
          options: {
            initialValue: searchForm.docName || undefined,
          },
          tag: <Input placeholder="请输入项目商机名称" />,
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
          title: '序号',
          dataIndex: 'id',
          className: 'text-center',
          width: 50,
          fixed: 'left',
          render: (value, record, index) => index + 1,
        },
        {
          title: '行类型',
          key: 'rppTypeName',
          dataIndex: 'rppTypeName',
          align: 'left',
          fixed: 'left',
          width: 100,
        },
        {
          title: '类型',
          key: 'docType',
          dataIndex: 'docType',
          align: 'left',
          fixed: 'left',
          width: 50,
          render: (value, row, index) => {
            if (value) {
              if (value === 'OPPORTUNITY') {
                return '商机';
              } else if (value === 'PROJECT') {
                return '项目';
              }
            }
            return '';
          },
        },
        {
          title: '项目名称',
          key: 'docName',
          dataIndex: 'docName',
          align: 'left',
          fixed: 'left',
          width: 100,
          render: (value, row, index) => {
            if (value) {
              return value;
            }
            return '';
          },
        },
        {
          title: '项目角色',
          key: 'roleName',
          dataIndex: 'roleName',
          align: 'left',
          fixed: 'left',
          width: 100,
          render: (value, row, index) => {
            if (value) {
              return value;
            }
            return '';
          },
        },
        {
          title: '资源姓名',
          key: 'resName',
          dataIndex: 'resName',
          align: 'left',
          fixed: 'left',
          width: 100,
          render: (value, row, index) => {
            if (value) {
              return value;
            }
            return '';
          },
        },
        {
          title: '主能力',
          key: 'mainCapasetLevelName',
          dataIndex: 'mainCapasetLevelName',
          align: 'left',
          fixed: 'left',
          width: 150,
          render: (value, row, index) => {
            if (value) {
              return value;
            }
            return '';
            // if (list.length > 0 && list[0].rppType === 'REQUIREMENT_SUM') {
            //   const obj = {
            //     children: value,
            //     props: {},
            //   };
            //   if (row.rppType === 'REQUIREMENT_SUM') {
            //     obj.props.rowSpan = 3;
            //   }
            //   if (row.rppType === 'ALLOCATE') {
            //     obj.props.rowSpan = 0;
            //   }
            //   if (row.rppType === 'CAPACITY_SHORTAGE') {
            //     obj.props.rowSpan = 0;
            //   }
            //   return obj;
            // }
            // return value;
          },
        },
        {
          title: '副能力',
          key: 'setCapasetLevelName',
          dataIndex: 'setCapasetLevelName',
          align: 'left',
          fixed: 'left',
          width: 150,
          render: (value, row, index) => {
            if (value) {
              return value;
            }
            return '';
          },
        },
        ...extraCols,
      ],
      leftButtons: [
        {
          key: 'exportExcel',
          icon: 'monitor',
          className: 'tw-btn-primary',
          title: '导出',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRowKeys => !selectedRowKeys.length === 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            createConfirm({
              content: `即将下载Excel文件，确定吗？`,
              onOk: () => {
                window.open(
                  toQs(`${SERVER_URL}/${rppItemExcelExport}`, {
                    ...searchForm,
                  })
                );
              },
            });
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper title="资源规划批处理查询">
        <DataTable
          // rowClassName={record => {
          //   // 总需求 （资源总需求）
          //   if (record.rppType === 'REQUIREMENT_SUM') {
          //     return styleTemp.Honeydew;
          //   }
          //   // 供给（资源匹配）
          //   if (record.rppType === 'ALLOCATE') {
          //     return styleTemp.LightSkyBlue;
          //   }
          //   if (record.rppType === 'CAPACITY_SHORTAGE') {
          //     return styleTemp.LavenderBlush;
          //   }
          //   if (
          //     record.rppType === 'OVERCAPACITY_MAIN' ||
          //     record.rppType === 'OVERCAPACITY_SECOND'
          //   ) {
          //     return styleTemp.LightYellow;
          //   }
          //   return null;
          // }}
          {...tableProps}
        />
      </PageHeaderWrapper>
    );
  }
}

export default RppItemListDomain;
