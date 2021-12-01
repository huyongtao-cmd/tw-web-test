import { commonModelReducers } from '@/utils/production/modelUtils';
import { fromQs } from '@/utils/production/stringUtil';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { omit } from 'ramda';
import {
  projectTeamDetailRq,
  projectTeamPartialRq,
  projectTeamAddRq,
} from '@/services/production/projectMgmt/projectTeam';
import { projectRoleSelectRq } from '@/services/workbench/project';

// 默认状态
const defaultState = {
  formData: {
    id: null,
  },
  formMode: 'EDIT',
  copy: false,
  pageConfig: null,
  projectRoleOptions: [], // 项目角色列表
};

export default {
  namespace: 'projectTeamDisplay',
  state: defaultState,
  // 异步方法
  effects: {
    *init({ payload }, { put, select }) {
      const {
        formData: { id },
        copy = false,
        formMode,
      } = yield select(({ projectTeamDisplay }) => projectTeamDisplay);
      if (formMode === 'EDIT') {
        // 获取项目角色下拉
        yield put({ type: 'projectRoleSelect' });
      }
      if (!id) {
        return;
      }
      const { data } = yield outputHandle(projectTeamDetailRq, { id });
      const { startDate, endDate, projectRole } = data;
      // 当为复制时,处理id为null
      const copyObj = {};
      if (copy) {
        copyObj.id = undefined;
      }

      yield put({
        type: 'updateState',
        payload: {
          formData: {
            ...data,
            projectRoles: data.projectRole.split(','),
            ...copyObj,
          },
        },
      });
    },

    *save({ payload }, { put, select }) {
      const { formData, cb } = payload;
      const { id } = formData;
      let output;
      if (id && id > 0) {
        // 编辑
        output = yield outputHandle(
          projectTeamPartialRq,
          omit(['createUserId', 'createTime'], formData),
          cb
        );
      } else {
        // 新增
        output = yield outputHandle(
          projectTeamAddRq,
          omit(['createUserId', 'createTime'], formData),
          cb
        );
      }
      cb(output);
    },
    //获取项目角色下拉
    *projectRoleSelect({ payload }, { put, select }) {
      const output = yield outputHandle(projectRoleSelectRq);
      const projectRoleOptions = output.data.map(item => ({
        ...item,
        // id: item.id,
        value: item.id,
        title: item.roleName,
      }));

      yield put({
        type: 'updateState',
        payload: {
          projectRoleOptions,
        },
      });
    },
  },

  // 同步方法
  reducers: {
    // 使用工具方法快速写updateState,updateForm,cleanState 方法
    ...commonModelReducers(defaultState),

    //路由获取id
    getParamsFromRoute(state, { payload }) {
      const { id, mode, projectId } = fromQs();
      return { ...state, formData: { ...state.formData, id, projectId }, formMode: mode || 'EDIT' };
    },
  },
};
