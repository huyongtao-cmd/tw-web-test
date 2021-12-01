import {
  deleteProdPord,
  doInspect,
  doPutaway,
  doSoldOut,
  finishInspect,
  queryProdList,
} from '@/services/sys/baseinfo/product';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'sysProduct',

  state: {
    searchForm: {},
    list: [],
    total: 0,
  },

  effects: {
    *fetch({ payload }, { call, put }) {
      const {
        response: { rows, total },
      } = yield call(queryProdList, payload);

      yield put({
        type: 'updateState',
        payload: {
          list: Array.isArray(rows) ? rows : [],
          total,
        },
      });
    },
    *delete({ payload }, { call, put }) {
      const { status, response } = yield call(deleteProdPord, payload.ids);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        createMessage({ type: 'success', description: '删除产品成功。' });
        yield put({ type: 'fetch', payload: { ...payload.queryParams } });
      } else {
        createMessage({ type: 'error', description: '删除产品失败。' });
      }
    },
    *putaway({ payload }, { call, put }) {
      const {
        status,
        response: { reason },
      } = yield call(doPutaway, payload.ids);
      return { reason, status };
    },
    *soldOut({ payload }, { call, put }) {
      const {
        status,
        response: { reason },
      } = yield call(doSoldOut, payload.ids);
      return { reason, status };
    },
    *doInspect({ payload }, { call, put }) {
      const {
        status,
        response: { reason },
      } = yield call(doInspect, payload.id);
      return { reason, status };
    },
    *finishInspect({ payload }, { call, put }) {
      const {
        status,
        response: { reason },
      } = yield call(finishInspect, payload.id);
      return { reason, status };
    },
  },

  reducers: {
    updateState(state, action) {
      return {
        ...state,
        ...action.payload,
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
      history.listen(location => {});
    },
  },
};
