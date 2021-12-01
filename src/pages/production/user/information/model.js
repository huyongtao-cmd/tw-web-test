import { informationImport } from '@/services/production/user';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { companySelectRq } from '@/services/workbench/contract';
import { commonModelReducers } from '@/utils/production/modelUtils.ts';

const defaultState = {
  formData: {},
  formMode: 'EDIT',
};
export default {
  namespace: 'information',
  state: defaultState,
  effects: {
    *upload({ payload }, { call, put, select }) {
      const { status, response } = yield call(informationImport, payload);
      if (status === 200) {
        return response;
      }
      return {};
    },
    *queryCompanyList({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(companySelectRq, payload);
      const list = data.rows.map(item => ({
        ...item,
        id: item.id,
        title: item.ouName,
        value: item.id,
      }));
      yield put({
        type: 'updateState',
        payload: {
          companyList: list,
        },
      });
    },
  },
  reducers: {
    ...commonModelReducers(defaultState),
  },
};
