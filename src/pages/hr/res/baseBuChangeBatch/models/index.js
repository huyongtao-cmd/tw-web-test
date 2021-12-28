import { baseBuChangeRq } from '@/services/hr/res/baseBuChangeBatch';
import { resDetailRq } from '@/services/plat/res/resprofile';
import createMessage from '@/components/core/AlertMessage';
import moment from 'moment';

const defaultFormData = {
  date: moment()
    .startOf('year')
    .format('YYYY-MM-DD'),
};

export default {
  namespace: 'baseBuChangeBatch',
  state: {
    formData: defaultFormData,
    dataSource: [],
  },

  effects: {
    *queryResDetail({ payload }, { call, put }) {
      const { status, response } = yield call(resDetailRq, payload);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        if (response && response.ok) {
          const data = response.datum || {};
          return data;
        }
        createMessage({ type: 'error', description: response.reason || '获取资源详情失败' });
        return {};
      }
      createMessage({ type: 'error', description: response.reason || '获取资源详情失败' });
      return {};
    },
    *submit({ payload }, { call, put, select }) {
      const { status, response } = yield call(baseBuChangeRq, payload);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        if (response.ok) {
          createMessage({ type: 'success', description: '操作成功' });
          return response;
        }
        createMessage({ type: 'error', description: response.reason || '操作失败' });
        return {};
      }
      createMessage({ type: 'error', description: response.reason || '操作失败' });
      return {};
    },

    *clean(_, { call, put }) {
      yield put({
        type: 'updateState',
        payload: { formData: defaultFormData },
      });
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
  },
};
