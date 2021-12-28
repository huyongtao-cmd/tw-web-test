import { isNil } from 'ramda';
import moment from 'moment';
import createMessage from '@/components/core/AlertMessage';
import { closeThenGoto } from '@/layouts/routerControl';
import { createOpporPartner } from '@/services/sale/opporPartner/opporPartner';

export default {
  namespace: 'opporPartner',
  state: {
    formData: {
      reportedDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
  },

  effects: {
    *create({ payload }, { call, put }) {
      const { status, response } = yield call(createOpporPartner, payload);
      if (status === 200) {
        const { submitted } = payload;
        if (response && response.ok) {
          createMessage({ type: 'success', description: submitted ? '提交成功' : '保存成功' });
          closeThenGoto(`/user/flow/process`);
        } else {
          const message = response.reason || (submitted ? '提交失败' : '保存失败');
          createMessage({ type: 'warn', description: message });
        }
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
