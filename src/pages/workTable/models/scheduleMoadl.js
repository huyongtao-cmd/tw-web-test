import moment from 'moment';
import { isNil } from 'ramda';
import update from 'immutability-helper';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
import message from '@/components/production/layout/Message';
import { commonModelReducers } from '@/utils/production/modelUtils';
import { scheduleDetailRq, scheduleOverallRq } from '@/services/workbench/project';

const defaultState = {
  formData: {
    putList: [],
    columnList: [],
  },
  formMode: 'EDIT',
  remarkFlag: true,
  permissionCode: '',
};
export default {
  namespace: 'scheduleMoadl',

  state: defaultState,

  effects: {
    //查询详情
    *queryDetail({ payload }, { call, put, select }) {
      yield put({
        type: 'updateState',
        payload: {
          id: payload.id,
        },
      });
      const { data } = yield outputHandle(scheduleDetailRq, payload);
      const { startDate, endDate, putList } = data;
      //将投放数据转换成可用于展示的格式
      const obj1 = { value0: '日期' };
      const obj2 = { value0: '数量' };
      const obj3 = { value0: '备注' };
      let arr = [];
      const columnList = [''];
      if (putList.length) {
        putList.forEach((item, index) => {
          obj1['value' + (index + 1)] = item.putDate;
          obj2['value' + (index + 1)] = item.putNumber;
          obj3['value' + (index + 1)] = item.remark;
        });
        arr = [obj1, obj2, obj3];
        Object.keys(obj1).forEach(item => {
          columnList.push(obj1[item].slice(0, 7));
        });
        columnList.splice(0, 1);
      }
      yield put({
        type: 'updateForm',
        payload: {
          ...data,
          date: [startDate, endDate],
          putList: arr,
          columnList,
          resourceType: data.resourceType1 + data.resourceType2,
        },
      });
      return data;
    },
    *scheduleSave({ payload }, { call, put, select }) {
      const { ...params } = payload;
      // params.projectStatus ==='CREATE' && delete params.projectStatus
      let response;
      const { data } = yield outputHandle(scheduleOverallRq, params);
      message({ type: 'success' });
      // router.push(`/workTable/projectMgmt/projectMgmtList/edit?id=${response.data.id}&mode=DESCRIPTION`)
      return data;
    },
  },

  reducers: {
    ...commonModelReducers(defaultState),
    updateFormForEditTable(state, { payload }) {
      const { formData } = state;
      const name = Object.keys(payload)[0];
      const element = payload[name];
      let newFormData;
      if (Array.isArray(element) && (name === 'putList' || name === 'columnList')) {
        element.forEach((ele, index) => {
          if (!isNil(ele)) {
            newFormData = update(formData, { [name]: { [index]: { $merge: ele } } });
          }
        });
      } else {
        newFormData = { ...formData, ...payload };
      }

      return {
        ...state,
        formData: newFormData,
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
