import { getViewConf } from '@/services/gen/flow';
import { getAdviserFlow, updateAdviser, createOpporPartner } from '@/services/hr/profile/adviser';
import message from '@/components/production/layout/Message';
import { closeThenGoto } from '@/layouts/routerControl';
import { getUrl } from '@/utils/flowToRouter';

export default {
  namespace: 'adviserFlow',
  state: {
    detailData: {},
    pageConfig: {},
    closeReason: '',
    twAuditInformationRecordViews: [],
    // 添加state
    flowForm: {
      remark: undefined,
      dirty: false,
    },
    fieldsConfig: {
      buttons: [],
      panels: {},
    },
    reasonFlag: '',
  },
  effects: {
    /* 更新 */
    *updateCoop({ payload }, { call, put, select }) {
      const { response } = yield call(updateAdviser, payload);
      return response;
    },

    /* 获取派工单详情 */
    *queryDetail({ payload }, { call, put, select }) {
      const { response } = yield call(getAdviserFlow, payload.id);
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            detailData: response.data,
            reasonFlag: response.data.reasonType ?? '',
          },
        });
      }
      return response;
    },

    // 添加effects
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
  },
  reducers: {
    updateState(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    clearDetailData(state, { payload }) {
      return {
        ...state,
        detailData: {},
      };
    },
    // 添加reducers修改flowForm
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
