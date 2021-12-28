/* eslint-disable no-plusplus*/
import {
  // 日历查看  列表
  projectResReportQueryFun,
  authBuLeaderQueryFun,
  authBQueryFun,
  // 项目列表
  queryProjectListApiFun,
  resManagerQueryFun,
  getPResInfoRq,
  taskAllRq,
  activityRq,
  workPlanCreateRq,
  workPlanDeleteRq,
  workPlanDetailsRq,
  workPlanUpdateRq,
} from '@/services/user/weeklyReport/weeklyReport';
import { queryCascaderUdc } from '@/services/gen/app';
import { selectBus } from '@/services/org/bu/bu';
import { selectUsers } from '@/services/gen/list';
import createMessage from '@/components/core/AlertMessage';
import { isEmpty, isNil } from 'ramda';
import moment from 'moment';
import { selectUserMultiCol } from '@/services/user/Contract/sales';

const defaultStartDate = moment().startOf('isoWeek');
const defaultEndDate = moment();

// 周计划分解为天计划
const weekPlanResolve = (plan, planStartDate, planEndDate, rowIndexTemp) => {
  const newPlanStartDate = planStartDate;
  const newPlanEndDate = planEndDate;
  const { yearWeek, planViews, leavePlanView } = plan;
  const itemYear = parseInt(yearWeek.substr(0, 4), 10);
  const itemWeek = parseInt(yearWeek.substr(4, 2), 10);
  return Array(7)
    .fill({})
    .map((day, idx) => {
      const result = {};
      const currDay = moment()
        .year(itemYear)
        .isoWeek(itemWeek)
        .isoWeekday(idx + 1); // 一周的第一天是周日；应该可以有方法设置 第一天是周一；
      // .add(idx + 1, 'days');
      result.tempId = idx + '' + rowIndexTemp;
      result.date = currDay.format('MM/DD');
      result.yearDate = currDay.format('YYYY-MM-DD');
      // 把每周计划放到每天的计划里
      result.dayPlanInfo = planViews.map((pItem, pIdx) => {
        const dayPlanInfoItem = {};
        const dayInPlan = moment(currDay).isBetween(pItem.dateFrom, pItem.dateTo, 'day');
        const dayInPlanStart = moment(currDay).format('YYYY-MM-DD') === pItem.dateFrom;
        const dayInPlanEnd = moment(currDay).format('YYYY-MM-DD') === pItem.dateTo;

        if (dayInPlan || dayInPlanStart || dayInPlanEnd) {
          dayPlanInfoItem.id = pItem.id;
          dayPlanInfoItem.planName = pItem.taskName;
          dayPlanInfoItem.planStatus = pItem.planStatus;
          dayPlanInfoItem.planType = pItem.planType;
          // 休假处理 休假名字叫做休假 是否结束 根据当前时间是否超过了休假结束的时间
          if (dayPlanInfoItem.planType === 'VACATION') {
            dayPlanInfoItem.planName = '休假计划';
          }
          if (dayPlanInfoItem.planType === 'VACATION') {
            const vacationEnd = moment().isAfter(pItem.dateTo);
            const vacationlastDay = moment().format('YYYY-MM-DD') === pItem.dateTo;
            if (vacationEnd && !vacationlastDay) {
              dayPlanInfoItem.planStatus = 'FINISHED';
            } else {
              dayPlanInfoItem.planStatus = 'PLAN';
            }
          }
          if (dayPlanInfoItem.planStatus) {
            if (dayPlanInfoItem.planStatus === 'PLAN') {
              if (dayPlanInfoItem.planType === 'WORK') {
                dayPlanInfoItem.className = 'plan-color';
              } else {
                dayPlanInfoItem.className = 'vacation-color';
              }
            } else {
              dayPlanInfoItem.className = 'finish-color';
            }
          }

          if (dayPlanInfoItem.planType) {
            if (dayPlanInfoItem.planType === 'WORK') {
              dayPlanInfoItem.planNo = pItem.planNo;
              dayPlanInfoItem.remark1 = pItem.remark1;
              dayPlanInfoItem.remark2 = pItem.remark2;
            }
          }
        }
        // 是否大于本周周一
        // 周一 和 周日
        const mon = moment()
          .year(itemYear)
          .isoWeek(itemWeek)
          .isoWeekday(1)
          .format('YYYY-MM-DD');
        const sun = moment()
          .year(itemYear)
          .isoWeek(itemWeek)
          .isoWeekday(7)
          .format('YYYY-MM-DD');
        const startBeforeWeek = moment(pItem.dateFrom).isBefore(mon);
        const endAfterWeek = moment(pItem.dateTo).isAfter(sun);
        const startBeforeRange = moment(pItem.dateFrom).isBefore(newPlanStartDate);
        const endAfterRange = moment(pItem.dateTo).isAfter(newPlanEndDate);
        // 如果在周一之前开始那么周一就是开始的一天
        // 如果在周日之后结束那么周日就是最后一天
        // 周日之后但是范围内也不是结束day
        if (
          (startBeforeWeek && moment(currDay).isoWeekday() === 1) ||
          (dayInPlanStart && moment(currDay).isoWeekday() === 1)
        ) {
          dayPlanInfoItem.needName = true;
        }
        if (
          (startBeforeRange && moment(currDay).format('YYYY-MM-DD') === newPlanStartDate) ||
          (!startBeforeRange && moment(currDay).format('YYYY-MM-DD') === pItem.dateFrom)
        ) {
          dayPlanInfoItem.isStart = true;
        }

        if (
          (endAfterRange && moment(currDay).format('YYYY-MM-DD') === newPlanEndDate) ||
          (!endAfterRange && moment(currDay).format('YYYY-MM-DD') === pItem.dateTo)
        ) {
          dayPlanInfoItem.isEnd = true;
        }

        return dayPlanInfoItem;
      });
      // 把本周的休假计划放到每天里
      result.leavePlanInfo = leavePlanView
        .map((pItem, pIdx) => {
          const leavePlanInfoItem = {};
          if (moment(currDay).format('YYYY-MM-DD') === pItem.vdate) {
            const vacationEnd = moment().isAfter(pItem.vdate);
            const vacationlastDay = moment().format('YYYY-MM-DD') === pItem.vdate;
            if (vacationEnd && !vacationlastDay) {
              leavePlanInfoItem.className = 'finish-color';
            } else {
              leavePlanInfoItem.className = 'vacation-color';
            }
            leavePlanInfoItem.vdays = pItem.vdays;
          }
          return leavePlanInfoItem;
        })
        .filter(value => Object.keys(value).length !== 0);
      return result;
    });
};

// 计划任务 重组数据结构
const calendarPlanResolve = plans => {
  const { workingCalendarPlan, planStartDate, planEndDate, rowIndexTemp } = plans;
  const newPlans = Object.assign([], workingCalendarPlan);
  newPlans.forEach(plan => {
    // eslint-disable-next-line no-param-reassign
    plan.dayPlan = weekPlanResolve(plan, planStartDate, planEndDate, rowIndexTemp);
  });
  return newPlans;
};

const defaultFormData = {
  planNo: '',
  priority: undefined,
  taskName: '',
  dates: ['', ''],
  planStatus: 'PLAN',
  taskId: undefined,
  activityId: undefined,
  planResId: undefined,
  reportedResId: [],
  relevantResId: [],
  planType: 'WORK',
  planTypeDisabled: 1,
  taskNameDisabled: 1,
  remark1: '',
  remark2: '',
};

export default {
  namespace: 'projectResReportDomain',
  state: {
    // 列表数据集合
    list: [],
    // 项目Id
    projectId: '',
    // 项目列表
    projectList: [],
    authBuLeaderList: [],
    authBList: [],
    authBAllList: [],
    activityList: [],
    taskAllList: [],
    resManagerList: [],
    allUseList: [],
    type2Data: [],
    searchForm: {},
    total: 0,
    formData: {},
    weekStartDate: defaultStartDate, // 开始日期选择周一
    weekEndDate: defaultEndDate, // 结束日期选择周一开始日期往后推4周
    planStartDate: moment()
      .startOf('isoWeek')
      .format('YYYY-MM-DD'), // 开始周的周一
    planEndDate: moment(defaultEndDate)
      .endOf('isoWeek')
      .format('YYYY-MM-DD'), // 结束周的周日
  },

  effects: {
    *query({ payload }, { call, put, select }) {
      const { status, response } = yield call(projectResReportQueryFun, payload);
      const { planStartDate, planEndDate } = yield select(
        ({ projectResReportDomain }) => projectResReportDomain
      );
      if (status === 200 && response.ok) {
        const list = Array.isArray(response.datum.lists) ? response.datum.lists : [];
        for (let i = 0; i < list.length; i++) {
          const workCalendarData = !isNil(list[i]) && !isEmpty(list[i]) ? list[i] : {};
          const workingCalendarPlan = workCalendarData.workingCalendarPlan
            ? workCalendarData.workingCalendarPlan
            : [];
          const params = {
            workingCalendarPlan,
            planEndDate,
            planStartDate,
            rowIndexTemp: i,
          };
          const cleanWorkCalender = yield call(calendarPlanResolve, params);
          list.workingCalendarPlan = cleanWorkCalender;
        }
        // return
        yield put({
          type: 'updateState',
          payload: {
            list,
            total: response.datum.total ?? 0,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.reason || '查询失败' });
      }
    },
    *queryProjectList({ payload }, { call, put }) {
      const { status, response } = yield call(queryProjectListApiFun, payload);
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            projectList: Array.isArray(response.datum) ? response.datum : [],
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors.reason || '项目列表查询失败' });
      }
    },
    // 资源上级视角 资源上级查找
    *authBuLeaderQuery({ payload }, { call, put }) {
      const { status, response } = yield call(authBuLeaderQueryFun);
      yield put({
        type: 'updateState',
        payload: {
          authBuLeaderList: response ?? [],
        },
      });
    },
    // 部门视角 部门列表
    *authBQuery({ payload }, { call, put }) {
      const { status, response } = yield call(authBQueryFun);
      yield put({
        type: 'updateState',
        payload: {
          authBList: response ?? [],
        },
      });
    },
    // 资源经理列表
    *resManagerQuery({ payload }, { call, put }) {
      const { status, response } = yield call(resManagerQueryFun);
      yield put({
        type: 'updateState',
        payload: {
          resManagerList: response ?? [],
        },
      });
    },
    // 全部人员列表
    *allUserQuery({ payload }, { call, put }) {
      const { status, response } = yield call(selectUsers);
      yield put({
        type: 'updateState',
        payload: {
          allUseList: response ?? [],
        },
      });
    },
    // 全局视角 部门列表
    *authBAllQuery({ payload }, { call, put }) {
      const { status, response } = yield call(selectBus);
      yield put({
        type: 'updateState',
        payload: {
          authBAllList: response ?? [],
        },
      });
    },
    // 根据资源类型一获取资源类型二下拉数据
    *updateListType2({ payload }, { call, put }) {
      if (!payload) {
        return;
      }
      const { response } = yield call(queryCascaderUdc, {
        defId: 'RES:RES_TYPE2',
        parentDefId: 'RES:RES_TYPE1',
        parentVal: payload,
      });
      if (response) {
        yield put({
          type: 'updateState',
          payload: { type2Data: Array.isArray(response) ? response : [] },
        });
      } else {
        yield put({
          type: 'updateState',
          payload: { type2Data: [] },
        });
      }
    },

    *clean(_, { call, put }) {
      yield put({
        type: 'updateState',
        payload: {
          formData: defaultFormData,
          activityList: [],
        },
      });
    },

    *res({ payload }, { call, put }) {
      const { response } = yield call(selectUserMultiCol);
      const list = Array.isArray(response) ? response : [];
      yield put({
        type: 'updateState',
        payload: {
          resDataSource: list,
        },
      });
    },

    *getPResInfo({ payload }, { call, put, select }) {
      const { status, response } = yield call(getPResInfoRq, payload);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (status === 200) {
        yield put({
          type: 'updateForm',
          payload: {
            reportedResId: [response.datum.id],
          },
        });
      } else {
        createMessage({ type: 'error', description: response.reason || '获取上级领导失败' });
      }
    },

    *taskAll({ payload }, { call, put }) {
      const { response } = yield call(taskAllRq, payload);
      const list = Array.isArray(response) ? response : [];
      yield put({
        type: 'updateState',
        payload: {
          taskAllList: list,
        },
      });
    },

    *activity({ payload }, { call, put }) {
      const { response } = yield call(activityRq, payload);
      const list = Array.isArray(response.datum) ? response.datum : [];
      yield put({
        type: 'updateState',
        payload: {
          activityList: list,
        },
      });
    },

    *save({ payload }, { call, put, select }) {
      const { formData } = yield select(({ projectResReportDomain }) => projectResReportDomain);
      const { dates, reportedResId, relevantResId, ...params } = formData;
      if (Array.isArray(dates) && dates[0] && dates[1]) {
        [params.dateFrom, params.dateTo] = dates;
      }
      params.reportedResId = reportedResId.join(',');
      params.relevantResId = relevantResId.join(',');
      params.dateFrom = moment(params.dateFrom).format('YYYY-MM-DD');
      params.dateTo = moment(params.dateTo).format('YYYY-MM-DD');
      const { status, response } = yield call(workPlanCreateRq, params);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        return response;
      }
      return {};
    },

    *delete({ payload }, { call, put, select }) {
      const { status, response } = yield call(workPlanDeleteRq, payload);
      if (status === 200) {
        // if (response && response.ok) {
        //   createMessage({ type: 'success', description: response.reason || '删除成功' });
        //   yield put({
        //     type: 'query',
        //     payload: {
        //       planStartDate,
        //       planEndDate,
        //     },
        //   });
        // } else {
        //   const message = response.reason || '删除失败';
        //   createMessage({ type: 'error', description: message });
        // }
        return response;
      }
      return {};
    },

    *queryDetail({ payload }, { call, put }) {
      const { status, response } = yield call(workPlanDetailsRq, payload);

      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        if (response.ok) {
          // 做了一个简单的优化:解决当 response.datum 为 null 时的报错
          const {
            dateFrom = '',
            dateTo = '',
            reportedResId = [],
            relevantResId = [],
          } = response.datum;
          yield put({
            type: 'updateForm',
            payload: {
              ...defaultFormData,
              ...response.datum,
              dates: [moment(dateFrom), moment(dateTo)],
              reportedResId:
                !isNil(reportedResId) && !isEmpty(reportedResId)
                  ? reportedResId.split(',').map(v => Number(v))
                  : [],
              relevantResId:
                !isNil(relevantResId) && !isEmpty(relevantResId)
                  ? relevantResId.split(',').map(v => Number(v))
                  : [],
            },
          });
          return response.datum;
        }
        createMessage({ type: 'error', description: response.reason || '获取详细信息失败' });
      }
      return {};
    },

    *edit({ payload }, { call, put, select }) {
      const { formData } = yield select(({ projectResReportDomain }) => projectResReportDomain);
      const { dates, reportedResId, relevantResId, ...params } = formData;
      if (Array.isArray(dates) && dates[0] && dates[1]) {
        [params.dateFrom, params.dateTo] = dates;
      }
      params.reportedResId = reportedResId.join(',');
      params.relevantResId = relevantResId.join(',');
      params.dateFrom = moment(params.dateFrom).format('YYYY-MM-DD');
      params.dateTo = moment(params.dateTo).format('YYYY-MM-DD');
      const { status, response } = yield call(workPlanUpdateRq, params);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        return response;
      }
      return {};
    },
  },

  reducers: {
    updateState(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
      };
    },
    updateSearchForm(state, { payload }) {
      const { searchForm } = state;
      const newFormData = { ...searchForm, ...payload };
      return {
        ...state,
        searchForm: newFormData,
      };
    },
  },
};
