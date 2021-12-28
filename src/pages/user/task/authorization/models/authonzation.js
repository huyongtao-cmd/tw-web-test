/* eslint-disable consistent-return */
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
  delAuthonzation,
  savePartAuthonzation,
} from '@/services/user/task/authonzation';
import { selectUsersWithBu, selectCapasetLevelBy } from '@/services/gen/list';
import { closeThenGoto } from '@/layouts/routerControl';

export default {
  namespace: 'authonzation',

  state: {
    // 查询系列
    formData: {
      reasonType: '01',
      acceptMethod: '01',
      pricingMethod: '总价',
      authResPlanFlag: true,
    },
    dataSource: [],
    total: 0,
    pageConfig: null,
    taskProjSource: [],
    searchForm: undefined,
    taskProjList: [], // 事由号-项目列表
    // 任务状态变更
  },

  effects: {
    *query({ payload }, { call, put }) {
      const { response } = yield call(queryAuthonzations, payload);
      yield put({
        type: 'updateState',
        payload: {
          dataSource: Array.isArray(response?.data?.rows) ? response?.data?.rows : [],
          total: response?.data?.total,
        },
      });
      return response;
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

    *updateAuthStatus({ payload }, { call, put }) {
      const { response } = yield call(savePartAuthonzation, payload);
      if (response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            formData: response.data,
          },
        });
        return response.data;
      }
      return null;
    },
    //查询事由号相关当量
    *getReasonInfo({ payload }, { call, put }) {
      const { response } = yield call(queryReasonInfo, payload);
      if (response.ok) {
        return response.data;
      }
      createMessage({ type: 'warn', description: response?.errors[0]?.code });

      return null;
    },

    *save({ payload }, { call, put, select }) {
      const { formData } = yield select(({ authonzation }) => authonzation);
      const param = {
        ...formData,
        ...payload,
      };
      delete param.createTime;
      const { status, response } = yield call(saveAuthonzation, param);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        // 进入派发编辑页，再次推动流程
        closeThenGoto(`/user/task/authonzationList`);
        return;
      }
      createMessage({ type: 'error', description: response.errors[0]?.code || '保存失败' });
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

    // 判断是否可以派发
    *checkDist({ payload }, { call, put }) {
      const { status, response } = yield call(checkDist, payload);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        router.push(`/user/distribute/create?taskId=${payload.id}`);
      } else {
        createMessage({ type: 'error', description: response.reason || '不满足派发条件' });
      }
    },

    *close({ payload }, { call, put }) {
      const { status, response } = yield call(closeTasks, payload);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        createMessage({ type: 'success', description: '任务关闭成功' });
        yield put({
          type: 'query',
        });
      } else {
        createMessage({ type: 'error', description: response.reason || '不满足关闭条件' });
      }
    },

    *delete({ payload }, { call, put }) {
      const { status, response } = yield call(delAuthonzation, payload);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        createMessage({ type: 'success', description: '任务授权删除成功' });
        yield put({
          type: 'query',
        });
        return true;
      }
      createMessage({ type: 'error', description: response.reason || '不满足删除条件' });
      return false;
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
