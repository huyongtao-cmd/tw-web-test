/* eslint-disable react/no-unused-state */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { formatMessage } from 'umi/locale';
import { Button, Card, DatePicker, Form } from 'antd';
import classnames from 'classnames';
import { isEmpty, isNil, mapObjIndexed } from 'ramda';
import { createConfirm } from '@/components/core/Confirm';
import { fromQs } from '@/utils/stringUtils';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import createMessage from '@/components/core/AlertMessage';
import moment from 'moment';
import ResourceModal from './modal/ResourceModal';
import History from './modal/History';
import HistoryModal from './modal/HistoryModal';
import ResourceListModal from './modal/ResourceListModal';
import { getUrl } from '@/utils/flowToRouter';
import { pushFlowTask } from '@/services/gen/flow';

// 编辑页tab
const editOperationTabList = [
  {
    key: 'resPlanning',
    tab: formatMessage({ id: `user.project.menuMap.resplanning`, desc: '资源规划' }),
  },
  {
    key: 'changeHistory',
    tab: formatMessage({ id: `user.project.menuMap.changehistory`, desc: '变更历史' }),
  },
];

// 保存历史版本明细初始化
const historyFormDataModel = {
  id: null,
  versionNo: null, // 版本号
  changeReason: null, // 变更原因
};

const DOMAIN = 'userResourcePlanning';
@connect(({ loading, userResourcePlanning }) => ({
  loading,
  userResourcePlanning,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const key = Object.keys(changedFields)[0];
    const value = Object.values(changedFields)[0];
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { key, value: value.value },
    });
  },
})
@mountToTab()
class ResourcePlanFlow extends PureComponent {
  state = {
    operationkey: 'resPlanning',
    historyVisible: false, // 保存历史版本管理弹框显示
    templateVisible: false, // 从模板导入弹框显示
    btnLoadingStatus: false,
    // btnHistoryLoadingStatus: false,
    editVisible: false,
    historyFormData: {
      ...historyFormDataModel,
    },
    btnDisabled: false, // 保存、保存历史版本按钮默认使用
    didMountFlag: false,
    isPastDate: true,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    this.setState({
      operationkey: 'resPlanning',
    });

    const { id, pageMode, taskId } = fromQs();
    dispatch({
      type: `${DOMAIN}/getSysAltResPlanningById`,
      payload: {
        id,
      },
    });
    taskId
      ? dispatch({
          type: `${DOMAIN}/fetchConfig`,
          payload: taskId,
        })
      : dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            fieldsConfig: {},
          },
        });
  }

  onOperationTabChange = key => {
    this.setState({
      operationkey: key,
      didMountFlag: key,
    });
    if (key === 'changeHistory') {
      // 切换到变更历史时，保存等按钮禁用
      this.setState({ btnDisabled: true });
    } else {
      this.setState({ btnDisabled: false });
    }
  };

  // 保存
  handleSave = () => {
    const {
      dispatch,
      form: { validateFieldsAndScroll },
      userResourcePlanning: { formData, dataSource, initialDate, weekDate },
    } = this.props;
    // 获取url上的参数
    const param = fromQs();
    const { startDate, ...data } = formData;
    const date = moment(startDate)
      .startOf('week')
      .format('YYYY-MM-DD');
    // 保存历史版本
    // if (param.planType === '2' && (!data.isPmoRes || !data.isAdmin)) {
    //   if (initialDate && weekDate && (initialDate !== date || weekDate !== data.durationWeek)) {
    //     this.historyToggleModal();
    //     return;
    //   }
    // }
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/save`,
          payload: { objid: param.id, formData: { startDate: date, ...data } },
        }).then(res => {
          this.ResourceModal.queryData();
          this.ResourceListModal.queryData();
          if (res.ok) {
            createMessage({ type: 'success', description: res.reason });
          } else {
            createMessage({ type: 'error', description: res.reason });
          }
        });
      }
    });
  };

  // 保存历史版本新增弹出窗。
  historyToggleModal = () => {
    const { historyVisible } = this.state;
    this.setState({
      historyVisible: !historyVisible,
      historyFormData: {
        ...historyFormDataModel,
      },
    });
  };

  // 编辑弹框
  editModeal = () => {
    const { editVisible } = this.state;
    this.setState({
      editVisible: !editVisible,
    });
  };

  // 显示隐藏过去日期
  pastTheDate = e => {
    const { isPastDate } = this.state;
    this.setState({
      isPastDate: !isPastDate,
    });
    this.ResourceModal.queryData(isPastDate);
  };

  onRef = ref => {
    this.ResourceModal = ref;
  };

  onRefList = ref => {
    this.ResourceListModal = ref;
  };

  // 保存历史版本保存按钮事件
  historySubmitModal = () => {
    const {
      dispatch,
      userResourcePlanning: { formData },
    } = this.props;
    const { historyVisible, historyFormData } = this.state;
    const param = fromQs();
    const { startDate, ...data } = formData;
    const date = moment(startDate)
      .startOf('week')
      .format('YYYY-MM-DD');

    dispatch({
      type: `${DOMAIN}/saveHistory`,
      payload: {
        id: formData.id,
        versionNo: historyFormData.versionNo,
        changeReason: historyFormData.changeReason,
      },
    }).then(reason => {
      if (!reason) {
        return;
      }
      dispatch({
        type: `${DOMAIN}/save`,
        payload: { objid: param.id, formData: { startDate: date, ...data } },
      }).then(res => {
        if (res.ok) {
          createMessage({ type: 'success', description: res.reason });
        } else {
          createMessage({ type: 'error', description: res.reason });
        }
        this.ResourceModal.queryData();
      });
      this.setState({
        historyVisible: !historyVisible,
        historyFormData,
      });
    });
  };

  submit = params => {
    const { id } = fromQs();
    const {
      dispatch,
      form: { validateFieldsAndScroll },
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/resPlanningSubmit`,
          payload: {
            ...params,
            id,
          },
        }).then(response => {
          if (response.ok) {
            createMessage({ type: 'success', description: '操作成功' });
            const url = getUrl().replace('edit', 'view');
            closeThenGoto(url);
          } else {
            createMessage({ type: 'error', description: response.errors[0].msg });
          }
        });
      }
    });
  };

  render() {
    const {
      loading,
      form,
      dispatch,
      userResourcePlanning: {
        dataSource,
        formData: { planType },
        fieldsConfig,
        flowForm,
      },
    } = this.props;
    const { id, pageMode, taskId } = fromQs();
    const { btnLoadingStatus, businessBtnIsFlag } = this.state;

    const {
      operationkey,
      historyFormData,
      historyVisible,
      templateVisible,
      btnDisabled,
      didMountFlag,
      editVisible,
      isPastDate,
    } = this.state;

    // 获取url上的参数
    const param = fromQs();
    const contentList = {
      resPlanning: (
        <ResourceModal
          didMountFlag={didMountFlag}
          form={form}
          switchWeek={event => this.setState({ weekSwitch: event })}
          onRef={this.onRef}
          editModeal={this.editModeal}
          ResourceListModal={this.ResourceListModal}
          pastTheDate={this.pastTheDate}
          pastDate={isPastDate}
        />
      ),
      changeHistory: <History form={form} />,
    };

    const submitBtn =
      loading.effects[`userResourcePlanning/query`] || loading.effects[`userResourcePlanning/save`];

    return (
      <PageHeaderWrapper>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          // buttonLoading={loading}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { taskKey } = fieldsConfig;
            const { key } = operation;
            const { branch, remark } = bpmForm;
            if (key === 'FLOW_RETURN') {
              createConfirm({
                content: '确定要拒绝该流程吗？',
                onOk: () =>
                  pushFlowTask(taskId, {
                    remark,
                    result: 'REJECTED',
                    branch,
                    taskKey,
                  }).then(({ status, response }) => {
                    if (status === 200) {
                      createMessage({ type: 'success', description: '操作成功' });
                      const url = getUrl().replace('edit', 'view');
                      closeThenGoto(url);
                    }
                    return Promise.resolve(false);
                  }),
              });
            }

            if (key === 'APPROVED') {
              this.submit({
                result: 'APPROVED',
                procTaskId: taskId,
                taskId,
                procRemark: remark,
                branch,
                submit: true,
                procTaskKey: taskKey,
                taskKey,
              });
              return Promise.resolve(false);
            }
            return Promise.resolve(false);
          }}
        >
          <Card>
            <Button
              className="tw-btn-primary"
              icon="save"
              size="large"
              onClick={this.handleSave}
              disabled={btnDisabled || submitBtn}
            >
              {formatMessage({ id: `misc.save`, desc: '保存' })}
            </Button>

            {/* <Button
              className={classnames('separate', 'tw-btn-default')}
              icon="undo"
              size="large"
              onClick={() => {
                if (param.planType === '2') {
                  closeThenGoto(`/user/project/projectDetail?id=${param.id}`);
                } else if (param.planType === '1') {
                  closeThenGoto(`/sale/management/opps`);
                }
              }}
            >
              {formatMessage({ id: `misc.rtn`, desc: '返回' })}
            </Button> */}
          </Card>
          <Card
            className="tw-card-multiTab"
            bordered={false}
            activeTabKey={operationkey}
            tabList={editOperationTabList}
            onTabChange={this.onOperationTabChange}
          >
            {contentList[operationkey]}
          </Card>
          <HistoryModal
            formData={historyFormData}
            visible={historyVisible}
            handleCancel={this.historyToggleModal}
            handleOk={this.historySubmitModal}
          />
          <ResourceListModal
            visible={editVisible}
            resourceListModal={this.editModeal}
            onRef={this.onRefList}
          />
          {!taskId && (
            <BpmConnection
              source={[
                {
                  docId: id,
                  procDefKey: 'ALT_L01',
                },
              ]}
            />
          )}
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default ResourcePlanFlow;
