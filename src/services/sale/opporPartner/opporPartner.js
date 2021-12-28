import api from '@/api';
import { request } from '@/utils/networkUtils';
import { toQs, toUrl } from '@/utils/stringUtils';

const { createOpportner, partnerFlow, updateOpportner } = api.sale.opporPartner;

//合作伙伴准入创建
export async function createOpporPartner(params) {
  return request.post(createOpportner, { body: params });
}

// 合作伙伴详情获取
export async function getPartnerFlow(id) {
  // console.log(id, 321);
  // const { key } = params;
  return request.get(partnerFlow.replace('{key}', id));
  // return request.get(toUrl(partnerFlow, id));
}

export async function updateOpporPartner(params) {
  return request.put(updateOpportner, { body: params });
}
