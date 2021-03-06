import React, { Component } from 'react';
import { connect } from 'dva';
import { formatMessage } from 'umi/locale';
import classnames from 'classnames';
import { Button, Card, Form, Input, InputNumber } from 'antd';
import { isNil, cond, equals, T, isEmpty } from 'ramda';

import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DescriptionList from '@/components/layout/DescriptionList';
import DataTable from '@/components/common/DataTable';
import { fromQs } from '@/utils/stringUtils';
import { Selection } from '@/pages/gen/field';
import { sub, mul, add, div, checkIfNumber } from '@/utils/mathUtils';
import { selectFinperiod } from '@/services/user/Contract/sales';

const { Description } = DescriptionList;
const DOMAIN = 'distInfoDetail';

@connect(({ distInfoDetail, loading }) => ({ distInfoDetail, loading }))
@Form.create({
  onValuesChange(props, changedValues, allValues) {
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: changedValues,
    });
  },
})
@mountToTab()
class DistInfoDetail extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id } = fromQs();
    dispatch({
      type: `${DOMAIN}/query`,
      payload: id,
    });
  }

  tableProps = () => {
    const {
      dispatch,
      loading,
      distInfoDetail: { total, list },
    } = this.props;
    const tableProps = {
      columnsCache: DOMAIN,
      dispatch,
      loading: loading.effects[`${DOMAIN}/query`],
      total,
      rowKey: 'groupRole',
      sortBy: 'id',
      sortDirection: 'DESC',
      showSearch: false,
      enableSelection: false,
      dataSource: list,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: changedValues,
        });
      },
      columns: [
        {
          title: '??????????????????',
          dataIndex: 'groupRoleDesc',
        },
        {
          title: '??????BU',
          dataIndex: 'gainerBuName',
        },
        {
          title: '??????????????????????????????',
          dataIndex: 'gainerInallPercent',
          render: value => (value || value === 0) && <span>{value}%</span>,
        },
        {
          title: '??????????????????',
          dataIndex: 'groupBaseTypeDesc',
        },
        {
          title: '??????????????????',
          dataIndex: 'receivedGainAmt',
          align: 'right',
        },
        {
          title: '??????????????????????????????',
          dataIndex: 'confirmedGainAmt',
          align: 'right',
        },
      ],
    };
    return tableProps;
  };

  render() {
    const {
      distInfoDetail: { formData },
    } = this.props;

    // ???????????????????????????
    const isRecv = formData.triggerType === 'RECV_DIST';

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={() => {
              const { sourceUrl } = fromQs();
              sourceUrl
                ? closeThenGoto(sourceUrl)
                : closeThenGoto('/plat/distInfoMgmt/distInfoList');
            }}
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>
        <Card className="tw-card-adjust" bordered={false}>
          <DescriptionList col={2} title="????????????" hasSeparator>
            <Description term="???????????????">{formData.contractInfo}</Description>
            <Description term="????????????">{formData.camt}</Description>
            <Description term="??????">{formData.taxRate}%</Description>
            <Description term="???????????????">{formData.effectiveAmt}</Description>
            <Description term="??????">{formData.grossProfit}</Description>
          </DescriptionList>
          <DescriptionList col={2} title="?????????????????????" hasSeparator>
            <Description term="??????????????????">{formData.recvedAmt}</Description>
            <Description term="???????????????">{formData.actualRecvedAmt}</Description>
            <Description term="?????????????????????">{formData.prevDistRecvedAmt}</Description>
            <Description term="?????????????????????">{formData.batchDistRecvedAmt}</Description>
            <Description term="??????????????????">{isRecv ? formData.finPeriodName : ''}</Description>
            <Description term="????????????????????????">{formData.batchDistRecvedAmt}</Description>
          </DescriptionList>
          <DescriptionList col={2} title="????????????????????????" hasSeparator>
            <Description term="????????????????????????">{formData.confirmAmt}</Description>
            <Description term="?????????????????????">{formData.confirmedAmt}</Description>
            <Description term="?????????????????????">{formData.prevDistConfirmedAmt}</Description>
            <Description term="?????????????????????">{formData.avalAmt}</Description>
            <Description term="??????????????????">{isRecv ? '' : formData.finPeriodName}</Description>
            <Description term="????????????????????????">{formData.batchDistConfirmedAmt}</Description>
          </DescriptionList>
          <DescriptionList size="large" title="????????????????????????" />
          <DataTable {...this.tableProps()} />
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default DistInfoDetail;
