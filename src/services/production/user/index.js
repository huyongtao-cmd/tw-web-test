import { request } from '@/utils/networkUtils';
import { toQs } from '@/utils/stringUtils';
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
