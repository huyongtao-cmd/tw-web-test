/* eslint-disable array-callback-return */
/* eslint-disable prefer-const */
import React, { Component } from 'react';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { Card, Button, Spin, Form } from 'antd';
import Title from '@/components/layout/Title';
import { connect } from 'dva';
import moment from 'moment';
import math from 'mathjs';
import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/stringUtils';
import { add as mathAdd, checkIfNumber, div, mul, sub } from '@/utils/mathUtils';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { isEmpty, takeLast, add, isNil, gte, lte } from 'ramda';
import { toIsoDate } from '@/utils/timeUtils';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';

import BearDepInfo from './editModel/bearDepInfo';
import BillInfo from './editModel/billInfo';
import PrePayInfo from './editModel/payInfo';
import CashOutInfo from './editModel/cashOutInfo';

import { mountToTab, closeThenGoto } from '@/layouts/routerControl';

import { CONFIGSCENE, FLOW_NO, checkAmt, ARRY_NO, getPaymentFlowNo } from '../constConfig';

const DOMAIN = 'paymentApplyEdit';
const tabConf = [
  {
    key: 'prePayInfo',
    tab: '付款单信息',
  },
  {
    key: 'billInfo',
    tab: '单据信息',
  },
];

const contentListSelected = (form, operationKey, mode, entrance) => {
  const contentList = {
    prePayInfo: <PrePayInfo form={form} mode={mode} />,
    DEPARTMENT: <BearDepInfo form={form} mode={mode} />,
    WITHDRAW: <CashOutInfo form={form} mode={mode} />,
    billInfo: <BillInfo form={form} mode={mode} entrance={entrance} />,
  };
  return contentList[operationKey];
};
@connect(({ loading, paymentApplyEdit, dispatch, user, emergencyPayment }) => ({
  loading,
  paymentApplyEdit,
  dispatch,
  user,
  emergencyPayment,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const { name, value } = Object.values(changedFields)[0];
    if (name === 'signDate' || name === 'activateDate') {
      // antD 时间组件返回的是moment对象 转成字符串提交
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: formatDT(value) },
      });
    } else {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: value },
      });
    }
  },
})
@mountToTab()
class Edit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      operationKey: 'prePayInfo',
      loadings: false,
    };
  }

  componentDidMount() {
    const { mode, scene, docNo, id = '', status } = fromQs();
    const {
      dispatch,
      user: {
        user: {
          extInfo: { resId },
        },
      },
    } = this.props;
    // 获取自定义配置
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: `PAYMENT_APPLY_EDIT:${CONFIGSCENE[scene]}`, resId, mode },
    }).then(res => {
      dispatch({
        type: `${DOMAIN}/query`,
        payload: { resId, mode, docNo, id, scene },
      });
    });
  }

  onOperationTabChange = key => {
    this.setState({
      operationKey: key,
    });
  };

  // 保存
  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      emergencyPayment,
      dispatch,
      paymentApplyEdit,
      user: {
        user: {
          extInfo: { resId },
        },
      },
    } = this.props;
    // const { mode, scene = 10, docNo = 'PCN200615150001' } = fromQs();
    const { mode, scene, docNo, id = '', status, entrance } = fromQs();
    const { payDetailList, formData, payRecordList } = paymentApplyEdit;
    const {
      flowNo,
      remark,
      paymentNo,
      purchaseName,
      purchasePaymentName,
      purchaseInchargeResId,
    } = emergencyPayment.formData;
    let PaymentAmt = 0; // 付款记录总金额
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        if (payDetailList.length !== 0) {
          if (formData.currPaymentAmt > 0) {
            if (entrance === 'flow' && payRecordList.length === 0) {
              createMessage({ type: 'error', description: '请填写付款单记录' });
              return;
            }
            // 付款记录核销总计
            if (payRecordList.length > 0) {
              payRecordList.map(item => {
                PaymentAmt = add(PaymentAmt, item.paymentAmt);
              });
            }
            if (entrance === 'flow' && formData.currPaymentAmt !== PaymentAmt) {
              createMessage({ type: 'error', description: '付款金额应与付款记录金额不一致' });
              return;
            }
            dispatch({
              type: `${DOMAIN}/save`,
              payload: {
                scene,
              },
            }).then(resq => {
              if (resq !== '') {
                createMessage({ type: 'success', description: '保存成功' });
                if (entrance === 'flow') {
                  dispatch({
                    type: `emergencyPayment/submit`,
                    payload: {
                      applyResId: undefined,
                      flowNo,
                      paymentNo: undefined,
                      purchaseInchargeResId,
                      purchasePaymentName: purchaseName,
                      purchasePaymentNo: paymentNo,
                      remark,
                    },
                  });
                  // 获取自定义配置
                  dispatch({
                    type: `${DOMAIN}/getPageConfig`,
                    payload: { pageNo: `PAYMENT_APPLY_EDIT:${CONFIGSCENE[scene]}`, resId, mode },
                  }).then(res => {
                    dispatch({
                      type: `${DOMAIN}/query`,
                      payload: { resId, mode, docNo, id, scene },
                    });
                  });
                } else {
                  closeThenGoto(
                    `/sale/purchaseContract/paymentApplyList/index?refresh=${Math.random()}`
                  );
                }
              } else {
                createMessage({ type: 'error', description: '保存失败' });
              }
            });
          } else {
            createMessage({ type: 'warn', description: '本次付款/核销金额必须要大于0' });
          }
        } else {
          createMessage({ type: 'warn', description: '付款明细不能为空' });
        }
      }
    });
  };

  // 提交
  handleSubmit = async () => {
    // await this.setState({
    //   loadings: true,
    // });
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      paymentApplyEdit,
    } = this.props;
    const { mode, scene, docNo, status } = fromQs();
    const { payDetailList, formData } = paymentApplyEdit;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        // 付款明细不能为空且本次付款/核销金额必须要大于0
        if (payDetailList.length !== 0) {
          if (formData.currPaymentAmt > 0) {
            dispatch({
              type: `${DOMAIN}/save`,
              payload: {
                scene,
              },
            }).then(res => {
              if (res !== '') {
                // 提交前的校验
                if (checkAmt(paymentApplyEdit)) {
                  dispatch({
                    type: `${DOMAIN}/submit`,
                    payload: { id: res },
                  }).then(resq => {
                    if (resq.ok) {
                      createMessage({ type: 'success', description: '提交成功' });
                      closeThenGoto(
                        `/sale/purchaseContract/paymentApplyList/index?refresh=${Math.random()}`
                      );
                    } else {
                      // this.setState({ loadings: false });
                      createMessage({ type: 'error', description: resq.reason || '提交失败' });
                    }
                  });
                } else {
                  // this.setState({ loadings: false });
                  mode === 'create' &&
                    closeThenGoto(
                      `/sale/purchaseContract/paymentApplyList/edit?mode=edit&id=${res}&scene=${scene}`
                    );
                }
              } else {
                // this.setState({ loadings: false });
                createMessage({ type: 'error', description: '提交失败' });
              }
            });
          } else {
            // this.setState({ loadings: false });
            createMessage({ type: 'warn', description: '本次付款/核销金额必须要大于0' });
          }
        } else {
          // this.setState({ loadings: false });
          createMessage({ type: 'warn', description: '付款明细不能为空' });
        }
      }
    });
  };

  render() {
    const { operationKey, loadings } = this.state;
    const { form, paymentApplyEdit, loading } = this.props;
    const { formData, pageConfig } = paymentApplyEdit;
    const { mode, status, entrance } = fromQs();
    // 获取工作流组件相关数据
    let docId;
    let procDefKey;
    const { id, scene, paymentApplicationType } = formData;
    if (mode === 'view') {
      docId = id;
      procDefKey = getPaymentFlowNo({ scene, paymentApplicationType });
    }

    let obj = {};
    if (pageConfig && pageConfig.pageTabViews) {
      pageConfig.pageTabViews.map(item => {
        obj[item.tabKey] = item.visibleFlag;
      });
      if (obj.DEPARTMENT === 1) {
        if (tabConf.filter(item => item.key === 'DEPARTMENT').length === 0) {
          tabConf.push({
            key: 'DEPARTMENT',
            tab: '费用承担部门',
          });
        }
      }
      if (obj.WITHDRAW === 1) {
        if (tabConf.filter(item => item.key === 'WITHDRAW').length === 0) {
          tabConf.push({
            key: 'WITHDRAW',
            tab: '提现申请',
          });
        }
      }
    }

    return (
      <PageHeaderWrapper title="付款申请单编辑">
        <Spin
          spinning={
            loading.effects[`${DOMAIN}/query`] && loading.effects[`${DOMAIN}/getPageConfig`]
          }
        >
          {mode !== 'view' && (
            <Card className="tw-card-rightLine">
              {entrance && entrance === 'flow' ? (
                <>
                  <Button
                    className="tw-btn-primary"
                    size="large"
                    loading={loading.effects[`${DOMAIN}/save`]}
                    disabled={false}
                    onClick={this.handleSave}
                  >
                    <Title id="misc.confirm" defaultMessage="确认" />
                  </Button>
                  <Button
                    className="tw-btn-primary"
                    size="large"
                    disabled={false}
                    onClick={() => {
                      closeThenGoto('/sale/purchaseContract/emergencyPayment');
                    }}
                  >
                    <Title id="misc.close" defaultMessage="关闭" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="tw-btn-primary"
                    icon="save"
                    size="large"
                    loading={loading.effects[`${DOMAIN}/save`]}
                    disabled={false}
                    onClick={this.handleSave}
                  >
                    <Title id="misc.save" defaultMessage="保存" />
                  </Button>
                  <Button
                    className="tw-btn-primary"
                    size="large"
                    disabled={false}
                    loading={
                      loading.effects[`${DOMAIN}/save`] || loading.effects[`${DOMAIN}/submit`]
                    }
                    // loading={loadings}
                    onClick={this.handleSubmit}
                  >
                    <Title id="misc.submit" defaultMessage="提交" />
                  </Button>
                </>
              )}
            </Card>
          )}
          <Card
            className="tw-card-multiTab"
            bordered={false}
            activeTabKey={operationKey}
            tabList={tabConf}
            onTabChange={this.onOperationTabChange}
          >
            {contentListSelected(form, operationKey, mode, entrance)}
          </Card>
          {mode === 'view' &&
            docId &&
            procDefKey && <BpmConnection source={[{ docId, procDefKey }]} />}
        </Spin>
      </PageHeaderWrapper>
    );
  }
}

export default Edit;
