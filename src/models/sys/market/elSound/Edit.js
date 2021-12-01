import { addElSoundRq, getElSoundDetailsRq } from '@/services/sys/market/elSound';
import createMessage from '@/components/core/AlertMessage';
import { closeThenGoto } from '@/layouts/routerControl';

export default {
  namespace: 'sysMarketElSoundEdit',
  state: {
    formData: {},
  },

  effects: {
    *save({ payload }, { call, put }) {
      const { status, response } = yield call(addElSoundRq, payload);
      if (status === 200) {
        if (response && response.ok) {
          createMessage({ type: 'success', description: '提交成功' });
          closeThenGoto(`/plat/contentMgmt/elSound`);
        } else {
          const message = response.reason || '提交失败';
          createMessage({ type: 'warn', description: message });
        }
      }
    },
    *getDetails({ payload }, { call, put }) {
      const { status, response } = yield call(getElSoundDetailsRq, payload);
      if (status === 200) {
        if (response && response.ok) {
          const detail = response.datum ? response.datum : {};
          yield put({
            type: 'updateForm',
            payload: {
              ...detail,
            },
          });
        } else {
          const message = response.reason || '获取详细信息失败';
          createMessage({ type: 'warn', description: message });
        }
      }
    },
  },

  reducers: {
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
      };
    },
    clearForm(state, { payload }) {
      return {
        ...state,
        formData: {},
      };
    },
  },
};
