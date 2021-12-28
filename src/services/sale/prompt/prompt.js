import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const { promptDetail, promptIncrease, editPrompt, changeLog, getRecvplan } = api.production.prompt;

// 获取催款单详情
export async function getPrompt(id) {
  return request.get(promptDetail.replace('{key}', id));
}

// 获取收款计划变更历史
export async function getChangeLog(param) {
  return request.get(toQs(changeLog, param));
}

// 获取收款计划详情
export async function getRecDetail(param) {
  return request.get(toQs(getRecvplan, param));
}

//独立顾问派工单
// export async function createAdviser(params) {
//   return request.post(applyAdviser, { body: params });
// }

// 独立顾问派工单详情获取
// export async function getAdviserFlow(id) {
//   // console.log(id, 321);
//   // const { key } = params;
//   return request.get(adviserDetail.replace('{key}', id));
//   // return request.get(toUrl(partnerFlow, id));
// }

export async function updatePrompt(params) {
  return request.post(editPrompt, { body: params });
}

// 列表
// export async function getAdviserList(params) {
//   // console.log(id, 321);
//   // const { key } = params;
//   return request.get(toQs(adviserList, params));
//   // return request.get(toUrl(partnerFlow, id));
// }
