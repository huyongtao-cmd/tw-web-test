import { clone } from 'ramda';
import { payPlanPatchDelete } from '@/services/plat/recv/purchase';
import {
  getPurchaseConractPaymentPlansRq,
  updatePaymentPlanByIdRq,
} from '@/services/sale/paymentPlan/paymentPlan';
import createMessage from '@/components/core/AlertMessage';

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
  namespace: 'purchaseContractPaymentPlan',
  state: {
    searchForm: defaultSearchForm,
    list: [],
    total: undefined,
    selectedRowKeys: [],
  },
  effects: {
    *query({ payload }, { call, put }) {
      const { response } = yield call(getPurchaseConractPaymentPlansRq, payload);
      if (response) {
        const { rows, total } = response;
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(rows) ? clone(rows) : [],
            selectedRowKeys: [],
            total,
          },
        });
      }
    },
    *delete({ payload }, { call, select, put }) {
      const { status, response } = yield call(payPlanPatchDelete, payload);
      if (status === 200 && response.ok) {
        createMessage({ type: 'success', description: '删除成功' });
        const { searchForm } = yield select(({ contractPurchasePlan }) => contractPurchasePlan);
        yield put({
          type: 'query',
          payload: searchForm,
        });
      } else if (status === 100) {
        // 主动取消请求，不做操作
      } else {
        createMessage({ type: 'error', description: '删除失败' });
      }
    },
    *submit({ payload }, { call, put }) {
      const { response } = yield call(updatePaymentPlanByIdRq, payload);
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
