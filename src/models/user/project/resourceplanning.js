/* eslint-disable prefer-const */
/* eslint-disable no-shadow */
/* eslint-disable no-else-return */
import router from 'umi/router';
import { pickAll, omit } from 'ramda';
import { closeThenGoto } from '@/layouts/routerControl';
import { Modal } from 'antd';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
import {
  findProjectResPlanningBy,
  findProjectresourcePlanningBy,
  resourcePlanningFn,
  resourceDetailFn,
  resHiddenroleFn,
  resourceModifyFn,
  resPlandetailFn,
  createResPlanningHistory,
  findProjectShListByProjId,
  businessResPlanningDetailUri,
  getRatioByResId,
  getRatioByLevelId,
  getSysAltResPlanning,
  sysAltResPlanningSubmit,
  queryResCapaSet,
} from '@/services/user/project/project';
import { selectCapasetLevel, selectUsersWithBu } from '@/services/gen/list';
import { getViewConf } from '@/services/gen/flow';

import createMessage from '@/components/core/AlertMessage';
import { genFakeId } from '@/utils/mathUtils';

const defaultFormData = {
  id: null,
  projId: null, // 项目id
  planTypeDesc: null, // 计划类型
  objName: null, // 计划对象
  startDate: null, // 开始周
  durationWeek: undefined, // 持续周数
  salePhase: null, // 销售阶段
  probability: null, // 承担概率
  remark: null, // 备注
};

export default {
  namespace: 'userResourcePlanning',

  state: {
    formData: {
      ...defaultFormData,
    },
    dataSource: [],

    dataList: [],

    abilityList: [],
    selectSorceList: [],

    importStatus: false,
    weekDate: undefined,
    initialDate: undefined,
    isHiddenFlag: 0,
    // 添加state
    flowForm: {
      remark: undefined,
      dirty: false,
    },
    fieldsConfig: {
      buttons: [],
      panels: {},
    },
    objId: undefined,
    planType: undefined,
  },

  effects: {
    // eslint-disable-next-line consistent-return
    *getRatioByLevelId({ payload }, { call, put }) {
      const { status, response } = yield call(getRatioByLevelId, payload);
      if (status === 200) {
        if (response) {
          return response;
        }
      }
    },

    // eslint-disable-next-line consistent-return
    *getRatioByResId({ payload }, { call, put }) {
      const { status, response } = yield call(getRatioByResId, payload);
      if (status === 200) {
        if (response) {
          return response;
        }
      }
    },
    // eslint-disable-next-line consistent-return
    *getRescapByResId({ payload }, { call, put }) {
      const { status, response } = yield call(queryResCapaSet, payload);
      if (status === 200) {
        if (response) {
          return response;
        }
      }
    },
    // 资源规划
    *query({ payload }, { call, put }) {
      const { status, response } = yield call(findProjectresourcePlanningBy, {
        planType: payload.planType, // 计划类型此处默认为“2”，表示“项目”
        objid: payload.objid,
        hiddenFlag: payload.hiddenFlag || 0,
      });
      if (status === 200) {
        if (response.ok) {
          yield put({
            type: 'updateState',
            payload: {
              formData: (response.datum || {}).planningTitle,
              dataSource: Array.isArray((response.datum || {}).details)
                ? (response.datum || {}).details
                : [],
              weekDate: (response.datum || {}).planningTitle.durationWeek,
              initialDate: (response.datum || {}).planningTitle.startDate,
              isHiddenFlag: payload.hiddenFlag || 0,
            },
          });
          return (response.datum || {}).planningTitle;
        }
        createMessage({ type: 'error', description: response.reason || '获取资源规划详情失败' });
        return null;
      }
      createMessage({ type: 'error', description: response.reason || '获取资源规划详情失败' });
      return null;
    },
    // 保存资源规划
    *save(payload, { call, select, put }) {
      const { objid, formData } = payload.payload;
      const { response } = yield call(resourcePlanningFn, {
        projId: objid,
        planningTitle: { ...omit(['probabilityDesc'], formData) },
      });
      return response;
    },

    // 保存资源规划明细
    *detailSave(payload, { call, select, put }) {
      const { dataSource, formData } = yield select(
        ({ userResourcePlanning }) => userResourcePlanning
      );
      const newDataSource = dataSource.map(item => {
        const { startDate, endDate, distributeRate } = item;
        let start;
        let end;
        let $distributeRate = distributeRate;
        if (startDate && typeof startDate !== 'string') {
          start = startDate.format('YYYY-MM-DD');
        } else {
          start = startDate;
        }
        if (endDate && typeof endDate !== 'string') {
          end = endDate.format('YYYY-MM-DD');
        } else {
          end = endDate;
        }

        if (distributeRate && typeof distributeRate !== 'string') {
          $distributeRate = distributeRate + '';
        }

        return {
          ...item,
          startDate: start,
          endDate: end,
          distributeRate: $distributeRate,
        };
      });
      // return;
      // 入职日期
      if (formData.startDate && typeof formData.startDate !== 'string') {
        formData.startDate = formData.startDate.format('YYYY-MM-DD');
      }
      // 保存接口
      const { status, response } = yield call(resourceDetailFn, {
        projId: payload.projId,
        planningTitle: { ...formData },
        details: newDataSource,
      });
      const { objid, planType } = payload.payload;
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response && response.ok) {
        createMessage({ type: 'success', description: '保存成功' });
        // closeThenGoto(`/sale/management/opps?_refresh=0`);
        yield put({
          type: 'query',
          payload: { objid, planType },
        });
      } else {
        createMessage({ type: 'error', description: response.reason || '保存失败' });
      }
      // eslint-disable-next-line
      return response;
    },

    // 隐藏/不隐藏
    *resHiddenrole(payload, { call, select, put }) {
      const {
        payload: { roleIds, hiddenFlag },
      } = payload;
      const response = yield call(resHiddenroleFn, roleIds, {
        hiddenFlag,
      });
    },

    // 修改资源规划一条数据
    *resPlandetail(payload, { call, select, put }) {
      const {
        payload: { planType, formData },
      } = payload;
      const response = yield call(resPlandetailFn, {
        details: [planType],
        planningTitle: { ...formData },
      });
    },

    // 保存资源规划历史版本
    *saveHistory({ payload }, { call, select, put }) {
      const { id, versionNo, changeReason } = payload;
      let flag = true;
      const { status, response } = yield call(createResPlanningHistory, {
        id,
        versionNo,
        changeReason,
      });
      if (status === 100) {
        // 主动取消请求
        return false;
      }
      if (response && response.ok) {
        createMessage({ type: 'success', description: '保存成功' });
      } else {
        flag = false;
        createMessage({ type: 'error', description: response.reason || '保存失败' });
      }
      return flag;
    },
    // 修改form表单字段内容，将数据保存到state
    *updateForm({ payload }, { put, select }) {
      const { key, value } = payload;
      const { formData } = yield select(({ userResourcePlanning }) => userResourcePlanning);
      const newFormData = Object.assign({}, formData);
      newFormData[key] = value;
      yield put({
        type: 'updateState',
        payload: { formData: newFormData },
      });
    },

    //  请求项目成员接口
    *projectShList({ payload }, { call, put, select }) {
      const { dataSource, formData } = yield select(
        ({ userResourcePlanning }) => userResourcePlanning
      );
      const { durationWeek } = formData;
      const { response } = yield call(findProjectShListByProjId, payload);
      if (response) {
        const rows = Array.isArray(response.datum)
          ? response.datum.filter(v => v.resName !== null)
          : [];
        const $rows = rows.map(item => {
          // eslint-disable-next-line
          item.distributeRate = '0';
          // eslint-disable-next-line
          item.endDate = item.planEndDate;
          // eslint-disable-next-line
          item.startDate = item.planStartDate;
          // eslint-disable-next-line
          item.id = genFakeId(-1) + '';
          // eslint-disable-next-line
          item.totalEqva = '0';
          // eslint-disable-next-line
          item.totalDays = '0';
          const yearWeek = [];

          if (durationWeek !== '' && durationWeek !== undefined) {
            for (let i = 0; i < Number(durationWeek); i += 1) {
              yearWeek.push(`yearWeek_${i}`);
              Object.assign(item, { [`yearWeek_${i}`]: 0 });
            }
          }

          const $item = pickAll(
            [
              'distributeRate',
              'endDate',
              'startDate',
              'id',
              'totalDays',
              'totalEqva',
              'capasetLevelId',
              'resId',
              'resName',
              'role',
              ...yearWeek,
            ],
            item
          );
          return { ...$item };
        });

        yield put({
          type: 'updateState',
          payload: {
            dataSource: dataSource.concat($rows),
            importStatus: true,
          },
        });
      }

      return response;
    },

    //  获取符合能力列表数据
    *fetchSelectCapasetLevel({ payload }, { call, put, select }) {
      const { response, status } = yield call(selectCapasetLevel);
      let obj = {};
      let arr1 = response.reduce((item, next) => {
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
    //  获取资源下拉列表
    *fetchSourceSelectList({ payload }, { call, put, select }) {
      const { response, status } = yield call(selectUsersWithBu);

      if (status === 200) {
        // response.forEach(item => {
        //   // eslint-disable-next-line
        //   item.key = item.id;
        //   // eslint-disable-next-line
        //   item.code = item.code;
        // });
        yield put({
          type: 'updateState',
          payload: {
            selectSorceList: Array.isArray(response) ? response : [],
          },
        });
      }
    },
    // 从商机导入（项目）
    *getBusinessData({ payload }, { call, put }) {
      const { status, response } = yield call(businessResPlanningDetailUri, payload);
      if (status === 100) {
        return {};
      }
      if (status === 200) {
        if (response) {
          return response;
        }
      }
      return {};
    },

    // 根据主键查询资源规划更新
    *getSysAltResPlanningById({ payload }, { call, put }) {
      const { status, response } = yield call(getSysAltResPlanning, payload.id);
      if (status === 200) {
        if (response.ok) {
          yield put({
            type: 'updateState',
            payload: {
              objId: response.data?.refId,
              planType: response.data?.refType,
            },
          });
        }
      }
      return response;
    },
    // 资源规划更新提交
    *resPlanningSubmit({ payload }, { call, put }) {
      const { status, response } = yield call(sysAltResPlanningSubmit, payload);
      // if (status === 200) {
      //   if (response.ok) {
      //     yield put({
      //       type: 'updateState',
      //       payload: {
      //         objId: response.data?.refId,
      //         planType: response.data?.refType,
      //       },
      //     });
      //   }
      // }
      return response;
    },
    *fetchConfig({ payload }, { call, put }) {
      const { status, response } = yield call(getViewConf, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            fieldsConfig: response || {},
            flowForm: {
              remark: undefined,
              dirty: false,
            },
          },
        });
      }
    },
  },

  reducers: {
    updateState(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    // 添加reducers修改flowForm
    updateFlowForm(state, { payload }) {
      const { flowForm } = state;
      const newFlowForm = { ...flowForm, ...payload };
      return {
        ...state,
        flowForm: newFlowForm,
      };
    },
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname, search }) => {
        if (
          pathname === '/user/project/projectResPlanning' ||
          pathname === '/user/project/ResourcePlanFlow'
        ) {
          dispatch({
            type: `fetchSelectCapasetLevel`,
          });
          dispatch({
            type: `fetchSourceSelectList`,
          });
        }
      });
    },
  },
};
