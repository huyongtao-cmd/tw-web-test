import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const { baseBuChange } = api.hr.baseBuChangeBatch;

// ================BU批量变更==================
// 取消考核
export async function baseBuChangeRq(params) {
  const { dataSource, ...restParams } = params;
  return request.put(toUrl(baseBuChange, restParams), {
    body: dataSource,
  });
}
