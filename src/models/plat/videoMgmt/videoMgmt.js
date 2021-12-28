import {
  videoListRq,
  videoEditRq,
  videoDeleteRq,
  videoDetailRq,
  videoCatDataRq,
  selectVideoDropRq,
  changeStatusRq,
  getTagIdsByDocIdAndDocTypeFun,
} from '@/services/plat/videoMgmt/videoMgmt';
import {
  //视频列表查询
  selectVideoSynListRq,
} from '@/services/sale/showHomePage/showHomePage';
import {
  customSelectionTreeFun, // 自定义选项tree
} from '@/services/production/system';
import { queryUdc, queryCascaderUdc } from '@/services/gen/app';
import { businessPageDetailByNo } from '@/services/sys/system/pageConfig';
import { fromQs } from '@/utils/stringUtils';
import { genFakeId } from '@/utils/mathUtils';
import createMessage from '@/components/core/AlertMessage';
import moment from 'moment';
import { isNil } from 'ramda';

const defaultSearchForm = {
  showFlag: '',
};
const defaultFormData = {
  accessFlag: 'ALL',
  showFlag: 'SHOW',
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
  namespace: 'videoMgmt',
  state: {
    list: [],
    total: 0,
    searchForm: defaultSearchForm,
    formData: defaultFormData,
    catCodeFormData: {},
    detailFormData: {},
    pageConfig: {
      pageBlockViews: [],
    },
    vCat1List: [],
    vCat2List: [],
    vCat5List: [],
    type2: [],
    videoCatDataList: [],
    videoCatDataListCopy: [],
    twVideoShowLabelEntityList: [],
    twVideoShowLabelEntityListDel: [],
    tagTree: [], //标签 包含合同、客户
    flatTags: {},
    checkedKeys: [],
    tagTreeContract: [], // 合同标签树
    tagTreeCust: [], // 客户标签树
    tagTreeCoop: [], // 客户标签树
    flatTagsContract: {},
    flatTagsCust: {},
    flatTagsCoop: {},
    checkedKeysContract: [], //选中的合同标签id
    checkedKeysCust: [], //选中的客户标签id
    checkedKeysCoop: [], //选择的合作伙伴标签id
    tagTreeContractDisabled: false,
  },

  effects: {
    // 列表详情页面
    *videoDetailView({ payload }, { call, put, select }) {
      const { status, response } = yield call(videoDetailRq, payload);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        if (response && response.ok) {
          yield put({
            type: 'updateState',
            payload: {
              detailFormData: response.datum || {},
            },
          });

          // 回显合同标签
          const { contractId } = response.datum;
          if (contractId) {
            yield put({
              type: 'getTagIdsByDocIdAndDocType',
              payload: { docId: contractId, docType: 'CONTRACT' },
            });
          } else {
            // 针对无合同视频 、回显视频标签数据到合同标签
            const { id } = response.datum;
            if (id) {
              yield put({
                type: 'getTagIdsByDocIdAndDocType',
                payload: { docId: id, docType: 'VIDEO' },
              });
            }
          }

          // 回显客户标签
          const { custId } = response.datum;
          if (custId) {
            yield put({
              type: 'getTagIdsByDocIdAndDocType',
              payload: { docId: custId, docType: 'CUST' },
            });
          }

          // 回显合作伙伴标签
          const { coopId } = response.datum;
          if (coopId) {
            yield put({
              type: 'getTagIdsByDocIdAndDocType',
              payload: { docId: coopId, docType: 'COOP' },
            });
          }

          return response.datum;
        }
        createMessage({ type: 'error', description: response.reason || '获取详细信息失败' });
        return {};
      }
      createMessage({ type: 'error', description: response.reason || '获取详细信息失败' });
      return {};
    },
    // 视频列表修改展示状态
    *changeStatus({ payload }, { call, put, select }) {
      const { status, response } = yield call(changeStatusRq, payload);
      if (status === 200) {
        if (response && response.ok) {
          yield put({
            type: 'updateSearchForm',
            payload: {
              selectedRowKeys: [],
            },
          });
        } else {
          createMessage({ type: 'error', description: response.reason || '操作失败' });
        }
      }
    },
    // UDC查询
    *queryUdcList({ payload }, { call, put, select }) {
      const { categoryCode, id: editId } = payload;
      const { status, response } = yield call(queryUdc, categoryCode);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            twVideoShowLabelEntityList: Array.isArray(response)
              ? response.map(v => ({
                  ...v,
                  id: genFakeId(-1),
                  startDate:
                    !editId && v.sphd1
                      ? v.sphd2 && v.sphd2 === 'DEFAULT' && moment().format('YYYY-MM-DD')
                      : undefined,
                  endDate:
                    !editId && v.sphd1
                      ? v.sphd2 &&
                        v.sphd2 === 'DEFAULT' &&
                        moment(Date.now())
                          .add(Number(v.sphd1), 'day')
                          .format('YYYY-MM-DD')
                      : undefined,
                  checked: !editId && (v.sphd2 && v.sphd2 === 'DEFAULT') ? true : undefined,
                }))
              : [],
          },
        });
      }
    },
    // 视频类别数据
    *videoCatData({ payload }, { call, put, select }) {
      const { status, response } = yield call(videoCatDataRq, payload);
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (status === 200) {
        if (response.ok) {
          yield put({
            type: 'updateForm',
            payload: {
              tabName: response.datum.tabName,
            },
          });
          yield put({
            type: 'updateState',
            payload: {
              videoCatDataList: Array.isArray(response.datum.twVCatDValView)
                ? response.datum.twVCatDValView
                : [],
              videoCatDataListCopy: Array.isArray(response.datum.twVCatDValView)
                ? response.datum.twVCatDValView
                : [],
            },
          });
        }
      }
    },
    // 查内部资源对应的资源类型二
    *typeChange({ payload }, { call, put }) {
      const { response } = yield call(queryCascaderUdc, {
        defId: 'RES:RES_TYPE2',
        parentDefId: 'RES:RES_TYPE1',
        parentVal: payload,
      });
      if (response) {
        yield put({
          type: 'updateState',
          payload: { type2: Array.isArray(response) ? response : [] },
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
            vCat2List: Array.isArray(response.datum.vcat2List) ? response.datum.vcat2List : [],
            vCat5List: Array.isArray(response.datum.vcat5List) ? response.datum.vcat5List : [],
          },
        });
      }
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
    // 列表查询
    *query({ payload }, { call, put }) {
      const { uploadDate, ...params } = payload;
      if (Array.isArray(uploadDate) && (uploadDate[0] || uploadDate[1])) {
        [params.startDate, params.endDate] = uploadDate;
      }
      const { response } = yield call(videoListRq, params);
      if (response) {
        const { rows, total } = response;
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(rows) ? rows : [],
            total,
          },
        });
      }
    },
    // 找案例调用接口
    *queryCust({ payload }, { call, put }) {
      const { uploadDate, ...params } = payload;
      if (Array.isArray(uploadDate) && (uploadDate[0] || uploadDate[1])) {
        [params.startDate, params.endDate] = uploadDate;
      }
      const { response } = yield call(selectVideoSynListRq, params);
      if (response) {
        const { rows, total } = response;
        yield put({
          type: 'updateState',
          payload: {
            list: Array.isArray(rows) ? rows : [],
            total,
          },
        });
      }
    },
    // 列表删除
    *videoDelete({ payload }, { call, put, select }) {
      const { status, response } = yield call(videoDeleteRq, payload);
      if (status === 200) {
        if (response && response.ok) {
          createMessage({ type: 'success', description: '删除成功' });
          const { searchForm } = yield select(({ videoMgmt }) => videoMgmt);
          yield put({
            type: 'query',
            payload: searchForm,
          });
        } else {
          createMessage({ type: 'error', description: response.reason || '删除失败' });
        }
      }
    },
    // 列表详情
    *videoDetail({ payload }, { call, put, select }) {
      const { status, response } = yield call(videoDetailRq, payload);
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        if (response && response.ok) {
          const { twVideoShowLabelView = [], twVCatDValView = [] } = response.datum;
          const { twVideoShowLabelEntityList } = yield select(({ videoMgmt }) => videoMgmt);
          const tt = twVideoShowLabelEntityList.map(v => {
            const aa = twVideoShowLabelView.filter(item => item.vlabel === v.code);
            if (aa.length) {
              return { ...v, ...aa[0], checked: true };
            }
            return v;
          });

          yield put({
            type: 'updateForm',
            payload: response.datum || {},
          });

          let bb = {};
          twVCatDValView.forEach(v => {
            bb = { ...bb, [v.tabField]: v.multFlagId };
          });
          yield put({
            type: 'updateState',
            payload: {
              videoCatDataList: twVCatDValView,
              twVideoShowLabelEntityList: tt,
              catCodeFormData: bb,
            },
          });

          // 有查看权限资源类型资源类型二
          const { accessResType1 } = response.datum;
          if (accessResType1) {
            yield put({
              type: 'typeChange',
              payload: accessResType1,
            });
          }

          // 回显合同标签
          const { contractId } = response.datum;
          if (contractId) {
            yield put({
              type: 'getTagIdsByDocIdAndDocType',
              payload: { docId: contractId, docType: 'CONTRACT' },
            });
          } else {
            //针对无合同视频数据 拉取视频标签回显至合同标签处
            const { id } = response.datum;
            if (id) {
              yield put({
                type: 'getTagIdsByDocIdAndDocType',
                payload: { docId: id, docType: 'VIDEO' },
              });
            }
          }

          // 回显客户标签
          const { custId } = response.datum;
          if (custId) {
            yield put({
              type: 'getTagIdsByDocIdAndDocType',
              payload: { docId: custId, docType: 'CUST' },
            });
          }

          // 回显合作伙伴标签
          const { coopId } = response.datum;
          if (coopId) {
            yield put({
              type: 'getTagIdsByDocIdAndDocType',
              payload: { docId: coopId, docType: 'COOP' },
            });
          }
          return response.datum;
        }
        createMessage({ type: 'error', description: response.reason || '获取详细信息失败' });
        return {};
      }
      createMessage({ type: 'error', description: response.reason || '获取详细信息失败' });
      return {};
    },
    // 视频新增修改
    *videoEdit({ payload }, { call, put, select }) {
      const {
        catCodeFormData,
        twVideoShowLabelEntityList,
        twVideoShowLabelEntityListDel,
      } = yield select(({ videoMgmt }) => videoMgmt);

      const params = {
        twVideoShowLabelEntityList: twVideoShowLabelEntityList
          .filter(v => v.checked)
          .map(v => ({ ...v, vlabel: v.code })),
        videoShowLabId: twVideoShowLabelEntityListDel.filter(v => v > 0),
        twVCatDVal: Object.entries(catCodeFormData).map(v => ({ [v[0]]: v[1] || '' })),
      };

      const { status, response } = yield call(videoEditRq, { ...payload, ...params });
      if (status === 100) {
        // 主动取消请求
        return {};
      }
      if (status === 200) {
        return response;
      }
      return {};
    },

    *clean(_, { put, select }) {
      const {
        user: { extInfo = {} },
      } = yield select(({ user }) => user);
      if (isNil(extInfo)) {
        createMessage({
          type: 'warn',
          description: '当前账号为管理员账号，可能无法获取默认申请人',
        });
        return;
      }
      yield put({
        type: 'updateState',
        payload: {
          formData: {
            accessFlag: 'ALL',
            showFlag: 'SHOW',
            uploadResId: extInfo.resId || undefined,
            uploadDate: moment().format('YYYY-MM-DD HH:mm:ss'),
          },
          twVideoShowLabelEntityList: [],
          twVideoShowLabelEntityListDel: [],
          videoCatDataList: [],
          catCodeFormData: {},
        },
      });
    },
    *cleanDetailForm(_, { put, select }) {
      yield put({
        type: 'updateState',
        payload: {
          detailFormData: {},
        },
      });
    },
    // 标签数据
    // 根据自定义选择项的key 获取本身和孩子数据-树形结构
    *getTagTree({ payload }, { call, put }) {
      const { docType } = payload;
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
        if (docType === 'CUST') {
          const flatTagsCust = {};
          toFlatTags(flatTagsCust, tagTreeTemp || []);
          yield put({
            type: 'updateState',
            payload: {
              tagTreeCust: tagTreeTemp,
              flatTagsCust,
            },
          });
        } else if (docType === 'CONTRACT') {
          const flatTagsContract = {};
          toFlatTags(flatTagsContract, tagTreeTemp || []);
          yield put({
            type: 'updateState',
            payload: {
              tagTreeContract: tagTreeTemp,
              flatTagsContract,
            },
          });
        } else if (docType === 'COOP') {
          const flatTagsCoop = {};
          toFlatTags(flatTagsCoop, tagTreeTemp || []);
          yield put({
            type: 'updateState',
            payload: {
              tagTreeCoop: tagTreeTemp,
              flatTagsCoop,
            },
          });
        } else {
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
      }
    },

    //根据合同、客户Id获取关联标签
    *getTagIdsByDocIdAndDocType({ payload }, { call, put, select }) {
      const { docType } = payload;
      const {
        flatTagsCust,
        checkedKeysCust,
        flatTagsContract,
        checkedKeysContract,
        flatTagsCoop,
        checkedKeysCoop,
      } = yield select(({ videoMgmt }) => videoMgmt);
      const { response } = yield call(getTagIdsByDocIdAndDocTypeFun, payload);
      if (response.ok) {
        const tagIds = response.datum;
        if (docType === 'CUST') {
          let checkedKeysTemp = [];
          if (tagIds) {
            const arrayTemp = tagIds.split(',');
            checkedKeysTemp = arrayTemp.filter(item => {
              const menu = flatTagsCust[item];
              return menu && (menu.children === null || menu.children.length === 0);
            });
            checkedKeysTemp = checkedKeysCust.concat(checkedKeysTemp);
          }
          yield put({
            type: 'updateState',
            payload: {
              checkedKeysCust: checkedKeysTemp,
            },
          });
        } else if (docType === 'CONTRACT') {
          let checkedKeysTemp = [];
          if (tagIds) {
            const arrayTemp = tagIds.split(',');
            checkedKeysTemp = arrayTemp.filter(item => {
              const menu = flatTagsContract[item];
              return menu && (menu.children === null || menu.children.length === 0);
            });
            checkedKeysTemp = checkedKeysContract.concat(checkedKeysTemp);
          }
          yield put({
            type: 'updateState',
            payload: {
              checkedKeysContract: checkedKeysTemp,
            },
          });
        } else if (docType === 'COOP') {
          let checkedKeysTemp = [];
          if (tagIds) {
            const arrayTemp = tagIds.split(',');
            checkedKeysTemp = arrayTemp.filter(item => {
              const menu = flatTagsCoop[item];
              return menu && (menu.children === null || menu.children.length === 0);
            });
            checkedKeysTemp = checkedKeysCoop.concat(checkedKeysTemp);
          }
          yield put({
            type: 'updateState',
            payload: {
              checkedKeysCoop: checkedKeysTemp,
            },
          });
        } else if (docType === 'VIDEO') {
          // 针对无合同的视频  采用视频标签方式回显合同标签
          let checkedKeysTemp = [];
          if (tagIds) {
            const arrayTemp = tagIds.split(',');
            checkedKeysTemp = arrayTemp.filter(item => {
              const menu = flatTagsContract[item];
              return menu && (menu.children === null || menu.children.length === 0);
            });
            checkedKeysTemp = checkedKeysContract.concat(checkedKeysTemp);
          }
          yield put({
            type: 'updateState',
            payload: {
              checkedKeysContract: checkedKeysTemp,
            },
          });
        }
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
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
      };
    },
    updateCatCodeForm(state, { payload }) {
      const { catCodeFormData } = state;
      const newFormData = { ...catCodeFormData, ...payload };
      return {
        ...state,
        catCodeFormData: newFormData,
      };
    },
    updateSearchForm(state, { payload }) {
      const { searchForm } = state;
      const newFormData = { ...searchForm, ...payload };
      return {
        ...state,
        searchForm: newFormData,
      };
    },
    cleanSearchForm(state, action) {
      return {
        ...state,
        searchForm: {
          ...defaultSearchForm,
          selectedRowKeys: [],
        },
        list: [],
        total: 0,
      };
    },
  },
};
