import { findRoles, remove, disable, enable } from '@/services/sys/iam/roles';
import createMessage from '@/components/core/AlertMessage';

const defaultSearchForm = {
  nameLike: undefined,
  custom: undefined,
  disabled: undefined,
};

export default {
  namespace: 'sysroles',
  state: {
    list: [],
    total: 0,
    searchForm: defaultSearchForm,
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { custom, disabled, ...restPayload } = payload;
      const newPayload = {
        ...restPayload,
        custom: custom === 'all' ? undefined : custom,
        disabled: disabled === 'all' ? undefined : disabled,
      };
      const { response } = yield call(findRoles, newPayload);
      if (response) {
        const { rows, total } = response;
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(rows) ? rows : [],
            total,
          },
        });
      }
    },

    *removeRole({ payload }, { call, select, put }) {
      const { id } = payload;
      const { response } = yield call(remove, id);
      if (response.ok) {
        const { searchForm } = yield select(({ sysroles }) => sysroles);
        yield put({ type: 'query', payload: searchForm });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg });
      }
    },

    *disable({ payload }, { call, put, select }) {
      const data = yield call(disable, payload.id);
      if (data.status === 200) {
        const { searchForm } = yield select(({ sysroles }) => sysroles);
        yield put({ type: 'query', payload: searchForm });
      }
    },

    *enable({ payload }, { call, put, select }) {
      const data = yield call(enable, payload.id);
      if (data.status === 200) {
        const { searchForm } = yield select(({ sysroles }) => sysroles);
        yield put({ type: 'query', payload: searchForm });
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
    cleanSearchForm(state, action) {
      return {
        ...state,
        searchForm: defaultSearchForm,
      };
    },
  },
};
