import { channelCostListRq } from '@/services/sale/purchaseContract/paymentApplyList';
import { channelCostConDEditRq } from '@/services/user/Contract/ChannelFee';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'channelFeeList',
  state: {
    list: [],
    total: 0,
    searchForm: {},
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { date, ...params } = payload;
      if (Array.isArray(date) && (date[0] || date[1])) {
        [params.startDate, params.endDate] = date;
      }

      const { status, response } = yield call(channelCostListRq, params);
      if (status === 200) {
        const { rows, total } = response;
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
    *save({ payload }, { call, put, select }) {
      const { status, response } = yield call(channelCostConDEditRq, payload);
      // if (response && response.ok) {

      //   return response;
      // }
      // createMessage({ type: 'error', description: response.reason || '保存失败' });
      // return {};
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
      return {
        ...state,
        searchForm: newFormData,
      };
    },
  },
};
