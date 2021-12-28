import { getMyReceiveList } from '@/services/user/Contract/recvplan';
import { getChangeLog } from '@/services/sale/prompt/prompt';

export default {
  namespace: 'myReceiveList',
  state: {
    searchForm: {
      // 子合同编号
      subContractNo: null,
      // 主合同名称
      mainContractName: null,
      // 子合同名称
      subContractName: null,
      // 客户名称
      custName: null,
      // 交付BU
      deliBuId: null,
      // 收款账号
      recvNo: null,
      // 收款状态
      recvStatus: ['1', '2', '4'],
      // 预期收款日期
      expectRecvDateStart: null,
      expectRecvDateEnd: null,
      // 开票日期
      invDateStart: null,
      invDateEnd: null,
      // 实际收款日期
      actualRecvDateStart: null,
      actualRecvDateEnd: null,
      pmoResId: null,
    },
    recvPlanList: [], // 合同收款计划列表
    delList: [],
    total: 0,
    logList: [],
  },
  effects: {
    *query({ payload }, { call, put, select }) {
      const { response } = yield call(getMyReceiveList, payload);
      yield put({
        type: 'updateState',
        payload: {
          recvPlanList: Array.isArray(response.rows) ? response.rows : [],
          total: response.total,
        },
      });
    },

    *queryLog({ payload }, { call, put, select }) {
      const { response: changeLog } = yield call(getChangeLog, {
        recvplanId: payload,
      });
      yield put({
        type: 'updateState',
        payload: {
          logList: Array.isArray(changeLog.data) ? changeLog.data : [],
        },
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
