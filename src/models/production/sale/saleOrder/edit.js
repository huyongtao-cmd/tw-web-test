import {
  saleOrderIncreaseRq,
  saleOrderOverallRq,
  saleOrderDetailRq,
  saleOrderAdjustRq,
} from '@/services/production/sale';
import { selectCust } from '@/services/user/Contract/sales';
import moment from 'moment';
import router from 'umi/router';
import createMessage from '@/components/core/AlertMessage';
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import { commonModelReducers } from '@/utils/production/modelUtils';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
import message from '@/components/production/layout/Message';
import { closeThenGoto } from '@/layouts/routerControl';
import { fromQs } from '@/utils/production/stringUtil';
import { isEmpty, isNil, omit, type } from 'ramda';
import update from 'immutability-helper';
import { div, mul, add } from '@/utils/mathUtils';

const defaultState = {
  formData: {
    soStatus: 'CREATE',
    createTime: moment().format('YYYY-MM-DD hh:mm:ss'),
    foreignCurrencyFlag: true,
    detailViews: [], // 销售单明细
    planViews: [], // 收款计划明细
  },
  pageConfig: {
    pageBlockViews: [],
  },
  formMode: 'EDIT',
  detailDelViews: [], // 删除的销售单明细
  planDelViews: [], // 删除的收款计划明细
  customerList: [],
};
export default {
  namespace: 'saleOrderEdit',

  state: defaultState,

  effects: {
    // 客户列表
    *getCustomerList({ payload }, { call, put, select }) {
      const { status, response = [] } = yield call(selectCust, payload);
      if (status === 100) {
        // 主动取消请求
        return [];
      }
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            customerList: response.map(item => ({
              ...item,
              value: item.id,
              title: item.name,
            })),
          },
        });
        return response;
      }
      createMessage({ type: 'error', description: response.reason || '获取客户列表失败' });
      return [];
    },
    // 编辑
    *saleOrderEdit({ payload }, { call, put, select }) {
      const { ...params } = payload;

      let data = {};
      if (!fromQs().id) {
        const { data: datum } = yield outputHandle(
          saleOrderIncreaseRq,
          params,
          'saleOrderEdit/success'
        );
        data = datum;
        message({ type: 'success' });

        if (params.submit && !params.relatedContractId) {
          closeThenGoto(`/user/flow/process?type=procs`);
          return {};
        }

        if (data.id) {
          const { id } = data;
          router.push(`/workTable/sale/saleOrder/edit?id=${id}&mode=EDIT`);
        } else {
          createMessage({ type: 'error', description: '后端未返回主数据Id' });
        }
      } else {
        const { data: datum } = yield outputHandle(
          saleOrderOverallRq,
          params,
          'saleOrderEdit/success'
        );
        data = datum;
        message({ type: 'success' });

        if (params.submit) {
          closeThenGoto(`/user/flow/process?type=procs`);
          return {};
        }

        yield put({
          type: 'saleOrderDetail',
          payload: {
            id: fromQs().id,
          },
        });
      }
      return data;
    },
    // 详情
    *saleOrderDetail({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(saleOrderDetailRq, payload);
      const { createTime } = data;
      yield put({
        type: 'updateForm',
        payload: {
          ...data,
          createTime: moment(createTime).format('YYYY-MM-DD hh:mm:ss'),
        },
      });

      return data;
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

    *init({ payload }, { put, select }) {
      const { id, copy = false } = payload;
      if (!id) {
        return;
      }
      const { data } = yield outputHandle(saleOrderDetailRq, { id });
      // 当为复制时,处理id为null
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
    },

    *success({ payload }, { put, select }) {
      // 弹出操作成功,操作失败无需写代码,outputHandle已处理
      message({ type: 'success' });

      // 页面变为详情模式，更新数据
      yield put({
        type: 'updateState',
        payload: {
          formMode: 'DESCRIPTION',
        },
      });

      // 赋值
      yield put({
        type: 'init',
        payload,
      });
    },
  },

  reducers: {
    ...commonModelReducers(defaultState),

    updateFormForEditTable(state, { payload }) {
      const { formData } = state;
      const name = Object.keys(payload)[0];
      const element = payload[name];
      let newFormData;
      if (Array.isArray(element) && !element.filter(v => type(v) !== 'Object').length) {
        element.forEach((ele, index) => {
          if (!isNil(ele)) {
            newFormData = update(formData, { [name]: { [index]: { $merge: ele } } });
            if (
              name === 'planViews' &&
              Object.keys(ele)[0] === 'collectionAmt' &&
              type(Object.values(ele)[0]) === 'Number'
            ) {
              const { planViews, exchangeRate } = newFormData;
              const tt1 = planViews
                .map(v => v.collectionAmt)
                .reduce((x = 0, y = 0) => add(x, y), 0);
              const tt2 = !isNil(tt1) && !isNil(exchangeRate) ? mul(tt1, exchangeRate) : '';
              newFormData = {
                ...newFormData,
                originalCurrencyAmt: tt1,
                baseCurrencyAmt: tt2,
              };
            }
          }
        });
      } else {
        newFormData = {
          ...formData,
          ...payload,
        };
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
