import { findAddrByNo } from '@/services/plat/addr/addr';
import { customSelectionTreeFun } from '@/services/production/system';

const emptyFormData = {};
const initialState = {
  tabkey: 'custDetail',
  tabModified: Array(10).fill(0), // 记录哪个tab修改过 - 这个需要放在redux中
  // 查询系列
  formData: {
    // 主数据
    ...emptyFormData,
    relateType: '',
  },
  personData: {
    // 个人
    ...emptyFormData,
  },
  ouData: {
    // 公司
    ...emptyFormData,
  },
  custData: {
    // 客户
    ...emptyFormData,
  },
  supplierData: {
    // 供应商
    ...emptyFormData,
  },
  coopData: {
    // 合作伙伴
    ...emptyFormData,
  },
  // 明细表
  connList: [], // 联系信息
  bankList: [], // 银行账户
  invoiceList: [], // 开票信息
  addressList: [], // 地址列表
  tagTree: [], // 标签树
  flatTags: {},
};

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
  namespace: 'userCustDetail',

  state: {
    ...initialState,
  },

  effects: {
    *query({ payload }, { call, put }) {
      // console.log('findAddrByNo ->', payload);
      const {
        response: { datum },
      } = yield call(findAddrByNo, payload);

      yield put({
        type: 'updateState',
        payload: {
          formData: datum.abBasicDetailView || { relateType: '' },
          personData: datum.personDetailView || {},
          ouData: datum.ouDetailView || {},
          connList: datum.contactListViews || [], // 联系信息
          bankList: datum.accListViews || [], // 银行账户
          invoiceList: datum.invInfoListViews || [], // 开票信息
          addressList: datum.addressListViews || [], // 地址列表
          custData: datum.custView || {},
          supplierData: datum.supplierView || {},
          coopData: datum.coopView || {},
        },
      });
    },
    // 在刷新页面之前将form表单里的数据置为空
    *clean(_, { put }) {
      yield put({
        type: 'updateState',
        payload: {
          ...initialState,
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
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, search }) => {});
    },
  },
};
