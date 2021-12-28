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
    tab: '独立顾问派工单',
  },
];

const DOMAIN = 'adviserFlow';

@connect(({ loading, adviserFlow, user }) => ({
  loading,
  adviserFlow,
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
    // dispatch({
    //   type: `${DOMAIN}/clearDetailData`,
    // });
    dispatch({
      type: `${DOMAIN}/queryDetail`,
      payload: {
        id,
      },
    });
    // if (id) {
    //  if (pageMode === 'change') {
    //      dispatch({
    //       type: `${DOMAIN}/queryChangeDetailByChangeId`,
    //       payload: id,
    //     });
    //   } else if (pageMode === 'purchase') {
    //     dispatch({
    //       type: `${DOMAIN}/queryDetail`,
    //       payload: id,
    //     });
    //   } else if (pageMode === 'over') {
    //     dispatch({
    //       type: `${DOMAIN}/queryOverDetailByOverId`,
    //       payload: id,
    //     });
    //   }
    // }
    taskId && dispatch({ type: `${DOMAIN}/fetchConfig`, payload: taskId });
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
      adviserFlow: { detailData, flowForm, fieldsConfig, form },
    } = this.props;
    const contentList = {
      contract: <ContractDetail onRef={this.onRef} />,
    };
    // const { taskKey } = fieldsConfig;
    const param = fromQs();
    const { taskId, id } = param;
    // let procDefKeys = detailData.purchaseType === 'CONTRACT' ? 'TSK_S06' : 'TSK_S07';
    // switch (detailData.businessType) {
    //   case 'RENT': {
    //     // 房屋租赁

    //     procDefKeys = 'TSK_S12';
    //     break;
    //   }
    //   case 'SUNDRY': {
    //     // 杂项采购

    //     procDefKeys = 'TSK_S13';
    //     break;
    //   }

    //   default:
    //     break;
    // }
    // 获取流程Key
    const { purchaseType, businessType } = detailData;
    const procDefKeys = getContractFlowNo(purchaseType, businessType);

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

              if (key === 'FLOW_PASS' || key === 'FLOW_COMMIT') {
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
                return Promise.resolve(true);
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
            {!taskId &&
              procDefKeys && (
                <BpmConnection
                  source={[
                    {
                      docId: id,
                      procDefKey: procDefKeys,
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
