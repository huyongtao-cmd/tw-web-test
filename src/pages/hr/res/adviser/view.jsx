import React, { PureComponent } from 'react';
import { connect } from 'dva';
import classnames from 'classnames';
import moment from 'moment';
import { Button, Card } from 'antd';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto, markAsTab } from '@/layouts/routerControl';
import Loading from '@/components/core/DataLoading';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { formatMessage } from 'umi/locale';
import DescriptionList from '@/components/layout/DescriptionList';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { FileManagerEnhance } from '@/pages/gen/field';
import router from 'umi/router';

const { Description } = DescriptionList;

const DOMAIN = 'adviserFlow';

@connect(({ loading, adviserFlow, dispatch }) => ({
  loading,
  adviserFlow,
  dispatch,
}))
@mountToTab()
class UserLeadsDetailView extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id } = fromQs();
    dispatch({
      type: `${DOMAIN}/queryDetail`,
      payload: {
        id,
      },
    });
  }

  renderPage = () => {
    const {
      mode,
      adviserFlow: { detailData, pageConfig },
    } = this.props;
    const filterList = [
      <Description key="applyNo" term="派工单编号">
        {detailData?.applyNo}
      </Description>,
      <Description key="applyName" term="派工单名称">
        {detailData?.applyName}
      </Description>,
      <Description key="reasonType" term="事由类型">
        {detailData?.reasonType === 'PROJ' ? '项目' : '售前'}
      </Description>,
      <Description key="reasonId" term="事由号">
        {detailData?.reasonName}
      </Description>,
      <Description key="consultantName" term="顾问名称">
        {detailData?.consultantName}
      </Description>,
      <Description key="capasetLevelId" term="复合能力">
        {detailData?.capasetLevelName}
      </Description>,
      <Description key="serviceFee" term="人天单价">
        {detailData?.serviceFee}
      </Description>,
      <Description key="isTax" term="是否含税">
        {detailData?.isTax ? '是' : '否'}
      </Description>,
      <Description term="预计入场日期" key="expectedStartDate">
        {detailData?.expectedStartDate}
      </Description>,
      <Description key="expectedEndDate" term="预计结束日期">
        {detailData?.expectedEndDate}
      </Description>,
      <Description key="applyResName" term="申请人">
        {detailData?.applyResName}
      </Description>,
      <Description key="applyDate" term="申请日期">
        {detailData?.applyDate}
      </Description>,
      <Description key="apprStatusName" term="审批状态">
        {detailData?.apprStatusName}
      </Description>,
      <Description key="resume" term="被推荐人简历">
        <FileManagerEnhance
          api="/api/person/v1/workOrderApply/sfs/resume/token"
          listType="text"
          dataKey={detailData?.id || ''}
          multiple={false}
          disabled
          preview
        />
      </Description>,
      <Description key="workOrder" term="派工单">
        <FileManagerEnhance
          api="/api/person/v1/workOrderApply/sfs/workOrder/token"
          listType="text"
          dataKey={detailData?.id || ''}
          multiple={false}
          disabled
          preview
        />
      </Description>,
    ];
    return (
      <>
        <DescriptionList
          size="large"
          // title={formatMessage({
          //   id: `app.settings.menuMap.basicMessage`,
          //   desc: '基本信息',
          // })}
          title="基本信息"
          col={2}
        >
          {filterList}
        </DescriptionList>
      </>
    );
  };

  render() {
    const {
      loading,
      mode,
      adviserFlow: { detailData, pageConfig },
    } = this.props;
    const { id } = fromQs();
    // const isInternal = detailData.sourceType === 'INTERNAL';
    const allBpm = [{ docId: id, procDefKey: 'ORG_G04', title: '派工单流程' }];
    return (
      <PageHeaderWrapper>
        {!mode ? (
          <Card className="tw-card-rightLine">
            <Button
              className={classnames('separate', 'tw-btn-default')}
              icon="undo"
              size="large"
              onClick={() => {
                const { from } = fromQs();
                closeThenGoto(markAsTab('/hr/res/adviserList'));
              }}
            >
              {formatMessage({ id: `misc.rtn`, desc: '返回' })}
            </Button>
          </Card>
        ) : null}
        <Card
          className="tw-card-adjust"
          title={
            <Title
              icon="profile"
              // id="app.settings.menuMap.leadsDetail"
              id="派工单详情"
              defaultMessage="派工单详情"
            />
          }
          bordered={false}
        >
          {/* {!loading.effects[`${DOMAIN}/getPageConfig`] && detailData.id ? (
            this.renderPage()
          ) : (
            <Loading />
          )} */}
          {this.renderPage()}
        </Card>
        <BpmConnection source={allBpm} />
      </PageHeaderWrapper>
    );
  }
}

export default UserLeadsDetailView;
