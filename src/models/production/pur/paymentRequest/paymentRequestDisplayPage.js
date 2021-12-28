// 产品化引用
import message from '@/components/production/layout/Message';
import { outputHandle } from '@/utils/production/outputUtil';
import { commonModelReducers } from '@/utils/production/modelUtils';

// service方法
import {
  paymentRequestCreate,
  paymentRequestDetail,
  paymentRequestOverall,
  paymentRequestModify,
  paymentComplete,
  paymentRequestLogicalDelete,
} from '@/services/production/pur';
import {
  accountSelectPaging,
  budgetSelectPaging,
  businessAccItemPaging,
} from '@/services/production/common/select';
import { customSelectionListByKey } from '@/services/production/system';
import { isNil } from 'ramda';
import update from 'immutability-helper';
import { getViewConf } from '@/services/gen/flow';
import { budgetItemListPaging, financialAccSubjListPaging } from '@/services/production/acc';

// 默认状态
const defaultState = {
  formData: {
    paymentPlanDetails: [],
    purchaseOrderDetails: [],
    originalCurrencyAmt: 0,
    baseCurrencyAmt: 0,
    exchangeRate: 1,
    originalCurrency: 'CNY',
    bankBranch: '',
    bankName: '',
    holderName: '',
    accountNo: '',
  },
  formMode: 'EDIT',
  copy: false,
  id: undefined,
  purTypeList: [],
  deleteKeys: [],
  internalOuList: [],
  businessAccItemList: [],
  budgetList: [],
  financialAccSubjList: [],
  accountList: [],
  taskId: undefined,
  from: undefined,
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
  namespace: 'paymentRequestDisplayPage',

  state: defaultState,

  // 异步方法
  effects: {
    *init({ payload }, { put, select }) {
      const {
        formData: { id },
        copy = false,
      } = yield select(({ paymentRequestDisplayPage }) => paymentRequestDisplayPage);
      if (!id) {
        return {};
      }
      const { data } = yield outputHandle(paymentRequestDetail, { id });
      const { foreignCurrencyFlag, paymentPlanDetails, poClass1, poName } = data;
      if (foreignCurrencyFlag) {
        data.foreignCurrencyFlagDesc = '是';
      } else {
        data.foreignCurrencyFlagDesc = '否';
      }
      //临时采购 拼凑名称
      if (poClass1 !== 'STANDARD') {
        let paymentRequestName;
        if (paymentPlanDetails.length < 2) {
          paymentRequestName = poName + '-' + paymentPlanDetails[0].paymentStage;
        } else {
          const date = new Date();
          date.setTime(date.getTime());
          const today = date.getFullYear() + '.' + (date.getMonth() + 1) + '.' + date.getDate();
          paymentRequestName = poName + '-' + today;
        }
        data.paymentRequestName = paymentRequestName;
      }
      const copyObj = {};
      if (copy) {
        copyObj.id = undefined;
      }
      yield put({
        type: 'updateState',
        payload: {
          formData: { ...data, ...copyObj },
        },
      });
      return data;
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
      // yield put({
      //   type: 'updateState',
      //   payload: {
      //     formMode: 'DESCRIPTION',
      //   },
      // });
    },

    *save({ payload }, { put, select }) {
      const { formData } = payload;
      const { id } = formData;
      let output;
      if (id && id > 0) {
        // 编辑
        output = yield outputHandle(
          paymentRequestOverall,
          formData,
          'paymentRequestDisplayPage/success'
        );
      } else {
        // 新增
        output = yield outputHandle(
          paymentRequestCreate,
          formData,
          'paymentRequestDisplayPage/success'
        );
      }
      yield put({ type: 'success', payload: output });
    },

    *update({ payload }, { put, select }) {
      const { formData } = payload;
      // 更新
      yield outputHandle(paymentRequestModify, formData);
    },

    *complete({ payload }, { put, select }) {
      const { formData } = payload;
      // 完成
      yield outputHandle(paymentComplete, formData);
    },

    *delete({ payload }, { put, select }) {
      const { formData } = payload;
      // 删除
      yield outputHandle(paymentRequestLogicalDelete, formData);
    },

    *fetchAccountList({ payload }, { put, select }) {
      const { data } = yield outputHandle(accountSelectPaging, { limit: 0, ...payload });
      const accountList = data.rows.map(item => ({
        ...item,
        value: item.id,
        title: item.accountNo,
      }));

      yield put({
        type: 'updateState',
        payload: {
          accountList,
        },
      });

      if (accountList.length > 0) {
        yield put({
          type: 'updateForm',
          payload: {
            accountNo: accountList[0].accountNo,
            holderName: accountList[0].holderName,
            bankName: accountList[0].bankName,
            bankBranch: accountList[0].bankBranch,
          },
        });
      }
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
    },

    *fetchBudgetList({ payload }, { put, select }) {
      const { data } = yield outputHandle(budgetItemListPaging, { limit: 0 });
      const budgetList = data.rows.map(item => ({ ...item, title: item.budgetName }));

      yield put({
        type: 'updateState',
        payload: {
          budgetList,
        },
      });
    },

    *fetchFinancialAccSubjList({ payload }, { put, select }) {
      const { data } = yield outputHandle(financialAccSubjListPaging, { limit: 0 });
      const financialAccSubjList = data.rows.map(item => ({ ...item, title: item.accName }));

      yield put({
        type: 'updateState',
        payload: {
          financialAccSubjList,
        },
      });
    },

    *fetchConfig({ payload }, { call, put }) {
      const { status, response } = yield call(getViewConf, payload);
      const { taskKey } = response;
      let formMode;
      if (taskKey === 'PUR_G02_01_SUBMIT_i') {
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
