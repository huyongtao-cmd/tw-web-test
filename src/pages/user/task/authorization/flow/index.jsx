import React, { Component } from 'react';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { Card, Button, Spin, Form, Modal, Input } from 'antd';
import { connect } from 'dva';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/stringUtils';
import { createConfirm } from '@/components/core/Confirm';
import ContractDetail from './indexc';
import { getContractFlowNo } from '@/pages/sale/purchaseContract/constConfig';
import { pushFlowTask } from '@/services/gen/flow';
import { getUrl } from '@/utils/flowToRouter';

const tabConf = [
  {
    key: 'contract',
    tab: '任务包授权',
  },
];

const DOMAIN = 'authonzationFlow';

@connect(({ loading, authonzationFlow, user }) => ({
  loading,
  authonzationFlow,
  user,
}))
// @mountToTab()
class AdviserDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      operationkey: 'contract',
    };
  }

  componentDidMount() {
    const { dispatch, user } = this.props;
    const { id, pageMode, taskId } = fromQs();
    const currentUserId = user.user.extInfo.userId;
    // if (id) {
    //   dispatch({
    //     type: `${DOMAIN}/queryById`,
    //     payload: id,
    //   })
    //   // .then(data => {
    //   //   this.handleChangeReasonId({ id: data.reasonId });
    //   // });
    // }
    taskId && dispatch({ type: `${DOMAIN}/fetchConfig`, payload: taskId });
    // taskId
    //   ? dispatch({
    //       type: `${DOMAIN}/fetchConfig`,
    //       payload: taskId,
    //     })
    //   : dispatch({
    //       type: `${DOMAIN}/updateState`,
    //       payload: {
    //         fieldsConfig: {},
    //       },
    //     });
  }

  onRef = ref => {
    this.detail = ref;
  };

  onOperationTabChange = key => {
    this.setState({
      operationkey: key,
    });
  };

  render() {
    const { operationkey } = this.state;
    const {
      loading,
      dispatch,
      authonzationFlow: { detailData, flowForm, fieldsConfig, form },
    } = this.props;
    const contentList = {
      contract: <ContractDetail onRef={this.onRef} />,
    };
    // const { taskKey } = fieldsConfig;
    const param = fromQs();
    const { taskId, id } = param;
    // 获取流程Key
    const { purchaseType, businessType } = detailData;
    const procDefKeys = getContractFlowNo(purchaseType, businessType);
    // console.log(this.detail,'90909090909');
    return (
      <PageHeaderWrapper>
        <Spin spinning={loading.effects[`${DOMAIN}/queryDetail`] || false}>
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

              if (key === 'FLOW_COMMIT') {
                this.detail.handleSave({
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
              return Promise.resolve(true);
            }}
          >
            <Card
              className="tw-card-multiTab"
              bordered={false}
              activeTabKey={operationkey}
              tabList={tabConf}
              onTabChange={this.onOperationTabChange}
            >
              {contentList[operationkey]}
              {/* <ContractDetail onRef={this.onRef}/> */}
            </Card>
            {!taskId &&
              procDefKeys && (
                <BpmConnection
                  source={[
                    {
                      docId: id,
                      procDefKey: 'TSK_P13',
                    },
                  ]}
                />
              )}
          </BpmWrapper>
        </Spin>
      </PageHeaderWrapper>
    );
  }
}

export default AdviserDetail;
