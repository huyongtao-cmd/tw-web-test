import { omit, clone } from 'ramda';
import {
  businessCheckListPaging,
  businessCheckLogicalDelete,
  businessCheckSwitchChange,
} from '@/services/sys/system/function';

import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/stringUtils';

const defaultSearchForm = {};

// 处理空属性,可以处理list,{},字符串
const handleEmptyProps = param => {
  if (param === undefined || param === null) {
    return undefined;
  }
  if (typeof param === 'object') {
    let newObject;
    if (Array.isArray(param)) {
      newObject = Object.assign([], param);
      for (let index = 0; index < newObject.length; index += 1) {
        const val = param[index];
        if (val === undefined || val === null) {
          newObject.splice(index, 1);
        }
        if (typeof val === 'string') {
          if (val.trim().length > 0) {
            newObject[index] = val.trim();
          } else {
            newObject.splice(index, 1);
          }
        }
      }
    } else {
      // 是一个对象
      newObject = Object.assign({}, param);
      Object.keys(newObject).forEach(key => {
        const val = param[key];
        if (val === undefined || val === null) {
          delete newObject[key];
          return;
        }
        if (typeof val === 'string') {
          if (val.trim().length > 0) {
            newObject[key] = val.trim();
          } else {
            delete newObject[key];
          }
        }
      });
    }
    return newObject;
  }
  if (typeof param === 'string') {
    return param.trim();
  }
  return param;
};

export default {
  namespace: 'businessCheckList',
  state: {
    searchForm: defaultSearchForm,
    dataSource: [],
    total: undefined,
  },
  effects: {
    *query({ payload }, { call, put }) {
      const param = handleEmptyProps(payload);
      const { response, status } = yield call(businessCheckListPaging, param);

      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            dataSource: clone(Array.isArray(response.rows) ? response.rows : []),
            total: response.total,
          },
        });
      }
    },
    *delete({ payload }, { call, put, select }) {
      const { response, status } = yield call(businessCheckLogicalDelete, payload);
      if (status === 200) {
        createMessage({ type: 'success', description: '成功' });
        const { searchForm } = yield select(({ projectReportList }) => projectReportList);
        yield put({ type: 'query', payload: searchForm });
      } else {
        createMessage({ type: 'warn', description: response.reason || '失败' });
      }
    },

    *switchChange({ payload }, { call, put, select }) {
      const { response, status } = yield call(businessCheckSwitchChange, payload);
      const param = fromQs();
      if (status === 200) {
        createMessage({ type: 'success', description: '成功' });
        const { searchForm } = yield select(({ projectReportList }) => projectReportList);
        yield put({ type: 'query', payload: { ...searchForm, functionId: param.functionId } });
      } else {
        createMessage({ type: 'warn', description: response.reason || '失败' });
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
    updateSearchForm(state, { payload }) {
      const { searchForm } = state;
      const newFormData = { ...searchForm, ...payload };
      return {
        ...state,
        searchForm: newFormData,
      };
    },
    cleanSearchForm(state, action) {
      return {
        ...state,
        searchForm: {
          ...defaultSearchForm,
          selectedRowKeys: [], // 清空选中项，因为searchForm里面记录了这个东西
        },
      };
    },
  },
};
