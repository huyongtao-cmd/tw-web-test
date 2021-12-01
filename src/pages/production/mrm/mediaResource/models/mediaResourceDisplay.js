import { commonModelReducers } from '@/utils/production/modelUtils';
import { fromQs } from '@/utils/production/stringUtil';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { omit, isNil } from 'ramda';
import update from 'immutability-helper';
import { div, mul } from '@/utils/mathUtils';
import {
  mediaResourceDetailRq,
  mediaResourceOverallRq,
  mediaResourceAddRq,
} from '@/services/production/mrm/mediaResource';
import { supplierSelectPaging } from '@/services/production/common/select';
import { attachmentsPreviewRq } from '@/services/gen/app';
import { serverUrl, clientUrl } from '@/utils/networkUtils';
import { toUrl } from '@/utils/stringUtils';
import apis from '@/api';
// 默认状态 change1
const defaultState = {
  formData: {
    id: null,
    attributeDetails: [], // 资源属性
    priceDetails: [], // 资源价格
  },
  formMode: 'EDIT',
  priceDeleteKeys: [], // 资源价格已删除列表
  attributeDeleteKeys: [], // 资源属性已删除列表
  supplierOptions: [], // 供应商列表
  copy: false,
  fileList: [], // 附件列表
  previewList: [],
};

export default {
  namespace: 'mediaResourceDisplay',
  state: defaultState,
  // 异步方法
  effects: {
    *init({ payload }, { put, select }) {
      const {
        formData: { id },
        copy = false,
        formMode,
      } = yield select(({ mediaResourceDisplay }) => mediaResourceDisplay);
      if (formMode === 'EDIT') {
        // 编辑时获取供应商列表
        yield put({ type: 'getSupplierOptions' });
      }
      if (!id) {
        return;
      }
      const { data } = yield outputHandle(mediaResourceDetailRq, { key: id });
      // 当为复制时,处理id为null
      const copyObj = {};
      if (copy) {
        copyObj.id = undefined;
      }
      // change

      const { priceDetails, attachments, ...other } = data;
      // 编辑时计算discount change_8
      const result = priceDetails.map(item => {
        const { publishedPrice, finalPrice, ...rest } = item;
        rest.discount = div(finalPrice, publishedPrice).toFixed(2);
        return { publishedPrice, finalPrice, ...rest };
      });
      yield put({
        type: 'updateState',
        payload: {
          formData: {
            priceDetails: result,
            attachmentIds: attachments.map(item => item.id),
            ...other,
            ...copyObj,
          },
          fileList: attachments,
        },
      });
      yield put({
        type: 'getPreviewList',
      });
    },

    *save({ payload }, { put, select }) {
      const { formData, cb } = payload;
      const { id } = formData;
      let output;
      if (id && id > 0) {
        // 编辑
        output = yield outputHandle(
          mediaResourceOverallRq,
          omit(['createUserId', 'createTime'], formData),
          cb
        );
      } else {
        // 新增
        output = yield outputHandle(
          mediaResourceAddRq,
          omit(['createUserId', 'createTime'], formData),
          cb
        );
      }
      cb(output);
    },
    //获取供应商选项
    *getSupplierOptions({ payload }, { put, select }) {
      const output = yield outputHandle(supplierSelectPaging, { limit: 0 });
      const supplierOptions = output.data.rows.map(item => ({
        ...item,
        id: item.id,
        value: item.supplierNo,
        title: item.supplierName,
      }));

      yield put({
        type: 'updateState',
        payload: {
          supplierOptions,
        },
      });
    },
    //获取预览图片
    *getPreviewList({ payload }, { put, select }) {
      const {
        formData: { attachmentIds },
        formMode,
      } = yield select(({ mediaResourceDisplay }) => mediaResourceDisplay);
      const previewList = []; //可以预览的图片地址
      const queryList = []; // 请求promise数组
      const imgUrlList = []; // 图片地址
      if (attachmentIds.length) {
        attachmentIds.forEach(item => {
          queryList.push(attachmentsPreviewRq({ key: item }));
          imgUrlList.push(serverUrl + toUrl(apis.sfs.filePreview, { key: item }));
        });

        yield Promise.all(queryList).then(res => {
          res.forEach((item, index) => {
            // 请求成功的可以预览
            if (item.status === 200) {
              previewList.push(imgUrlList[index]);
            } else {
              previewList.push('');
            }
          });
        });
      }
      yield put({
        type: 'updateState',
        payload: { previewList },
      });
    },
    *updateFormForEditTable({ payload }, { put, select }) {
      const { formData } = yield select(({ mediaResourceDisplay }) => mediaResourceDisplay);
      const name = Object.keys(payload)[0];
      const element = payload[name];
      let newFormData;
      // 可编辑列表的值发生变化
      if (Array.isArray(element) && name.includes('Details')) {
        element.forEach((ele, index) => {
          if (!isNil(ele)) {
            newFormData = update(formData, { [name]: { [index]: { $merge: ele } } });
          }
        });
      } else {
        // 基本信息表单内容变化
        newFormData = { ...formData, ...payload };
      }
      yield put({
        type: 'updateState',
        payload: { formData: newFormData },
      });
      // 编辑的时候更新图片列表
      if (name === 'attachmentIds') {
        yield put({
          type: 'getPreviewList',
        });
      }
    },
  },

  // 同步方法
  reducers: {
    // 使用工具方法快速写updateState,updateForm,cleanState 方法
    ...commonModelReducers(defaultState),

    //路由获取id
    getParamsFromRoute(state, { payload }) {
      // change_2
      const { id, mode } = fromQs();
      return { ...state, formData: { ...state.formData, id }, formMode: mode || 'EDIT' };
    },
  },
};
