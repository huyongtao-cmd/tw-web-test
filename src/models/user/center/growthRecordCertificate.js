import { getCourseApplyList } from '@/services/user/growth';

export default {
  namespace: 'growthRecordCourse',

  state: {
    dataSource: [],
    total: 0,
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { response } = yield call(getCourseApplyList, payload);
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            dataSource: response.rows,
            total: response.total,
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
  },
};
