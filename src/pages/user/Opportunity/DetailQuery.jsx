import React, { PureComponent } from 'react';
import { formatMessage } from 'umi/locale';
import { Button, Card, Table, Tooltip } from 'antd';
import { connect } from 'dva';
import classnames from 'classnames';
import DescriptionList from '@/components/layout/DescriptionList';

import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import Loading from '@/components/core/DataLoading';
import Title from '@/components/layout/Title';
import component from './component';
import { closeThenGoto, mountToTab } from '@/layouts/routerControl';
import { fromQs } from '@/utils/stringUtils';
import {
  tabList,
  saleCol,
  caseCol,
  shCol,
  competitorCol,
  partnerCol,
  extrafeeCol,
  costEstimationCol,
  benefitDistributionCol,
  channelFeeCol,
  quoteCol,
} from './config/index';

const { OppoInfo } = component;
const { Description } = DescriptionList;
const DOMAIN = 'userOppsDetail';
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
    user,
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
    user,
    dispatch,
  })
)
@mountToTab()
class OppoDetailQuery extends PureComponent {
  state = {
    tabKey: 'basic',
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const param = fromQs();
    dispatch({
      type: `${DOMAIN}/getPageConfigs`,
      payload: {
        pageNos: 'BUSINESS_EDIT_BASIC_INFORMATION,BUSINESS_EDIT_CATEGORY_CODE',
      },
    });
    dispatch({
      type: `${DOMAIN}/query`,
      payload: param,
    }).then(() => {
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

      // ????????????
      dispatch({
        type: `opportunityCostEstimation/getPageConfig`,
        payload: { pageNo: 'BUSINESS_EDIT_COSTE_ESTIMATE' },
      });
      // ????????????
      dispatch({
        type: `opportunityBenefitDistribution/getPageConfig1`,
        payload: { pageNo: 'BUSINESS_EDIT_BENEFIT_AIIOT' },
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

      dispatch({ type: `userOppsDetailsale/query`, payload: { oppoId: param.id } });
      dispatch({ type: `userOppsDetailcase/query`, payload: { oppoId: param.id } });
      dispatch({
        type: `userOppsDetailstakeholder/query`,
        payload: { sourceId: param.id, shClass: '1' },
      });
      dispatch({ type: `userOppsDetailcompetitor/query`, payload: { oppoId: param.id } });
      dispatch({ type: `userOppsDetailpartner/query`, payload: { oppoId: param.id } });
      dispatch({ type: `userOppsDetailextrafee/query`, payload: { oppoId: param.id } });

      dispatch({ type: `opportunityCostEstimation/costeList`, payload: { id: param.id } });
      dispatch({ type: `opportunityBenefitDistribution/benefitList`, payload: { id: param.id } });
      dispatch({ type: `opportunityChannelFee/channelList`, payload: { id: param.id } });
      dispatch({ type: `opportunityQuote/offerList`, payload: { id: param.id } });
    });
  }

  onOperationTabChange = key => {
    const { dispatch } = this.props;
    this.setState({ tabKey: key });
  };

  // ??????????????????????????????????????????visible??????
  filterTabByField = (pageTabViews, formData, resId, baseBuId) => {
    const arr = JSON.parse(JSON.stringify(pageTabViews));
    arr.forEach((item, index) => {
      Array.isArray(item.permissionViews) &&
        item.permissionViews.forEach(view => {
          if (view.allowType === 'FIELD') {
            if (formData[view.allowValue] === resId) {
              !item.visible ? (arr[index].visible = true) : null;
            }
          }
          if (view.allowType === 'BUFIELD') {
            if (formData[view.allowValue] === baseBuId) {
              !item.visible ? (arr[index].visible = true) : null;
            }
          }
        });
    });
    return arr;
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
      userOppsDetail: { formData, basicPageConfig, categoryPageConfig },
      userOppsDetailsale: { saleList, saleTotal, salePageConfig },
      userOppsDetailcase: { caseList, caseTotal, casePageConfig },
      userOppsDetailstakeholder: { shsList, shsTotal, stakePageConfig },
      userOppsDetailcompetitor: { compeList, compeTotal, competitorPageConfig },
      userOppsDetailpartner: { partnerList, partnerTotal, partnerPageConfig },
      userOppsDetailextrafee: { extrafeeList, extrafeeTotal, extrafeePageConfig },
      opportunityCostEstimation: { list, pageConfig },
      opportunityBenefitDistribution: { benefitDistributionList, pageConfig1 },
      opportunityChannelFee: { channelFeeList, pageConfig2 },
      opportunityQuote: { list: quoteList, pageConfig: quotePageConfig },
      user: {
        user: {
          extInfo: { resId, baseBuId },
        },
      },
    } = this.props;
    const { tabKey } = this.state;
    // loading?????????????????????????????????
    const disabledBtn = loading.effects[`${DOMAIN}/query`];
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
            dataSource={list}
            columns={costEstimationCol(pageConfig)}
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
            domain="opportunityCostEstimation"
            loading={loading.effects[`opportunityCostEstimation/query`]}
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
            loading={loading.effects[`opportunityQuote/query`]}
            dataSource={quoteList}
            columns={quoteCol(quotePageConfig)}
            rowKey="id"
            bordered
            pagination={false}
          />
        </div>
      ),
    };

    let keyList = [];
    if (basicPageConfig && basicPageConfig.pageTabViews) {
      const resArr = this.filterTabByField(basicPageConfig.pageTabViews, formData, resId, baseBuId);
      keyList = resArr.filter(view => view.visible).map(view => view.tabKey);
    }
    const permissionTabList = tabList.filter(tab => keyList.indexOf(tab.key) > -1);

    // const permissionTabKey = permissionTabList.indexOf(tabKey)>-1?tabKey:permissionTabList[0];

    const btnJson = {};
    if (basicPageConfig && basicPageConfig.pageButtonViews) {
      const resArr = this.filterTabByField(
        basicPageConfig.pageButtonViews,
        formData,
        resId,
        baseBuId
      );
      resArr.forEach(btn => {
        btnJson[btn.buttonKey] = btn;
      });
    }
    return (
      <PageHeaderWrapper title="????????????">
        <Card className="tw-card-rightLine">
          {(tabKey === 'costEstimation' && btnJson.costEstimationEditBtn.visible) ||
          (tabKey === 'benefitDistribution' && btnJson.benefitDistributionEditBtn.visible) ||
          (tabKey === 'channelFee' && btnJson.channelFeeEditBtn.visible) ||
          (tabKey === 'quote' && btnJson.quoteEditBtn.visible) ||
          ['costEstimation', 'benefitDistribution', 'channelFee', 'quote'].indexOf(tabKey) ===
            -1 ? (
            // eslint-disable-next-line react/jsx-indent
            <>
              <Button
                className="tw-btn-primary"
                icon="form"
                size="large"
                disabled={disabledBtn}
                onClick={() => {
                  if (formData.oppoStatus === ACTIVE) {
                    closeThenGoto(
                      `/sale/management/oppsedit?id=${
                        formData.id
                      }&mode=update&tab=${tabKey}&page=opps`
                    );
                  } else {
                    createMessage({ type: 'warn', description: '??????????????????????????????' });
                  }
                }}
              >
                <Title id="misc.update" defaultMessage="??????" />
              </Button>
              <Button
                className="tw-btn-primary"
                icon="form"
                size="large"
                disabled={disabledBtn}
                onClick={() => {
                  if (formData.oppoStatus === ACTIVE) {
                    closeThenGoto(
                      `/sale/purchaseContract/prePaymentApply/edit?docNo=${
                        formData.leadsNo
                      }&mode=create&scene=3`
                    );
                  } else {
                    createMessage({ type: 'warn', description: '?????????????????????????????????????????????' });
                  }
                }}
              >
                ???????????????
              </Button>
            </>
          ) : (
            ''
          )}
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={() => closeThenGoto('/sale/management/opps')}
          >
            <Title id="misc.rtn" defaultMessage="??????" />
          </Button>
        </Card>
        <Card
          className="tw-card-multiTab"
          bordered={false}
          activeTabKey={tabKey}
          tabList={permissionTabList}
          onTabChange={this.onOperationTabChange}
        >
          {formData.id ? contentList[tabKey] : <Loading />}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default OppoDetailQuery;
