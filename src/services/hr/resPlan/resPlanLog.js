import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const { resPlanLogListApi, listBpAllApi, resPlanLogicalDeleteApi } = api.hr.resPlan;

// =====资源规划批处理结果列表========
export async function resPlanLogList(params) {
  return request.get(toQs(resPlanLogListApi, params));
}

//查询所有批处理结果
export async function listBpAll() {
  return request.get(listBpAllApi);
}

//逻辑删除
export async function resPlanLogicalDelete(payload) {
  return request.patch(toUrl(resPlanLogicalDeleteApi, payload));
}
