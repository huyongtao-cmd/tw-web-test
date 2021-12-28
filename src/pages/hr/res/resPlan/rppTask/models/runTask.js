import { selectListRppConfig, taskStartFun } from '@/services/hr/rppTask/runTask';
import createMessage from '@/components/core/AlertMessage';

const defaultFormData = {
  listRppConfig: [],
  configNo: null,
  configI: null,
  configName: null,
  remark: null,
  taskNo: null,
};

export default {
  namespace: 'runTask',
  state: {
    formData: defaultFormData,
    divisionBuList: [],
  },

  effects: {
    *selectListRppConfig({ payload }, { call, put }) {
      const { response } = yield call(selectListRppConfig);
      const list = Array.isArray(response) ? response : [];
      const listRppConfig = list.map(item => ({
        ...item,
      }));

      yield put({
        type: 'updateState',
        payload: {
          listRppConfig,
        },
      });
    },

    *start({ payload }, { call, put }) {
      const { status, response } = yield call(taskStartFun, payload);
      if (status === 200 && response.ok) {
        yield put({
          type: 'updateForm',
          payload: {
            taskNo: response.data.taskNo,
          },
        });
        createMessage({ type: 'success', description: '操作成功' });
      } else {
        createMessage({ type: 'error', description: response.errors[0].msg || '运行失败' });
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
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
      };
    },
    clearForm(state, { payload }) {
      return {
        ...state,
        formData: {},
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
  },
};
