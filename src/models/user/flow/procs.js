import { getProcs } from '@/services/user/flow/flow';
import { cancelFlow } from '@/services/gen/flow';
import createMessage from '@/components/core/AlertMessage';

const defaultSearchForm = {
  todoAssigneeNameLike: undefined,
  done: false,
  defKey: undefined,
  no: undefined,
  nameLike: undefined,
  infoLike: undefined,
  initiator: undefined,
  sinceDate: undefined,
  untilDate: undefined,
};

export default {
  namespace: 'flowProcs',
  state: {
    searchForm: defaultSearchForm,
    list: [],
    total: undefined,
  },
  effects: {
    *query({ payload }, { call, put }) {
      const { sinceDate, untilDate, done } = payload;
      const params = { ...payload };
      if (sinceDate && typeof sinceDate !== 'string') {
        params.sinceDate = sinceDate.format('YYYY-MM-DD');
      }
      if (untilDate && typeof untilDate !== 'string') {
        params.untilDate = untilDate.format('YYYY-MM-DD');
      }
      if (done === 'all') {
        delete params.done;
      }
      const { response, status } = yield call(getProcs, params);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(response.rows) ? response.rows : [],
            total: response.total,
          },
        });
      }
    },
    *deleteProc({ payload }, { call, put, select }) {
      const { status, response } = yield call(cancelFlow, payload);
      if (status === 200) {
        createMessage({ type: 'success', description: response.reason || '删除成功' });
        const { searchForm } = yield select(({ flowProcs }) => flowProcs);
        yield put({
          type: 'query',
          payload: searchForm,
        });
        yield put({ type: 'updateSearchForm', payload: { selectedRowKeys: [] } });
      } else if (status === 100) {
        // 主动取消请求，不做操作
      } else createMessage({ type: 'error', description: response.reason || '删除失败' });
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
    cleanSearchForm(state, action) {
      return {
        ...state,
        searchForm: {
          ...defaultSearchForm,
          selectedRowKeys: [],
        },
      };
    },
  },
};
