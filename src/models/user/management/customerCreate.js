import {
  customerSaveRq,
  customerDetailsRq,
  seletePicByIdRq,
} from '@/services/user/management/customer';
import createMessage from '@/components/core/AlertMessage';
import { closeThenGoto } from '@/layouts/routerControl';
import { selectUserMultiCol } from '@/services/user/Contract/sales';
import { queryCascaderUdc } from '@/services/gen/app';
import { isEmpty, isNil } from 'ramda';
import { fromQs } from '@/utils/stringUtils';
import { customSelectionTreeFun } from '@/services/production/system';

const toFlatTags = (flatTags, menus) => {
  menus.forEach(item => {
    // eslint-disable-next-line no-param-reassign
    flatTags[item.id] = item;
    if (item.children && item.children.length > 0) {
      toFlatTags(flatTags, item.children);
    }
  });
};

export default {
  namespace: 'customerCreate',
  state: {
    formData: {},
    cityList: [],
    checkedKeys: [], //选中的标签id
    resDataSource: [],
    tagTree: [], // 标签树
    flatTags: {},
  },

  effects: {
    *save({ payload }, { call, put, select }) {
      const { formData } = yield select(({ customerCreate }) => customerCreate);
      const { status, response } = yield call(customerSaveRq, formData);
      if (status === 200) {
        if (response && response.ok) {
          if (payload) {
            createMessage({ type: 'success', description: '提交成功' });
          }
          createMessage({ type: 'success', description: '提交成功' });
          const { from } = fromQs();
          closeThenGoto(`${from}?saveEdit=true`);
        } else {
          createMessage({ type: 'warn', description: response.reason || '提交失败' });
        }
      }
    },
    *customerDetails({ payload }, { call, put }) {
      const { status, response } = yield call(customerDetailsRq, payload);
      if (status === 200) {
        if (response && response.ok) {
          const detail = response.datum ? response.datum : {};
          yield put({
            type: 'updateForm',
            payload: {
              ...detail,
            },
          });

          const { provInce } = detail;
          yield put({
            type: 'handleChangeCity',
            payload: provInce,
          });
        } else {
          createMessage({ type: 'warn', description: response.reason || '获取详细信息失败' });
        }
      }
    },
    *seletePicById({ payload }, { call, put }) {
      const { status, response } = yield call(seletePicByIdRq, payload);
      if (status === 200) {
        if (response && response.ok) {
          yield put({
            type: 'updateForm',
            payload: {
              saleVp: response.datum,
            },
          });
        } else {
          createMessage({ type: 'warn', description: response.reason || '获取销售VP失败' });
        }
      }
    },
    // 根据省获取市
    *handleChangeCity({ payload }, { call, put }) {
      if (!payload) {
        return;
      }
      const { response } = yield call(queryCascaderUdc, {
        defId: 'COM:CITY',
        parentDefId: 'COM:PROVINCE',
        parentVal: payload,
      });
      if (response) {
        yield put({
          type: 'updateState',
          payload: { cityList: Array.isArray(response) ? response : [] },
        });
      }
    },
    *res({ payload }, { call, put }) {
      const { response } = yield call(selectUserMultiCol);
      const list = Array.isArray(response) ? response : [];
      yield put({
        type: 'updateState',
        payload: {
          resData: list,
          resDataSource: list,
        },
      });
    },
    // 标签数据
    // 根据自定义选择项的key 获取本身和孩子数据-树形结构
    *getTagTree({ payload }, { call, put }) {
      const { response } = yield call(customSelectionTreeFun, payload);
      const treeDataMap = tree =>
        tree.map(item => {
          if (item.children) {
            return {
              id: item.id,
              value: item.id,
              key: item.id,
              text: item.selectionName,
              title: item.selectionName,
              child: treeDataMap(item.children),
              children: treeDataMap(item.children),
            };
          }
          return {
            id: item.id,
            value: item.id,
            key: item.id,
            text: item.selectionName,
            title: item.selectionName,
            child: item.children,
            children: item.children,
          };
        });
      const tagTreeTemp = treeDataMap([response.data]);
      const flatTags = {};
      toFlatTags(flatTags, tagTreeTemp || []);
      if (response.ok) {
        yield put({
          type: 'updateState',
          payload: {
            tagTree: tagTreeTemp,
            flatTags,
          },
        });
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
  },
};
