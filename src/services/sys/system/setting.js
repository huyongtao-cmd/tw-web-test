import { request } from '@/utils/networkUtils';
import { toUrl } from '@/utils/stringUtils';
import api from '@/api';

const { setting } = api.sys;
const { clearCache, reloadCacheDefIdApi } = setting;

// 清除下拉缓存
export async function clearCacheHandle() {
  return request.get(clearCache);
}

// 更新指定defId的UDC缓存
export async function reloadCacheDefIdFun(defId) {
  return request.get(toUrl(reloadCacheDefIdApi, defId));
}
