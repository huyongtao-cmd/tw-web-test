/* eslint-disable arrow-body-style*/
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Checkbox,
  Radio,
  Modal,
  Row,
  Tooltip,
  Select,
  Input,
  Spin,
  Form,
  Pagination,
  InputNumber,
  Icon,
} from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import { Selection } from '@/pages/gen/field';
import styles from './index.less';
import moment from 'moment';
import router from 'umi/router';
import classNames from 'classnames';
import PageWrapper from '@/components/production/layout/PageWrapper';
import { selectBus } from '@/services/org/bu/bu';
import AsyncSelect from '@/components/common/AsyncSelect';
import { getUrl } from '@/utils/flowToRouter';
import { stringify } from 'qs';
import createMessage from '@/components/core/AlertMessage';
import { formatMessage } from 'umi/locale';
import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import { isEmpty, isNil } from 'ramda';
import { fromQs } from '@/utils/stringUtils';
import { createConfirm } from '@/components/core/Confirm';

const { confirm } = Modal;
const defaultStartDate = moment().startOf('isoWeek');
const defaultEndDate = moment()
  .add(4, 'w')
  .startOf('isoWeek');
const { Field, FieldLine } = FieldList;
const DOMAIN = 'projectResReportDomain';
const { Option } = Select;
const { RangePicker } = DatePicker;
const RadioGroup = Radio.Group;

const activityColumns = [
  { dataIndex: 'actNo', title: '编号', span: 8 },
  { dataIndex: 'actName', title: '名称', span: 16 },
];

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];

const daysUdc = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
let headComp = [];
let contentComp = [];
const typeArr = [
  { key: '项目', value: 1 },
  { key: '资源经理', value: 2 },
  { key: '资源上级', value: 3 },
  { key: '部门', value: 4 },
  { key: '全局', value: 5 },
];
const checkBoxOptions = [
  { label: '项目资源规划', value: 'projectResPlans' },
  { label: '商机资源规划', value: 'oppoResPlans' },
  { label: '任务包', value: 'tasks' },
  { label: '工作计划', value: 'workPlans' },
  { label: '休假信息', value: 'vacations' },
];
const checkBoxOptionsAll = ['projectResPlans', 'oppoResPlans', 'tasks', 'workPlans', 'vacations'];
const resReportShowTypeKey = 'resReportShowType';
const defaultCheckedList = ['workPlans'];
@connect(({ loading, projectResReportDomain, user }) => ({
  projectResReportDomain,
  loading: loading.effects[`${DOMAIN}/query`],
  user,
}))
@Form.create({
  onValuesChange(props, changedValues) {
    const { activityId, taskId } = changedValues;
    if (activityId) {
      // eslint-disable-next-line
      changedValues.activityId = Number(activityId);
    }
    if (taskId) {
      // eslint-disable-next-line
      changedValues.taskId = Number(taskId);
    }
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
@mountToTab()
class ProjectResReportDomain extends PureComponent {
  constructor(props) {
    super(props);
    const { value, mode } = this.props;

    this.state = {
      resType1: undefined,
      resType2: undefined,
      type: 1,
      overall: false,
      selfManager: [],
      pageSize: 5,
      current: 1,
      showItems: ['workPlans'],
      checkedList: defaultCheckedList,
      indeterminate: true,
      checkAll: false,
      taskRequest: true,
      fromFlag: 'WORK',
    };
  }

  componentDidMount() {
    const {
      dispatch,
      user: {
        user: { roles, extInfo },
      },
    } = this.props;
    const { defaultType } = fromQs();
    let showType = 1;
    const localStorageType = localStorage.getItem(resReportShowTypeKey);
    if (localStorageType) {
      showType = Number(localStorageType);
    }
    if (defaultType) {
      showType = Number(defaultType);
    }
    dispatch({ type: `${DOMAIN}/queryProjectList` });
    dispatch({ type: `${DOMAIN}/authBuLeaderQuery` });
    dispatch({ type: `${DOMAIN}/authBQuery` });
    dispatch({ type: `${DOMAIN}/authBAllQuery` });
    dispatch({ type: `${DOMAIN}/resManagerQuery` });
    dispatch({ type: `${DOMAIN}/allUserQuery` });
    dispatch({ type: `${DOMAIN}/res` });
    dispatch({ type: `${DOMAIN}/clean` });

    const overall = roles.includes('RES_REPORT_BU_ADMIN') || roles.includes('SYS_ADMIN');
    this.setState({
      overall,
      selfManager: [{ code: extInfo.resId, id: extInfo.resId, name: extInfo.resName }],
      resManagerResId: showType === 5 ? undefined : extInfo.resId,
      type: showType,
    });
    // 初始化
    this.initDateData();
  }

  // 查询 事件
  fetchData = (params, limit = 5, offset = 0, current = 1) => {
    const {
      dispatch,
      projectResReportDomain: { planStartDate, planEndDate, projectId },
    } = this.props;
    const {
      resType1,
      resType2,
      type,
      searchKey,
      pResId,
      resManagerResId,
      baseCity,
      baseBuId,
      projName,
      showItems,
    } = this.state;
    this.setState({ current });
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        planStartDate,
        planEndDate,
        projectId,
        resType1,
        resType2,
        type,
        searchKey,
        pResId,
        resManagerResId: type === 5 ? resManagerResId : undefined,
        baseCity,
        baseBuId,
        projName,
        limit,
        offset,
        showItems,
      },
    });
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        cellSelectedBox: [],
      },
    });
  };

  // 初始化
  initDateData = id => {
    const { dispatch } = this.props;
    const planStartDate = moment()
      .startOf('isoWeek')
      .format('YYYY-MM-DD');
    const planEndDate = moment(defaultEndDate)
      .endOf('isoWeek')
      .format('YYYY-MM-DD');
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        weekStartDate: defaultStartDate,
        weekEndDate: defaultEndDate,
        planStartDate,
        planEndDate,
        cellSelectedBox: [],
      },
    });
  };

  // 时间改变 事件
  fetchDateRange = val => {
    const { dispatch } = this.props;
    const startVal = val[0];
    const endVal = val[1];
    const weekStart = moment(startVal)
      .startOf('isoWeek')
      .format('YYYY-MM-DD');
    const weekEnd = moment(endVal)
      .endOf('isoWeek')
      .format('YYYY-MM-DD');
    const weekStartDate = moment(startVal);
    const weekEndDate = moment(endVal);
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        weekStartDate,
        weekEndDate,
        planStartDate: weekStart,
        planEndDate: weekEnd,
        cellSelectedBox: [],
      },
    });
  };

  // 项目选择
  handleChange = v => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        projectId: v,
      },
    });
  };

  // 选中单元格 事件
  cellSelectedHandle = date => {
    const {
      projectResReportDomain: { cellSelectedBox = [] },
      dispatch,
    } = this.props;

    const selectedOrUnSelected = cellSelectedBox.indexOf(date);
    if (selectedOrUnSelected === -1) {
      cellSelectedBox.push(date);
    } else {
      cellSelectedBox.splice(selectedOrUnSelected, 1);
    }
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        cellSelectedBox,
      },
    });
  };

  // 遍历表头
  workingCalendarPlanCol = (workPlan, index) => {
    headComp = [];
    this.dayPlayColWeek(workPlan, index);
    workPlan.dayPlan.map((item, indexTemp) => this.dayPlayColDay(item, indexTemp));
    return headComp;
  };

  // 年周列
  dayPlayColWeek = (workPlan, index) => {
    headComp.push(
      <Col span={2} className={styles['head-col']}>
        {workPlan.yearWeek + '年周'}
      </Col>
    );
  };

  // 每日列 （周一 ... 周日）
  dayPlayColDay = (item, indexTemp) => {
    headComp.push(
      <Col span={2} className={styles['head-col']}>
        {item.date + daysUdc[indexTemp]}
      </Col>
    );
  };

  // 遍历表格内容
  workingCalendarPlanColContent = (workPlan, index, personName) => {
    contentComp = [];
    this.dayPlayColWeekContent(workPlan, index, personName);
    workPlan.dayPlan.map((item, indexTemp) => this.dayPlayColDayContent(item, indexTemp, index));
    return contentComp;
  };

  // 年周列
  dayPlayColWeekContent = (workPlan, index, personName) => {
    contentComp.push(
      <Col span={2} className={styles['date-plan-left-cell']}>
        <span style={{ fontWeight: 'bold' }}>{workPlan.yearWeek}</span>
        <br />
        <br />
        <span style={{ fontSize: 14, opacity: 0.2 }}>{personName}</span>
      </Col>
    );
  };

  // 每日列 （周一 ... 周日）
  dayPlayColDayContent = (dateItem, indexTemp, index) => {
    const {
      projectResReportDomain: { cellSelectedBox = [] },
    } = this.props;
    const searchElement = dateItem.yearDate + '' + indexTemp + '' + index + '' + dateItem.tempId;
    contentComp.push(
      <Col
        span={2}
        key={Math.random()}
        className={cellSelectedBox.indexOf(searchElement) > -1 ? styles['cell-selected'] : ''}
        onClick={() => {
          this.cellSelectedHandle(searchElement);
        }}
      >
        <div className={styles['date-info']}>{dateItem.date}</div>
        <div className={styles['date-line']} />
        <div className={styles['date-plan-info']}>
          {dateItem.dayPlanInfo.map((workPlanItem, workPlanIndex) => (
            <div
              key={Math.random()}
              className={classNames(
                styles[workPlanItem.className],
                workPlanItem.isStart ? styles['plan-left-styles'] : '',
                workPlanItem.isEnd ? styles['plan-right-styles'] : ''
              )}
            >
              {workPlanItem.isStart || workPlanItem.needName ? (
                // 有备注就显示 备注分为备注1和备注2
                <Tooltip
                  title={`${workPlanItem.planNo || ''} ${workPlanItem.planName || ''} ${
                    workPlanItem.remark1 || workPlanItem.remark2 ? '(' : ''
                  } ${workPlanItem.remark1 ? '备注1:' : ''} ${workPlanItem.remark1 || ''}  ${
                    workPlanItem.remark2 ? '备注2:' : ''
                  } ${workPlanItem.remark2 || ''} ${
                    workPlanItem.remark1 || workPlanItem.remark2 ? ')' : ''
                  }`}
                >
                  {workPlanItem.planNo || ''} {workPlanItem.planName || ''}{' '}
                  {workPlanItem.remark1 || workPlanItem.remark2 ? '(' : ''}{' '}
                  {workPlanItem.remark1 ? '备注1:' : ''} {workPlanItem.remark1 || ''}{' '}
                  {workPlanItem.remark2 ? '备注2:' : ''} {workPlanItem.remark2 || ''}{' '}
                  {workPlanItem.remark1 || workPlanItem.remark2 ? ')' : ''}
                </Tooltip>
              ) : (
                ''
              )}

              {workPlanItem.isEnd ? (
                <span className={styles['plan-handle']}>
                  <Icon
                    type="delete"
                    style={{ fontSize: '14px', color: '#284488' }}
                    onClick={e => {
                      e.stopPropagation();
                      this.deletePlanHandle(workPlanItem.id, workPlanItem.planName);
                    }}
                  >
                    删除
                  </Icon>
                  <Icon
                    type="form"
                    style={{ fontSize: '14px', color: '#284488' }}
                    onClick={e => {
                      e.stopPropagation();
                      this.modifyPlanHandle(workPlanItem.id, workPlanItem.planType);
                    }}
                  >
                    修改
                  </Icon>
                </span>
              ) : (
                ''
              )}
            </div>
          ))}
          {dateItem.leavePlanInfo.map(leavePlanItem => (
            <div
              key={Math.random()}
              className={classNames(
                styles[leavePlanItem.className],
                styles['plan-left-styles'],
                styles['plan-right-styles']
              )}
            >
              {leavePlanItem.vdays ? (
                <span>
                  已请假(
                  {leavePlanItem.vdays}
                  天)
                </span>
              ) : (
                <></>
              )}
            </div>
          ))}
        </div>
      </Col>
    );
  };

  deletePlanHandle = (id, name) => {
    const { dispatch } = this.props;
    const getData = () => {
      this.fetchData();
    };
    const idArr = [id].join(',');
    createConfirm({
      // title: '确认删除?',
      content: `确认删除${name}任务吗?`,
      onOk() {
        dispatch({
          type: `${DOMAIN}/delete`,
          payload: {
            ids: idArr,
          },
        }).then(response => {
          if (response.ok) {
            createMessage({ type: 'success', description: response.reason || '删除成功' });
            getData();
          } else {
            const message = response.reason || '删除失败';
            createMessage({ type: 'error', description: message });
          }
        });
      },
      onCancel() {},
    });
  };

  modifyPlanHandle = (id, type) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/queryDetail`,
      payload: { id },
    });
    this.setState({ visible: true, modalType: 'edit' });
  };

  changeResType1 = v => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateListType2`,
      payload: v,
    });
    this.setState({
      resType1: v,
      resType2: undefined,
    });
  };

  addPlan = () => {
    const {
      dispatch,
      projectResReportDomain: { cellSelectedBox = [], list = [], formData },
    } = this.props;
    this.setState({ modalType: 'add' });
    // 通过选择项末尾字符判断是否为同一个人
    let flag;
    let clickStr;
    if (cellSelectedBox?.length === 0) {
      createMessage({ type: 'error', description: '请选择日期后添加计划!' });
    } else if (cellSelectedBox?.length === 1) {
      flag = true;
      [clickStr] = cellSelectedBox;
    } else {
      clickStr = cellSelectedBox.reduce((pre, cur) => {
        if (pre.charAt(pre.length - 1) === cur.charAt(cur.length - 1)) {
          flag = true;
        } else {
          flag = false;
        }
        return pre;
      });
    }

    if (flag) {
      // 通过选择项末尾字符获取资源id
      const resId = list[clickStr.charAt(clickStr.length - 1)]?.resId;
      const urls = getUrl();
      const from = stringify({ from: urls });
      let dateFrom;
      let dateTo;
      if (cellSelectedBox.length === 0) {
        this.setState({
          dateFrom: cellSelectedBox[0].slice(0, 10),
          dateTo: cellSelectedBox[0].slice(0, 10),
        });
        router.push(
          `/user/weeklyReport/workPlan/edit?fromFlag=ALL&fromPage=projectResReport&${from}&buResId=${resId}`
        );
      } else if (cellSelectedBox.length === 1) {
        dateFrom = moment(cellSelectedBox[0].slice(0, 10));
        dateTo = moment(cellSelectedBox[0].slice(0, 10));
      } else {
        const maxDateStr = cellSelectedBox.reduce((x, y) => {
          if (moment(x.slice(0, 10)) > moment(y.slice(0, 10))) {
            return x;
          }
          return y;
        });
        const minDateStr = cellSelectedBox.reduce((x, y) => {
          if (moment(x.slice(0, 10)) < moment(y.slice(0, 10))) {
            return x;
          }
          return y;
        });
        dateTo = moment(maxDateStr.slice(0, 10));
        dateFrom = moment(minDateStr.slice(0, 10));
      }
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: {
          planResId: resId,
          dates: [dateFrom, dateTo],
        },
      });
      dispatch({
        type: `${DOMAIN}/getPResInfo`,
        payload: {
          resId,
        },
      });
      dispatch({ type: `${DOMAIN}/taskAll`, payload: { resId } });
      this.setState({
        dateFrom,
        dateTo,
        visible: true,
      });

      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          cellSelectedBox: [],
        },
      });
    } else {
      createMessage({ type: 'error', description: '只能为一个人添加计划!' });
    }
  };

  changeType = v => {
    const {
      dispatch,
      user: {
        user: { roles, extInfo },
      },
    } = this.props;
    this.setState({
      resType1: undefined,
      resType2: undefined,
      type: v,
      searchKey: undefined,
      pResId: undefined,
      resManagerResId: v === 2 ? extInfo.resId : undefined,
      baseCity: undefined,
      baseBuId: undefined,
      projName: undefined,
    });
    localStorage.setItem(resReportShowTypeKey, v);
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        projectId: undefined,
      },
    });
  };

  onShowSizeChange = (current, pageSize) => {
    this.fetchData({}, pageSize, (current - 1) * pageSize, current);
    this.setState({
      pageSize,
      current,
    });
  };

  changePage = (page, pageSize) => {
    this.setState(
      {
        current: page,
      },
      () => {
        this.fetchData({}, pageSize, (page - 1) * pageSize, page);
      }
    );
  };

  clickName = resId => {
    router.push(`/hr/res/resPortrayal?id=${resId}`);
  };

  handleSubmit = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
    } = this.props;
    const { modalType } = this.state;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: modalType === 'add' ? `${DOMAIN}/save` : `${DOMAIN}/edit`,
        }).then(response => {
          // const { dispatch } = this.props;
          if (response.ok) {
            createMessage({ type: 'success', description: '操作成功' });
            this.fetchData();
            this.setState({ visible: false });
            dispatch({ type: `${DOMAIN}/clean` });
          }
        });
      }
    });
  };

  modalCancel = () => {
    const { dispatch } = this.props;
    this.setState({ visible: false });
    dispatch({
      type: `${DOMAIN}/clean`,
    });
  };

  // 显示内容全选
  onCheckAllChange = e => {
    this.setState({
      showItems: e.target.checked ? checkBoxOptionsAll : [],
      checkedList: e.target.checked ? checkBoxOptionsAll : [],
      indeterminate: false,
      checkAll: e.target.checked,
    });
  };

  // 显示内容 onchange事件
  onChangeBoxOptions = checkedList => {
    this.setState({
      showItems: checkedList,
      checkedList,
      indeterminate: !!checkedList.length && checkedList.length < checkBoxOptions.length,
      checkAll: checkedList.length === checkBoxOptions.length,
    });
  };

  radioChange = val => {
    this.setState({
      taskRequest: val.target.value !== 'VACATION',
    });
  };

  render() {
    const {
      projectResReportDomain: {
        list = [],
        weekStartDate = '',
        weekEndDate = '',
        projectList = [],
        projectId = '',
        type2Data = [],
        authBList = [],
        authBAllList = [],
        authBuLeaderList = [],
        resManagerList = [],
        allUseList = [],
        total = 0,
        formData,
        resDataSource,
        taskAllList = [],
        activityList = [],
      },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
      loading,
      dispatch,
    } = this.props;
    const {
      resType1,
      resType2,
      type,
      searchKey,
      pResId,
      resManagerResId,
      baseCity,
      baseBuId,
      projName,
      overall,
      selfManager,
      pageSize,
      current,
      dateFrom,
      dateTo,
      visible,
      indeterminate,
      checkAll,
      checkedList,
      taskRequest,
      fromFlag = 'WORK',
    } = this.state;
    const dates = [dateFrom, dateTo];
    return (
      <div>
        <PageWrapper>
          <Card className="tw-card-adjust" style={{ marginTop: '6px' }} bordered={false}>
            <div style={{ display: 'flex' }}>
              <div
                style={{
                  width: 230,
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  // borderRight:'1px black solid'
                }}
              >
                <div style={{ width: 50, textAlign: 'right' }}>视角：</div>
                <Select style={{ width: 120 }} value={type} onChange={v => this.changeType(v)}>
                  {typeArr.map((item, index) => {
                    if (item.value === 5) {
                      return (
                        <Option value={item.value} style={{ display: overall ? '' : 'none' }}>
                          {item.key}
                        </Option>
                      );
                    }
                    return <Option value={item.value}>{item.key}</Option>;
                  })}
                </Select>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div className={styles['search-item2']}>
                  <span className={styles['label-title']}>显示内容：</span>
                  <Checkbox
                    indeterminate={indeterminate}
                    onChange={this.onCheckAllChange}
                    checked={checkAll}
                  >
                    全选
                  </Checkbox>
                  <Checkbox.Group
                    options={checkBoxOptions}
                    value={checkedList}
                    // defaultValue={['workPlans']}
                    onChange={this.onChangeBoxOptions}
                  />
                </div>

                <div className={styles['search-item']}>
                  <span className={styles['label-title']}>期间：</span>
                  <RangePicker
                    className={styles['calendar-styles']}
                    allowClear={false}
                    value={[weekStartDate, weekEndDate]}
                    disabledDate={v =>
                      moment(v).format('YYYY-MM-DD') !==
                      moment(v)
                        .startOf('isoWeek')
                        .format('YYYY-MM-DD')
                    }
                    onChange={value => value && this.fetchDateRange(value)}
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 1 ? '' : 'none' }}
                >
                  <span className={styles['label-title']}>项目：</span>
                  <Selection
                    className={styles['calendar-styles']}
                    transfer={{ key: 'id', code: 'id', name: 'projName' }}
                    source={projectList}
                    value={projectId}
                    placeholder="请选择项目"
                    onChange={v => this.handleChange(v)}
                  />
                </div>
                <div className={styles['search-item']}>
                  <span className={styles['label-title']}>姓名/英文名：</span>
                  <Input
                    style={{ width: '100%' }}
                    value={searchKey}
                    placeholder="请输入姓名/英文名"
                    onChange={e => this.setState({ searchKey: e.target.value })}
                    onPressEnter={() => this.fetchData()}
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 3 || type === 5 ? '' : 'none' }}
                >
                  <span className={styles['label-title']}>资源上级：</span>
                  <Selection
                    transfer={{ key: 'id', code: 'id', name: 'name' }}
                    source={type === 3 ? authBuLeaderList : allUseList}
                    placeholder="请选择资源上级"
                    value={pResId}
                    onChange={v => this.setState({ pResId: v })}
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 4 || type === 5 ? '' : 'none' }}
                >
                  <span className={styles['label-title']}>部门：</span>
                  <Selection
                    transfer={{ key: 'id', code: 'id', name: 'name' }}
                    source={type === 4 ? authBList : authBAllList}
                    placeholder="请选择部门"
                    value={baseBuId}
                    onChange={v => this.setState({ baseBuId: v })}
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 2 || type === 5 ? '' : 'none' }}
                >
                  <span className={styles['label-title']}>资源经理：</span>
                  <Selection
                    transfer={{ key: 'id', code: 'id', name: 'name' }}
                    source={type === 5 ? resManagerList : selfManager}
                    placeholder="请选择资源经理"
                    value={resManagerResId}
                    disabled={type !== 5}
                    onChange={v => this.setState({ resManagerResId: v })}
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 1 ? 'none' : '' }}
                >
                  <span className={styles['label-title']}>区域：</span>
                  <Selection.UDC
                    value={baseCity}
                    onChange={v => this.setState({ baseCity: v })}
                    code="COM.CITY"
                    placeholder="请选择区域"
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 1 ? 'none' : '' }}
                >
                  <span className={styles['label-title']}>项目名称：</span>
                  <Input
                    style={{ width: '100%' }}
                    value={projName}
                    onChange={e => this.setState({ projName: e.target.value })}
                    onPressEnter={() => this.fetchData()}
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 5 ? '' : 'none' }}
                >
                  <span className={styles['label-title']}>资源类型一：</span>
                  <Selection.UDC
                    code="RES.RES_TYPE1"
                    style={{ width: '100%' }}
                    value={resType1}
                    onChange={v => this.changeResType1(v)}
                    placeholder="请选择资源类型一"
                  />
                </div>
                <div
                  className={styles['search-item']}
                  style={{ display: type === 5 ? '' : 'none' }}
                >
                  <span className={styles['label-title']}>资源类型二：</span>
                  <AsyncSelect
                    source={type2Data}
                    style={{ width: '100%' }}
                    value={resType2}
                    onChange={v => this.setState({ resType2: v })}
                    placeholder="请选择资源类型二"
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card className="tw-card-adjust" style={{ marginTop: '6px' }} bordered={false}>
            <div className={styles['example-wrap']}>
              <Button
                icon="search"
                type="primary"
                className="tw-btn-primary"
                onClick={() => {
                  this.fetchData();
                }}
              >
                查询
              </Button>
              <Button
                icon="plus"
                type="primary"
                className="tw-btn-primary"
                onClick={() => {
                  this.addPlan();
                }}
              >
                添加计划
              </Button>
              &nbsp; &nbsp; &nbsp; &nbsp; 图例:
              <span className={styles['example-finish']}>已完成</span>
              <span className={styles['example-plan']}>工作计划</span>
              <span className={styles['example-vacation']}>休假</span>
            </div>
          </Card>

          {/*// 大容器s */}
          {loading ? (
            <div
              style={{
                width: '100%',
                minHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div className={styles['calendar-box']}>
                {/*list start*/}
                {list.length > 0 && (
                  // head
                  <Row
                    type="flex"
                    justify="start"
                    align="middle"
                    className={styles['calendar-title']}
                    // span={8}
                  >
                    <Col span={2}>姓名</Col>
                    {list[0].workingCalendarPlan.map((item, index) =>
                      this.workingCalendarPlanCol(item, index).map(value => value)
                    )}
                  </Row>
                )}
                {/*list end*/}

                {/*list start*/}
                {list.map((mianItem, index) => (
                  // content  s
                  <div className={styles['calendar-content']} key={Math.random()}>
                    {/*年周*/}
                    <Row
                      type="flex"
                      justify="start"
                      align="middle"
                      className={styles['week-title']}
                    >
                      <Col span={2} className={styles['year-week']}>
                        <a onClick={() => this.clickName(mianItem?.resId)}>{mianItem.personName}</a>
                      </Col>

                      {mianItem.workingCalendarPlan.map((item, indexOne) => (
                        <Col span={16} className={styles['week-info']}>
                          {item.planItemVies.map((pItem, pIndex) => (
                            <div className={styles['pro-color']} key={Math.random()}>
                              <span className={styles['pro-title']}>
                                {pIndex === 0 ? '项目规划:' : ''}
                              </span>
                              {pItem.projName}({pItem.projdays}
                              天)
                            </div>
                          ))}
                          {item.businessVies.map((oItem, oIndex) => (
                            <div className={styles['opp-color']} key={Math.random()}>
                              <span className={styles['opp-title']}>
                                {oIndex === 0 ? '商机规划:' : ''}
                              </span>
                              {oItem.oppoName}({oItem.oppodays}
                              天)
                            </div>
                          ))}
                          {item.taskViews.map((tItem, tIndex) => (
                            <div className={styles['task-color']} key={Math.random()}>
                              <span className={styles['task-title']}>
                                {tIndex === 0 ? '处理中的任务包:' : ''}
                              </span>
                              {tItem.taskName}({tItem.planStartDate}-{tItem.planEndDate})
                            </div>
                          ))}
                        </Col>
                      ))}
                    </Row>

                    <Row
                      key={Math.random()}
                      type="flex"
                      justify="start"
                      align="top"
                      className={styles['week-content']}
                      // span={8}
                    >
                      <Col span={2} className={styles['date-plan-left-cell']} />
                      {mianItem.workingCalendarPlan.map((item, mindex) =>
                        this.workingCalendarPlanColContent(item, mindex, mianItem.personName).map(
                          value => value
                        )
                      )}
                    </Row>
                  </div>
                ))}
                {/*list end*/}
              </div>
              {list.length > 0 && (
                <Pagination
                  showSizeChanger
                  onShowSizeChange={this.onShowSizeChange}
                  onChange={this.changePage}
                  // current={current * pageSize > total ? 1 : current}
                  current={current}
                  total={total}
                  showTotal={() => `共 ${total} 条`}
                  pageSizeOptions={['5', '10', '15', '20']}
                  defaultPageSize={5}
                  pageSize={pageSize}
                  style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}
                  // hideOnSinglePage={true}
                />
              )}
            </>
          )}
          {/*// 大容器e */}
          <Modal
            title="工作计划维护"
            visible={visible}
            width="60%"
            onOk={this.handleSubmit}
            onCancel={this.modalCancel}
            destroyOnClose
            maskClosable={false}
            className={styles['prores-page']}
          >
            <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
              <FieldLine label="编号/优先级">
                <Field
                  name="planNo"
                  wrapperCol={{ span: 23, xxl: 23 }}
                  decorator={{
                    initialValue: formData.planNo || '',
                  }}
                >
                  <Input placeholder="请输入编号" />
                </Field>
                <Field
                  name="priority"
                  wrapperCol={{ span: 23, xxl: 23 }}
                  decorator={{
                    initialValue: formData.priority || '',
                  }}
                >
                  <InputNumber min={0} placeholder="请输入优先级" className="x-fill-100" />
                </Field>
              </FieldLine>

              {taskRequest ? (
                <Field
                  name="taskName"
                  label="任务"
                  decorator={{
                    initialValue: formData.taskName || '',
                    rules: [
                      {
                        required: formData.taskNameDisabled === 1 || false,
                        message: '请输入任务',
                      },
                    ],
                  }}
                >
                  <Input placeholder="请输入任务" />
                </Field>
              ) : (
                <Field
                  name="taskName"
                  label="任务"
                  decorator={{
                    initialValue: formData.taskName || '',
                  }}
                >
                  <Input placeholder="请输入任务" />
                </Field>
              )}

              <Field
                name="dates"
                label="计划开始/结束日"
                decorator={{
                  initialValue: formData.dates ? formData.dates : dates,
                  // initialValue: dates,
                  rules: [
                    {
                      required: true,
                      message: '请选择计划开始/结束日',
                    },
                  ],
                }}
              >
                <DatePicker.RangePicker className="x-fill-100" format="YYYY-MM-DD" />
              </Field>
              <Field
                name="planStatus"
                label="状态"
                decorator={{
                  initialValue: formData.planStatus || undefined,
                }}
              >
                <RadioGroup>
                  <Radio value="PLAN">计划中</Radio>
                  <Radio value="FINISHED">已完成</Radio>
                </RadioGroup>
              </Field>
              <Field
                name="taskId"
                label="相关任务包"
                decorator={{
                  initialValue: formData.taskId || undefined,
                }}
              >
                <Selection
                  className="x-fill-100"
                  source={taskAllList}
                  dropdownMatchSelectWidth={false}
                  showSearch
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  onColumnsChange={value => {}}
                  placeholder="请选择相关任务包"
                  onChange={value => {
                    if (value) {
                      dispatch({ type: `${DOMAIN}/activity`, payload: { taskId: value } });
                    } else {
                      dispatch({ type: `${DOMAIN}/updateState`, payload: { activityList: [] } });
                    }
                    dispatch({
                      type: `${DOMAIN}/updateForm`,
                      payload: { activityId: undefined },
                    });
                    setFieldsValue({
                      activityId: undefined,
                    });
                  }}
                />
              </Field>
              <Field
                name="activityId"
                label="相关活动"
                decorator={{
                  initialValue: formData.activityId || undefined,
                }}
              >
                <Selection.Columns
                  className="x-fill-100"
                  source={activityList}
                  dropdownMatchSelectWidth={false}
                  showSearch
                  columns={activityColumns}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  onChange={value => {
                    if (isNil(formData.taskName) || isEmpty(formData.taskName)) {
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: {
                          taskName: activityList.filter(v => v.id === Number(value))[0].name,
                        },
                      });
                    }
                  }}
                  placeholder="请选择相关活动"
                />
              </Field>
              <Field
                name="planResId"
                label="执行人"
                decorator={{
                  initialValue: formData.planResId || undefined,
                  rules: [
                    {
                      required: fromFlag === 'WORK',
                      message: '请选择执行人',
                    },
                  ],
                }}
              >
                <Selection.Columns
                  className="x-fill-100"
                  source={resDataSource}
                  columns={particularColumns}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  dropdownMatchSelectWidth={false}
                  showSearch
                  onColumnsChange={value => {
                    if (value) {
                      dispatch({
                        type: `${DOMAIN}/getPResInfo`,
                        payload: {
                          resId: value.id,
                        },
                      });
                    } else {
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: {
                          reportedResId: [],
                        },
                      });
                    }
                  }}
                  placeholder="请选择执行人"
                />
              </Field>
              <Field
                name="reportedResId"
                label="汇报对象"
                decorator={{
                  initialValue: formData.reportedResId || undefined,
                  rules: [
                    {
                      required: fromFlag === 'WORK',
                      message: '请选择汇报对象',
                    },
                  ],
                }}
              >
                <Selection.Columns
                  className="x-fill-100"
                  source={resDataSource}
                  columns={particularColumns}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  dropdownMatchSelectWidth={false}
                  showSearch
                  onColumnsChange={value => {}}
                  placeholder="请选择汇报对象"
                  mode="multiple"
                />
              </Field>
              <Field
                name="relevantResId"
                label="相关人"
                decorator={{
                  initialValue: formData.relevantResId || undefined,
                }}
              >
                <Selection.Columns
                  className="x-fill-100"
                  source={resDataSource}
                  columns={particularColumns}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  dropdownMatchSelectWidth={false}
                  showSearch
                  onColumnsChange={value => {}}
                  placeholder="请选择相关人"
                  mode="multiple"
                />
              </Field>
              <Field
                name="planType"
                label="计划类型"
                decorator={{
                  initialValue: fromFlag === 'ALL' ? 'WORK' : fromFlag,
                }}
              >
                <RadioGroup
                  // disabled={
                  //   (fromPage !== 'calendar' && fromFlag === 'WORK') ||
                  //   (fromPage !== 'calendar' && fromFlag === 'VACATION')
                  // }
                  onChange={val => {
                    this.radioChange(val);
                  }}
                >
                  <Radio value="WORK">工作计划</Radio>
                  <Radio value="VACATION">休假计划</Radio>
                </RadioGroup>
              </Field>
              <Field
                name="remark1"
                label="任务备注1"
                decorator={{
                  initialValue: formData.remark1 || '',
                }}
              >
                <Input.TextArea rows={3} placeholder="请输入备注1" />
              </Field>
              <Field
                name="remark2"
                label="任务备注2"
                decorator={{
                  initialValue: formData.remark2 || '',
                }}
              >
                <Input.TextArea rows={3} placeholder="请输入备注2" />
              </Field>
            </FieldList>
          </Modal>
        </PageWrapper>
      </div>
    );
  }
}

export default ProjectResReportDomain;
