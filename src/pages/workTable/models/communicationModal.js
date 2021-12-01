import moment from 'moment';
import { isNil } from 'ramda';
import update from 'immutability-helper';
import message from '@/components/production/layout/Message';
import { commonModelReducers } from '@/utils/production/modelUtils';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
import { scheduleCommSaveRq } from '@/services/workbench/project';

const defaultState = {
  formData: {},
  formMode: 'EDIT',
};
export default {
  namespace: 'communicationModal',

  state: defaultState,

  effects: {
    *scheduleCommSave({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(scheduleCommSaveRq, payload);
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
      if (Array.isArray(element)) {
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
