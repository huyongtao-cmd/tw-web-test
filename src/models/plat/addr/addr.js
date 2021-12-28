import { queryAddrList, findAddrById, deleteAddrById } from '@/services/plat/addr/addr';

export default {
  namespace: 'platAddrList',

  state: {
    // 查询系列
    searchForm: {},
    dataSource: [],
    total: 0,
  },

  effects: {
    *query({ payload }, { call, put }) {
      const {
        response: { rows, total },
      } = yield call(queryAddrList, payload);

      yield put({
        type: 'updateState',
        payload: {
          dataSource: Array.isArray(rows) ? rows : [],
          total,
        },
      });
    },

    // 删除地址簿
    *deleteRow({ payload }, { call, put }) {
      const { response, status } = yield call(deleteAddrById, payload);
      return {
        success: response.ok,
        status,
      };
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
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, search }) => {});
    },
  },
};
