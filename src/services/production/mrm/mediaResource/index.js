import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const {
  // 资源管理
  mediaResourcePaging,
  mediaResourceAdd, //资源登记-post
  mediaResourceOverall, //整体更新-put
  mediaResourcePartial, //指定更新-put
  mediaResourceDelete, //删除-delete
  mediaResourcePatch, //逻辑删除-patch
  mediaResourceDetail, //详情-get
  mediaResourcepage, //
  mediaResourceChangeStatus,
} = api.production.mrm.mediaResource;

// =====================资源管理======================
// 列表
export async function mediaResourcePagingRq(payload) {
  return request.get(toQs(mediaResourcePaging, payload));
}
// 价格列表
export async function mediaResourcepageRq(payload) {
  return request.get(toQs(mediaResourcepage, payload));
}
// 新增
export async function mediaResourceAddRq(params) {
  return request.post(mediaResourceAdd, {
    body: params,
  });
}
// 整体更新
export async function mediaResourceOverallRq(params) {
  return request.put(mediaResourceOverall, {
    body: params,
  });
}
// 指定更新
export async function mediaResourcePartialRq(params) {
  return request.put(mediaResourcePartial, {
    body: params,
  });
}
// 资源状态更新
export async function mediaResourceChangeStatusRq(params) {
  return request.put(mediaResourceChangeStatus, {
    body: params,
  });
}
// 详情
export async function mediaResourceDetailRq(params) {
  return request.get(toUrl(mediaResourceDetail, params));
}
// 逻辑删除
export async function mediaResourcePatchRq(params) {
  return request.patch(toQs(mediaResourcePatch, params));
}

// 删除
export async function mediaResourceDeleteRq(params) {
  return request.delete(toQs(mediaResourceDelete, params));
}
