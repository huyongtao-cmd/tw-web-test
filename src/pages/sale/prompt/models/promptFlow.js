import { getViewConf } from '@/services/gen/flow';
import { getPrompt, updatePrompt, getChangeLog, getRecDetail } from '@/services/sale/prompt/prompt';
import message from '@/components/production/layout/Message';
import { closeThenGoto } from '@/layouts/routerControl';
import { getUrl } from '@/utils/flowToRouter';
import { getRecvplanListPersonal } from '@/services/user/Contract/recvplan';
import { getNoticeLength } from '@/services/gen/center';
import moment from 'moment';

export default {
  namespace: 'promptFlow',
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
    days: '',
    maxTime: 2,
  },
  effects: {
    /* 更新 */
    *updatePrompt({ payload }, { call, put, select }) {
      const { response } = yield call(updatePrompt, payload);
      return response;
    },
    *queryNoticeLength({ payload }, { call, put }) {
      const { response } = yield call(getNoticeLength, payload);
      // return response;
    },

    /* 获取催款单详情 */
    *queryDetail({ payload }, { call, put, select }) {
      const { response } = yield call(getPrompt, payload.id);
      // console.log(response, '777');
      const { response: plan } = yield call(getRecDetail, {
        recvNoAccurate: response?.data?.recvNo,
      });
      const { response: changeLog } = yield call(getChangeLog, {
        recvplanId: response?.data?.recvplanId,
      });
      let setParam = { key: '' };
      if (plan.data.recvStatus === '1') {
        setParam = { key: 'MAX_RECV_DT_DELAYDAYS' };
      } else if (plan.data.recvStatus === '2' || plan.data.recvStatus === '4') {
        setParam = { key: 'MAX_RECV_DT_DELAYDAYS_2' };
      }
      let settingConfig;
      if (plan.data.recvStatus !== '3') {
        const settingConfigResponse = yield call(getNoticeLength, setParam);
        settingConfig = settingConfigResponse.response;
      }

      const { response: maxConfig } = yield call(getNoticeLength, { key: 'RECV_DT_CHG_UGD_CNT' });
      if (maxConfig) {
        yield put({
          type: 'updateState',
          payload: {
            maxTime: maxConfig.data.settingValue,
          },
        });
      }

      if (settingConfig) {
        yield put({
          type: 'updateState',
          payload: {
            days: settingConfig.data.settingValue,
          },
        });
      }
      // if (settingConfig) {
      //   yield put({
      //     type: 'updateState',
      //     payload: {
      //       days: settingConfig.data.settingValue,
      //     },
      //   });
      // }
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            detailData: response.data,
            // flag1:response.data.pmConfirm,
            // flag2:response.data.recvDateConfirm,
            // flag3:response.data.financeConfirm
          },
        });
      }
      if (plan) {
        const exDate = moment(plan?.data.expectRecvDate).valueOf();
        const today = moment().valueOf();
        yield put({
          type: 'updateState',
          payload: {
            recvPlanDetail: plan?.data,
            startDay: exDate > today ? exDate : today,
          },
        });
      }
      if (changeLog) {
        yield put({
          type: 'updateState',
          payload: {
            logList: Array.isArray(changeLog.data) ? changeLog.data : [],
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

    //查询合同收款计划
    *query({ payload }, { call, put, select }) {
      const { response } = yield call(getRecvplanListPersonal, payload);
      yield put({
        type: 'updateState',
        payload: {
          recvPlanList: Array.isArray(response.rows) ? response.rows : [],
          total: response.total,
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
    clearDetailData(state, { payload }) {
      return {
        ...state,
        detailData: {},
      };
    },
    // 添加reducers修改flowForm
    updateForm(state, { payload }) {
      const { detailData } = state;
      const newFlowForm = { ...detailData, ...payload };
      return {
        ...state,
        detailData: newFlowForm,
      };
    },
  },
};
