import {
  findMainBU,
  findBUBasic,
  updateBasic,
  findBUCats,
  updateCats,
  queryBuTree,
  findbuMainTree,
  findbuAcc,
  logicDelete,
  activeBu,
  updateHangupAndClose,
  buVersionSave,
  getbuVersion,
  getTreeByVersion,
} from '@/services/org/bu/bu';
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import { findSubjtemplates } from '@/services/sys/baseinfo/subjtemplate';
import { savePartnerByBuId } from '@/services/org/bu/component/buPartner';
import { saveEqvaByBuId } from '@/services/org/bu/component/buEqva';
import { createBuProdClass } from '@/services/org/bu/component/buBusinessScope';
import router from 'umi/router';
import { createNotify } from '@/components/core/Notify';
import createMessage from '@/components/core/AlertMessage';

export default {
  namespace: 'orgbu',

  state: {
    list: [],
    delList: [],
    versionList: [],
    versionTotal: 0,
    listVersion: [],
    totalVersion: 0,
    buHistoryTree: [],
    mode: 'create',
    total: 0,
    expirys: 0,
    buId: 0,
    searchForm: {},
    versionSearchForm: {},
    formData: {
      accTmplId: null,
      beginPeriodId: null,
      beginPeriodName: null,
      buName: null,
      buNo: null,
      buStatus: null,
      buStatusDesc: null,
      buType: null,
      buTypeDesc: null,
      busiPeriodId: null,
      busiPeriodName: null,
      contactDesc: null,
      currCode: null,
      currCodeDesc: null,
      finCalendarId: null,
      finCalendarName: null,
      finPeriodId: null,
      finPeriodName: null,
      id: null,
      inchargeResId: null,
      inchargeResName: null,
      pid: null,
      remark: null,
    },
    catData: {
      regionCode: null,
      buCat1: null,
      buCat2: null,
      buCat3: null,
      buCat4: null,
      buCat5: null,
      buCat6: null,
      buCat7: null,
      buCat8: null,
      buCat9: null,
      buCat10: null,
      buCat11: null,
      buCat12: null,
      buCat13: null,
      buCat14: null,
      buCat15: null,
      buCat16: null,
      buCat17: null,
      buCat18: null,
      buCat19: null,
      buCat20: null,
    },
    buTree: [],
    treeArray: [],
    pageConfig: {},
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { response } = yield call(findMainBU, payload);
      yield put({
        type: 'updateState',
        payload: {
          list: Array.isArray(response.rows) ? response.rows : [],
          total: response.total,
        },
      });
    },

    *queryVersion({ payload }, { call, put, select }) {
      const { response } = yield call(findMainBU, payload);
      yield put({
        type: 'updateState',
        payload: {
          listVersion: Array.isArray(response.rows) ? response.rows : [],
          totalVersion: response.total,
        },
      });
    },

    *getSingle({ payload }, { call, put }) {
      const { response } = yield call(findBUBasic, payload);
      const { ok, datum = {} } = response;
      if (response && ok) {
        yield put({
          type: 'updateState',
          payload: {
            formData: datum,
            buId: datum ? datum.id : 0,
          },
        });
        return datum.id;
      }
      return 0;
    },

    *findCats({ payload }, { call, put }) {
      const { response } = yield call(findBUCats, { buId: payload });
      const { datum = {} } = response;
      yield put({
        type: 'updateState',
        payload: { catData: datum },
      });
    },
    *edit({ payload }, { call, put }) {
      const { response } = yield call(findBUBasic, payload);
      const { ok, reason, datum = {} } = response;
      yield put({
        type: 'updateState',
        payload: { formData: datum, buId: payload.buId },
      });
      router.push(`/org/bu/maindetail?buId=${payload.buId}`);
    },

    *updateBasic({ payload }, { call, put, select }) {
      const { key, value } = payload;
      const { formData } = yield select(({ orgbu }) => orgbu);
      const newFormData = Object.assign({}, formData);
      newFormData[key] = value;
      yield put({
        type: 'updateState',
        payload: { formData: newFormData },
      });
    },

    *updateCats({ payload }, { call, put, select }) {
      const { key, value } = payload;
      const { catData } = yield select(({ orgbu }) => orgbu);
      const newFormData = Object.assign({}, catData);
      newFormData[key] = value;
      yield put({
        type: 'updateState',
        payload: { catData: newFormData },
      });
    },

    *buDelete({ payload }, { call, put, select }) {
      const { response, status } = yield call(logicDelete, payload.delList);
      if (status === 100) {
        // ??????????????????
        return;
      }
      if (response.ok) {
        createNotify({ title: 'misc.success', code: 'misc_success', type: 'success' });
        yield put({
          type: 'query',
        });
      } else {
        createNotify({ title: 'misc.hint', code: 'misc_fail', type: 'error' });
      }
    },

    *hangAndCloseFn({ payload }, { call, put, select }) {
      const { type, ids } = payload;
      const { response, status } = yield call(updateHangupAndClose, ids, type);
      if (status === 100) {
        // ??????????????????
        return;
      }
      if (response.ok) {
        createNotify({ title: 'misc.success', code: 'misc_success', type: 'success' });
        yield put({
          type: 'query',
        });
      } else {
        createNotify({ title: 'misc.hint', code: 'misc_fail', type: 'error' });
      }
    },

    *saveBasicInfo({ payload }, { call, put, select }) {
      const { formData } = yield select(({ orgbu }) => orgbu);

      if (formData.remark && formData.remark.length > 200) {
        createMessage({ type: 'error', description: '??????????????????' });
        return;
      }
      if (formData.id) {
        // ?????????????????????
        const { code, response, status } = yield call(updateBasic, formData);
        if (status === 100) {
          // ??????????????????
          return;
        }
        if (response.ok) {
          createMessage({ type: 'success', description: '????????????' });
        } else {
          createMessage({ type: 'error', description: response.reason || '????????????' });
        }
      }
    },

    *saveBuCat({ payload }, { call, put, select }) {
      const { buId, catData } = yield select(({ orgbu }) => orgbu);
      if (buId) {
        // ?????????????????????
        const { code, response, status } = yield call(updateCats, buId, catData);
        if (status === 100) {
          // ??????????????????
          return;
        }
        if (response.ok) {
          createNotify({ title: 'misc.success', code: 'misc_success', type: 'success' });
        } else {
          createNotify({ title: 'misc.hint', code: 'misc_fail', type: 'error' });
        }
      }
    },

    *savePartner({ payload }, { call, put, select }) {
      const { buId, dataList, delList } = yield select(({ orgbuPartner }) => orgbuPartner);
      if (buId) {
        let flag = true;
        dataList.forEach(v => {
          if (Date.parse(v.dateFrom) > Date.parse(v.dateTo)) {
            flag = false;
          }
        });
        if (!flag) {
          createMessage({ type: 'error', description: '????????????????????????????????????' });
          return;
        }
        const { response, status } = yield call(savePartnerByBuId, buId, { dataList, delList });
        if (status === 100) {
          // ??????????????????
          return;
        }
        if (response.ok) {
          createNotify({ title: 'misc.success', code: 'misc_success', type: 'success' });
        } else {
          createNotify({ title: 'misc.hint', code: 'misc_fail', type: 'error' });
        }
      }
    },

    *saveBusinessScope({ payload }, { call, put, select }) {
      const { buId, dataList, delList } = yield select(({ buBusinessScope }) => buBusinessScope);
      const { response, status } = yield call(createBuProdClass, buId, {
        entity: dataList,
        delList,
      });
      if (status === 100) {
        // ??????????????????
        return;
      }
      if (response.ok) {
        createNotify({ title: 'misc.success', code: 'misc_success', type: 'success' });
      } else {
        createNotify({ title: 'misc.hint', code: 'misc_fail', type: 'error' });
      }
    },

    *queryBuTree({ payload }, { call, put }) {
      const { response } = yield call(queryBuTree);
      yield put({
        type: 'updateState',
        payload: {
          buTree: Array.isArray(response) ? response : [],
        },
      });
    },
    *querySubjtemplates({ payload }, { call, put }) {
      const { response } = yield call(findSubjtemplates);
      yield put({
        type: 'updateState',
        payload: {
          buTemplates: Array.isArray(response.rows) ? response.rows : [],
        },
      });
    },
    *findbuMainTree({ payload }, { call, put }) {
      const { response } = yield call(findbuMainTree);
      if (response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            tree: Array.isArray(response.datum) ? response.datum : [],
          },
        });
      }
    },
    // BU??????
    *active({ payload }, { put, call }) {
      const { response, status } = yield call(activeBu, payload.ids);
      if (status === 100) {
        // ??????????????????
        return;
      }
      if (response.ok) {
        createMessage({ type: 'success', description: '????????????' });
        yield put({ type: 'query' });
      } else {
        createMessage({ type: 'error', description: '????????????' });
      }
    },

    // ??????????????????
    *buSaveVersion({ payload }, { put, call }) {
      const { response, status } = yield call(buVersionSave, payload);
      if (status === 100) {
        // ??????????????????
        return;
      }
      if (response.ok) {
        createMessage({ type: 'success', description: '????????????' });
      } else {
        createMessage({ type: 'error', description: '????????????' });
      }
    },
    // ??????????????????
    *getBuVersion({ payload }, { put, call }) {
      const { response, status } = yield call(getbuVersion, payload);
      yield put({
        type: 'updateState',
        payload: {
          versionList: Array.isArray(response.rows) ? response.rows : [],
          versionTotal: response.total,
        },
      });
    },

    // ?????????????????????bu??????????????????
    *getTreeByVersion({ payload }, { call, put }) {
      const { response } = yield call(getTreeByVersion, payload);
      if (response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            buHistoryTree: Array.isArray(response.datum) ? response.datum : [],
          },
        });
      }
    },
    // ??????????????????
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
    updateVersionSearchForm(state, { payload }) {
      const { versionSearchForm } = state;
      const newFormData = { ...versionSearchForm, ...payload };
      return {
        ...state,
        versionSearchForm: newFormData,
      };
    },
  },
};
