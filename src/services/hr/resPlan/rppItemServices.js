import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const {
  rppItemListPageApi,
  rppItemListListPageApi,
  selectTaskListApi,
  mainCapasetLevelNameListApi,
  resPlanNeedListApi,
  resPlanRoleDetailApi,
  resPlanRecommendedApi,
  confirmOrRecommendedApi,
  resPlanContrastApi,
  resPlanSubmitApi,
} = api.hr.resPlan;

// =====资源规划批处理结果列表========
export async function listPageFun(params) {
  return request.get(toQs(rppItemListPageApi, params));
}

export async function listListPageFun(params) {
  return request.get(toQs(rppItemListListPageApi, params));
}

// =====资源规划批处理 任务列表========
export async function selectTaskListFun(params) {
  return request.get(toQs(selectTaskListApi, params));
}

// =====资源规划批处理 任务列表========
export async function mainCapasetLevelNameListFun(params) {
  return request.get(toQs(mainCapasetLevelNameListApi, params));
}

// 资源规划需求处理
export async function resPlanNeedList(params) {
  return request.get(toQs(resPlanNeedListApi, params));
}

// 资源规划需求处理
export async function resPlanRoleDetail({ id }) {
  return request.get(toUrl(resPlanRoleDetailApi, { id }));
}

// 资源规划推荐资源列表
export async function resPlanRecommendedList(params) {
  return request.get(toQs(resPlanRecommendedApi, params));
}

// 资源规划确认指派或推荐
export async function confirmOrRecommended(params) {
  return request.put(confirmOrRecommendedApi, {
    body: params,
  });
}

// 资源规划对比
export async function resPlanContrast(params) {
  return request.get(toUrl(resPlanContrastApi, params));
}

// 规划资源确定提交
export async function resPlanSubmit(params) {
  return request.post(resPlanSubmitApi, {
    body: params,
  });
}
