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
import ContractDetail from './component/ContractDetail';
import { getContractFlowNo } from '@/pages/sale/purchaseContract/constConfig';
import { pushFlowTask } from '@/services/gen/flow';
import { getUrl } from '@/utils/flowToRouter';

const tabConf = [
  {
    key: 'contract',
    tab: '合同催款单',
  },
];

const DOMAIN = 'promptFlow';

@connect(({ loading, promptFlow, user }) => ({
  loading,
  promptFlow,
  user,
}))
// @mountToTab()
class PromptFlow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      operationkey: 'contract',
    };
  }

  componentDidMount() {
    const { dispatch, user } = this.props;
    const { id, pageMode, taskId } = fromQs();
    // dispatch({ type: `${DOMAIN}/queryNoticeLength`, payload: { key: 'MAX_RECV_DT_DELAYDAYS' } })
    dispatch({
      type: `${DOMAIN}/queryDetail`,
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
      promptFlow: { detailData, flowForm, fieldsConfig, form },
    } = this.props;
    const contentList = {
      contract: <ContractDetail onRef={this.onRef} />,
    };
    const param = fromQs();
    const { taskId, id } = param;
    return (
      <PageHeaderWrapper>
        <Spin spinning={loading.effects[`${DOMAIN}/queryDetail`] || false}>
          <BpmWrapper
            fieldsConfig={fieldsConfig}
            flowForm={flowForm}
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
              if (key === 'REJECTED') {
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

              if (key === 'APPROVED' || key === 'APPLIED') {
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
              return Promise.resolve(false);
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
            </Card>
            {!taskId && (
              <BpmConnection
                source={[
                  {
                    docId: id,
                    procDefKey: 'ACC_A115',
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

export default PromptFlow;
