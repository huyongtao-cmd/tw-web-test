import { getSubContractDetail, saveVirtualSubContract } from '@/services/plat/prePayMgmt';
import { launchFlowFn } from '@/services/sys/flowHandle';
import createMessage from '@/components/core/AlertMessage';
import { closeThenGoto } from '@/layouts/routerControl';
import router from 'umi/router';
import { getViewConf } from '@/services/gen/flow';

export default {
  namespace: 'submitVirtualSub',

  state: {
    formData: {},
    ruleList: [],
    formMode: 'EDIT',
    fieldsConfig: {},
    flowForm: {
      remark: undefined,
      salesmanResId: undefined,
      dirty: false,
    },
  },

  effects: {
    *querySubContractDetail({ payload }, { call, put, select }) {
      const { response } = yield call(getSubContractDetail, payload);
      if (response.ok) {
        const data = response.datum || {};
        yield put({
          type: 'updateState',
          payload: {
            formData: response.datum || {},
            ruleList: Array.isArray(response.datum.profitAgreeList)
              ? response.datum.profitAgreeList
              : [],
          },
        });
      }
    },

    *saveSubContractDetail({ payload }, { call, put, select }) {
      const { response } = yield call(saveVirtualSubContract, payload);
      if (response && response.ok) {
        const kid = response.datum;
        const responseFlow = yield call(launchFlowFn, {
          defkey: 'ACC_A112',
          value: {
            id: kid,
          },
        });
        const response2 = responseFlow.response;
        if (response2 && response2.ok) {
          createMessage({ type: 'success', description: '提交成功' });
          closeThenGoto('/user/flow/process?type=procs');
        } else {
          createMessage({
            type: 'warn',
            description: '提交出现问题,请返回重新提交',
          });
        }
      } else if (response.reason === 'CONTRACT:CONTRACT_ACTIVACTION_ISNULL_CHECK') {
        createMessage({
          type: 'warn',
          description: '子合同收益分配规则不能为空,请返回子合同完善信息',
        });
      } else {
        createMessage({ type: 'warn', description: response.reason });
      }
    },

    *fetchConfig({ payload }, { call, put }) {
      const { status, response } = yield call(getViewConf, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            formMode: 'DESCRIPTION',
            fieldsConfig: response || {},
            flowForm: {
              remark: undefined,
              salesmanResId: undefined,
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
    clearForm(state, { payload }) {
      return {
        formData: {},
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
