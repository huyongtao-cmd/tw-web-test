import { rppConfigPagingRq, rppConfigDeleteRq } from '../services';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'resPlanConfig',

  state: {
    // 查询系列
    searchForm: {},
    dataSource: [],
    total: 0,
    params: {},
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { date, sDate, trnCurProg, resType, ...params } = payload;

      const { response } = yield call(rppConfigPagingRq, params);

      yield put({
        type: 'updateState',
        payload: {
          dataSource: Array.isArray(response.data.rows) ? response.data.rows : [],
          total: response.data.total,
          params: payload,
        },
      });
    },
    *delete({ payload }, { call, put, select }) {
      const { response } = yield call(rppConfigDeleteRq, payload);
      if (response.ok) {
        createMessage({ type: 'success', description: '删除成功' });
        const { params } = yield select(({ resPlanConfig }) => resPlanConfig);
        yield put({
          type: 'query',
          payload: params,
        });
      } else {
        createMessage({ type: 'error', description: response.reason || '删除成功' });
      }
    },
  },

  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
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
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
      };
    },
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, search }) => {});
    },
  },
};
