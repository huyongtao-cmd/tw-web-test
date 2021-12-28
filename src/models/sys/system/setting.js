import { clearCacheHandle, reloadCacheDefIdFun } from '@/services/sys/system/setting';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'syssetting',
  state: {},

  effects: {
    *clearCacheHandleFn({ payload }, { call, put }) {
      const response = yield call(clearCacheHandle);
      if (response.status === 200) {
        createMessage({ type: 'success', description: '清除成功' });
      }
    },

    *reloadCacheDefIdFn({ payload }, { call, put }) {
      const response = yield call(reloadCacheDefIdFun, payload);
      if (response.status === 200) {
        createMessage({ type: 'success', description: '重置成功' });
      }
    },
  },

  reducers: {},

  subscriptions: {},
};
