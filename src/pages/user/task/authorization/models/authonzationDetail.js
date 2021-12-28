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
  queryAuthTasks,
} from '@/services/user/task/authonzation';
import { queryUserTasks } from '@/services/user/task/task';

import { selectUsersWithBu, selectCapasetLevelBy } from '@/services/gen/list';
import { closeThenGoto } from '@/layouts/routerControl';

export default {
  namespace: 'authonzationDetail',

  state: {
    // 查询系列
    formData: {
      reasonType: '01',
      acceptMethod: '01',
      pricingMethod: '总价',
    },
    dataSource: [],
    total: 0,
    pageConfig: null,
    taskProjSource: [],
    dataList: [],
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

    //查询事由号相关当量
    *getReasonInfo({ payload }, { call, put }) {
      const { response } = yield call(queryReasonInfo, payload);
      if (response.ok) {
        return response.data;
      }
      return null;
    },

    *save({ payload }, { call, put, select }) {
      const { formData } = yield select(({ authonzation }) => authonzation);
      const param = {
        ...formData,
        ...payload,
      };
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
      createMessage({ type: 'error', description: response.reason || '保存失败' });
    },

    *queryTaskList({ payload }, { call, put }) {
      const { response } = yield call(queryAuthTasks, payload);
      if (response.rows) {
        yield put({
          type: 'updateState',
          payload: {
            dataList: Array.isArray(response.rows) ? response.rows : [],
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
