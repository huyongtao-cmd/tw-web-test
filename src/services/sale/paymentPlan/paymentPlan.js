import api from '@/api';
import { request } from '@/utils/networkUtils';
import { toQs, toUrl } from '@/utils/stringUtils';

const { purchaseConractPaymentPlans, updatePaymentPlanById } = api.sale.paymentPlan;

//采购合同付款计划-列表
export async function getPurchaseConractPaymentPlansRq(params) {
  return request.get(toQs(purchaseConractPaymentPlans, params));
}

//采购合同付款计划-付款计划更新
export async function updatePaymentPlanByIdRq(param) {
  return request.put(updatePaymentPlanById, { body: param });
}
