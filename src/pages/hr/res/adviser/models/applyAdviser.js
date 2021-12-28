import { isNil } from 'ramda';
import moment from 'moment';
import createMessage from '@/components/core/AlertMessage';
import { closeThenGoto } from '@/layouts/routerControl';
import { createOpporPartner } from '@/services/sale/opporPartner/opporPartner';
import { selectCapasetLevel, selectUsersWithBu } from '@/services/gen/list';
import { selectPreSaleTask, selectProject } from '@/services/user/expense/expense';
import { createAdviser } from '@/services/hr/profile/adviser';
import { findOpposNoP } from '@/services/user/management/opportunity';

const reportedDate = moment().format('YYYY-MM-DD HH:mm:ss');
export default {
  namespace: 'applyAdviser',
  state: {
    formData: {
      reportedDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
    abilityList: [],
    projectList: [],
    preSaleTaskList: [],
  },

  effects: {
    *queryReason({ payload }, { call, put }) {
      const { response: projectList } = yield call(selectProject, payload);
      yield put({
        type: 'updateState',
        payload: {
          projectList,
        },
      });
      // if (status === 200) {
      //   const { submitted } = payload;
      //   if (response && response.ok) {
      //     createMessage({ type: 'success', description: submitted ? '提交成功' : '保存成功' });
      //     closeThenGoto(`/user/flow/process`);
      //   } else {
      //     const message = response.reason || (submitted ? '提交失败' : '保存失败');
      //     createMessage({ type: 'warn', description: message });
      //   }
      // }
    },
    *queryOppos({ payload }, { call, put }) {
      const {
        response: { datum: preSaleTaskList },
      } = yield call(findOpposNoP);
      yield put({
        type: 'updateState',
        payload: {
          preSaleTaskList,
        },
      });
    },

    *create({ payload }, { call, put, select }) {
      const { formData } = yield select(({ applyAdviser }) => applyAdviser);
      const data = {
        ...payload,
        applyDate: reportedDate,
        isUpdateResume: 1,
        isUpdateOrder: 1,
      };
      // delete data.resume;
      // delete data.workOrder;
      const { status, response } = yield call(createAdviser, data);
      if (status === 200) {
        const { submitted } = payload;
        if (response && response.ok) {
          createMessage({ type: 'success', description: submitted ? '提交成功' : '保存成功' });
          closeThenGoto(`/user/flow/process`);
        } else {
          const message = response.reason || (submitted ? '提交失败' : '保存失败');
          createMessage({ type: 'warn', description: message });
        }
      }
    },

    //获取符合能力列表数据
    *fetchSelectCapasetLevel({ payload }, { call, put, select }) {
      const { response, status } = yield call(selectCapasetLevel);
      const obj = {};
      const arr1 = response.reduce((item, next) => {
        obj[next.id] ? '' : (obj[next.id] = true && item.push(next));
        return item;
      }, []);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            abilityList: Array.isArray(arr1) ? arr1 : [],
          },
        });
      }
    },
  },

  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    updateForm(state, { payload }) {
      const { formData } = state;
      const newFormData = { ...formData, ...payload };
      return {
        ...state,
        formData: newFormData,
      };
    },
  },
};
