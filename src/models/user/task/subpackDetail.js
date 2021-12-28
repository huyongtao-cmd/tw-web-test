import { querySubpackDetail, queryBuSubpackDetail } from '@/services/user/task/received';
import { getViewConf } from '@/services/gen/flow';

export default {
  namespace: 'userTaskSubpackDetail',

  state: {
    formData: {
      disterResId: null,
      receiverResId: null,
      taskName: null,
      capasetLeveldId: null,
      pid: null,
      planStartDate: null,
      planEndDate: null,
      remark: null,
    },
    fieldsConfig: {},
    flowForm: {
      remark: undefined,
      dirty: false,
    },
    taskSourceView: {}, // 来源任务包信息
    taskChangeView: {}, // 转包信息
    taskSurplusView: {}, // 结余信息
    taskApplyView: {}, // 转包申请信息
    taskOtherChangeViews: [],
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { response } = yield call(querySubpackDetail, payload);
      if (response && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            formData: response.datum || {},
          },
        });
      }
    },
    *fetchConfig({ payload }, { call, put }) {
      const { status, response } = yield call(getViewConf, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            fieldsConfig: response || {},
            flowForm: {
              remark: undefined,
              dirty: false,
            },
          },
        });
      }
    },
    // 到bu负责人时需要查询的信息
    *queryBu({ payload }, { call, put }) {
      const { response } = yield call(queryBuSubpackDetail, payload);
      if (response && response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            taskSourceView: response.datum ? response.datum.twTransferTaskSourceView : {},
            taskChangeView: response.datum ? response.datum.twTransferTaskChangeView : {},
            taskSurplusView: response.datum ? response.datum.twTransferTaskSurplusView : {},
            formData: response.datum ? response.datum.twTransferTaskApplyView : {},
            taskOtherChangeViews: response.datum
              ? response.datum.twTransferTaskChangeView.transferTaskOtherChangeViews
              : [],
          },
        });
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
    updateFlowForm(state, { payload }) {
      const { flowForm } = state;
      const newFlowForm = { ...flowForm, ...payload };
      return {
        ...state,
        flowForm: newFlowForm,
      };
    },
  },
};
