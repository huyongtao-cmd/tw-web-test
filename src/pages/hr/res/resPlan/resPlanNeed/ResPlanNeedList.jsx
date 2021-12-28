// 框架类
import React, { Component } from 'react';
import { Form, Modal, Checkbox, Input, Popover, Button } from 'antd';
import { connect } from 'dva';
import router from 'umi/router';
import moment from 'moment';

// 产品化组件
import PageWrapper from '@/components/production/layout/PageWrapper';
import DataTable from '@/components/common/DataTable';
import BuSimpleSelect from '@/components/production/basic/BuSimpleSelect';
import ResSimpleSelect from '@/components/production/basic/ResSimpleSelect';
import math from 'mathjs';
import stylesModel from '../../../../user/Project/modal/ResourceListModal.less';
import { Selection } from '@/pages/gen/field';
import { mountToTab } from '@/layouts/routerControl';
import createMessage from '@/components/core/AlertMessage';

const DOMAIN = 'resPlanNeed';

// 动态列数组初始化
let extraCols = [];

// 动态列属性初始化
const columnTemp = {
  title: '',
  dataIndex: 'days',
  align: 'center',
  // width: 50,
  render: '',
};

/***
 * 资源规划需求处理
 */
@connect(({ user, resPlanNeed, dispatch, loading }) => ({
  user,
  resPlanNeed,
  dispatch,
  loading,
}))
@Form.create()
@mountToTab()
class ResPlanNeedList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resVisible: false, // 推荐资源弹窗
      operationVisible: false, // 规划对比弹窗
      roleVisible: false, // 角色弹窗
      planTypeDescTemp: '', // 角色弹窗类型显示
      objNameTemp: '', // 角色弹窗对象显示
      mainId: undefined, // 存放主表id
      mainEndDate: undefined, // 主列表结束日期
      contrastName: '', // 规划对比人姓名
      isOver: true,
      planType: '',
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/fetchSelectCapasetLevel` });
  }

  // 关闭推荐资源弹窗清空数据
  clearRecommended = () => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        searchForm: {},
        resPlanRecommendedList: [],
      },
    });
  };

  // 查询列表数据
  fetchData = params => {
    // 处理搜索条件'剩余天数大于0'
    if (params?.isOver === false) {
      // eslint-disable-next-line no-param-reassign
      params.isOver = undefined;
    } else if (params?.isOver === true) {
      // eslint-disable-next-line no-param-reassign
      params.isOver = '1';
    }
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/resPlanList`,
      payload: {
        ...params,
      },
    });
  };

  // 推荐资源列表
  resPlanRecommendedList = async params => {
    const { dispatch } = this.props;
    const { mainEndDate, mainId } = this.state;
    await dispatch({
      type: `${DOMAIN}/resPlanRecommendedList`,
      payload: {
        ...params,
        endDate: mainEndDate,
      },
    });
    this.findRoleDetail(mainId);
  };

  // 点击角色查询详情
  findRoleDetail = id => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/resPlanRole`,
      payload: id,
    });
  };

  // 确认或推荐指派
  confirmOrRecommended = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/confirmOrRecommended`,
      payload: [{ ...params }],
    });
  };

  // 规划对比
  resPlanContrast = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/resPlanContrast`,
      payload: {
        ...params,
      },
    });
  };

  // 确认提交
  resPlanSubmit = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/resPlanSubmit`,
      payload: params,
    });
  };

  // 数组求和，计算合计需求和缺口
  sum = arr => arr.length && arr.reduce((prev, curr) => prev + curr);

  // 剩余天数查询条件
  onChange = e => {
    const { isOver } = this.state;
    this.setState({
      isOver: e.target.checked,
    });
  };

  render() {
    const {
      resVisible,
      operationVisible,
      roleVisible,
      planTypeDescTemp,
      objNameTemp,
      mainId,
      contrastName,
      mainEndDate,
      planType,
      isOver,
    } = this.state;
    const { dispatch, resPlanNeed, loading } = this.props;
    const {
      searchForm,
      resPlanNeedList,
      total,
      resPlanRole,
      resPlanRecommendedList,
      resPlanRecommendedTotal,
      resPlanContrastList,
      resPlanContrastTotal,
      compareDays,
      abilityList,
    } = resPlanNeed;
    const newDays = [];
    resPlanContrastList.forEach((item, index) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const key in item) {
        if (key.substr(0, 4) === 'days' && key.substr(4, key.length - 4) !== 'Detail') {
          newDays.push({ [`${key}`]: item[key] });
        }
      }
    });
    // 数组中相同的元素相加，处理当前对比资源的已规划天数
    const res =
      newDays.length &&
      newDays.reduce((result, next) => {
        if (!result) {
          // eslint-disable-next-line no-param-reassign
          result = {};
        }
        Object.keys(next).forEach(key => {
          //数值类型
          if (typeof next[key] === 'number') {
            // eslint-disable-next-line no-param-reassign
            result[key] = (result[key] ? result[key] : 0) + next[key];
          }
        });
        return result;
      });
    const maxLength = resPlanRole.length ? resPlanRole[0].daysDetails.length : 0; // 以本项目需求天数为标准循环
    const temp = [];
    // 合并table列设置
    const contrasData = [
      {
        planTypeDesc: `${contrastName}的规划天数`,
      },
      {
        planTypeDesc: '本项目需求',
      },
      {
        planTypeDesc: <span style={{ color: 'red' }}>缺口分析</span>,
      },
    ];

    // 合并规划对比表格列
    const renderContent = (value, row, index) => {
      if (!(index > resPlanContrastList.length - 1)) {
        return value;
      }
      return {
        children: value,
        props: {
          colSpan: 0,
        },
      };
    };
    const data = [...resPlanContrastList, ...contrasData];

    const allPerDays = [];
    for (let index = 0; index < resPlanRole[0]?.daysDetails.length; index += 1) {
      const styles = {
        cursor: 'pointer',
      };
      temp.push({
        ...columnTemp,
        title: (
          <Popover
            content={`${moment(new Date())
              .startOf('week')
              .add(index, 'weeks')
              .startOf('week')
              .format('YYYY-MM-DD')}~${moment(new Date())
              .startOf('week')
              .add(index, 'weeks')
              .startOf('week')
              .add(6, 'days')
              .format('YYYY-MM-DD')}`}
            trigger="hover"
          >
            <div style={styles}>
              <div style={{ color: '#008FDB' }}>
                {moment(new Date())
                  .startOf('week')
                  .add(index, 'weeks')
                  .startOf('week')
                  .format('MM/DD')}
              </div>
            </div>
          </Popover>
        ),
        dataIndex: columnTemp.dataIndex + index,
        width: 50,
        align: 'center',
      });
      allPerDays.push(resPlanRole[0][`days${index}`]);
    }
    const allPerDay = this.sum(allPerDays) || 0; // 合计人天
    const allEquivalent =
      (resPlanRole.length && math.multiply(allPerDay, resPlanRole[0].distributeRate).toFixed(2)) ||
      '';
    extraCols = temp;
    // 主列表属性
    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: 'max-content' },
      loading: loading.effects[`${DOMAIN}/resPlanList`],
      total,
      dataSource: resPlanNeedList.length > 0 ? resPlanNeedList : [], // 存放列表数据
      enableSelection: true, // 是否显示勾选框
      showColumn: true, // 是否显示列控制按钮
      showClear: true, // 是否显示清空按钮
      showExport: true, // 是否显示导出按钮
      onChange: filters => this.fetchData(filters), // 分页、排序、筛选变化时触发
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
        this.setState({
          planType: allValues.planType,
          isOver: allValues.isOver,
        });
      },
      searchForm,
      searchBarForm: [
        {
          title: '计划类型',
          dataIndex: 'planType',
          options: {
            initialValue: planType === undefined ? undefined : 2,
          },
          tag: <Selection.UDC code="COM:PLAN_TYPE" placeholder="请选择计划类型" allowClear />,
        },
        {
          title: '计划对象',
          dataIndex: 'objName',
          options: {
            initialValue: searchForm.objName || undefined,
          },
          tag: <Input placeholder="请输入计划对象" />,
        },
        {
          title: '只看剩余天数>0',
          dataIndex: 'isOver',
          options: {
            initialValue: ![undefined, false].includes(isOver),
          },
          tag: (
            <Checkbox
              checked={[undefined, false].includes(isOver) ? false : isOver}
              onChange={this.onChange}
            />
          ),
        },
        {
          title: '状态',
          dataIndex: 'planRoleStatus',
          options: {
            initialValue: searchForm.planRoleStatus || undefined,
          },
          tag: <Selection.UDC code="COM:PLAN_ROLE_STATUS" placeholder="请选择状态" allowClear />,
        },
        {
          title: '交付BU',
          dataIndex: 'deliBuId',
          options: {
            initialValue: searchForm.deliBuId || undefined,
          },
          tag: <BuSimpleSelect placeholder="请选择交付BU" />,
        },
        {
          title: '负责人',
          dataIndex: 'deliResId',
          options: {
            initialValue: searchForm.deliResId || undefined,
          },
          tag: <ResSimpleSelect placeholder="请选择负责人" />,
        },
        {
          title: '复合能力',
          dataIndex: 'capasetLevelId',
          options: {
            initialValue: searchForm.capasetLevelId || undefined,
          },
          tag: <Selection source={abilityList} placeholder="请选择复合能力" />,
        },
        {
          title: '角色',
          dataIndex: 'role',
          options: {
            initialValue: searchForm.role || undefined,
          },
          tag: <Input placeholder="请输入角色" />,
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
          render: (value, row, index) => (
            <a
              onClick={async () => {
                await this.findRoleDetail(row.id);
                this.setState({
                  roleVisible: true,
                  planTypeDescTemp: row.planTypeDesc,
                  objNameTemp: row.objName,
                });
              }}
            >
              {row.role}
            </a>
          ),
        },
        {
          title: '原资源',
          align: 'center',
          dataIndex: 'resName',
          render: (value, row, index) => {
            if (row.resStatus === '6') {
              return (
                <span>
                  <span>{row.resName}</span>
                  <span style={{ color: 'red' }}>{row.resStatusDesc}</span>
                </span>
              );
            }
            if (row.resStatus === '4') {
              return (
                <span>
                  <span>{row.resName}</span>
                  <span style={{ color: 'orange' }}>{row.resStatusDesc}</span>
                </span>
              );
            }
            return row.resName;
          },
        },
        {
          title: '状态',
          align: 'center',
          dataIndex: 'planRoleStatusDesc',
        },
        {
          title: '推荐资源',
          align: 'center',
          dataIndex: 'recommendResName',
          render: (value, row, index) => (
            <a
              onClick={async () => {
                this.setState({
                  resVisible: true,
                  mainId: row.id,
                  mainEndDate: row.endDate,
                });
                // await this.resPlanRecommendedList(
                //   {
                //     offset: 0,
                //     limit: 10,
                //     sortBy: 'id',
                //     sortDirection: 'DESC',
                //   },
                //   row.id,
                // );
              }}
            >
              {row.recommendResName || '请选择资源'}
            </a>
          ),
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
          key: 'submit',
          title: '确定提交',
          type: 'primary',
          className: 'tw-btn-primary',
          size: 'large',
          loading: loading.effects[`${DOMAIN}/resPlanSubmit`],
          minSelections: 0,
          cb: async (selectedRowKeys, selectedRows, queryParams) => {
            const list = [];
            if (!selectedRows.length) {
              createMessage({
                type: 'error',
                description: '请选择数据',
              });
              return;
            }
            selectedRows.forEach((item, index) => {
              if (item.planRoleStatus !== 'ASSIGN') {
                createMessage({
                  type: 'error',
                  description: '请选择已指派的数据',
                });
              } else {
                list.push({
                  id: item.id,
                  planType: item.planType,
                  deliResId: item.deliResId,
                });
              }
            });
            if (!list.length) {
              return;
            }
            await this.resPlanSubmit(list);
          },
          disabled: () => {},
        },
        {
          key: 'operation',
          title: '资源规划运算',
          type: 'primary',
          size: 'large',
          loading: false,
          minSelections: 0,
          cb: internalState => {
            router.push(`/hr/resPlan/rppTask/runTask`);
          },
        },
      ],
    };

    // 推荐资源列配置
    const resourceColumns = [
      {
        title: '员工编号',
        dataIndex: 'resNo',
        align: 'center',
      },
      {
        title: '姓名',
        dataIndex: 'resName',
        align: 'center',
      },
      {
        title: '部门',
        dataIndex: 'baseBuName',
        align: 'center',
      },
      {
        title: '未来使用率',
        dataIndex: 'ratio',
        align: 'center',
      },
    ];

    // 推荐资源属性
    const resTableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: 'max-content' },
      loading: loading.effects[`${DOMAIN}/resPlanRecommendedList`],
      total: resPlanRecommendedTotal,
      dataSource: resPlanRecommendedList.length > 0 ? resPlanRecommendedList : [],
      rowSelection: { type: 'radio' },
      showExport: false, // 是否显示导出按钮
      onChange: filters => this.resPlanRecommendedList(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchForm,
      searchBarForm: [
        {
          title: '姓名',
          dataIndex: 'resId',
          options: {
            initialValue: searchForm.resId || undefined,
          },
          tag: <ResSimpleSelect placeholder="请选择姓名" />,
        },
        {
          title: '能力',
          dataIndex: 'resCapas',
          options: {
            initialValue: searchForm.resCapas || undefined,
          },
          tag: <Input placeholder="请输入能力" />,
        },
        {
          title: '行业',
          dataIndex: 'trade',
          options: {
            initialValue: searchForm.trade || undefined,
          },
          tag: <Input placeholder="请输入行业" />,
        },
        {
          title: '客户',
          dataIndex: 'customer',
          options: {
            initialValue: searchForm.customer || undefined,
          },
          tag: <Input placeholder="请输入客户" />,
        },
      ],
      columns: resourceColumns,
      leftButtons: [
        {
          key: 'confirmAssign',
          title: '确定指派',
          type: 'primary',
          size: 'large',
          hidden: false,
          minSelections: 0,
          loading: false,
          cb: async (selectedRowKeys, selectedRows, queryParams) => {
            if (selectedRows.length === 0) {
              createMessage({
                type: 'error',
                description: '请选择资源',
              });
              return;
            }
            await this.confirmOrRecommended({
              id: mainId,
              resId: selectedRows[0].resId,
              planRoleStatus: 'ASSIGN',
              recommendResId: '',
            });
            await this.setState({ resVisible: false });
            this.clearRecommended();
            await this.fetchData({
              ...searchForm,
            });
          },
        },
        {
          key: 'recommended',
          title: '推荐',
          type: 'primary',
          size: 'large',
          hidden: false,
          loading: false,
          minSelections: 0,
          cb: async (selectedRowKeys, selectedRows, queryParams) => {
            if (selectedRows.length === 0) {
              createMessage({
                type: 'error',
                description: '请选择资源',
              });
              return;
            }
            await this.confirmOrRecommended({
              id: mainId,
              recommendResId: selectedRows[0].resId,
              planRoleStatus: 'ASSIGN',
            });
            await this.setState({ resVisible: false });
            this.clearRecommended();
            await this.fetchData({
              ...searchForm,
            });
          },
        },
        {
          key: 'clean',
          title: '清空',
          type: 'primary',
          size: 'large',
          loading: false,
          hidden: false,
          minSelections: 0,
          cb: async (selectedRowKeys, selectedRows, queryParams) => {
            await this.confirmOrRecommended({
              id: mainId,
              recommendResId: '',
            });
          },
        },
        {
          key: 'planContrast',
          title: '规划对比',
          type: 'primary',
          size: 'large',
          loading: false,
          hidden: false,
          minSelections: 0,
          cb: async (selectedRowKeys, selectedRows, queryParams) => {
            if (selectedRows.length === 0) {
              createMessage({
                type: 'error',
                description: '请选择资源',
              });
              return;
            }
            await this.resPlanContrast({ resId: selectedRows[0].resId });
            this.setState({
              operationVisible: true,
              contrastName: selectedRows[0].resName,
            });
          },
        },
      ],
    };

    // 角色详情属性
    const roleTableProps = {
      rowKey: 'id',
      sortBy: 'id',
      sortDirection: 'DESC', // 降序排序
      total: 0,
      enableSelection: false, // rowSelection配置
      dataSource: resPlanRole.length > 0 ? resPlanRole : [],
      loading: loading.effects[`${DOMAIN}/resPlanRole`],
      showExport: false, // 是否显示导出按钮
      showColumn: false, // 显示列按钮控制
      rowClassName: (record, index) => {
        // 表格行类名
        let className;
        if (Number(record.hiddenFlag) === 1) className = stylesModel.tableColorDust;
        return className;
      },
      scroll: { x: Number(extraCols.length) * 50 },
      columns: [
        {
          title: '角色',
          dataIndex: 'role',
          fixed: true, // 列固定
          width: 100,
          align: 'center',
        },
        {
          title: '资源',
          dataIndex: 'resName',
          fixed: true,
          width: 50,
          align: 'center',
        },
        {
          title: '复合能力',
          dataIndex: 'capasetLevelName',
          fixed: true,
          width: 100,
          align: 'center',
        },
        {
          title: '当量系数',
          dataIndex: 'distributeRate',
          align: 'center',
        },
        ...extraCols,
      ],
    };

    const contrastTemp = [];
    for (let index = 0; index < maxLength; index += 1) {
      const styles = {
        cursor: 'pointer',
      };
      contrastTemp.push({
        ...columnTemp,
        title: (
          <Popover
            content={`${moment(new Date())
              .startOf('week')
              .add(index, 'weeks')
              .startOf('week')
              .format('YYYY-MM-DD')}~${moment(new Date())
              .startOf('week')
              .add(index, 'weeks')
              .startOf('week')
              .add(6, 'days')
              .format('YYYY-MM-DD')}`}
            trigger="hover"
          >
            <div style={styles}>
              <div style={{ color: '#008FDB' }}>
                {moment(new Date())
                  .startOf('week')
                  .add(index, 'weeks')
                  .startOf('week')
                  .format('MM/DD')}
              </div>
            </div>
          </Popover>
        ),
        dataIndex: columnTemp.dataIndex + index,
        // width: 50,
        align: 'center',
      });
    }

    const allDemands = [];
    const allGaps = [];
    for (let i = 0; i < maxLength; i += 1) {
      contrasData[0][`days${i}`] = res[`days${i}`]; // 给某个人的规划天数赋值
      contrasData[1][`days${i}`] = compareDays[i] && compareDays[i][`days${i}`]; // 给本项目需求赋值
      allDemands.push(contrasData[1][`days${i}`] || 0);

      // 缺口分析赋值
      const gap = math.subtract(
        contrasData[1][`days${i}`] ? Number(contrasData[1][`days${i}`]) : 0,
        math.subtract(5, contrasData[0][`days${i}`] ? Number(contrasData[0][`days${i}`]) : 0)
      );
      contrasData[2][`days${i}`] = <span style={{ color: 'red' }}>{gap < 0 ? '' : gap}</span>;

      allGaps.push(gap < 0 ? 0 : gap);
    }
    const allDemand = this.sum(allDemands); // 合计需求
    const allGap = this.sum(allGaps); // 总缺口天数

    const matching = math.subtract(allDemand, allGap); // 可匹配天数 = 总需求-缺口
    const matchingRate = math.multiply(math.divide(matching, allDemand), 100); // 匹配率
    extraCols = contrastTemp;
    // 资源规划对比属性
    const resContrast = {
      rowKey: 'id',
      sortBy: 'id',
      sortDirection: 'DESC', // 降序排序
      enableSelection: false, // rowSelection配置
      showExport: false, // 是否显示导出按钮
      showColumn: false, // 显示列按钮控制
      showSearch: false, // 是否显示查询按钮
      pagination: false, // 不显示分页
      dataSource: data,
      total: resPlanContrastTotal,
      loading: loading.effects[`${DOMAIN}/resPlanContrast`],
      rowClassName: (record, index) => {
        // 表格行类名
        let className;
        if (Number(record.hiddenFlag) === 1) className = stylesModel.tableColorDust;
        return className;
      },
      // scroll: { x: Number(extraCols.length) * 50 },
      scroll: { x: 800 },
      columns: [
        {
          title: '类型',
          dataIndex: 'planTypeDesc',
          align: 'center',
          fixed: true, // 列固定
          width: extraCols.length === 0 ? '0.4%' : 100,
          render: (value, row, index) => {
            if (!(index > resPlanContrastList.length - 1)) {
              return value;
            }
            return {
              children: value,
              props: {
                colSpan: 4,
              },
            };
          },
        },
        {
          title: '对象',
          dataIndex: 'objName',
          align: 'center',
          fixed: true,
          render: renderContent,
          width: extraCols.length === 0 ? '0.4%' : 180,
        },
        {
          title: '负责人',
          dataIndex: 'deliResName',
          align: 'center',
          fixed: true,
          width: extraCols.length === 0 ? '0.4%' : 100,
          render: renderContent,
        },
        {
          title: '角色',
          dataIndex: 'role',
          align: 'center',
          width: extraCols.length === 0 ? '0.4%' : 100,
          fixed: true,
          render: renderContent,
        },
        ...extraCols,
      ],
    };

    return (
      <PageWrapper>
        {/*列表数据*/}
        <DataTable {...tableProps} />
        {/*推荐资源弹窗*/}
        <Modal
          visible={resVisible}
          width={1000}
          destroyOnClose
          footer={
            <Button
              onClick={async () => {
                await this.setState({ resVisible: false });
                this.clearRecommended();
              }}
            >
              关闭
            </Button>
          }
          onOk={async () => {
            await this.setState({ resVisible: false });
            this.clearRecommended();
          }}
          onCancel={async () => {
            await this.setState({
              resVisible: false,
            });
            this.clearRecommended();
          }}
        >
          <DataTable {...resTableProps} />
        </Modal>

        {/*规划对比弹窗*/}
        <Modal
          visible={operationVisible}
          width={1000}
          destroyOnClose
          footer={null}
          onOk={() => {
            this.setState({ operationVisible: false });
          }}
          onCancel={() => {
            this.setState({ operationVisible: false });
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                paddingLeft: '24px',
                fontSize: '24px',
                fontWeight: 500,
                marginRight: '25px',
              }}
            >
              资源规划对比
            </span>
            <Button
              type="primary"
              style={{ marginRight: '80px' }}
              onClick={() => {
                this.setState({ operationVisible: false });
              }}
            >
              关闭
            </Button>
            <span style={{ fontSize: '17px', fontWeight: 'bold', marginRight: '10px' }}>
              合计需求：
              {allDemand},
            </span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', marginRight: '10px' }}>
              可匹配：
              {matching},
            </span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', marginRight: '10px' }}>
              匹配率：
              {/* eslint-disable-next-line no-nested-ternary */}
              {allDemand !== 0
                ? Math.round(matchingRate) === matchingRate
                  ? matchingRate + '%'
                  : matchingRate.toFixed(1) + '%'
                : '0%'}
            </span>
          </div>
          <DataTable {...resContrast} />
        </Modal>

        {/*角色详情弹窗*/}
        <Modal
          visible={roleVisible}
          width={1000}
          destroyOnClose
          footer={null}
          maskClosable
          onOk={() => {
            this.setState({ roleVisible: false });
          }}
          onCancel={() => {
            this.setState({ roleVisible: false });
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                paddingLeft: '24px',
                fontSize: '24px',
                fontWeight: 500,
                marginRight: '25px',
                flex: '0 0 168px',
              }}
            >
              资源规划明细
            </span>
            <Button
              type="primary"
              style={{ marginRight: '80px' }}
              onClick={() => {
                this.setState({ roleVisible: false });
              }}
            >
              关闭
            </Button>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 'bold',
                marginRight: '80px',
                flex: '0 0 260px',
              }}
            >
              {planTypeDescTemp}：{objNameTemp}
            </span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', marginRight: '10px' }}>
              合计人天：
              {allPerDay}
            </span>
            <span style={{ fontSize: '17px', fontWeight: 'bold', marginRight: '10px' }}>
              合计当量：
              {allEquivalent}
            </span>
          </div>
          <DataTable showSearch={false} {...roleTableProps} />
        </Modal>
      </PageWrapper>
    );
  }
}

export default ResPlanNeedList;
