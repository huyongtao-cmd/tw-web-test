import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const {
  bumain,
  bubasic,
  bubasicupdate,
  bucats,
  bucatsupdate,
  buTree,
  busSelect,
  resBusSelect,
  buMainTree,
  buAcc,
  buFound,
  buFoundLinmon,
  buDelete,
  buActive,
  offerApply,
  hangupAndClose,
  buMainMyTree,
  buVersion,
  findTreeByVersion,
} = api.org;
const { buMultiColSelect } = api.user;

const { butemplates } = api.sys;

export async function findMainBU(params) {
  return request.get(toQs(bumain, params));
}

export async function findBUBasic({ buId }) {
  return request.get(toUrl(bubasic, { buId }));
}

export async function findBUCats({ buId }) {
  return request.get(toUrl(bucats, { buId }));
}

export async function updateBasic(params) {
  return request.patch(toQs(toUrl(bubasicupdate, { buId: params.id }), params));
}

export async function logicDelete(params) {
  return request(buDelete, {
    method: 'PUT',
    body: { delList: params },
  });
}

export async function updateCats(id, params) {
  return request.patch(toQs(toUrl(bucatsupdate, { buId: id }), params));
}

export async function create(params) {
  return request(buFound, {
    method: 'POST',
    body: params,
  });
}
export async function createLinmon(params) {
  return request(buFoundLinmon, {
    method: 'POST',
    body: params,
  });
}

export async function queryBuTree(params) {
  return request.get(toQs(buTree, params));
}

export async function selectBus(params) {
  return request.get(toQs(busSelect, params));
}

export async function selectResBus(params) {
  return request.get(resBusSelect);
}

export async function selectBuMultiCol(params) {
  return request.get(toQs(buMultiColSelect, params));
}

/* bu */
export async function findbuMainTree() {
  return request.get(buMainTree);
}
/* bu */
export async function findbuMainMyTree() {
  return request.get(buMainMyTree);
}
export async function findbuAcc({ buId }) {
  return request.get(toUrl(buAcc, { buId }));
}

// ????????????
export async function findButemplates(params) {
  return request.get(toQs(butemplates, params));
}

// BU??????
export async function activeBu(ids) {
  return request.patch(toUrl(buActive, { ids: ids.join(',') }));
}

// offer??????????????????
export async function offerApplyRq(params) {
  return request.put(offerApply, {
    body: params,
  });
}

// ???????????????
export async function updateHangupAndClose(ids, status) {
  return request.patch(
    toUrl(hangupAndClose, {
      ids: ids.join(','),
      status,
    })
  );
}

// ?????????????????????
export async function buVersionSave(params) {
  return request.post(buVersion, { body: params });
}

// ?????????????????????
export async function getbuVersion(params) {
  return request.get(buVersion);
}

// ?????????????????????bu??????????????????
export async function getTreeByVersion(id) {
  return request.get(toUrl(findTreeByVersion, { id }));
}
