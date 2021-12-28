import { purchaseEmergencyPaymentListFn } from '@/services/sale/purchaseContract/paymentApplyList';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'emergencyPaymentList',
  state: {
    list: [],
    total: 0,
    searchForm: {},
  },

  effects: {
    *query({ payload }, { call, put }) {
      //   const { date, ...params } = payload;
      //   if (Array.isArray(date) && (date[0] || date[1])) {
      //     [params.startDate, params.endDate] = date;
      //   }
      const { status, response } = yield call(purchaseEmergencyPaymentListFn, payload);
      if (status === 200) {
        const { rows, total } = response.data;
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(rows) ? rows : [],
            searchForm: {
              selectedRowKeys: [],
            },
            total,
          },
        });
      } else {
        createMessage({ type: 'error', description: response.reason || '查询失败' });
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
  },
};
