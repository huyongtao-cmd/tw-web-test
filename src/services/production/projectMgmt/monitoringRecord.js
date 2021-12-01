import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const {
  // 监播记录
  monitoringRecordPaging,
  monitoringRecordAdd, //新增-post
  monitoringRecordPartial, //指定更新-put
  monitoringRecordDelete, //删除-delete
  monitoringRecordDetail, //详情-get
} = api.production.projectMgmt.monitoringRecord;

// =====================监播记录======================
// 列表
export async function monitoringRecordPagingRq(payload) {
  return request.get(toQs(monitoringRecordPaging, payload));
}
// 新增
export async function monitoringRecordAddRq(params) {
  return request.post(monitoringRecordAdd, {
    body: params,
  });
}
// 编辑
export async function monitoringRecordPartialRq(params) {
  return request.put(monitoringRecordPartial, {
    body: params,
  });
}
// 详情
export async function monitoringRecordDetailRq(params) {
  return request.get(toUrl(monitoringRecordDetail, params));
}

// 删除
export async function monitoringRecordDeleteRq(params) {
  return request.patch(toQs(monitoringRecordDelete, params));
}
