import createMessage from '@/components/core/AlertMessage';
import router from 'umi/router';
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import { getViewConf } from '@/services/gen/flow';

import {
  cancelTask,
  queryAuthonzations,
  reopenTask,
  checkDist,
  getAuthonzation,
  deleteUserTasksByIds,
  closeTasks,
  queryReasonList,
  queryReasonInfo,
  saveAuthonzation,
} from '@/services/user/task/authonzation';
import { selectUsersWithBu, selectCapasetLevelBy } from '@/services/gen/list';
import { closeThenGoto } from '@/layouts/routerControl';

export default {
  namespace: 'authonzationFlow',

  state: {
    // 查询系列
    Source: [],
    total: 0,
    taskProjSource: [],
    taskProjList: [], // 事由号-项目列表
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
    *query({ payload }, { call, put }) {
      const {
        response: {
          data: { rows, total },
        },
      } = yield call(queryAuthonzations, payload);
      yield put({
        type: 'updateState',
        payload: {
          dataSource: Array.isArray(rows) ? rows : [],
          total,
        },
      });
    },

    *queryById({ payload }, { call, put }) {
      const { response } = yield call(getAuthonzation, payload);
      if (response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            formData: response.data,
          },
        });
      }
      return response.data;
    },

    //查询事由号相关当量
    *getReasonInfo({ payload }, { call, put }) {
      const { response } = yield call(queryReasonInfo, payload);
      // yield put({
      //   type: 'updateState',
      //   payload: {
      //     dataSource: Array.isArray(rows) ? rows : [],
      //     total,
      //   },
      // });
      if (response.ok) {
        return response.data;
      }
      createMessage({ type: 'warn', description: response?.errors[0]?.code });

      return null;
    },

    *save({ payload }, { call, put, select }) {
      const { formData } = yield select(({ authonzationFlow }) => authonzationFlow);
      const payloadObj = {
        ...formData,
        ...payload,
      };
      delete payloadObj.createTime;
      const { status, response } = yield call(saveAuthonzation, payloadObj);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        // 进入派发编辑页，再次推动流程
        closeThenGoto(`/user/task/authonzationList`);
        return;
      }
      createMessage({ type: 'error', description: response.reason || '保存失败' });
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

    *queryProjList({ payload }, { call, put }) {
      const { response } = yield call(queryReasonList);
      if (response.datum) {
        yield put({
          type: 'updateState',
          payload: {
            taskProjList: Array.isArray(response.datum) ? response.datum : [],
            taskProjSource: Array.isArray(response.datum) ? response.datum : [],
          },
        });
      }
    },

    // 工种 + 工种子类 + 复合能力 -> 资源
    *queryResList({ payload }, { call, put }) {
      const response = yield call(selectUsersWithBu);
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            resList: Array.isArray(response.response) ? response.response : [],
            resSource: Array.isArray(response.response) ? response.response : [],
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
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
      };
    },
  },
};
