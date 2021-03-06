import React, { Component } from 'react';
import router from 'umi/router';
import { connect } from 'dva';
import classnames from 'classnames';
import { Card, Button, Tooltip } from 'antd';
import { formatMessage } from 'umi/locale';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';
import DescriptionList from '@/components/layout/DescriptionList';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { FileManagerEnhance } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';

const { Description } = DescriptionList;
const DOMAIN = 'prePayMgmtPreview';

@connect(({ prePayMgmtPreview, user, loading }) => ({ prePayMgmtPreview, user, loading }))
@mountToTab()
class PrePayMgmtPreview extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id, taskId } = fromQs();
    dispatch({ type: `${DOMAIN}/query`, payload: id });
    taskId
      ? dispatch({
          type: `${DOMAIN}/fetchConfig`,
          payload: taskId,
        })
      : dispatch({ type: `${DOMAIN}/cleanFlow` });
  }

  render() {
    const {
      dispatch,
      loading,
      prePayMgmtPreview: { formData, fieldsConfig: config, flowForm },
    } = this.props;

    const { id, taskId, back } = fromQs();

    return (
      <PageHeaderWrapper>
        <BpmWrapper
          fieldsConfig={config}
          flowForm={flowForm}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
        >
          <Card className="tw-card-rightLine">
            <Button
              className="tw-btn-primary"
              size="large"
              onClick={() => {
                router.push(`/plat/purchPay/advanceVerification/List?id=${id}`);
              }}
            >
              ????????????
            </Button>
            {fromQs().id && (
              <a
                href={`/print?scope=ACC_A29&id=${fromQs().id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 'auto', marginRight: 8 }}
              >
                <Tooltip title="????????????">
                  <Button
                    className={classnames('tw-btn-default')}
                    type="dashed"
                    icon="printer"
                    size="large"
                  />
                </Tooltip>
              </a>
            )}
            <Button
              className={classnames('tw-btn-default')}
              icon="undo"
              size="large"
              onClick={() => closeThenGoto('/plat/purchPay/prePayMgmt')}
            >
              {formatMessage({ id: `misc.rtn`, desc: '??????' })}
            </Button>
          </Card>
          <Card
            className="tw-card-adjust"
            bordered={false}
            title={<Title icon="profile" text="?????????????????????" />}
          >
            <DescriptionList size="large" col={2}>
              <Description term="?????????">{formData.applyNo}</Description>
              <Description term="????????????">{formData.applyName}</Description>
              <Description term="????????????????????????">{formData.feeApplyName}</Description>
              <Description term="?????????">{formData.applyResName}</Description>
              <Description term="?????????Base BU">{formData.applyBuName}</Description>
              <Description term="??????????????????">{formData.pcontractName}</Description>
              <Description term="????????????">{formData.applyTypeDesc}</Description>
              <Description term="?????????">{formData.reasonName}</Description>
              <Description term="????????????">{formData.prepayTypeDesc}</Description>
              <Description term="????????????BU">{formData.expenseBuName}</Description>
              <Description term="?????????">{formData.supplierName}</Description>
              <Description term="????????????">{formData.holderName}</Description>
              <Description term="????????????">{formData.accountNo}</Description>
              <Description term="????????????">{formData.bankName}</Description>
              <Description term="???????????????">{formData.adpayAmt}</Description>
              <Description term="??????????????????">{formData.adpayHxDate}</Description>
              <Description term="????????????">{formData.applyDate}</Description>
              {formData.applyStatus === 'APPROVED' && (
                <Description term="????????????">{formData.processStateName}</Description>
              )}
              {formData.applyStatus === 'APPROVED' && (
                <Description term="??????????????????">{formData.isHxDelayName}</Description>
              )}

              <Description term="????????????">{formData.applyStatusDesc}</Description>
              <Description term="????????????">
                <FileManagerEnhance
                  api="/api/worth/v1/adpay/sfs/token"
                  dataKey={formData.id}
                  listType="text"
                  preview
                />
              </Description>
              <Description term="??????????????????">{formData.feeExtendOuName}</Description>
              <Description term="????????????">{formData.remark}</Description>
            </DescriptionList>
          </Card>
          {!taskId && <BpmConnection source={[{ docId: id, procDefKey: 'ACC_A29' }]} />}
        </BpmWrapper>
        <br />
        <div style={{ marginTop: 60 }} />
      </PageHeaderWrapper>
    );
  }
}

export default PrePayMgmtPreview;
