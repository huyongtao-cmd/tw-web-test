import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const { applyAdviser, editAdviser, adviserDetail, adviserList } = api.hr.profile;

//独立顾问派工单
export async function createAdviser(params) {
  return request.post(applyAdviser, { body: params });
}

// 独立顾问派工单详情获取
export async function getAdviserFlow(id) {
  // console.log(id, 321);
  // const { key } = params;
  return request.get(adviserDetail.replace('{key}', id));
  // return request.get(toUrl(partnerFlow, id));
}

export async function updateAdviser(params) {
  return request.put(editAdviser, { body: params });
}

// 列表
export async function getAdviserList(params) {
  // console.log(id, 321);
  // const { key } = params;
  return request.get(toQs(adviserList, params));
  // return request.get(toUrl(partnerFlow, id));
}
