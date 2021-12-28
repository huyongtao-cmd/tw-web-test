import {
  findProjectActivityByProjId,
  projectActivitySave,
  findProjectById,
} from '@/services/user/project/project';
import createMessage from '@/components/core/AlertMessage';
import { closeThenGoto } from '@/layouts/routerControl';
import { launchFlowFn } from '@/services/sys/flowHandle';
import moment from 'moment';

export default {
  namespace: 'userProjectActivity',

  state: {
    dataSource: [],
    deleteList: [],
    showDateSource: [],
    projActivityStatus: null, //活动状态
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { response } = yield call(findProjectActivityByProjId, payload.projId);
      yield put({
        type: 'updateState',
        payload: {
          dataSource: Array.isArray(response.datum) ? response.datum : [],
          showDateSource: Array.isArray(response.datum)
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
    *save(payload, { call, select, put }) {
      const responseFlow = yield call(launchFlowFn, {
        defkey: 'TSK_P11',
        value: {
          id: payload.projId,
        },
      });
      const response2 = responseFlow.response;
      if (response2 && response2.ok) {
        const { dataSource, deleteList } = yield select(
          ({ userProjectActivity }) => userProjectActivity
        );

        const { status, response } = yield call(projectActivitySave, {
          projId: payload.projId,
          projActivityTempEntities: dataSource,
          prcId: response2.datum.id,
          deleteIds: deleteList,
        });
        if (status === 100) {
          // 主动取消请求
          return;
        }
        if (response && response.ok) {
          if (response.errorCode) {
            createMessage({ type: 'error', description: response.errorCode });
          } else {
            yield put({
              type: 'query',
              payload: { projId: payload.projId },
            });
            createMessage({ type: 'success', description: '保存成功' });
            closeThenGoto(`/user/flow/process?type=procs&refresh=${moment().valueOf()}`);
            // 保存成功之后不让跳了
            // closeThenGoto(`/user/project/projectDetail?id=${payload.projId}`);
          }
        } else {
          createMessage({ type: 'error', description: response.reason || '保存失败' });
        }
      } else {
        createMessage({ type: 'error', description: response2.errorCode });
      }
    },
    // 查询项目内容
    *queryProjActivityStatus({ payload }, { call, put }) {
      const {
        response: { ok, datum },
      } = yield call(findProjectById, payload.projId);
      if (ok) {
        yield put({
          type: 'updateState',
          payload: {
            projActivityStatus: datum.projActivityStatus || '',
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
};
