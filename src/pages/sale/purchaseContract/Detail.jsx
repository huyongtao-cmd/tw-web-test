import React, { Component } from 'react';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { Card, Button, Spin, Form, Modal, Input } from 'antd';
import { connect } from 'dva';
import router from 'umi/router';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/stringUtils';
import { add as mathAdd, sub, div, mul, checkIfNumber, genFakeId } from '@/utils/mathUtils';

import ContractDetail from './component/ContractDetail';
import DocumentDetail from './component/DocumentDetail';
import SalesContractDetail from './component/SalesContractDetail';
import ProjectDetail from './component/ProjectDetail';
import { getContractFlowNo } from '@/pages/sale/purchaseContract/constConfig';

const tabConf = [
  {
    key: 'contract',
    tab: '采购合同信息',
  },
  {
    key: 'document',
    tab: '单据信息',
  },
  {
    key: 'salesContract',
    tab: '销售合同信息',
  },
  {
    key: 'project',
    tab: '项目信息',
  },
];

const contentList = {
  contract: <ContractDetail />,
  document: <DocumentDetail />,
  salesContract: <SalesContractDetail />,
  project: <ProjectDetail />,
};

const DOMAIN = 'salePurchaseDetail';

@connect(({ loading, salePurchaseDetail, user }) => ({
  loading,
  salePurchaseDetail,
  user,
}))
// @mountToTab()
class Detail extends Component {
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
    dispatch({
      type: `${DOMAIN}/clearDetailData`,
    });
    if (id) {
      if (pageMode === 'change') {
        dispatch({
          type: `${DOMAIN}/queryChangeDetailByChangeId`,
          payload: id,
        });
      } else if (pageMode === 'purchase') {
        dispatch({
          type: `${DOMAIN}/queryDetail`,
          payload: id,
        }); /*.then(res => {
          const { apprStatus, createUserId } = res;
          //驳回、撤销再次编辑
          if (
            taskId &&
            (apprStatus === 'REJECTED' || apprStatus === 'WITHDRAW') &&
            currentUserId === createUserId
          ) {
            closeThenGoto(
              `/sale/purchaseContract/Edit?id=${id}&taskId=${taskId}&remark=再次提交&mode=edit&from=task`
            );
          }
        });*/
      } else if (pageMode === 'over') {
        dispatch({
          type: `${DOMAIN}/queryOverDetailByOverId`,
          payload: id,
        });
      }
    }
    taskId && dispatch({ type: `${DOMAIN}/fetchConfig`, payload: taskId });
  }

  onOperationTabChange = key => {
    this.setState({
      operationkey: key,
    });
  };

  // 终止提交
  handleRetryCloseSubmit = (id, taskId, remark) => {
    const {
      dispatch,
      salePurchaseDetail: { detailData, closeReason },
    } = this.props;
    dispatch({
      type: `${DOMAIN}/retryCloseSubmit`,
      payload: {
        id,
        overNo: detailData.overNo,
        contractId: detailData.id,
        contractNo: detailData.contractNo,
        overWhy: closeReason,
        flow: {
          result: 'APPROVED',
          remark,
          taskId,
        },
      },
    });
  };

  render() {
    const { operationkey } = this.state;
    const {
      loading,
      salePurchaseDetail: { detailData, flowForm, fieldsConfig, form },
    } = this.props;
    const { taskKey } = fieldsConfig;
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
        <Spin
          spinning={
            loading.effects[`${DOMAIN}/queryDetail`] ||
            loading.effects[`${DOMAIN}/fetchConfig`] ||
            loading.effects[`${DOMAIN}/queryChangeDetailByChangeId`] ||
            loading.effects[`${DOMAIN}/queryOverDetailByOverId`] ||
            loading.effects[`${DOMAIN}/getPageConfig`] ||
            loading.effects[`${DOMAIN}/retryCloseSubmit`] ||
            false
          }
        >
          <BpmWrapper
            fieldsConfig={fieldsConfig}
            flowForm={flowForm}
            onBtnClick={({ operation, bpmForm }) => {
              const { remark, branch } = bpmForm;
              const { key, branches } = operation;

              if (
                taskKey === 'TSK_S06_01_PUR_CON_SUBMIT_i' ||
                taskKey === 'TSK_S07_01_PUR_CON_SUBMIT_i'
              ) {
                closeThenGoto(
                  `/sale/purchaseContract/Edit?id=${id}&taskId=${taskId}&result=${key}&remark=${remark}&mode=edit&from=task`
                );
                return Promise.resolve(false);
              }
              if (
                taskKey === 'TSK_S08_01_PUR_CON_SUBMIT_i' ||
                taskKey === 'TSK_S10_01_PUR_CON_SUBMIT_i'
              ) {
                closeThenGoto(
                  `/sale/purchaseContract/Edit?id=${id}&taskId=${taskId}&result=${key}&remark=${remark}&mode=change&from=task`
                );
                return Promise.resolve(false);
              }
              if (
                taskKey === 'TSK_S09_01_PUR_CON_SUBMIT_i' ||
                taskKey === 'TSK_S11_01_PUR_CON_SUBMIT_i'
              ) {
                this.handleRetryCloseSubmit(id, taskId, remark);
                return Promise.resolve(false);
              }
              // 当节点在创建人的时候，驳回or撤回 点击确认的时候 调整至编辑页
              if (
                taskKey === 'TSK_S12_01_SUBMIT_i' ||
                taskKey === 'TSK_S13_01_SUBMIT_i' ||
                taskKey === 'TSK_S14_01_SUBMIT_i' ||
                taskKey === 'TSK_S15_01_SUBMIT_i' ||
                taskKey === 'TSK_S16_01_SUBMIT_i' ||
                taskKey === 'TSK_S17_01_SUBMIT_i' ||
                taskKey === 'TSK_S18_01_SUBMIT_i' ||
                taskKey === 'TSK_S19_01_SUBMIT_i' ||
                taskKey === 'TSK_S20_01_SUBMIT_i' ||
                taskKey === 'TSK_S21_01_SUBMIT_i' ||
                taskKey === 'TSK_S22_01_SUBMIT_i'
              ) {
                closeThenGoto(
                  `/sale/purchaseContract/Edit?id=${id}&taskId=${taskId}&result=${key}&remark=${remark}&mode=edit&from=task`
                );
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

export default Detail;
