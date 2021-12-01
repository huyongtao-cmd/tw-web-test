import { commonModelReducers } from '@/utils/production/modelUtils';
import { fromQs } from '@/utils/production/stringUtil';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { omit } from 'ramda';
// TODO:替换请求接口
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import {
  monitoringRecordDetailRq,
  monitoringRecordPartialRq,
  monitoringRecordAddRq,
} from '@/services/production/projectMgmt/monitoringRecord';
// 默认状态
const defaultState = {
  formData: {
    id: null,
  },
  formMode: 'EDIT',
  copy: false,
  pageConfig: null,
};
export default {
  namespace: 'Display',
  state: defaultState,
  // 异步方法
  effects: {
    *init({ payload }, { put, select }) {
      const {
        formData: { id },
        copy = false,
        formMode,
      } = yield select(({ monitoringRecordDisplay }) => monitoringRecordDisplay);
      if (!id) {
        return;
      }

      const { data } = yield outputHandle(monitoringRecordDetailRq, { id });
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
          monitoringRecordPartialRq,
          omit(['createUserId', 'createTime'], formData),
          cb
        );
      } else {
        // 新增
        output = yield outputHandle(
          monitoringRecordAddRq,
          omit(['createUserId', 'createTime'], formData),
          cb
        );
      }
      cb(output);
    },
    // 获取配置字段
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
  },

  // 同步方法
  reducers: {
    // 使用工具方法快速写updateState,updateForm,cleanState 方法
    ...commonModelReducers(defaultState),

    //路由获取id
    getParamsFromRoute(state, { payload }) {
      const { id, mode } = fromQs();
      return { ...state, formData: { ...state.formData, id }, formMode: mode || 'EDIT' };
    },
  },
};
