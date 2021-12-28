import { isNil } from 'ramda';
import {
  channelCostConDDetailByIdRq,
  channelCostConEditRq,
} from '@/services/user/Contract/ChannelFee';
import { queryProdList } from '@/services/sys/baseinfo/product';
import { selectAbOus } from '@/services/gen/list';
import { launchFlowFn } from '@/services/sys/flowHandle';
import createMessage from '@/components/core/AlertMessage';
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import { getViewConf } from '@/services/gen/flow';
import moment from 'moment';

export default {
  namespace: 'channelFeeDetail',

  state: {
    formData: {
      demandStatus: 'CREATE',
    },
    dataSource: [],
    channelConstCon: [],
    delChannelCostConD: [],
    prodList: [],
    abOusArr: [],
    oppoChannelCosttViews: [],
    collectionPlanView: [],
    pageConfig: {
      pageBlockViews: [],
    },
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
    *query({ payload }, { call, put, select }) {
      const { status, response } = yield call(channelCostConDDetailByIdRq, payload);
      const {
        user: { extInfo },
      } = yield select(({ user }) => user);

      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        // const { demandType, signBuIdInchargeResId } = response.datum;
        yield put({
          type: 'getPageConfig',
          payload: { pageNo: 'SALE_CONTRACT_EDIT_SUB:not' },
        });

        const {
          oppoChannelCosttViews,
          channelCostConDEntities,
          collectionPlanView,
          ...newFormData
        } = response.datum || {};
        yield put({
          type: 'updateState',
          payload: {
            oppoChannelCosttViews: Array.isArray(oppoChannelCosttViews)
              ? oppoChannelCosttViews
              : [],
            collectionPlanView: Array.isArray(collectionPlanView) ? collectionPlanView : [],
            dataSource: Array.isArray(channelCostConDEntities) ? channelCostConDEntities : [],
            channelConstCon: Array.isArray(channelCostConDEntities)
              ? JSON.parse(JSON.stringify(channelCostConDEntities))
              : [],
          },
        });
        const { applyDate, applyResId, applyBuId, ...parmars } = newFormData;
        yield put({
          type: 'updateForm',
          payload: {
            applyDate: isNil(applyDate) ? moment().format('YYYY-MM-DD') : applyDate,
            applyResId: isNil(applyResId) ? extInfo.resId : applyResId,
            applyBuId: isNil(applyBuId) ? extInfo.baseBuId : applyBuId,
            ...parmars,
          },
        });
      } else {
        createMessage({
          type: 'error',
          description: response.reason || '获取渠道费用详情失败',
        });
      }
    },
    *selectAbOus({ payload }, { call, put }) {
      const { response } = yield call(selectAbOus, payload);
      yield put({
        type: 'updateState',
        payload: {
          abOusArr: response || [],
        },
      });
    },
    *queryProdListFun({ payload }, { call, put }) {
      const {
        response: { rows, total },
      } = yield call(queryProdList, payload);

      yield put({
        type: 'updateState',
        payload: {
          prodList: Array.isArray(rows) ? rows : [],
        },
      });
    },
    *save({ payload }, { call, put, select }) {
      const { formData, dataSource, delChannelCostConD } = yield select(
        ({ channelFeeDetail }) => channelFeeDetail
      );
      const { status, response } = yield call(channelCostConEditRq, {
        ...formData,
        channelCostConDEntities: dataSource,
        delChannelCostConD,
      });
      if (response && response.ok) {
        const { TwChannelCostConView, channelCostConDEntities, ...newFormData } = response.datum;
        yield put({
          type: 'updateState',
          payload: {
            dataSource: Array.isArray(channelCostConDEntities) ? channelCostConDEntities : [],
            delChannelCostConD: [],
          },
        });
        yield put({
          type: 'updateForm',
          payload: newFormData,
        });
        yield put({
          type: 'userContractEditSub/updateState',
          payload: {
            flag7: 0,
          },
        });
        createMessage({ type: 'success', description: '保存成功' });
        return response;
      }
      createMessage({ type: 'error', description: response.reason || '保存失败' });
      return {};
    },
    *submit({ payload }, { call, select, put, all }) {
      const responseFlow = yield call(launchFlowFn, {
        defkey: 'ACC_A55',
        value: {
          id: payload.id,
        },
      });
    },
    // 获取配置字段
    *getPageConfig({ payload }, { call, put, select }) {
      const { status, response } = yield call(businessPageDetailByNo, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            pageConfig: response.configInfo,
          },
        });
        return response;
      }
      return {};
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
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
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
