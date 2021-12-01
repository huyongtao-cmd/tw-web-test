import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const { contractPlanPaging, salesInvoiceApply } = api.production.payAndRec;
// 收付款列表
export async function contractPlanPagingRq(payload) {
  return request.get(toQs(contractPlanPaging, payload));
}
// 开票申请
export async function salesInvoiceApplyRq(payload) {
  return request.get(toQs(salesInvoiceApply, payload));
}
