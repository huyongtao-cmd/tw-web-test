import { isNil, isEmpty } from 'ramda';
import update from 'immutability-helper';
import router from 'umi/router';
import { supplierSelectPaging } from '@/services/production/common/select';
import { addrListRq, companySelectRq } from '@/services/workbench/contract';
import createMessage from '@/components/core/AlertMessage';
import message from '@/components/production/layout/Message';
import { closeThenGoto } from '@/layouts/routerControl';
import { getUrl } from '@/utils/flowToRouter';
import { commonModelReducers } from '@/utils/production/modelUtils';
import { outputHandle, OutputProps } from '@/utils/production/outputUtil';
// 添加获取节点配置
import { getViewConf } from '@/services/gen/flow';
import {
  projectDetailRq,
  projectOverallRq,
  projectSaveRq,
  roleSelectRq,
  projectRoleSelectRq,
  scheduleListImportRq,
  projectFlowRq,
} from '@/services/workbench/project';

const defaultState = {
  formData: {
    projectStatus: 'CREATE',
    roleIdList: [1],
    scheduleList: [],
    scheduleNo: undefined,
    // createTime: moment().format('YYYY-MM-DD'),
  },
  permissionCode: '',
  pageConfig: {
    pageBlockViews: [],
  },
  formMode: 'EDIT',
  currentNode: 'noNode',
  projectTemplateList: [],
  supplierOptions: [],
  projectRoleOptions: [],
  flowForm: {
    remark: undefined,
    dirty: false,
  },
  fieldsConfig: {
    buttons: [],
    panels: {},
  },
};
export default {
  namespace: 'projectMgmtListEdit',

  state: defaultState,

  effects: {
    *fetchConfig({ payload }, { call, put }) {
      const { status, response } = yield call(getViewConf, payload);
      if (status === 200) {
        const { taskKey } = response;
        let formMode;
        let currentNode;
        if (taskKey === 'PRO_P02_01_SUBMIT_i') {
          formMode = 'EDIT';
          currentNode = 'create';
        } else {
          formMode = 'DESCRIPTION';
          currentNode = 'check';
        }
        yield put({
          type: 'updateState',
          payload: {
            formMode,
            currentNode,
            fieldsConfig: response || {},
            flowForm: {
              remark: undefined,
              dirty: false,
            },
          },
        });
      }
    },
    *upload({ payload }, { call, put, select }) {
      const response = yield outputHandle(scheduleListImportRq, payload);
      if (response.ok && response.data.length > 0) {
        createMessage({ type: 'success', description: '上传成功' });
        return response;
      }
      return {};
      // if (status === 100) {
      //   // 主动取消请求
      //   return {};
      // }
      // if (status === 200) {
      //   if (!response.ok) {
      //     return response;
      //   }
      //   createMessage({ type: 'success', description: '上传成功' });
      //   return response;
      // }
      // return {};
    },
    //获取项目角色下拉
    *projectRoleSelect({ payload }, { put, select }) {
      const output = yield outputHandle(projectRoleSelectRq);
      const projectRoleOptions = output.data.map(item => ({
        ...item,
        // id: item.id,
        value: item.id,
        title: item.roleName,
      }));

      yield put({
        type: 'updateState',
        payload: {
          projectRoleOptions,
        },
      });
    },
    //获取供应商选项
    *getSupplierOptions({ payload }, { put, select }) {
      const output = yield outputHandle(supplierSelectPaging, { limit: 0 });
      const supplierOptions = output.data.rows.map(item => ({
        ...item,
        id: item.id,
        value: item.supplierNo,
        title: `${item.supplierNo}-${item.supplierName}`,
      }));

      yield put({
        type: 'updateState',
        payload: {
          supplierOptions,
        },
      });
    },
    //公司下拉查询
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
    //地址簿下拉查询
    *quertAddrList({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(addrListRq, payload);
      const list = data.rows.map(item => ({
        ...item,
        id: item.abNo,
        title: item.abName,
        value: item.abNo,
      }));
      yield put({
        type: 'updateState',
        payload: {
          addrList: list,
        },
      });
    },
    //查询详情
    *queryDetails({ payload }, { call, put, select }) {
      const { data } = yield outputHandle(projectDetailRq, payload);
      const { roleCodesDesc } = data;
      yield put({
        type: 'updateForm',
        payload: {
          ...data,
          roleCodeListDesc: roleCodesDesc,
        },
      });
    },

    *projectManagementEdit({ payload }, { call, put, select }) {
      const { taskId } = yield select(({ projectMgmtListEdit }) => ({
        ...projectMgmtListEdit,
      }));
      const { ...params } = payload;
      const { submit, procRemark } = params;
      // params.projectStatus === 'CREATE' && delete params.projectStatus;
      // taskId && (params.taskId = taskId)
      taskId && (params.result = 'APPROVED'); //推流程必填
      taskId && (params.procRemark = procRemark);
      let response;
      if (params.id) {
        //修改
        response = yield outputHandle(projectOverallRq, params);
      } else {
        //新增
        response = yield outputHandle(projectSaveRq, params);
      }
      message({ type: 'success' });
      // closeThenGoto(`/workTable/projectMgmt/projectMgmtList?refresh=${moment().valueOf()}`);
      if (submit) {
        const url = getUrl().replace('edit', 'view');
        closeThenGoto(url);
      } else {
        router.push(
          `/workTable/projectMgmt/projectMgmtList/projectApplyDisplay?id=${
            response.data.id
          }&mode=DESCRIPTION`
        );
      }
      return response.data;
    },
  },

  reducers: {
    ...commonModelReducers(defaultState),

    updateFormForEditTable(state, { payload }) {
      const { formData } = state;
      const name = Object.keys(payload)[0];
      const element = payload[name];
      let newFormData;
      if (Array.isArray(element) && name === 'scheduleList') {
        element.forEach((ele, index) => {
          if (!isNil(ele)) {
            newFormData = update(formData, { [name]: { [index]: { $merge: ele } } });
          }
        });
      } else {
        newFormData = { ...formData, ...payload };
      }

      return {
        ...state,
        formData: newFormData,
      };
    },

    updateFlowForm(state, { payload }) {
      const { flowForm } = state;
      const newFlowForm = { ...flowForm, ...payload };
      return {
        ...state,
        flowForm: newFlowForm,
      };
    },
  },
};
