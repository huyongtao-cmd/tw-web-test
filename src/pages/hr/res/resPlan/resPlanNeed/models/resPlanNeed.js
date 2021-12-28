// 产品化组件
import createMessage from '@/components/core/AlertMessage';
// 接口
import {
  resPlanNeedList,
  resPlanRoleDetail,
  resPlanRecommendedList,
  confirmOrRecommended,
  resPlanContrast,
  resPlanSubmit,
} from '@/services/hr/resPlan/rppItemServices';
import { selectCapasetLevel } from '@/services/gen/list';

export default {
  namespace: 'resPlanNeed',
  state: {
    resPlanNeedList: [], // 主列表数据
    resPlanConfirmList: [], // 确认页面列表数据
    resPlanRecommendedList: [], // 资源规划推荐资源列表
    resPlanContrastList: [], // 规划对比
    searchForm: {},
    resPlanRole: [],
    compareDays: [], // 存放本项目需求要展示的数据
    resPlanedDays: [], // 存放规划对比人已经被规划的天数
    abilityList: [], // 复合能力列表
  },

  effects: {
    // 主列表查询
    *resPlanList({ payload }, { call, put }) {
      const { status, response } = yield call(resPlanNeedList, payload);
      const { rows, total } = response.data;
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            resPlanNeedList: Array.isArray(rows) ? rows : [],
            total,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },

    // 确认页面主列表查询
    *resPlanConfirmList({ payload }, { call, put }) {
      const { status, response } = yield call(resPlanNeedList, payload);
      const { rows, total } = response.data;
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            resPlanConfirmList: Array.isArray(rows) ? rows : [],
            confirmTotal: total,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },

    // 推荐列表资源查询
    *resPlanRecommendedList({ payload }, { call, put }) {
      const { status, response } = yield call(resPlanRecommendedList, payload);
      const { rows, total: resPlanRecommendedTotal } = response.data;
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            resPlanRecommendedList: Array.isArray(rows) ? rows : [],
            resPlanRecommendedTotal,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },

    // 确认指派或推荐指派
    *confirmOrRecommended({ payload }, { call, put }) {
      const { status, response } = yield call(confirmOrRecommended, payload);
      if (status === 200 && response.ok) {
        createMessage({
          type: 'success',
          description: '操作成功',
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },

    // 角色详情
    *resPlanRole({ payload }, { call, put }) {
      const res = yield call(resPlanRoleDetail, { id: payload });
      const { status, response } = res;
      const compareDaysTemp = [];
      for (let i = 0; i < response.data.daysDetails.length; i += 1) {
        response.data[`yearWeek${i}`] = response.data.daysDetails[i].yearWeek;
        response.data[`days${i}`] = response.data.daysDetails[i].days;
        compareDaysTemp.push({ [`days${i}`]: response.data[`days${i}`] });
      }
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            resPlanRole: [{ ...response.data }],
            compareDays: compareDaysTemp,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },

    // 规划对比
    *resPlanContrast({ payload }, { call, put }) {
      const { status, response } = yield call(resPlanContrast, payload);
      if (status === 200 && response.ok) {
        const resPlanedDaysTemp = [];
        response.data.forEach((item, index) => {
          for (let i = 0; i < item.daysDetail.length; i += 1) {
            // eslint-disable-next-line no-param-reassign
            item[`days${i}`] = item.daysDetail[i].days;
          }
        });
        yield put({
          type: 'updateState',
          payload: {
            resPlanContrastList: Array.isArray(response.data) ? response.data : [],
            resPlanContrastTotal: response.data.length || 0,
            resPlanedDays: resPlanedDaysTemp,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },

    // 规划资源确认提交
    *resPlanSubmit({ payload }, { call, put }) {
      const { status, response } = yield call(resPlanSubmit, payload);
      if (status === 200 && response.ok) {
        createMessage({
          type: 'success',
          description: '提交成功',
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },

    //获取符合能力列表数据
    *fetchSelectCapasetLevel({ payload }, { call, put, select }) {
      const { response, status } = yield call(selectCapasetLevel);
      const obj = {};
      const arr1 = response.reduce((item, next) => {
        obj[next.id] ? '' : (obj[next.id] = true && item.push(next));
        return item;
      }, []);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            abilityList: Array.isArray(arr1) ? arr1 : [],
          },
        });
      }
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
