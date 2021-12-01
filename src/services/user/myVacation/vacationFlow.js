import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const {
  myVacation: { vacationResDetail, vacationApply, vacationFlowDetail },
} = api.user;

// 个人假期详情
export async function vacationResDetailRq(id) {
  return request.get(toUrl(vacationResDetail, id));
}

// 个人请假流程详情
export async function vacationFlowDetailRq(id) {
  return request.get(toUrl(vacationFlowDetail, id));
}

// 发起请假流程
export async function vacationApplyRq(params) {
  return request.post(vacationApply, {
    body: params,
  });
}

// 请假流程审批
export async function vacationFlowRq(params) {
  return request.put(vacationApply, {
    body: params,
  });
}
