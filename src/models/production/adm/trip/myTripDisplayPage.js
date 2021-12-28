// 产品化引用
import message from '@/components/production/layout/Message';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
import { commonModelReducers } from '@/utils/production/modelUtils';

// service方法
import { budgetDetail } from '@/services/production/bud';
import { tripApplyCreate, tripApplyOverallModify } from '@/services/production/adm/trip/tripApply';
import { customSelectionListByKey, systemSelectionListByKey } from '@/services/production/system';
import { budgetSelectPaging } from '@/services/production/common/select';
import { isNil } from 'ramda';
import update from 'immutability-helper';
import { getViewConf } from '@/services/gen/flow';
import {
  tripApplyCreateProcess,
  tripApplyDetail,
  tripApplyOverallModifyProcess,
  tripExpenseDetailListAllData,
} from '../../../../services/production/adm/trip/tripApply';
import { businessAccItemPaging } from '../../../../services/production/common/select';

// 默认状态
const defaultState = {
  formData: {
    submit: false, // 是否执行提交审批流程
    tripExpenseDataList: [],
    tripExpenseDataListNo: 0,
  },
  projectSelectParam: '', // 项目查询条件
  budgetDescList: [], // 预算查询列表
  expenseClaimSiteList: [], // 费用结算方下拉列表
  budgetTypeList: [], // 预算归属类型
  formMode: 'EDIT', // 模式类型
  submitState: false,
  deleteKeys: [], // 删除字段keys
  copy: false, // 复制标志
  businessAccItemList: [],
  unExpandedRowKeys: [],
  taskId: undefined,
  flowForm: {
    remark: undefined,
    dirty: false,
  },
  fieldsConfig: {
    buttons: [],
    panels: {},
  },
};

export default {
  namespace: 'myTripDisplayPage',

  state: defaultState,

  // 异步方法
  effects: {
    *init({ payload }, { put, select }) {
      const {
        formData: { id },
        copy = false,
      } = yield select(({ myTripDisplayPage }) => myTripDisplayPage);
      if (!id) {
        yield put({ type: 'cleanState' });
        return;
      }
      const { data } = yield outputHandle(tripApplyDetail, { id });
      const startEndTime = [];
      if (data.startDate) {
        startEndTime[0] = data.startDate;
      }
      if (data.endDate) {
        startEndTime[1] = data.endDate;
      }
      data.startEndTime = startEndTime;
      if (isNil(data.tripExpenseDataList)) {
        data.tripExpenseDataList = [];
      }
      // 当为复制时,处理id为null
      const copyObj = {};
      if (copy) {
        copyObj.id = undefined;
      }
      yield put({
        type: 'updateState',
        payload: {
          formData: { ...data, ...copyObj },
          projectSelectParam: data.chargeClassification,
        },
      });
      if (data.chargeProjectId !== undefined && data.chargeProjectId !== null) {
        yield put({
          type: 'fetchBudgetDescList',
          payload: {
            budgetStatus: 'ACTIVE',
            limit: 0,
            chargeProjectId: data.chargeProjectId,
          },
        });
      }
      if (data.id !== undefined && data.id !== null) {
        yield put({
          type: 'fetchTripExpenseData',
          payload: { tripApplyId: id },
        });
      }
      // 初始化核算列表
      if (data.id !== undefined && data.id !== null) {
        yield put({
          type: 'fetchBusinessAccItem',
          payload: { docType: 'TRIP_EXPENSE', buId: data.chargeBuId },
        });
      }
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
    },

    *save({ payload }, { put, select }) {
      const { formData } = payload;
      const { id, process } = formData;
      let output;
      if (id && id > 0) {
        if (process) {
          // 编辑
          output = yield outputHandle(
            tripApplyOverallModifyProcess,
            formData,
            'budgetDisplayPage/success'
          );
        } else {
          output = yield outputHandle(
            tripApplyOverallModify,
            formData,
            'budgetDisplayPage/success'
          );
        }
      } else {
        // 新增
        // eslint-disable-next-line no-lonely-if
        if (process) {
          output = yield outputHandle(
            tripApplyCreateProcess,
            formData,
            'budgetDisplayPage/success'
          );
        } else {
          output = yield outputHandle(tripApplyCreate, formData, 'budgetDisplayPage/success');
        }
      }
      yield put({ type: 'success', payload: output });

      yield put({
        type: 'updateState',
        payload: {
          submitState: false,
        },
      });
    },
    /**
     * 获取预算查询展示列表数据
     * @param payload
     * @param put
     * @param select
     * @returns {Generator<*, void, *>}
     */
    *fetchBudgetDescList({ payload }, { put, select }) {
      const { budgetStatus, limit, chargeProjectId } = payload;
      const output = yield outputHandle(budgetSelectPaging, {
        budgetStatus,
        limit,
        chargeProjectId,
      });
      const list = output.data.rows.map(item => ({
        ...item,
        value: item.id,
        title: item.budgetName,
      }));
      if (list.length === 1) {
        yield put({ type: 'updateForm', payload: { relatedBudgetId: list[0].id } });
      } else {
        yield put({ type: 'updateForm', payload: { relatedBudgetId: undefined } });
      }
      yield put({
        type: 'updateState',
        payload: {
          budgetDescList: list,
        },
      });
    },
    /**
     * 获取费用归属类型
     * @param payload
     * @param put
     * @param select
     * @returns {Generator<*, void, *>}
     */
    *fetchBudgetType({ payload }, { put, select }) {
      const output = yield outputHandle(customSelectionListByKey, {
        key: 'CUS:CHARGE_CLASSIFICATION',
      });
      const list = output.data.map(item => ({
        ...item,
        value: item.selectionValue,
        label: item.selectionName,
      }));
      yield put({
        type: 'updateState',
        payload: {
          budgetTypeList: list,
        },
      });
    },
    /**
     * 获取结算方列表
     * @param payload
     * @param put
     * @param select
     * @returns {Generator<*, void, *>}
     */
    *fetchExpenseClaimSiteList({ payload }, { put, select }) {
      const output = yield outputHandle(systemSelectionListByKey, {
        key: 'ADM:EXPENSE_CLAIM_SITE',
      });
      const list = output.data.map(item => ({
        ...item,
        value: item.selectionValue,
        label: item.selectionName,
      }));
      yield put({
        type: 'updateState',
        payload: {
          expenseClaimSiteList: list,
        },
      });
    },

    *fetchConfig({ payload }, { call, put }) {
      const { status, response } = yield call(getViewConf, payload);
      const { taskKey } = response;
      let formMode;
      if (taskKey === 'EL_ADM_M04_01_SUBMIT_i') {
        formMode = 'EDIT';
      } else {
        formMode = 'DESCRIPTION';
      }
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            formMode,
            fieldsConfig: response || {},
            flowForm: {
              remark: undefined,
              dirty: false,
            },
          },
        });
      }
    },
    /**
     * 查询出差费用明细列表
     * @returns {*}
     */
    *fetchTripExpenseData({ payload }, { put, select }) {
      const output = yield outputHandle(tripExpenseDetailListAllData, payload);
      // 处理最大的编号
      let maxNo = 0;
      output.data.rows.forEach(d => {
        const no = Number(d.tripExpenseNo.substring(3));
        if (maxNo < no) {
          maxNo = no;
        }
      });
      yield put({
        type: 'updateForm',
        payload: {
          tripExpenseDataList: output.data.rows,
          tripExpenseDataListNo: maxNo,
        },
      });
    },
    /**
     * 获取核算项目
     * @param payload
     * @param put
     * @param select
     * @returns {IterableIterator<Promise<OutputProps | OutputProps>|*>}
     */
    *fetchBusinessAccItem({ payload }, { put, select }) {
      const output = yield outputHandle(businessAccItemPaging, payload, undefined, false);

      let list = [];

      if (output.ok) {
        list = output.data.rows
          .sort((d1, d2) => d1.busAccItemCode.localeCompare(d2.busAccItemCode))
          .map(item => ({
            ...item,
            id: item.busAccItemId,
            value: item.busAccItemId,
            title: item.busAccItemName,
            parentId: item.parentId + '',
          }));
      }

      yield put({
        type: 'updateState',
        payload: {
          businessAccItemList: list,
        },
      });

      return output.ok;
    },
  },

  // 同步方法
  reducers: {
    // 使用工具方法快速写updateState,updateForm,cleanState 方法
    ...commonModelReducers(defaultState),
    updateFormForEditTable(state, { payload }) {
      const { formData } = state;
      const name = Object.keys(payload)[0];
      const element = payload[name];
      let newFormData;
      if (Array.isArray(element) && name === 'tripExpenseDataList') {
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
