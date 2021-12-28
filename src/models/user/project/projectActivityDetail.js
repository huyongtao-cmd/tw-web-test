import {
  findProjectActivityByProjId,
  findProjectActivityChangeByProjId,
  projectActivitySave,
  findProjectById,
} from '@/services/user/project/project';
import { getViewConf } from '@/services/gen/flow';

export default {
  namespace: 'userProjectActivityDetail',

  state: {
    formData: {},
    projActivitys: [],
    projActivitysByChange: [],
    deleteList: [],
    showProjActivitys: [], // 显示的变更前
    showProjActivitysByChange: [], //显示的变更后
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
    *query({ payload }, { call, put }) {
      const { response } = yield call(findProjectActivityChangeByProjId, payload);
      yield put({
        type: 'updateState',
        payload: {
          projActivitys: Array.isArray(response.datum) ? response.datum : [],
          showProjActivitys: Array.isArray(response.datum)
            ? response.datum.filter(
                v =>
                  v.phaseFlag === 1 ||
                  (v.startDate !== '' &&
                    v.endDate !== '' &&
                    v.startDate !== null &&
                    v.endDate !== null)
              )
            : [],
        },
      });
    },

    *querByChange({ payload }, { call, put }) {
      const { response } = yield call(findProjectActivityChangeByProjId, payload);
      yield put({
        type: 'updateState',
        payload: {
          projActivitysByChange: Array.isArray(response.datum) ? response.datum : [],
          showProjActivitysByChange: Array.isArray(response.datum)
            ? response.datum.filter(
                v =>
                  v.phaseFlag === 1 ||
                  (v.startDate !== '' &&
                    v.endDate !== '' &&
                    v.startDate !== null &&
                    v.endDate !== null)
              )
            : [],
        },
      });
    },
    // 查询项目内容
    *queryProject({ payload }, { call, put }) {
      const {
        response: { ok, datum },
      } = yield call(findProjectById, payload.projId);
      if (ok) {
        yield put({
          type: 'updateState',
          payload: {
            formData: datum || {},
          },
        });
      }
    },
    *save(payload, { call, select, put }) {
      const { projActivitysByChange, deleteList } = yield select(
        ({ userProjectActivityDetail }) => userProjectActivityDetail
      );

      const { status, response } = yield call(projectActivitySave, {
        projId: payload.projId,
        projActivityTempEntities: projActivitysByChange,
        deleteIds: deleteList,
        prcId: payload.prcId,
      });
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
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, search }) => {});
    },
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
};
