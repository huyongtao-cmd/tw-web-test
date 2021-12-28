import { request } from '@/utils/networkUtils';
import { toQs, toUrl } from '@/utils/stringUtils';
import api from '@/api';

const { resPlanConfig } = api.hr;
const {
  rppConfigPaging,
  rppConfigEdit,
  rppConfigDelete,
  rppConfigView,
  selectList,
} = resPlanConfig;

// 资源规划配置列表
export async function rppConfigPagingRq(params) {
  return request.get(toQs(rppConfigPaging, params));
}

// 资源规划配置新增、修改
export async function rppConfigEditRq(payload) {
  return request.post(rppConfigEdit, {
    body: payload,
  });
}

// 资源规划配置详情
export async function rppConfigViewRq(payload) {
  return request.get(toUrl(rppConfigView, payload));
}

// 资源规划配置删除
export async function rppConfigDeleteRq(payload) {
  return request.patch(toUrl(rppConfigDelete, payload));
}

// 参照历史需求/供给结果列表
export async function selectListRq(params) {
  return request.get(toQs(selectList, params));
}
