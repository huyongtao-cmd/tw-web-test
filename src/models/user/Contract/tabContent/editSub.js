import {
  queryContractDetail,
  saveEditContract,
  selectUserMultiCol,
  selectSalesRegionBuMultiCol,
} from '@/services/user/Contract/sales';
import { queryCascaderUdc } from '@/services/gen/app';
import { selectBuMultiCol } from '@/services/org/bu/bu';
import createMessage from '@/components/core/AlertMessage';
import {
  findProfitdistRuleList,
  deleteProfitdistRules,
} from '@/services/sys/baseinfo/profitdistrule';
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import { virtualContractActivationUrl } from '@/services/plat/prePayMgmt';
import { launchFlowFn } from '@/services/sys/flowHandle';
import { closeThenGoto } from '@/layouts/routerControl';
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
  namespace: 'userContractEditSub',

  state: {
    operationkeyDetail: 'Info',
    operationkeyEdit: 'Info',
    flag1: 0,
    flag2: 0,
    flag3: 0,
    flag4: 0,
    flag5: 0,
    smallClass: [],
    formData: {
      contractNo: null, // "HTSUBxx"
      contractName: null, // "YApiSubTest"
      contractStatus: null, // "CREATE"
      mainContractId: null, // 1
      userdefinedNo: null, // 1
      remark: null, // "测试销售合同"
      closeReason: null, // "close"
      amt: null, // 1000000
      extraAmt: null, // 10000
      effectiveAmt: null, // 900000
      grossProfit: null, // 800000
      finPeriodId: null, // 1
      deliveryAddress: null, // "交付地点"
      saleType1: null, // "01"
      saleType2: null, // "01"
      signBuId: null, // 1
      salesmanResId: null, // 1
      deliBuId: null, // 1
      deliResId: null, // 1
      regionBuId: null, // 销售区域BU_ID
      mainType: 'SUB', // "SUB"
      sourceType: null, // "EXTERNAL"
      externalIden: null, // "外部必填(可从商机带入)"
      externalName: null, // "YApi"
      externalPhone: null, // "13000000000"
      internalBuId: null, // 2
      internalResId: null, // 3
      profitDesc: null, // "承诺没有bug"
      startDate: null, // "2018-01-01"
      endDate: null, // "2018-11-01"
      productId: null, // 1
      briefDesc: null, // "说明"
      workType: null, // "01"
      promotionType: null, // "01"
      rangeProp: null, // "OPEN"
      halfOpenDesc: null, // "说明"
      prodProp: null, // "EL"
      projProp: null, // "NEW"
      channelType: null, // "DIRECT"
      cooperationType: null, // "DEF"
      custpaytravelFlag: null, // 0
      reimbursementDesc: null, // "说明
      taxRate: null, // 税率
      currCode: null,
      currCodeDesc: null,
      profitRuleId: null, // 收益分配规则主数据 T_PROFITDIST_RULE.id
    },
    ruleTotal: 0,
    ruleDataSource: [], // 其他利益分配规则主数据按钮弹出窗口中的数据
    pageConfig: {
      pageBlockViews: [],
    },
    tagTree: [], // 标签树
    flatTags: {},
    checkedKeys: [], //选中的标签id
  },

  effects: {
    /* 获取子合同详情 */
    *querySub({ payload }, { call, put, select }) {
      const { response } = yield call(queryContractDetail, payload);
      // let custpaytravelFlag = null;
      // if (response.datum.custpaytravelFlag === 0) {
      //   custpaytravelFlag = 'NO';
      // } else if (response.datum.custpaytravelFlag === 1) {
      //   custpaytravelFlag = 'YES';
      // }
      if (response && response.datum) {
        yield put({
          type: 'updateState',
          payload: {
            formData: response.datum || {},
          },
        });

        // 初始化 品项类别
        if ((response.datum || {}).saleType1) {
          yield put({
            type: 'UDC_SmallClass',
            payload: response.datum.saleType1,
          });
        }

        return response;
      }
      return {};
    },

    *editInfo({ payload }, { call, put, select }) {
      const { formData } = yield select(({ userContractEditSub }) => userContractEditSub);
      // formData.custpaytravelFlag = formData.custpaytravelFlag === 'YES' ? 1 : 0;
      const { status, response } = yield call(saveEditContract, formData);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response.ok) {
        createMessage({ type: 'success', description: response.reason });
        yield put({
          type: 'updateState',
          payload: { flag1: 0 },
        });
      } else {
        createMessage({ type: 'error', description: response.reason || '保存失败' });
      }
    },

    *UDC_SmallClass({ payload }, { call, put }) {
      const { response } = yield call(queryCascaderUdc, {
        defId: 'TSK:SALE_TYPE2',
        parentDefId: 'TSK:SALE_TYPE1',
        parentVal: payload,
      });
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            smallClass: Array.isArray(response) ? response : [],
          },
        });
      }
    },
    *bu({ payload }, { call, put, select }) {
      const { response } = yield call(selectBuMultiCol);
      const list = Array.isArray(response) ? response : [];
      yield put({
        type: 'updateState',
        payload: {
          buData: list,
          deliBuDataSource: list,
          preSaleBuDataSource: list,
        },
      });
    },

    *user({ payload }, { call, put, select }) {
      const { response } = yield call(selectUserMultiCol);
      const list = Array.isArray(response) ? response : [];
      yield put({
        type: 'updateState',
        payload: {
          userData: list,
          deliResDataSource: list,
          preSaleResDataSource: list,
        },
      });
    },

    *salesRegionBu({ payload }, { call, put, select }) {
      const { response } = yield call(selectSalesRegionBuMultiCol);
      const list = Array.isArray(response) ? response : [];
      yield put({
        type: 'updateState',
        payload: {
          salesRegionBuData: list,
          salesRegionBuDataSource: list,
        },
      });
    },

    *ruleQuery({ payload }, { call, put }) {
      const { response } = yield call(findProfitdistRuleList, payload);

      yield put({
        type: 'updateState',
        payload: {
          ruleDataSource: Array.isArray(response.rows) ? response.rows : [],
          ruleTotal: response.total,
        },
      });
    },

    ruleUpdateSearchForm(state, { payload }) {
      const { searchForm } = state;
      const newFormData = { ...searchForm, ...payload };
      return {
        ...state,
        searchForm: newFormData,
      };
    },
    // 获取配置字段
    *getPageConfig({ payload }, { call, put, select }) {
      const { status, response } = yield call(businessPageDetailByNo, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            pageConfig: response.configInfo,
          },
        });
        return response;
      }
      return {};
    },

    *virtualContractActivationUrl({ payload }, { call, put, select }) {
      const { response } = yield call(virtualContractActivationUrl, payload);
      if (response && response.ok) {
        const kid = response.datum;
        const responseFlow = yield call(launchFlowFn, {
          defkey: 'ACC_A62',
          value: {
            id: kid,
          },
        });
        const response2 = responseFlow.response;
        if (response2 && response2.ok) {
          createMessage({ type: 'success', description: '提交成功' });
          closeThenGoto('/user/flow/process?type=procs');
        } else {
          createMessage({
            type: 'warn',
            description: '提交出现问题,请返回重新提交',
          });
        }
      } else if (response.reason === 'CONTRACT:CONTRACT_ACTIVACTION_ISNULL_CHECK') {
        createMessage({
          type: 'warn',
          description: '子合同收益分配规则不能为空,请返回子合同完善信息',
        });
      } else {
        createMessage({ type: 'warn', description: response.reason });
      }
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
  },
};
