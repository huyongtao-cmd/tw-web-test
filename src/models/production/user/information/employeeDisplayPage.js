import { informationImport, informationSave, findById, editInfo } from '@/services/production/user';
import { outputHandle } from '@/utils/production/outputUtil';
import message from '@/components/production/layout/Message';
import { commonModelReducers } from '@/utils/production/modelUtils.ts';
import { testMainDetail } from '@/services/demo/prod';
import { isNil } from 'ramda';
import update from 'immutability-helper';
import { companySelectRq } from '@/services/workbench/contract';
import { closeThenGoto } from '@/layouts/routerControl';

const defaultState = {
  formData: {},
  modifyFormData: {},
  formMode: 'EDIT',
  copy: false,
  id: undefined,
};
export default {
  namespace: 'employeeDisplayPage',

  state: defaultState,

  effects: {
    *init({ payload }, { put, select }) {
      // const {
      //   formData: { id },
      //   copy = false,
      // } = yield select(({ employeeDisplayPage }) => employeeDisplayPage);
      // if (!id) {
      //   return;
      // }

      const { data } = yield outputHandle(findById, payload);
      // // 当为复制时,处理id为null
      // const copyObj = {};
      // if (copy) {
      //   copyObj.id = undefined;
      // }

      yield put({
        type: 'updateState',
        payload: {
          formData: data,
        },
      });
    },
    *upload({ payload }, { call, put, select }) {
      const { status, response } = yield call(informationImport, payload);
      if (status === 200) {
        return response;
      }
      return {};
    },

    *success({ payload }, { put, select }) {
      // 弹出操作成功,操作失败无需写代码,outputHandle已处理
      message({ type: 'success' });
      yield put({
        type: 'updateForm',
        payload: {
          id: payload.data.id,
        },
      });
      yield put({
        type: 'init',
      });
      // 页面变为详情模式
      yield put({
        type: 'updateState',
        payload: {
          formMode: 'DESCRIPTION',
        },
      });
    },

    *save({ payload }, { put, select }) {
      const { formData } = payload;
      const { id } = formData;
      let output;
      if (id && id > 0) {
        //编辑
        output = yield outputHandle(editInfo, formData);
      } else {
        //新增
        output = yield outputHandle(informationSave, formData);
      }
      if (output.ok) {
        closeThenGoto(`/plat/baseData/information?refresh=` + new Date().valueOf());
      }

      return output;
    },
    *queryCompanyList({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(companySelectRq, payload);
      const list = data.rows.map(item => ({
        ...item,
        id: item.id,
        title: item.ouName,
        value: item.id,
      }));
      yield put({
        type: 'updateState',
        payload: {
          companyList: list,
        },
      });
    },
  },
  // 同步方法
  reducers: {
    // 使用工具方法快速写updateState,updateForm,cleanState 方法
    ...commonModelReducers(defaultState),
    updateFormForEditTable(state, { payload }) {
      const { formData, modifyFormData } = state;
      const name = Object.keys(payload)[0];
      const element = payload[name];
      let newFormData;
      let modifyData;
      if (Array.isArray(element)) {
        element.forEach((ele, index) => {
          if (!isNil(ele)) {
            newFormData = update(formData, { [name]: { [index]: { $merge: ele } } });
          }
        });
      } else {
        newFormData = { ...formData, ...payload };
        modifyData = { ...modifyFormData, ...payload };
      }

      return {
        ...state,
        formData: newFormData,
        modifyFormData: modifyData,
      };
    },
    updateFlowForm(state, { payload }) {
      const { flowForm } = state;
      const newFlowForm = { ...flowForm, ...payload };
      return {
        ...state,
        flowForm: newFlowForm,
      };
    },
  },
};
