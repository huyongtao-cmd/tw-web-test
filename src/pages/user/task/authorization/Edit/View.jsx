import React from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { Button, Card, Form, Table, Tag } from 'antd';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import { closeThenGoto, markAsTab, mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import classnames from 'classnames';
import { FileManagerEnhance } from '@/pages/gen/field';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { fromQs } from '@/utils/stringUtils';
import { formatDT } from '@/utils/tempUtils/DateTime';
import DescriptionList from '@/components/layout/DescriptionList';
import EvalCommonModal from '@/pages/gen/eval/modal/Common';
import Loading from '@/components/core/DataLoading';

const DOMAIN = 'authonzationDetail';
const { Description } = DescriptionList;

// --------------- 需要的数据写在这里,或者由数据文件import进来(*.data.js) -----------------

/**
 * 公共空白模版页面
 */
@connect(({ loading, user, authonzationDetail }) => ({
  user,
  loading,
  ...authonzationDetail,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    const { name, value } = Object.values(changedFields)[0];
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { [name]: value },
    });
  },
})
@mountToTab()
class AuthView extends React.PureComponent {
  state = {
    visible: false,
    reasonInfo: undefined,
    disFlag: false,
    resFlag: false,
  };

  componentDidMount() {
    const { dispatch, user } = this.props;
    const param = fromQs();
    const {
      user: { extInfo },
    } = user;
    if (param.id) {
      dispatch({
        type: `${DOMAIN}/queryById`,
        payload: param.id,
      }).then(response => {
        if (response.applyStatus === 'IN PROCESS' && response.receiverResId === extInfo.resId) {
          this.setState({ disFlag: false });
        } else {
          this.setState({ disFlag: true });
        }
        if (
          response.applyStatus === 'IN PROCESS' &&
          response.receiverResId === extInfo.resId &&
          response.resPlanExistFlag
        ) {
          this.setState({ resFlag: false });
        } else {
          this.setState({ resFlag: true });
        }
        dispatch({
          type: `${DOMAIN}/getReasonInfo`,
          payload: {
            reasonId: response.reasonId,
            reasonType: response.reasonType,
          },
        }).then(info => {
          this.setState({ reasonInfo: info });
        });
      });
      dispatch({
        type: `${DOMAIN}/queryTaskList`,
        payload: { authorizedId: param.id },
      });
    }
  }

  render() {
    const { loading, formData, dataList = [], hasEval, resId, pageConfig, user } = this.props;
    const { visible, reasonInfo, disFlag, resFlag } = this.state;
    const param = fromQs();

    const tableProps = {
      rowKey: 'id',
      scroll: { x: 1600 },
      bordered: true,
      loading: false,
      pagination: false,
      dataSource: dataList,
      total: dataList.length || 0,
      columns: [
        {
          title: '编码',
          dataIndex: 'taskNo',
          align: 'center',
        },
        {
          title: '任务名称',
          dataIndex: 'taskName',
          align: 'center',
        },
        {
          title: '接收资源',
          dataIndex: 'receiverResName',
          align: 'center',
        },
        {
          title: '复合能力',
          align: 'center',
          dataIndex: 'capasetLeveldName',
        },
        {
          title: 'BU结算价',
          align: 'center',
          dataIndex: 'buSettlePrice',
        },
        {
          title: '总当量',
          dataIndex: 'eqvaQty',
          align: 'center',
        },
        {
          title: '已结算当量',
          align: 'center',
          dataIndex: 'settledEqva',
        },
        {
          title: '验收方式',
          align: 'center',
          dataIndex: 'acceptMethodName',
        },
        {
          title: '已填工时当量',
          align: 'center',
          dataIndex: 'tsUsedEqva',
        },
        {
          title: '发包资源',
          dataIndex: 'disterResName',
          align: 'center',
        },
        {
          title: '创建日期',
          align: 'center',
          dataIndex: 'createTime',
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
        },
      ],
      buttons: [],
    };
    return (
      <PageHeaderWrapper title="任务包信息">
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            size="large"
            onClick={() =>
              router.push(`/user/task/edit?authId=${param.id}&from=/user/authonzation/detail`)
            }
            disabled={disFlag}
          >
            派发任务包
          </Button>
          {formData?.authResPlanFlag && (
            <Button
              className="tw-btn-primary"
              size="large"
              onClick={() =>
                router.push(
                  `/user/project/projectResPlanning?objId=${formData?.reasonId}&planType=2`
                )
              }
              disabled={resFlag}
            >
              资源规划
            </Button>
          )}
        </Card>
        <Card className="tw-card-adjust" bordered={false} title="任务授权详情">
          {/* {!loading.effects[`${DOMAIN}/getPageConfig`] ? this.renderPage() : <Loading />} */}
          <DescriptionList title="" size="large" col={2} hasSeparator>
            <Description term="派发资源">{formData.disterResName}</Description>
            <Description term="编号">{formData.authorizedNo}</Description>
            <Description term="任务授权名称">{formData.name}</Description>
            <Description term="结算负责人">
              {formData.approvedType && formData.approvedType === 'PL' ? '授权资源' : '项目经理'}
            </Description>
            <Description term="事由类型">{formData.reasonTypeName}</Description>
            <Description term="事由号">{formData.reasonName}</Description>
            <Description term="接收资源">{formData.receiverResName}</Description>
            <Description term="费用承担BU">{formData.expenseBuName}</Description>
            <Description term="合作类型">
              {formData.resSourceType && formData.resSourceType === 'INTERNAL_RES'
                ? '内部资源'
                : '外部资源'}
            </Description>
            <Description term="验收方式/计价方式">任务包/总价</Description>
            <Description term="授权派发当量">{formData.authEqva}</Description>
            <Description term="授权做资源规划">
              {formData?.authResPlanFlag ? '是' : '否'}
            </Description>
            <Description term="备注">{formData.remark}</Description>
            <br />
            <Description term="创建人">{formData.disterResName}</Description>
            <Description term="创建日期">{formatDT(formData.createTime)}</Description>
          </DescriptionList>
        </Card>
        <br />
        {formData.receiverResId !== user.user.extInfo.resId && (
          <Card
            className="tw-card-adjust"
            bordered={false}
            title="项目当量详情"
            // style={{ display: formData.receiverResId === user.user.extInfo.resId ? 'none' : '' }}
          >
            {/* {!loading.effects[`${DOMAIN}/getPageConfig`] ? this.renderPage() : <Loading />} */}
            <DescriptionList title="" size="large" col={2} hasSeparator>
              <Description term="项目预算当量">{reasonInfo?.budgetEqva}</Description>
              <Description term="已拨付当量">{reasonInfo?.appropriationEqva}</Description>
              <Description term="已派发任务包当量">{reasonInfo?.distedEqva}</Description>
              <Description term="已授权派发当量">
                {reasonInfo?.authedEqva ?? ''}/{reasonInfo?.authedDistedEqva ?? ''}
              </Description>
              <Description term="剩余可用当量">{reasonInfo?.availabledEqva}</Description>
            </DescriptionList>
          </Card>
        )}
        <br />
        <Card className="tw-card-adjust" bordered={false} title="任务包派发纪录">
          <Table {...tableProps} />
        </Card>

        {/* {!taskId && !disabledBtn && <BpmConnection source={allBpm} />} */}

        <EvalCommonModal
          modalLoading={loading.effects[`evalCommonModal/query`]}
          visible={visible}
          toggle={() => this.setState({ visible: !visible })}
        />
      </PageHeaderWrapper>
    );
  }
}
export default AuthView;
