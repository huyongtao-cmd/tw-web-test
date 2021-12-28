import { clone } from 'ramda';
import { resPlanLogList, listBpAll, resPlanLogicalDelete } from '@/services/hr/resPlan/resPlanLog';
import createMessage from '@/components/core/AlertMessage';
import { selectTaskListFun } from '@/services/hr/resPlan/rppItemServices';

const defaultSearchForm = {
  purchaseContract: undefined,
  supplierId: undefined,
  payNo: undefined,
  salesContract: undefined,
  custId: undefined,
  deliBuId: undefined,
  payStatus: undefined,
};

export default {
  namespace: 'resPlanLog',
  state: {
    searchForm: defaultSearchForm,
    list: [],
    total: undefined,
    selectedRowKeys: [],
    bpLogAll: [],
    taskList: [],
  },
  effects: {
    *query({ payload }, { call, put }) {
      const { response } = yield call(resPlanLogList, payload);
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(response.data.rows) ? response.data.rows : [],
            total: response.data.total,
            params: payload,
          },
        });
      }
    },

    *queryAll({ payload }, { call, put }) {
      const { response } = yield call(listBpAll);
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            bpLogAll: Array.isArray(response) ? response : [],
          },
        });
      }
    },

    *delete({ payload }, { call, select, put }) {
      const { status, response } = yield call(resPlanLogicalDelete, payload);
      return response;
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
      const { selectedRowKeys } = payload;
      return {
        ...state,
        searchForm: newFormData,
        selectedRowKeys,
      };
    },
    cleanSearchForm(state, action) {
      return {
        ...state,
        searchForm: defaultSearchForm,
      };
    },
  },
};
