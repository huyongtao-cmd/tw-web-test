import {
  purchaseEmergencyPaymentEditFn,
  purchaseEmergencyPaymentCreateFn,
  selectByFlowNoFn,
  isAPAccountantFn,
} from '@/services/sale/purchaseContract/paymentApplyList';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'emergencyPayment',
  state: {
    total: 0,
    searchForm: {},
    formData: {},
  },

  effects: {
    *selectFlow({ payload }, { call, put, select }) {
      const { status, response } = yield call(selectByFlowNoFn, payload);
      yield put({
        type: 'updateState',
        payload: {
          formData: response.datum || {},
        },
      });
      return response;
    },

    *submit({ payload }, { call, put, select }) {
      const { status, response } = yield call(purchaseEmergencyPaymentCreateFn, payload);
      return response;
    },

    *isAPAccountant({ payload }, { call, put, select }) {
      const { status, response } = yield call(isAPAccountantFn, payload);
      return response;
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

    updateSearchForm(state, { payload }) {
      const { searchForm } = state;
      const newFormData = { ...searchForm, ...payload };
      return {
        ...state,
        searchForm: newFormData,
      };
    },
  },
};
