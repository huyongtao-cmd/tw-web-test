import {
  listPageFun,
  listListPageFun,
  selectTaskListFun,
  mainCapasetLevelNameListFun,
} from '@/services/hr/resPlan/rppItemServices';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'rppItemDomain',
  state: {
    // 列表数据集合
    list: [],
    searchForm: {},
    // 动态数量
    columnNum: 0,
    // 任务列表
    taskList: [],
    // 复合能力 列表
    mainCapasetLevelNameList: [],
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { status, response } = yield call(listPageFun, payload);
      if (status === 200 && response.ok) {
        const { columnNum, itemAndDetailViewPagingResult } = response.data;
        const { rows, total } = itemAndDetailViewPagingResult;
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(rows) ? rows : [],
            total,
            columnNum: columnNum,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },
    *selectTaskList({ payload }, { call, put }) {
      const { status, response } = yield call(selectTaskListFun, payload);
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            taskList: Array.isArray(response.data) ? response.data : [],
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
      }
    },
    *mainCapasetLevelNameList({ payload }, { call, put }) {
      const { status, response } = yield call(mainCapasetLevelNameListFun, payload);
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            mainCapasetLevelNameList: Array.isArray(response.data) ? response.data : [],
          },
        });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '查询失败' });
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
