import React, { Component } from 'react';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { Card, Button, Spin, Form } from 'antd';
import Title from '@/components/layout/Title';
import { connect } from 'dva';
import createMessage from '@/components/core/AlertMessage';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import classnames from 'classnames';
import { fromQs } from '@/utils/stringUtils';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { isEmpty, takeLast, add, isNil, gte, lte } from 'ramda';
import { createConfirm } from '@/components/core/Confirm';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import { add as mathAdd, sub, div, mul, checkIfNumber, genFakeId } from '@/utils/mathUtils';
import moment from 'moment';

import { getContractFlowNo } from '@/pages/sale/purchaseContract/constConfig';
import ContractEdit from './component/ContractEdit';
import DocumentEdit from './component/DocumentEdit';
import AssociatedResourcesEdit from './component/AssociatedResourcesEdit';
import SettlementRateEdit from './component/SettlementRateEdit';
import RelatedAgreementsEdit from './component/RelatedAgreementsEdit';
import { pushFlowTask } from '@/services/gen/flow';
import { getUrl } from '@/utils/flowToRouter';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';

const tabConf = [
  {
    key: 'contract',
    tab: '采购协议信息',
  },
  {
    key: 'document',
    tab: '单据信息',
  },
  {
    key: 'resources',
    tab: '关联资源',
  },
  {
    key: 'rate',
    tab: '人力资源结算费率',
  },
  {
    key: 'agreements',
    tab: '关联协议',
  },
];

const contentListSelected = (form, operationkey, isEdit) => {
  const contentList = {
    contract: <ContractEdit form={form} isEdit={isEdit} />,
    document: <DocumentEdit form={form} isEdit={isEdit} />,
    resources: <AssociatedResourcesEdit isEdit={isEdit} />,
    rate: <SettlementRateEdit isEdit={isEdit} />,
    agreements: <RelatedAgreementsEdit isEdit={isEdit} />,
  };
  return contentList[operationkey];
};

const DOMAIN = 'salePurchaseAgreementsEdit';

@connect(({ loading, salePurchaseAgreementsEdit }) => ({
  loading,
  salePurchaseAgreementsEdit,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const { name, value } = Object.values(changedFields)[0];
    if (name === 'signingLegalDesc' || name === 'supplierLegalDesc') return;
    if (name === 'effectiveDate') {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: {
          effectiveStartDate: value && value[0] ? formatDT(value[0]) : null,
          effectiveEndDate: value && value[1] ? formatDT(value[1]) : null,
        },
      });
    } else {
      const val = name === 'signDate' ? formatDT(value) : value;
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: val },
      });
    }
  },
})
@mountToTab()
class ActiveFlow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      operationkey: 'contract',
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    const { id, mode, from, purchaseType, businessType, acceptanceType, taskId } = fromQs();
    dispatch({
      type: `${DOMAIN}/clear`,
    });
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: {
        pageNo: 'PURCHASE_AGREEMENT_SAVE',
      },
    });
    dispatch({
      type: `${DOMAIN}/getProductClass`,
    });
    dispatch({
      type: `${DOMAIN}/selectAbOus`,
    });
    dispatch({
      type: `${DOMAIN}/selectAllAbOu`,
    });
    dispatch({
      type: `${DOMAIN}/selectAssociation`,
      payload: {
        id,
      },
    });
    dispatch({
      type: `${DOMAIN}/selectExternalUser`,
    });
    if (id) {
      dispatch({
        type: `${DOMAIN}/queryEdit`,
        payload: id,
      });
    } else {
      dispatch({
        type: `${DOMAIN}/fetchPrincipal`,
      }).then(res => {
        dispatch({
          type: `${DOMAIN}/selectOuByOuId`,
          payload: res.extInfo.ouId,
        }).then(response => {
          dispatch({
            type: `${DOMAIN}/updateForm`,
            payload: {
              signingLegalNo: response.code,
              signingLegalDesc: response.name,
              signingBuId: res.extInfo.baseBuId,
              purchaseInchargeResId: res.extInfo.resId,
            },
          });
        });
      });
    }
    taskId && dispatch({ type: `${DOMAIN}/fetchConfig`, payload: taskId });
  }

  onOperationTabChange = key => {
    this.setState({
      operationkey: key,
    });
  };

  handleCancel = () => {
    closeThenGoto(`/sale/purchaseContract/purchaseAgreementList`);
  };

  checkList = (list, checks) => {
    let flag = false;
    list.forEach(item => {
      checks.forEach(view => {
        if (!item[view] && item[view] !== 0) flag = true;
      });
    });
    return flag;
  };

  checkSettlementRate = list => {
    let flag = false;
    let repeatFlag = false;
    let orderFlag = false;
    if (list.find(item => item.startAtm >= item.endAtm)) {
      orderFlag = true;
    }
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < list.length; i++) {
      // eslint-disable-next-line no-plusplus
      for (let j = i + 1; j < list.length; j++) {
        if (list[i].startAtm < list[j].endAtm && list[j].startAtm < list[i].endAtm) {
          flag = true;
        }
        if (list[i].startAtm === list[j].endAtm && list[j].startAtm === list[i].endAtm) {
          repeatFlag = true;
        }
      }
    }
    if (flag || repeatFlag || orderFlag)
      createMessage({
        type: 'error',
        description: `请检查人力资源结算费率，金额期间不允许有交叉或相同, 且结束金额需大于开始金额`,
      });
    return flag || repeatFlag || orderFlag;
  };

  checkAssociatedResources = list => {
    let flag = false;
    let repeatFlag = false;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < list.length; i++) {
      // eslint-disable-next-line no-plusplus
      for (let j = i + 1; j < list.length; j++) {
        if (
          list[i].resId === list[j].resId &&
          moment(list[i].resStartDate).isBefore(list[j].resEndDate, 'day') &&
          moment(list[j].resStartDate).isBefore(list[i].resEndDate, 'day')
        ) {
          flag = true;
        }
        if (
          list[i].resId === list[j].resId &&
          moment(list[i].resStartDate).isSame(list[j].resEndDate, 'day') &&
          moment(list[j].resStartDate).isSame(list[i].resEndDate, 'day')
        ) {
          repeatFlag = true;
        }
      }
    }
    if (flag || repeatFlag) {
      createMessage({
        type: 'error',
        description: `请检查关联资源，同一资源的资源日期不允许有交叉或相同`,
      });
    }
    return flag || repeatFlag;
  };

  // 保存
  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      salePurchaseAgreementsEdit: {
        formData,
        agreementDetailsEntities,
        agreementDetailsDeletedKeys,
        agreementResEntities,
        agreementResDeletedKeys,
        resSetRateEntities,
        resSetRateDeletedKeys,
        agreementEntities,
        agreementDeleteKeys,
      },
      dispatch,
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        if (!agreementDetailsEntities.length > 0) {
          createMessage({ type: 'error', description: '请添加采购明细' });
          return;
        }
        const agreementDetailsChecks = ['relatedProductId', 'quantity', 'taxPrice', 'taxRate'];
        const agreementResChecks = ['resId', 'resStartDate', 'resEndDate'];
        const resSetRateChecks = ['startAtm', 'endAtm', 'serviceRate'];
        const agreementChecks = ['associationId'];

        const flagArr = [
          this.checkList(agreementDetailsEntities, agreementDetailsChecks),
          this.checkList(agreementResEntities, agreementResChecks),
          this.checkList(resSetRateEntities, resSetRateChecks),
          this.checkList(agreementEntities, agreementChecks),
        ];
        const tableNameArr = ['采购明细', '关联资源', '人力资源结算费率', '关联协议'];
        const filterArr = tableNameArr.filter((item, index) => flagArr[index]);
        if (filterArr.length > 0) {
          createMessage({ type: 'error', description: `请检查${filterArr.join(',')}必填项` });
          return;
        }
        const associatedResourcesCheckRes = this.checkAssociatedResources(agreementResEntities);
        const settlementRateCheckRes = this.checkSettlementRate(resSetRateEntities);
        if (associatedResourcesCheckRes || settlementRateCheckRes) return;
        dispatch({
          type: `${DOMAIN}/save`,
          payload: {
            purchaseAgreementEntity: {
              id: genFakeId(-1),
              ...formData,
              agreementDetailsEntities,
              agreementResEntities,
              resSetRateEntities,
              associationAgreementEntities: agreementEntities,
            },
            deleteDetails: agreementDetailsDeletedKeys,
            deleteRes: agreementResDeletedKeys,
            deleteRates: resSetRateDeletedKeys,
            deleteAgreements: agreementDeleteKeys,
          },
        });
      }
    });
  };

  render() {
    const { operationkey } = this.state;
    const {
      dispatch,
      loading,
      form,
      salePurchaseAgreementsEdit: { flowForm, fieldsConfig, formData },
    } = this.props;
    const { pageMode, mode, taskId, id } = fromQs();
    // const {  } = param;
    const { purchaseType, businessType } = formData;
    const procDefKeys = getContractFlowNo(purchaseType, businessType);
    const { taskKey } = fieldsConfig;
    const isEdit = !(taskId && taskKey === 'ACC_A114_01_SUBMIT_i' && mode === 'edit');
    return (
      <PageHeaderWrapper>
        <Spin
          spinning={
            loading.effects[`${DOMAIN}/queryEdit`] ||
            loading.effects[`${DOMAIN}/save`] ||
            loading.effects[`${DOMAIN}/getPageConfig`] ||
            false
          }
        >
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
              // const { taskKey } = fieldsConfig;
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
              if (key === 'FLOW_PASS') {
                return Promise.resolve(true);
              }

              if (key === 'FLOW_COMMIT') {
                this.handleSave({
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
              {contentListSelected(form, operationkey, isEdit)}
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

export default ActiveFlow;
