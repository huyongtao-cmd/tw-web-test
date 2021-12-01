import { queryResInfo } from '@/services/user/center/myTeam';
import { fromQs } from '@/utils/stringUtils';

const defaultSearchForm = {
  receiverResId: fromQs().resId,
};

export default {
  namespace: 'taskList',
  state: {
    searchForm: defaultSearchForm,
    dataSource: [],
    total: undefined,
    detailList: [],
    detailTotal: undefined,
    detailTitle: undefined,
  },
  effects: {
    *queryResInfo({ payload }, { call, put }) {
      const { response } = yield call(queryResInfo, payload);
      if (response) {
        const resInfo = response.datum || {};
        yield put({
          type: 'updateSearchForm',
          payload: {
            receiverResName: resInfo.resName,
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
