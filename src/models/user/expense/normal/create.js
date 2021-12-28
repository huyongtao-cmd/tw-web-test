/* eslint-disable */
import {
  createNormal,
  findExpenseById,
  saveExpense,
  changeLeads,
} from '@/services/user/expense/expense';
import createMessage from '@/components/core/AlertMessage';
import { queryUserPrincipal } from '@/services/gen/user';
import { pushFlowTask } from '@/services/gen/flow';
import { closeThenGoto } from '@/layouts/routerControl';
import moment from 'moment';
import { isEmpty, isNil, takeWhile, trim } from 'ramda';
import { fromQs } from '@/utils/stringUtils';
import { findOppoById } from '@/services/user/management/opportunity';

export default {
  namespace: 'userExpenseNormalCreate',
  state: {
    formData: {},
    detailList: [], // 明细列表
    phaseList: [],
    feeCodeList: [],
    reimTmpl: {},
    expenseOuList: [],
    // channelCOnstConDList :
    channelCostConDIdList: undefined,
  },

  effects: {
    *clean(_, { put }) {
      return yield put({
        type: 'updateState',
        payload: {
          formData: {},
          detailList: [],
        },
      });
    },

    *getOpport({ payload }, { call, put, select }) {
      console.log(payload, 88999999);
      const { status, response } = yield call(findOppoById, payload?.selectOpporId);
      const { expenseOuList } = yield select(
        ({ userExpenseNormalCreate }) => userExpenseNormalCreate
      );
      console.log(response, 999999);
      console.log(expenseOuList, 7890);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (!isEmpty(response.datum)) {
        yield put({
          type: 'updateForm',
          payload: {
            ...payload,
            expenseBuId: response.datum.signBuId,
            expenseBuName: response.datum.signBuName,
            expenseOuId: response.datum.expenseOuId,
            expenseOuName: response.datum.expenseOuName,
          },
        });
      }
      // if (response.ok) {
      //   // 如果是复制功能，则给部分参数初始化，如果是编辑功能，则给所有值

      //   yield put({
      //     type: 'updateState',
      //     payload: {
      //       formData,
      //       detailList,
      //     },
      //   });
      //   return formData;
      // }
      // createMessage({ type: 'error', description: response.reason });
      // return {};
    },

    *query({ payload }, { call, put }) {
      const { status, response } = yield call(findExpenseById, payload);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (response.ok) {
        // 如果是复制功能，则给部分参数初始化，如果是编辑功能，则给所有值
        const { isCopy = null } = fromQs();
        const formData = isCopy
          ? {
              ...response.datum,
              id: null,
              reimStatus: 'CREATE',
              reimBatchNo: '系统生成',
              reimNo: '系统生成',
              reimStatusName: '新建',
              applyDate: moment().format('YYYY-MM-DD'),
            }
          : response.datum || {};
        const detailList =
          Array.isArray(formData.reimdList) && isCopy
            ? formData.reimdList.map(item => ({
                ...item,
                id: item.id + '',
                reimId: undefined,
                invoiceentity: [],
              }))
            : formData.reimdList || [];
        yield put({
          type: 'updateState',
          payload: {
            formData,
            detailList,
          },
        });
        return formData;
      }
      createMessage({ type: 'error', description: response.reason });
      return {};
    },

    *init({ payload }, { call, put }) {
      const { status, response } = yield call(queryUserPrincipal);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      const { resId, resName, jobGrade, baseBuName, baseBuId } = response.extInfo || {};

      yield put({
        type: 'updateState',
        payload: {
          formData: {
            reimResId: isNil(resId) ? undefined : resId + '',
            reimResName: resName,
            jobGrade,
            resBuId: baseBuId,
            resBuName: baseBuName,
            reimBatchNo: '系统生成',
            reimNo: '系统生成',
            reimStatusName: '新建',
            applyDate: moment().format('YYYY-MM-DD'),
            payMethod: '1',
          },
          detailList: [],
        },
      });
    },

    *changeLeadsStatus({ payload }, { call, put }) {
      const { status, response } = yield call(changeLeads, payload);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (status === 200) {
        if (response.ok) {
          return;
        }
        createMessage({
          type: 'error',
          description: '报销单提交成功,领奖状态变更失败,请联系管理员!!!',
        });
      }
      createMessage({
        type: 'error',
        description: '报销单提交成功,领奖状态变更失败,请联系管理员!!!',
      });
    },

    *save({ payload }, { call, put, select }) {
      const { id, isSubmit, taskId, params } = payload;
      const { formData, detailList } = yield select(
        ({ userExpenseNormalCreate }) => userExpenseNormalCreate
      );
      // 明细列表
      let notSatisfied = false;
      takeWhile(item => {
        const judgment = isNil(item.accId) || isNil(item.reimDesc) || isEmpty(trim(item.reimDesc));
        if (judgment) {
          createMessage({ type: 'warn', description: '请补全表单必填项（带*的均为必填项）' });
          notSatisfied = true;
        }
        return !judgment;
      }, detailList);
      if (notSatisfied) return false;
      formData.reimdList = detailList.map(r => ({
        ...r,
        id: typeof r.id === 'string' ? null : r.id,
      }));
      const { status: sts, response } = yield call(saveExpense, {
        ...formData,
        submitted: payload.isSubmit,
      });
      if (sts === 100) {
        // 主动取消请求
        return false;
      }
      if (response.ok) {
        createMessage({ type: 'success', description: '保存成功' });
        const { sourceUrl } = fromQs();
        if (isSubmit) {
          if (taskId) {
            // 再次提交流程
            const { status } = yield call(pushFlowTask, taskId, params);
            if (status === 200) {
              createMessage({ type: 'success', description: '操作成功' });
              closeThenGoto(`/user/flow/process`);
            } else if (status === 100) {
              // 主动取消请求
              return false;
            }
            return true;
          }
          sourceUrl
            ? // 提交之后进查看页
              // 如果带来源页，则传递来源页
              closeThenGoto(`/plat/expense/normal/view?id=${response.datum}&sourceUrl=${sourceUrl}`)
            : closeThenGoto(`/plat/expense/normal/view?id=${response.datum}`);
        } else {
          // // 保存之后原地刷新
          // yield put({ type: 'query', payload: formData.id });
          // 现在不跳编辑页了，跳我的报销
          closeThenGoto(sourceUrl || '/user/center/myExpense');
        }
        return true;
      }
      createMessage({ type: 'warn', description: response.reason || '保存失败', duration: 8 });
      return false;
    },

    *create({ payload }, { call, put, select }) {
      const { formData, detailList, channelCostConDIdList } = yield select(
        ({ userExpenseNormalCreate }) => userExpenseNormalCreate
      );
      if (isEmpty(detailList) || detailList.length <= 0) {
        createMessage({ type: 'warn', description: '请填写费用明细' });
        return 0;
      }
      // 明细列表
      let notSatisfied = false;
      takeWhile(item => {
        const judgment = isNil(item.accId) || isNil(item.reimDesc) || isEmpty(trim(item.reimDesc));
        if (judgment) {
          createMessage({ type: 'warn', description: '请补全表单必填项（带*的均为必填项）' });
          notSatisfied = true;
        }
        return !judgment;
      }, detailList);
      if (notSatisfied) return false;
      formData.reimdList = detailList.map(r => ({
        ...r,
        id: typeof r.id === 'string' ? null : r.id,
      }));

      const { status, response } = yield call(createNormal, {
        ...formData,
        submitted: payload.isSubmit,
        channelCostConDIdList,
      });
      if (status === 100) {
        // 主动取消请求
        return false;
      }
      if (response.ok) {
        const { sourceUrl } = fromQs();
        createMessage({ type: 'success', description: '保存成功' });
        if (payload.isSubmit) {
          yield put({
            type: 'changeLeadsStatus',
            payload: {
              id: fromQs().leadsId,
            },
          });
          // 提交之后进查看页
          sourceUrl
            ? // 如果带来源页，则传递来源页
              closeThenGoto(`/plat/expense/normal/view?id=${response.datum}&sourceUrl=${sourceUrl}`)
            : closeThenGoto(`/plat/expense/normal/view?id=${response.datum}`);
        } else {
          // 保存之后进我的报销页面
          closeThenGoto(sourceUrl || '/user/center/myExpense');
          // 保存之后进编辑页
          // closeThenGoto(`/plat/expense/normal/edit?id=${response.datum}`);
        }
        return true;
      }
      const { datum } = response;
      if (datum === -88) {
        createMessage({
          type: 'warn',
          description: response.reason.desc || '保存失败',
          duration: 8,
        });
      } else if (datum === -99) {
        createMessage({ type: 'warn', description: response.reason || '保存失败', duration: 8 });
      } else {
        createMessage({ type: 'warn', description: response.reason || '保存失败', duration: 8 });
      }
      return false;
    },
  },

  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
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

    updateTableCell(state, { payload }) {
      const { detailList } = state;
      const newList = detailList.slice();
      const { type, item, ruleExplain, itemList } = payload;

      newList.map(ele => {
        if (ele.id === item.id) {
          if (ele.ruleExplain && !ele.ruleExplain.includes(ruleExplain)) {
            ele.ruleExplain = ele.ruleExplain
              ? `${ele.ruleExplain}${ele.ruleExplain && ruleExplain ? ',' : ''}${ruleExplain}`
              : '';
          }
        }
        return ele;
      });

      if (type === 'exceedHotelFee' || type === 'invoiceConsecutiveNum') {
        newList.map(ele => {
          if (ele.lineNo === item.lineNo) {
            if (ele.ruleExplain && !ele.ruleExplain.includes(ruleExplain)) {
              ele.ruleExplain = ele.ruleExplain
                ? `${ele.ruleExplain}${ele.ruleExplain && ruleExplain ? ',' : ''}${ruleExplain}`
                : '';
            }
            return ele;
          }
        });
      }

      return {
        ...state,
        detailList: newList,
      };
    },
  },
};
