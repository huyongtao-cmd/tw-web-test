import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const { list, found, change, myInfo } = api.user.shortcut;

const {
  customShortCut,
  delCustomShortCut,
  addCustomShortCut,
  updateSortNoCustomShortCut,
  getNavsCustomShortCut,
  saveNavsCustomShortCut,
  noticeListLength,
} = api.user.customShortCut;
const { todo, back, done, getYeedocFlowList, saveOrUpdateYeedocFlow } = api.user.flow;
const { willApproveCount, recentWork } = api.user.timesheet;
const { ticketInfoChange } = api.user.center;
const { idxMessageList, idxMessageCount } = api.plat.message;

const { selectTrainingAll, updateNewPushFlag, updateShowFlag } = api.user.remind;

// 拉取易稻壳退回、知会表为已读
export async function saveOrUpdateYeedocFlowRq(params) {
  const { appId, secretKey, ...restParmars } = params;
  return request(toQs(saveOrUpdateYeedocFlow, { appId, secretKey }), {
    method: 'POST',
    body: restParmars,
  });
}

// 拉取易稻壳推送待办、退回、知会
export async function getYeedocFlowListRq(params) {
  return request.get(toQs(getYeedocFlowList, params));
}

// 拉取 三个弹窗所有详细信息
export async function selectTrainingAllRq(params) {
  return request.get(toQs(selectTrainingAll, params));
}

// 更新推送提醒是否弹出
export async function updateNewPushFlagRq(params) {
  return request.put(toUrl(updateNewPushFlag, params));
}

//  更新第一个弹窗是否弹出
export async function updateShowFlagRq(params) {
  return request.put(toUrl(updateShowFlag, params));
}

export async function queryShortCut() {
  return request(list, {
    method: 'GET',
  });
}
export async function foundShortCut(params) {
  return request(toQs(found, params), {
    method: 'POST',
  });
}
export async function changeShortCut(params) {
  return request(toQs(change, params), {
    method: 'POST',
  });
}

export async function getTodo(params) {
  return request.get(toQs(todo, params));
}

export async function getBack(params) {
  return request.get(toQs(back, params));
}

export async function getDone(params) {
  return request.get(toQs(done, params));
}

export async function getMessage(params) {
  return request.get(toQs(idxMessageList, params));
}

export async function getMessageCount(params) {
  return request.get(toQs(idxMessageCount, params));
}

// 获取首页-我的信息
export async function queryMyInfo() {
  return request.get(myInfo);
}

export async function queryWillApproveCount() {
  return request.get(willApproveCount);
}
export async function queryRecentWork() {
  return request.get(recentWork);
}

export async function changeTicketInfo(id) {
  return request.put(toUrl(ticketInfoChange, { id }));
}

export async function queryCustomShortCut(params) {
  return request.get(toQs(customShortCut, params));
}

export async function CustomShortCutAdd(params) {
  return request.post(toQs(addCustomShortCut, params));
}

export async function customShortCutDel(ids) {
  return request.patch(delCustomShortCut.replace('{ids}', ids));
}

export async function customShortCutUpdateSortNo(id, sortNo) {
  return request.put(updateSortNoCustomShortCut.replace('{id}/{sortNo}', id + '/' + sortNo));
}

export async function customShortCutGetNavs() {
  return request.get(getNavsCustomShortCut);
}

export async function customShortCutsaveNavs(params) {
  return request.put(saveNavsCustomShortCut, { body: params });
}

export async function getNoticeLength(params) {
  const { key } = params;
  return request.get(noticeListLength.replace('{key}', key));
}
