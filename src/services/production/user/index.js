import { request } from '@/utils/networkUtils';
import { toQs, toUrl } from '@/utils/stringUtils';
import api from '@/api';

const { user } = api.production;

export async function informationListPaging(param) {
  return request.get(toQs(user.informationListPagingUri, param));
}

export async function informationImport(payload) {
  return request.post(user.informationImport, {
    body: payload,
  });
}

export async function informationSave(param) {
  return request.post(user.informationSaveUri, {
    body: param,
  });
}
export async function logicDel(param) {
  return request.patch(toUrl(user.informationLogicDeleteUri, param));
}

export async function findById(param) {
  return request.get(toUrl(user.informationFindById, param));
}

export async function editInfo(params) {
  return request.put(toUrl(user.informationEditUri, { id: params.id }), {
    body: params,
  });
}
