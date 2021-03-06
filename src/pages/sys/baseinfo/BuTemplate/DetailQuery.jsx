import React, { PureComponent } from 'react';
import router from 'umi/router';
import classnames from 'classnames';
import { Button, Card, Divider, Table } from 'antd';
import { connect } from 'dva';
import { formatMessage } from 'umi/locale';
import DescriptionList from '@/components/layout/DescriptionList';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';
import Loading from '@/components/core/DataLoading';
import { mountToTab } from '@/layouts/routerControl';
import { fromQs } from '@/utils/stringUtils';

import {
  operationTabList,
  financeColumns,
  roleColumns,
  incomeColumns,
  operateColumns,
  examPeriodColumns,
} from './config';

const { Description } = DescriptionList;

const DOMAIN = 'sysButempDetail';
@connect(
  ({ loading, sysButempDetail, sysButemprole, sysButempincome, sysButempoperation, dispatch }) => ({
    loading,
    sysButempDetail,
    sysButemprole,
    sysButempincome,
    sysButempoperation,
    dispatch,
  })
)
@mountToTab()
class BuTmplDetailQuery extends PureComponent {
  state = {
    operationkey: 'basic',
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const param = fromQs();

    dispatch({
      type: `${DOMAIN}/query`,
      payload: param,
    }).then(() => {
      // dispatch({ type: `sysButemprole/queryRoleList`, payload: { tmplId: param.id } });
      dispatch({ type: `sysButempincome/queryIncomeList`, payload: { tmplId: param.id } });
      dispatch({ type: `${DOMAIN}/queryEqvaList`, payload: { tmplId: param.id } });
      dispatch({ type: `sysButempoperation/queryOperateList`, payload: { tmplId: param.id } });
      dispatch({ type: `sysButempoperation/queryExamPeriodList`, payload: { tmplId: param.id } });

      this.fetchData();
    });
  }

  fetchData = () => {
    const {
      dispatch,
      sysButempDetail: { formData },
    } = this.props;

    dispatch({
      type: `${DOMAIN}/queryFinanceList`,
      payload: { accTmplId: formData.accTmplId },
    });
  };

  onOperationTabChange = key => {
    this.setState({ operationkey: key });
  };

  render() {
    const {
      loading,
      sysButempDetail: { formData, financeList, eqvaList },
      sysButemprole: { roleList },
      sysButempincome: { incomeList },
      sysButempoperation: { operateList, examPeriodList },
    } = this.props;
    const { operationkey } = this.state;

    // loading?????????????????????????????????
    const disabledBtn = loading.effects[`${DOMAIN}/query`];

    const contentList = {
      basic: (
        <>
          <DescriptionList
            size="large"
            title={formatMessage({ id: `app.settings.menuMap.basic`, desc: '????????????' })}
            col={2}
          >
            <Description
              term={formatMessage({ id: `sys.baseinfo.buTemplate.tmplNo`, desc: '????????????' })}
            >
              {formData.tmplNo}
            </Description>
            <Description
              term={formatMessage({ id: `sys.baseinfo.buTemplate.tmplName`, desc: '????????????' })}
            >
              {formData.tmplName}
            </Description>
            <Description
              term={formatMessage({ id: `sys.baseinfo.buTemplate.tmplType`, desc: '??????' })}
            >
              {formData.tmplTypeName}
            </Description>
            <Description style={{ visibility: 'hidden' }} term="??????">
              ??????
            </Description>
            <Description
              term={formatMessage({ id: `sys.baseinfo.buTemplate.remark`, desc: '??????' })}
            >
              {formData.remark}
            </Description>
          </DescriptionList>
        </>
      ),
      finance: (
        <div>
          <DescriptionList
            size="large"
            title={formatMessage({ id: `app.settings.menuMap.basic`, desc: '????????????' })}
            col={2}
            hasSeparator
          >
            <Description
              term={formatMessage({ id: `sys.baseinfo.buTemplate.accTmpl`, desc: '????????????' })}
            >
              {formData.accTmplName}
            </Description>
            <Description
              term={formatMessage({
                id: `sys.baseinfo.buTemplate.finCalendar`,
                desc: '??????????????????',
              })}
            >
              {formData.finCalendarName}
            </Description>
            <Description
              term={formatMessage({ id: `sys.baseinfo.buTemplate.currCode`, desc: '??????' })}
            >
              {formData.currCodeName}
            </Description>
          </DescriptionList>
          <div className="tw-card-title">
            {formatMessage({ id: `app.settings.menuMap.financeSubj`, desc: '????????????' })}
          </div>
          <div style={{ margin: 12 }}>
            <Table
              domain={`${DOMAIN}`}
              loading={loading.effects[`${DOMAIN}/queryFinanceList`]}
              dataSource={financeList}
              columns={financeColumns}
              rowKey="id"
              bordered
            />
          </div>
        </div>
      ),
      role: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `app.settings.menuMap.role`, desc: '????????????' })}
          </div>
          <div style={{ margin: 12 }}>
            <Table
              // style={{ marginBottom: 24 }}
              domain={`${DOMAIN}`}
              loading={loading.effects[`sysButemprole/queryRoleList`]}
              dataSource={roleList}
              columns={roleColumns.concat()}
              rowKey="id"
              bordered
            />
          </div>
        </div>
      ),
      income: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `app.settings.menuMap.income`, desc: '??????????????????' })}
          </div>
          <div style={{ margin: 12 }}>
            <Table
              domain={`${DOMAIN}`}
              loading={loading.effects[`sysButempincome/queryIncomeList`]}
              dataSource={incomeList}
              columns={incomeColumns.concat()}
              rowKey="id"
              bordered
            />
          </div>
        </div>
      ),
      eqva: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `app.settings.menuMap.eqva`, desc: '????????????' })}
          </div>
          <div style={{ margin: 12 }} className="text-center">
            ?????????????????????
          </div>
        </div>
      ),
      operation: (
        <div>
          <div className="tw-card-title">
            {formatMessage({ id: `app.settings.menuMap.operationRange`, desc: '????????????' })}
          </div>
          <div style={{ margin: 12 }}>
            <Table
              domain={`${DOMAIN}`}
              loading={loading.effects[`sysButempoperation/queryOperateList`]}
              dataSource={operateList}
              columns={operateColumns.concat()}
              rowKey="id"
              bordered
            />
          </div>
          <Divider dashed />
          <div className="tw-card-title">
            {formatMessage({ id: `app.settings.menuMap.examPeriod`, desc: '????????????' })}
          </div>
          <div style={{ margin: 12 }}>
            <Table
              domain={`${DOMAIN}`}
              loading={loading.effects[`sysButempoperation/queryExamPeriodList`]}
              dataSource={examPeriodList}
              columns={examPeriodColumns.concat()}
              rowKey="id"
              bordered
            />
          </div>
        </div>
      ),
    };

    return (
      <PageHeaderWrapper title="BU????????????">
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            icon="form"
            size="large"
            disabled={disabledBtn}
            onClick={() =>
              router.push(
                `/plat/buMgmt/butempedit?id=${formData.id}&mode=update&tab=${operationkey}`
              )
            }
          >
            <Title id="misc.update" defaultMessage="??????" />
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={() => router.push('/plat/buMgmt/butemplate')}
          >
            <Title id="misc.rtn" defaultMessage="??????" />
          </Button>
        </Card>
        <Card
          className="tw-card-multiTab"
          bordered={false}
          tabList={operationTabList}
          onTabChange={this.onOperationTabChange}
        >
          {formData.id ? contentList[operationkey] : <Loading />}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default BuTmplDetailQuery;
