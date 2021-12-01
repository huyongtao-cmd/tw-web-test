import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const {
  // 项目团队管理
  projectTeamPaging,
  projectTeamAdd, //项目团队登记-post
  projectTeamPartial, //指定更新-put
  projectTeamDelete, //删除-delete
  projectTeamDetail, //详情-get
} = api.production.projectMgmt.projectTeam;

// =====================项目团队管理======================
// 列表
export async function projectTeamPagingRq(payload) {
  return request.get(toQs(projectTeamPaging, payload));
}
// 新增
export async function projectTeamAddRq(params) {
  return request.post(projectTeamAdd, {
    body: params,
  });
}
// 编辑
export async function projectTeamPartialRq(params) {
  return request.put(projectTeamPartial, {
    body: params,
  });
}
// 详情
export async function projectTeamDetailRq(params) {
  return request.get(toUrl(projectTeamDetail, params));
}

// 删除
export async function projectTeamDeleteRq(params) {
  return request.patch(toQs(projectTeamDelete, params));
}
