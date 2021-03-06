/* eslint-disable no-nested-ternary */
import React, { PureComponent } from 'react';
import { formatMessage } from 'umi/locale';
import { Button, Card, Table, Tooltip, Input } from 'antd';
import { connect } from 'dva';
import classnames from 'classnames';
import DescriptionList from '@/components/layout/DescriptionList';

import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import Loading from '@/components/core/DataLoading';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import Title from '@/components/layout/Title';
import component from './component';
import { closeThenGoto, mountToTab } from '@/layouts/routerControl';
import { fromQs } from '@/utils/stringUtils';
import {
  saleCol,
  caseCol,
  shCol,
  competitorCol,
  partnerCol,
  extrafeeCol,
  quoteCol,
  quoteColEdit,
  benefitDistributionCol,
  tabList,
  costEstimationCol,
  channelFeeCol,
} from './config/index';

const { OppoInfo } = component;
const { Description } = DescriptionList;
const DOMAIN = 'opportunityQuote';
const ACTIVE = 'ACTIVE';
@connect(
  ({
    loading,
    userOppsDetail,
    userOppsDetailsale,
    userOppsDetailcase,
    userOppsDetailstakeholder,
    userOppsDetailcompetitor,
    userOppsDetailpartner,
    userOppsDetailextrafee,
    opportunityCostEstimation,
    opportunityBenefitDistribution,
    opportunityChannelFee,
    opportunityQuote,
    dispatch,
  }) => ({
    loading,
    userOppsDetail,
    userOppsDetailsale,
    userOppsDetailcase,
    userOppsDetailstakeholder,
    userOppsDetailcompetitor,
    userOppsDetailpartner,
    userOppsDetailextrafee,
    opportunityCostEstimation,
    opportunityBenefitDistribution,
    opportunityChannelFee,
    opportunityQuote,
    dispatch,
  })
)
@mountToTab()
class QuoteFlowView extends PureComponent {
  state = {
    tabKey: 'quote',
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const { id, taskId } = fromQs();

    taskId &&
      dispatch({
        type: `${DOMAIN}/fetchConfig`,
        payload: taskId,
      });

    dispatch({
      type: `userOppsDetail/getPageConfigs`,
      payload: {
        pageNos: 'BUSINESS_EDIT_BASIC_INFORMATION,BUSINESS_EDIT_CATEGORY_CODE',
      },
    });

    id &&
      dispatch({
        type: `${DOMAIN}/offerFlowDetail`,
        payload: { id },
      }).then(res => {
        if (!res.ok) {
          return;
        }
        const { oppoId } = res.datum;
        dispatch({
          type: `${DOMAIN}/getCosteIdFlow`,
          payload: { id: oppoId },
        });

        // ??????????????????
        dispatch({
          type: `userOppsDetailsale/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_SALES_LIST' },
        });
        dispatch({
          type: `userOppsDetailcase/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_CASE_ANALYSIS' },
        });
        dispatch({
          type: `userOppsDetailstakeholder/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_STAKEHOLDERS' },
        });
        dispatch({
          type: `userOppsDetailcompetitor/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_COMPES' },
        });
        dispatch({
          type: `userOppsDetailpartner/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_PARTNERS' },
        });
        dispatch({
          type: `userOppsDetailextrafee/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_EXTRAFEES' },
        });
        // ??????????????????
        dispatch({
          type: `opportunityBenefitDistribution/getPageConfig1`,
          payload: { pageNo: 'BUSINESS_EDIT_BENEFIT_AIIOT' },
        });
        // ????????????
        dispatch({
          type: `opportunityCostEstimation/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_COSTE_ESTIMATE' },
        });
        // ????????????
        dispatch({
          type: `opportunityChannelFee/getPageConfig2`,
          payload: { pageNo: 'BUSINESS_EDIT_CHANNEL_COSTT' },
        });
        // ??????
        dispatch({
          type: `opportunityQuote/getPageConfig`,
          payload: { pageNo: 'BUSINESS_EDIT_OFFER' },
        });

        // ????????????
        dispatch({
          type: `userOppsDetail/query`,
          payload: { id: oppoId },
        });
        dispatch({ type: `userOppsDetailsale/query`, payload: { oppoId } });
        dispatch({ type: `userOppsDetailcase/query`, payload: { oppoId } });
        dispatch({
          type: `userOppsDetailstakeholder/query`,
          payload: { sourceId: oppoId, shClass: '1' },
        });
        dispatch({ type: `userOppsDetailcompetitor/query`, payload: { oppoId } });
        dispatch({ type: `userOppsDetailpartner/query`, payload: { oppoId } });
        dispatch({ type: `userOppsDetailextrafee/query`, payload: { oppoId } });

        dispatch({ type: `opportunityCostEstimation/costeList`, payload: { id: oppoId } });
        dispatch({ type: `opportunityBenefitDistribution/benefitList`, payload: { id: oppoId } });
        dispatch({ type: `opportunityChannelFee/channelList`, payload: { id: oppoId } });
        // dispatch({ type: `opportunityQuote/offerList`, payload: { id: oppoId } });
      });
  }

  onOperationTabChange = key => {
    this.setState({ tabKey: key });
  };

  renderPage = () => {
    const {
      loading,
      userOppsDetail: { formData, categoryPageConfig },
    } = this.props;
    if (!categoryPageConfig.pageBlockViews || categoryPageConfig.pageBlockViews.length < 1) {
      return <div />;
    }
    const currentBlockConfig = categoryPageConfig.pageBlockViews[0];
    const { pageFieldViews } = currentBlockConfig;
    const pageFieldJson = {};
    pageFieldViews.forEach(field => {
      pageFieldJson[field.fieldKey] = field;
    });
    const fields = [
      <Description
        term={pageFieldJson.oppoCat1.displayName}
        key="oppoCat1"
        sortNo={pageFieldJson.oppoCat1.sortNo}
      >
        {formData.oppoCat1}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat2.displayName}
        key="oppoCat2"
        sortNo={pageFieldJson.oppoCat2.sortNo}
      >
        {formData.oppoCat2}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat3.displayName}
        key="oppoCat3"
        sortNo={pageFieldJson.oppoCat3.sortNo}
      >
        {formData.oppoCat3}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat4.displayName}
        key="oppoCat4"
        sortNo={pageFieldJson.oppoCat4.sortNo}
      >
        {formData.oppoCat4Desc}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat5.displayName}
        key="oppoCat5"
        sortNo={pageFieldJson.oppoCat5.sortNo}
      >
        {formData.oppoCat5Desc}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat6.displayName}
        key="oppoCat6"
        sortNo={pageFieldJson.oppoCat6.sortNo}
      >
        {formData.oppoCat6Desc}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat7.displayName}
        key="oppoCat7"
        sortNo={pageFieldJson.oppoCat7.sortNo}
      >
        {formData.oppoCat7Desc}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat8.displayName}
        key="oppoCat8"
        sortNo={pageFieldJson.oppoCat8.sortNo}
      >
        {formData.oppoCat8Desc}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat9.displayName}
        key="oppoCat9"
        sortNo={pageFieldJson.oppoCat9.sortNo}
      >
        {formData.oppoCat9Desc}
      </Description>,
      <Description
        term={pageFieldJson.oppoCat10.displayName}
        key="oppoCat10"
        sortNo={pageFieldJson.oppoCat10.sortNo}
      >
        {formData.oppoCat10Desc}
      </Description>,
    ];
    const filterList = fields
      .filter(field => !field.key || pageFieldJson[field.key].visibleFlag === 1)
      .sort((field1, field2) => field1.props.sortNo - field2.props.sortNo);
    return (
      <DescriptionList size="large" title="?????????" col={2}>
        {filterList}
      </DescriptionList>
    );
  };

  render() {
    const {
      loading,
      dispatch,
      userOppsDetail: { formData, basicPageConfig, categoryPageConfig },
      userOppsDetailsale: { saleList, saleTotal, salePageConfig },
      userOppsDetailcase: { caseList, caseTotal, casePageConfig },
      userOppsDetailstakeholder: { shsList, shsTotal, stakePageConfig },
      userOppsDetailcompetitor: { compeList, compeTotal, competitorPageConfig },
      userOppsDetailpartner: { partnerList, partnerTotal, partnerPageConfig },
      userOppsDetailextrafee: { extrafeeList, extrafeeTotal, extrafeePageConfig },
      opportunityQuote: { fieldsConfig, flowForm, list, pageConfig },
      opportunityBenefitDistribution: { pageConfig1, benefitDistributionList },
      opportunityChannelFee: { channelFeeList, pageConfig2 },
      opportunityCostEstimation: { list: costList, pageConfig: pageConfig3 },
    } = this.props;
    const { tabKey } = this.state;

    const { mode, taskId, id } = fromQs();

    const { taskKey, buttons } = fieldsConfig;

    const tt =
      taskKey === 'ACC_A72_01_SUBMIT_i' && mode !== 'view'
        ? Array.isArray(quoteColEdit(pageConfig))
          ? quoteColEdit(pageConfig)
          : []
        : Array.isArray(quoteCol(pageConfig))
          ? quoteCol(pageConfig)
          : [];

    // loading?????????????????????????????????
    const disabledBtn = loading.effects[`${DOMAIN}/offerFlowDetail`];

    const contentList = {
      basic: <OppoInfo formData={formData} pageConfig={basicPageConfig} />,
      sale: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `user.management.oppo.sale`, desc: '????????????' })}
          </div>
          <Table
            domain="userOppsDetailsale"
            loading={loading.effects[`userOppsDetailsale/query`]}
            dataSource={saleList}
            total={saleTotal}
            columns={saleCol(salePageConfig)}
            rowKey="id"
            bordered
          />
        </div>
      ),
      case: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `user.management.oppo.case`, desc: '?????????????????????' })}
          </div>
          <Table
            domain="userOppsDetailcase"
            loading={loading.effects[`userOppsDetailcase/query`]}
            dataSource={caseList}
            total={caseTotal}
            columns={caseCol(casePageConfig)}
            rowKey="id"
            bordered
          />
        </div>
      ),
      stakeholder: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `user.management.oppo.stakeholder`, desc: '???????????????' })}
          </div>
          <Table
            domain="userOppsDetailstakeholder"
            loading={loading.effects[`userOppsDetailstakeholder/query`]}
            dataSource={shsList}
            total={shsTotal}
            columns={shCol(stakePageConfig)}
            rowKey="id"
            bordered
          />
        </div>
      ),
      partner: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `user.management.oppo.partner`, desc: '????????????' })}
          </div>
          <Table
            domain="userOppsDetailpartner"
            loading={loading.effects[`userOppsDetailpartner/query`]}
            dataSource={partnerList}
            total={partnerTotal}
            columns={partnerCol(partnerPageConfig)}
            rowKey="id"
            bordered
          />
        </div>
      ),
      extrafee: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `user.management.oppo.extrafee`, desc: '??????????????????' })}
          </div>
          <Table
            domain="userOppsDetailextrafee"
            loading={loading.effects[`userOppsDetailextrafee/query`]}
            dataSource={extrafeeList}
            total={extrafeeTotal}
            columns={extrafeeCol(extrafeePageConfig)}
            rowKey="id"
            bordered
          />
        </div>
      ),
      competitor: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `user.management.oppo.competitor`, desc: '????????????' })}
          </div>
          <Table
            domain="userOppsDetailcompetitor"
            loading={loading.effects[`userOppsDetailcompetitor/query`]}
            dataSource={compeList}
            total={compeTotal}
            columns={competitorCol(competitorPageConfig)}
            rowKey="id"
            bordered
          />
        </div>
      ),
      category: this.renderPage(),
      costEstimation: (
        <div>
          <div className="tw-card-title">????????????</div>
          <Table
            domain="opportunityCostEstimation"
            loading={loading.effects[`opportunityCostEstimation/query`]}
            dataSource={costList}
            columns={costEstimationCol(pageConfig3)}
            rowKey="id"
            bordered
            pagination={false}
          />
        </div>
      ),
      benefitDistribution: (
        <div>
          <div className="tw-card-title">????????????</div>
          <Table
            domain="opportunityBenefitDistribution"
            loading={loading.effects[`opportunityBenefitDistribution/benefitFlowDetail`]}
            dataSource={benefitDistributionList}
            columns={benefitDistributionCol(pageConfig1)}
            rowKey="id"
            bordered
            pagination={false}
          />
        </div>
      ),
      channelFee: (
        <div>
          <div className="tw-card-title">????????????</div>
          <Table
            domain="opportunityCostEstimation"
            loading={loading.effects[`opportunityCostEstimation/query`]}
            dataSource={channelFeeList}
            columns={channelFeeCol(pageConfig2)}
            rowKey="id"
            bordered
            pagination={false}
          />
        </div>
      ),
      quote: (
        <div>
          <div className="tw-card-title">??????</div>
          <Table
            domain="opportunityQuote"
            loading={loading.effects[`opportunityQuote/offerFlowDetail`]}
            dataSource={list}
            columns={tt}
            rowKey="id"
            bordered
            pagination={false}
            scroll={taskKey === 'ACC_A72_01_SUBMIT_i' ? { x: 1800 } : ''}
          />
        </div>
      ),
    };

    return (
      <PageHeaderWrapper title="??????????????????">
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          scope="ACC_A72"
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { branch, remark } = bpmForm;
            const { key } = operation;
            if (taskId) {
              if (taskKey === 'ACC_A72_01_SUBMIT_i') {
                dispatch({
                  type: `${DOMAIN}/saveFlowAgain`,
                  payload: {
                    flow: {
                      result: 'REJECTED',
                      taskId,
                      remark,
                      branch,
                    },
                  },
                });
                return Promise.resolve(false);
              }
              // ????????????????????????????????????pass????????????
              if (taskKey === 'ACC_A72_02_ACTIVATION_b') {
                // ??????????????????????????????
                if (key === 'FLOW_PASS') {
                  dispatch({
                    type: `${DOMAIN}/offerPass`,
                    payload: {
                      payload: {
                        result: 'APPROVED',
                        taskId,
                        remark,
                        branch,
                      },
                    },
                  });
                  return Promise.resolve(false);
                }
                if (key === 'FLOW_RETURN') {
                  dispatch({
                    type: `${DOMAIN}/offerPass`,
                    payload: {
                      payload: {
                        result: 'REJECTED',
                        taskId,
                        remark,
                        branch,
                      },
                    },
                  });
                }
                return Promise.resolve(false);
              }
              // ??????????????????????????????
              return Promise.resolve(true);
            }
            return Promise.resolve(true);
          }}
        >
          <Card
            className="tw-card-multiTab"
            bordered={false}
            activeTabKey={tabKey}
            tabList={tabList}
            onTabChange={this.onOperationTabChange}
          >
            {disabledBtn ? <Loading /> : contentList[tabKey]}
          </Card>
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default QuoteFlowView;
