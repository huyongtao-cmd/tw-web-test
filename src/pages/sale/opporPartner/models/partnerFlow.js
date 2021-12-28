import { getViewConf } from '@/services/gen/flow';
import {
  getPartnerFlow,
  updateOpporPartner,
  createOpporPartner,
} from '@/services/sale/opporPartner/opporPartner';
import message from '@/components/production/layout/Message';
import { closeThenGoto } from '@/layouts/routerControl';
import { getUrl } from '@/utils/flowToRouter';

export default {
  namespace: 'partnerFlow',
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
  },
  effects: {
    /* 更新 */
    *updateCoop({ payload }, { call, put, select }) {
      const { response } = yield call(updateOpporPartner, payload);
      return response;
    },

    /* 获取合作伙伴准入详情 */
    *queryDetail({ payload }, { call, put, select }) {
      const { response } = yield call(getPartnerFlow, payload.id);
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            detailData: response.data,
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
