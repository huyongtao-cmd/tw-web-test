import {
  pcontractSaveRq,
  pcontractSubmitRq,
  pcontractRelatedDocsRq,
  pcontractDetailRq,
  rulesTemplateRulesDetailRq,
} from '@/services/workbench/contract';
import { getViewConf } from '@/services/gen/flow';
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import { commonModelReducers } from '@/utils/production/modelUtils';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
import message from '@/components/production/layout/Message';
import { closeThenGoto } from '@/layouts/routerControl';
import { getUrl } from '@/utils/flowToRouter';
import { fromQs } from '@/utils/production/stringUtil';
import { genFakeId } from '@/utils/mathUtils';

const defaultState = {
  formData: {
    relateDocumentList: [],
    docDelIds: [],
  },
  pageConfig: {
    pageBlockViews: [],
  },
  formMode: 'EDIT',
  pcontractRelatedDocsList: [],
  pcontractRelatedDocsTotal: 0,
  contractRulesList: [],
  flowForm: {
    remark: undefined,
    dirty: false,
  },
  fieldsConfig: {
    buttons: [],
    panels: {},
  },
};
export default {
  namespace: 'contractFlowApprove',

  state: defaultState,

  effects: {
    *rulesTemplatePagingRq({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(rulesTemplateRulesDetailRq, payload);
      yield put({
        type: 'updateState',
        payload: {
          contractRulesList: Array.isArray(data)
            ? data.map(v => ({ ...v, id: genFakeId(-1) }))
            : [],
        },
      });
    },
    *queryDetails({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(pcontractDetailRq, payload);

      const tt = Array.isArray(data.twPItemsViews)
        ? data.twPItemsViews.map(v => ({
            ...v,
            key: `${v.id || ''}-${v.type || ''}`,
            // disabled: !!v.relatedContractId,
          }))
        : [];

      yield put({
        type: 'updateForm',
        payload: {
          ...data,
          effectiveStartDate: [data.effectiveStartDate, data.effectiveEndDate],
          relateDocumentList: tt,
          relateDocumentDesc: tt
            .map(v => `${v.type || ''} - ${v.no || ''} - ${v.name || ''}` || '')
            .join(','),
        },
      });

      yield put({
        type: 'updateState',
        payload: {
          contractRulesList: Array.isArray(data.contractRules) ? data.contractRules : [],
        },
      });
    },

    *submit({ payload }, { call, put, select }) {
      const {
        effectiveStartDate: date,
        relateDocumentList,
        contractRulesList,
        ...params
      } = payload;
      if (Array.isArray(date) && (date[0] || date[1])) {
        [params.effectiveStartDate, params.effectiveEndDate] = date;
      }
      params.twPItemsViews = relateDocumentList;
      params.rulesIds = contractRulesList;

      const { data } = yield outputHandle(pcontractSubmitRq, params);

      message({ type: 'success' });
      const url = getUrl().replace('edit', 'view');
      closeThenGoto(url);
      return data;
    },

    *pcontractSave({ payload }, { call, put, select }) {
      const { effectiveStartDate: date, relateDocumentList, ...params } = payload;
      if (Array.isArray(date) && (date[0] || date[1])) {
        [params.effectiveStartDate, params.effectiveEndDate] = date;
      }

      params.twPItemsViews = relateDocumentList;

      const { data } = yield outputHandle(pcontractSaveRq, params, 'contractFlowCreate/success');

      yield put({
        type: 'updateForm',
        payload: data,
      });

      yield put({
        type: 'flowDetail',
        payload: {
          id: fromQs().id,
        },
      });

      return data;
    },

    // ??????????????????
    *getPageConfig({ payload }, { call, put, select }) {
      const { status, response } = yield call(businessPageDetailByNo, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            pageConfig: response.configInfo || {},
          },
        });
        return response;
      }
      return {};
    },

    *fetchConfig({ payload }, { call, put }) {
      const { status, response } = yield call(getViewConf, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            fieldsConfig: response || {},
          },
        });
        return response || {};
      }
      return {};
    },

    *pcontractRelatedDocs({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(pcontractRelatedDocsRq, payload);
      const { rows, total } = data;

      yield put({
        type: 'updateState',
        payload: {
          pcontractRelatedDocsTotal: total,
        },
      });

      return Array.isArray(rows)
        ? rows.map(v => ({
            ...v,
            key: `${v.id || ''}-${v.type || ''}`,
            disabled: !!v.relatedContractId,
          }))
        : [];
    },

    *init({ payload }, { put, select }) {
      const { id, copy = false } = payload;
      if (!id) {
        return;
      }
      const { data } = yield outputHandle(pcontractDetailRq, { id });
      // ???????????????,??????id???null
      const copyObj = {};
      if (copy) {
        copyObj.id = undefined;
      }
      yield put({
        type: 'updateState',
        payload: {
          formData: { ...data, ...copyObj },
        },
      });
    },

    *success({ payload }, { put, select }) {
      // ??????????????????,???????????????????????????,outputHandle?????????
      message({ type: 'success' });

      // ???????????????????????????????????????
      yield put({
        type: 'updateState',
        payload: {
          formMode: 'DESCRIPTION',
        },
      });

      // ??????
      yield put({
        type: 'init',
        payload,
      });
    },
  },

  reducers: {
    ...commonModelReducers(defaultState),

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
