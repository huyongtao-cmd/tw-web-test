// 框架类
import { isEmpty } from 'ramda';
import moment from 'moment';

// 产品化组件
import createMessage from '@/components/core/AlertMessage';
import { closeThenGoto } from '@/layouts/routerControl';
import { strToHump } from '@/utils/stringUtils';

// 接口
import { rppConfigEditRq, selectListRq, rppConfigViewRq } from '../services';
import { queryUdc, divisionBuList } from '@/services/gen/app';

const listAddValue = list => list.map(v => ({ ...v, changeName: strToHump(v.code) }));

export default {
  namespace: 'resPlanConfigEdit',
  state: {
    divisionBuList: [],
    // ============================公共部分，form托管部分,其余状态都由state托管=================
    formData: {
      allBu: false,
      notOpen: false,
      bu: [],
      // buSelect:{},
      id: null,
      configNo: null,
      configName: null,
      referringHistoricalResuites: null, // 给后端时间+姓名+Id
      referringHistoricalResuitesName: null,
      referringHistoricalResuitesNo: null,
      // 资源需求整合参数-数据源
      dataSource: {
        projectForecast: {
          value01: 'N',
          value02: null,
        },
        businessOpportunityStageProjectForecast: {
          value01: 'N',
          value02: null,
        },
        presalesResourceForecast: {
          value01: 'N',
          value02: null,
        },
      },
      // 资源需求整合参数-项目大类
      projectType: {
        externalProject: {
          value01: 'N',
          value02: null,
        },
        internalProject: {
          value01: 'N',
          value02: null,
        },
      },
      // 资源需求整合参数-成单日期在过去日
      orderDateRefer: {
        ignone: {
          value01: 'N',
          value02: null,
        },
        // reference: {
        //   value01: 'N',
        //   value02: null,
        // },
        currentDay: {
          value01: 'N',
          value02: null,
        },
        startTime: {
          value01: 'N',
          value02: null,
        },
      },
      // 资源计划整合参数-计算类别
      computingCategory: {
        ignoreArea: {
          value01: 'N',
          value02: null,
        },
        accordingArea: {
          value01: 'N',
          value02: null,
        },
      },
      // 资源计划整合参数-指定资源
      designatedResource: {
        reference: {
          value01: 'N',
          value02: null,
        },
        ignore: {
          value01: 'N',
          value02: null,
        },
      },
    },
    // ============================资源需求整合参数===============
    // 商机销售阶段权重
    opportunitySalesStageWeight: {
      ignone: {
        value01: 'N',
        value02: null,
      },
    },
    // 商机销售阶段权重列表
    oppoSalesWeightList: [],
    // 商机成单概率权重
    businessOpportunitySingleProbabilityWeight: {
      ignone: {
        value01: 'N',
        value02: null,
      },
    },
    // 商机成单概率权重列表
    oppounitySingleList: [],
    // 供需时间段
    supplyRequirementPeriod: {
      nextEightWeek: {
        value01: 'N',
        value02: null,
      },
      nextTwelveWeek: {
        value01: 'N',
        value02: null,
      },
      nextTwentySixWeek: {
        value01: 'N',
        value02: null,
      },
      other: {
        value01: 'N',
        value02: null,
      },
    },
    // 供需时限开始时间
    supplyRequirementStartTime: {
      currentWeek: {
        value01: 'Y',
        value02: '2020--02-03',
      },
      specifyTime: {
        value01: 'N',
        value02: null,
      },
    },
    // 基于商机成单日期的提前周数
    orderDateAdvanceWeek: {
      week: {
        value01: null,
        value02: null,
      },
    },
    // 参照历史需求/供给结果列表
    selectList: [],
    // ============================资源供给整合参数===============
    // 资源类型一
    resourceType01List: [],
    resourceType01: {
      all: {
        value01: 'N',
        value02: null,
      },
    },
    // 资源类型二
    resourceType02List: [],
    resourceType02: {
      all: {
        value01: 'N',
        value02: null,
      },
    },
    // 资源状态
    resStatusList: [],
    resStatus: {
      all: {
        value01: 'N',
        value02: null,
      },
    },
    // 招聘计划
    recruitmentPlan: {
      referenceRecruitmentPlan: {
        value01: 'N',
        value02: null,
      },
      recruitmentPlanSupplyWeight: {
        value01: 0,
        value02: null,
      },
    },
    // 入职预定供给权重
    entrySupplyWeight: {
      week: {
        value01: 0,
        value02: null,
      },
    },
    // ============================资源计划整合参数===============
    // 能力级别兼容
    competenceLevelCompatibility: {
      mustMatch: {
        value01: 'N',
        value02: null,
      },
      canCompatible: {
        value01: 0,
        value02: 0,
      },
    },
  },

  effects: {
    *save({ payload }, { call, put }) {
      const { status, response } = yield call(rppConfigEditRq, payload);
      if (status === 200) {
        if (response && response.ok) {
          createMessage({ type: 'success', description: '提交成功' });
          closeThenGoto(`/hr/resPlan/resPlanConfig?refresh=${moment().valueOf()}`);
        } else {
          const message = response.reason || '提交失败';
          createMessage({ type: 'warn', description: message });
        }
      }
    },
    // 资源供给-资源状态
    *getResStatusList({ payload }, { call, put }) {
      const { status, response } = yield call(queryUdc, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            resStatusList: Array.isArray(response)
              ? response
                  .map((v, i) => ({ ...v, sort: i + 1, changeName: strToHump(v.code) }))
                  .map(v => ({ ...v, [strToHump(v.code)]: { value01: 'N', value02: null } }))
              : [],
          },
        });
      }
    },
    // 资源供给-资源类型二
    *getResourceType02List({ payload }, { call, put }) {
      const { status, response } = yield call(queryUdc, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            resourceType02List: Array.isArray(response)
              ? response
                  .map((v, i) => ({ ...v, sort: i + 1, changeName: strToHump(v.code) }))
                  .map(v => ({ ...v, [strToHump(v.code)]: { value01: 'N', value02: null } }))
              : [],
          },
        });
      }
    },
    // 资源供给-资源类型一
    *getResourceType01List({ payload }, { call, put }) {
      const { status, response } = yield call(queryUdc, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            resourceType01List: Array.isArray(response)
              ? response
                  .map((v, i) => ({ ...v, sort: i + 1, changeName: strToHump(v.code) }))
                  .map(v => ({ ...v, [strToHump(v.code)]: { value01: 'N', value02: null } }))
              : [],
          },
        });
      }
    },
    // 资源供给-商机销售阶段权重列表
    *getOppoSalesWeight({ payload }, { call, put }) {
      const { status, response } = yield call(queryUdc, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            oppoSalesWeightList: Array.isArray(response)
              ? response
                  .map((v, i) => ({ ...v, sort: i + 1, changeName: strToHump(v.code) }))
                  .map(v => ({ ...v, [strToHump(v.code)]: { value01: v.changeName, value02: 0 } }))
              : [],
          },
        });
      }
    },
    // 资源供给-参照历史需求/供给结果列表
    *getOppoSinglePro({ payload }, { call, put }) {
      const { status, response } = yield call(queryUdc, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            oppounitySingleList: Array.isArray(response)
              ? response
                  .map((v, i) => ({ ...v, sort: i + 1, changeName: strToHump(v.code) }))
                  .map(v => ({ ...v, [strToHump(v.code)]: { value01: v.changeName, value02: 0 } }))
              : [],
          },
        });
      }
    },
    // 参照历史需求/供给结果
    *getSelectList({ payload }, { call, put }) {
      const { status, response } = yield call(selectListRq, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            selectList: Array.isArray(response?.data) ? response?.data : [],
          },
        });
      }
    },

    // 事业部下拉
    *divisionBuList({ payload }, { call, put }) {
      const { status, response } = yield call(divisionBuList, payload);
      if (status === 200) {
        yield put({
          type: 'updateState',
          payload: {
            divisionBuList: Array.isArray(response) ? response : [],
          },
        });
      }
    },

    *getDetails({ payload }, { call, put, select }) {
      const { status, response } = yield call(rppConfigViewRq, payload);
      if (status === 200 && response.ok) {
        const { data = {} } = response;
        if (data && !isEmpty(data)) {
          const { integration = {}, requirement = {}, supply = {}, bSelect = {}, ...rest } = data;

          const {
            competenceLevelCompatibility = {},
            computingCategory = {},
            designatedResource = {},
          } = integration;
          const {
            businessOpportunitySingleProbabilityWeight = {},
            dataSource = {},
            opportunitySalesStageWeight = {},
            orderDateAdvanceWeek = {},
            orderDateRefer = {},
            projectType = {},
            supplyRequirementPeriod = {},
            supplyRequirementStartTime = {},
          } = requirement;

          const {
            entrySupplyWeight = {},
            recruitmentPlan = {},
            resStatus = {},
            resourceType01 = {},
            resourceType02 = {},
          } = supply;

          const { buSelect } = bSelect;
          const buIds = [];
          [
            Object.keys(buSelect).forEach(key => {
              if (key !== 'all') {
                buIds.push({ key: buSelect[key]?.value02 });
              }
            }),
          ];

          yield put({
            type: 'updateForm',
            payload: {
              ...rest,
              dataSource,
              orderDateRefer,
              projectType,
              computingCategory,
              designatedResource,
              allBu: bSelect.buSelect.all?.value01 === 'Y',
              notOpen: bSelect.openSelect.notOpen?.value01 === 'Y',
              bu: buIds,
            },
          });
          yield put({
            type: 'updateState',
            payload: {
              opportunitySalesStageWeight,
              businessOpportunitySingleProbabilityWeight,
              supplyRequirementPeriod,
              supplyRequirementStartTime,
              orderDateAdvanceWeek,
              resourceType01,
              resourceType02,
              resStatus,
              recruitmentPlan,
              entrySupplyWeight,
              competenceLevelCompatibility,
            },
          });

          // 处理数据回写
          const {
            resourceType01List,
            resourceType02List,
            resStatusList,
            oppoSalesWeightList,
            oppounitySingleList,
          } = yield select(({ resPlanConfigEdit }) => resPlanConfigEdit);
          yield put({
            type: 'updateState',
            payload: {
              resourceType01List: resourceType01List.map(v => ({
                ...v,
                [v.changeName]: {
                  ...v[v.changeName],
                  ...resourceType01[v.changeName],
                },
              })),
              resourceType02List: resourceType02List.map(v => ({
                ...v,
                [v.changeName]: {
                  ...v[v.changeName],
                  ...resourceType02[v.changeName],
                },
              })),
              resStatusList: resStatusList.map(v => ({
                ...v,
                [v.changeName]: {
                  ...v[v.changeName],
                  ...resStatus[v.changeName],
                },
              })),
              oppoSalesWeightList: oppoSalesWeightList.map(v => ({
                ...v,
                [v.changeName]: {
                  ...v[v.changeName],
                  ...opportunitySalesStageWeight[v.changeName],
                },
              })),
              oppounitySingleList: oppounitySingleList.map(v => ({
                ...v,
                [v.changeName]: {
                  ...v[v.changeName],
                  ...businessOpportunitySingleProbabilityWeight[v.changeName],
                },
              })),
            },
          });

          return response;
        }
        const message = response.reason || '获取详细信息失败';
        createMessage({ type: 'warn', description: message });
        return response;
      }
      const message = response.reason || '获取详细信息失败';
      createMessage({ type: 'warn', description: message });
      return response;
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
    clearForm(state, { payload }) {
      return {
        ...state,
        formData: {},
      };
    },
  },
};
