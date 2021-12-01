import moment from 'moment';
import { isNil } from 'ramda';
import update from 'immutability-helper';
import { commonModelReducers } from '@/utils/production/modelUtils';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
import message from '@/components/production/layout/Message';
import { closeThenGoto } from '@/layouts/routerControl';
import {
  contractSaveRq,
  pcontractSubmitRq,
  contractDetailRq,
  contractOverallRq,
  addrListRq,
  companySelectRq,
} from '@/services/workbench/contract';

const defaultState = {
  formData: {
    currCode: 'CNY',
    contractStatus: 'CREATE',
    partyFirstList: [],
    partySecondList: [],
    expenseList: [],
    collectionPlanList: [],
    paymentPlanList: [],
  },
  addrList: [],
  pageConfig: {
    pageBlockViews: [],
  },
  formMode: 'EDIT',
};
export default {
  namespace: 'contractFlowCreate',

  state: defaultState,

  effects: {
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
    //地址簿下拉查询
    *quertAddrList({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(addrListRq, payload);
      const list = data.rows.map(item => ({
        ...item,
        id: item.abNo,
        title: item.abName,
        value: item.abNo,
      }));
      yield put({
        type: 'updateState',
        payload: {
          addrList: list,
        },
      });
    },
    //  查询详情
    *queryDetails({ payload }, { call, put, select }) {
      const response = yield outputHandle(contractDetailRq, payload);
      const { ok, data } = response;
      if (ok) {
        const collectionPlanList = data.planList.filter(item => item.planClass === 'COLLECTION');
        const paymentPlanList = data.planList.filter(item => item.planClass === 'PAYMENT');
        let effectiveStartDate = [];
        if (data.effectStartDate !== null && data.effectEndDate !== null) {
          effectiveStartDate = [data.effectStartDate, data.effectEndDate];
        }
        const [partyA1 = '', partyA2 = '', partyA3 = ''] = data.partyFirstDesc.split(',');
        const [partyB1 = '', partyB2 = '', partyB3 = ''] = data.partySecondDesc.split(',');
        yield put({
          type: 'updateForm',
          payload: {
            ...data,
            collectionPlanList,
            paymentPlanList,
            effectiveStartDate,
            partyA1,
            partyA2,
            partyA3,
            partyB1,
            partyB2,
            partyB3,
          },
        });
      }
    },
    // 保存
    *contractSave({ payload }, { call, put, select }) {
      const { effectiveStartDate, ...params } = payload;
      if (Array.isArray(effectiveStartDate) && (effectiveStartDate[0] || effectiveStartDate[1])) {
        [params.effectStartDate, params.effectEndDate] = effectiveStartDate;
      }
      let response;
      if (payload.id) {
        //存在id走修改
        response = yield outputHandle(contractOverallRq, params);
      } else {
        //不存在id走保存
        response = yield outputHandle(contractSaveRq, params);
      }
      message({ type: 'success' });
      closeThenGoto(`/workTable/contractMgmt/contractList?refresh=${moment().valueOf()}`);
      return response.data;
    },
    // 提交流程
    *contractSubmit({ payload }, { call, put, select }) {
      const { effectiveStartDate, ...params } = payload;
      if (Array.isArray(effectiveStartDate) && (effectiveStartDate[0] || effectiveStartDate[1])) {
        [params.effectStartDate, params.effectEndDate] = effectiveStartDate;
      }
      const { data } = yield outputHandle(pcontractSubmitRq, params);
      message({ type: 'success' });
      closeThenGoto(`/user/flow/process?type=procs`);
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
      if (
        Array.isArray(element) &&
        (name === 'expenseList' || name === 'collectionPlanList' || name === 'paymentPlanList')
      ) {
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
