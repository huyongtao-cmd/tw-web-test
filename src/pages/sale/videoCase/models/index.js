import { selectVideoDropRq } from '@/services/plat/videoMgmt/videoMgmt';
import {
  customSelectionTreeFun, // 自定义选项tree
} from '@/services/production/system';
import {
  //视频列表查询
  selectVideoSynListRq,
} from '@/services/sale/showHomePage/showHomePage';

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
  namespace: 'videoCase',

  state: {
    list: [],
    total: 0,
    detail: null,
    caseList: [],
    vCat1List: [], //视频大类数据
    videoUrl: undefined,
    tagTree: [], // 标签树
    flatTags: {},
    checkedKeys: [], //选中的标签id
  },

  effects: {
    *fetch({ payload }, { call, put }) {
      const { response } = yield call(selectVideoSynListRq, payload);
      yield put({
        type: 'updateState',
        payload: {
          list: Array.isArray(response.rows) ? response.rows : [],
          total: response.length,
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
      if (response.ok) {
        const tagTreeTemp = treeDataMap([response.data]);
        const flatTags = {};
        toFlatTags(flatTags, tagTreeTemp || []);
        yield put({
          type: 'updateState',
          payload: {
            tagTree: tagTreeTemp,
            flatTags,
          },
        });
      }
    },
    // 视频大类、视频小类、服务属性
    *selectVideoDrop({ payload }, { call, put }) {
      const { response } = yield call(selectVideoDropRq, payload);
      if (response) {
        yield put({
          type: 'updateState',
          payload: {
            vCat1List: Array.isArray(response.datum.vcat1List) ? response.datum.vcat1List : [],
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
  },

  subscriptions: {
    setup({ dispatch, history }) {
      history.listen(location => {});
    },
  },
};
