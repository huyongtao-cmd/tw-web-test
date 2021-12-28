import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const {
  list,
  savePreAccountJde,
  activeSubContract,
  virtualContractActivation,
  submitSubContract,
  submitVirtualSubContract,
  checkSubContract,
  passSubContractResult,
} = api.plat.prePay;

export async function queryPrePayMgmtList(params) {
  return request.get(toQs(list, params));
}

// 保存报销付款数据，用于jde数据同步，保存加修改
export async function savePreAccount({ adpayApplyIds, jdePay }) {
  return request.post(toUrl(savePreAccountJde, { adpayApplyIds }), { body: jdePay });
}

export async function getSubContractDetail({ id }) {
  return request.get(toUrl(activeSubContract, { id }));
}

export async function virtualContractActivationUrl({ id }) {
  return request.get(toUrl(virtualContractActivation, { id }));
}

export async function saveSubContract(params) {
  return request.post(submitSubContract, { body: params });
}

export async function saveVirtualSubContract(params) {
  return request.post(submitVirtualSubContract, { body: params });
}

export async function getViewSubContract({ id }) {
  return request.get(toUrl(checkSubContract, { id }));
}

export async function passResultSubContract(params) {
  return request.put(passSubContractResult, { body: params });
}
