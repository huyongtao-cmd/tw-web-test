import React from 'react';
import { connect } from 'dva';
import Link from 'umi/link';
import { Card, Row, Col, Input, Radio, Button } from 'antd';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { mountToTab, closeThenGoto, markAsTab } from '@/layouts/routerControl';
import DataTable from '@/components/common/DataTable';
import FieldList from '@/components/layout/FieldList';
import { Selection, DatePicker } from '@/pages/gen/field';
import classnames from 'classnames';
import { formatMessage } from 'umi/locale';

const DOMAIN = 'growthRecordAbilityAccess';

@connect(({ loading, growthRecordAbilityAccess, dispatch }) => ({
  loading: loading.effects[`${DOMAIN}/query`],
  growthRecordAbilityAccess,
  dispatch,
}))
@mountToTab()
class GrowthRecordAbilityAccess extends React.Component {
  componentDidMount() {
    const { dispatch } = this.props;
    this.fetchData({
      offset: 0,
      limit: 10,
      sortBy: 'problemTime',
      sortDirection: 'DESC',
    });
    dispatch({
      type: `${DOMAIN}/queryCapaset`,
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    const obj = {
      ...params,
      no: params.no || void 0,
      apprStatus: params.apprStatus || void 0,
      examPoint: params.examPoint || void 0,
      accessFlag: params.accessFlag || void 0,
      startDate: params.applyDate && params.applyDate[0],
      endDate: params.applyDate && params.applyDate[1],
      applyDate: void 0,
    };
    dispatch({
      type: `${DOMAIN}/query`,
      payload: obj,
    });
  };

  render() {
    const {
      growthRecordAbilityAccess: { dataSource, total, capasetData },
      dispatch,
      loading,
    } = this.props;
    const tableProps = {
      columnsCache: DOMAIN,
      dispatch,
      loading,
      expirys: 0,
      rowKey: 'id',
      sortBy: 'problemTime',
      sortDirection: 'DESC',
      dataSource,
      total,
      enableSelection: false,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        // dispatch({
        //   type: `${DOMAIN}/updateSearchForm`,
        //   payload: allValues,
        // });
      },
      searchBarForm: [
        {
          title: '流程编号',
          dataIndex: 'no',
          options: {
            // initialValue: ,
          },
          tag: <Input placeholder="请输入流程编号" />,
        },
        {
          title: '状态',
          dataIndex: 'apprStatus',
          options: {
            // initialValue: ,
          },
          tag: <Selection.UDC code="COM.APPR_STATUS" placeholder="请选择状态" />,
        },
        {
          title: '申请权限能力',
          dataIndex: 'examPoint',
          options: {
            // initialValue: ,
          },
          tag: (
            <Selection.Columns
              source={capasetData}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              placeholder="请选择复合能力"
              showSearch
            />
          ),
        },
        {
          title: '审批结果',
          dataIndex: 'accessFlag',
          options: {
            initialValue: '',
          },
          tag: (
            <Radio.Group>
              <Radio value="YES">开放权限</Radio>
              <Radio value="NO">未开放权限</Radio>
              <Radio value="">全部</Radio>
            </Radio.Group>
          ),
        },
        {
          title: '申请时间',
          dataIndex: 'applyDate',
          options: {
            // initialValue: ,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
      ],
      columns: [
        {
          title: '流程编号',
          align: 'center',
          dataIndex: 'no',
          key: 'no',
          width: '15%',
          render: (value, row) => {
            const href = `/user/center/growth/compoundPermission/view?id=${row.id}&mode=view`;
            return (
              <Link className="tw-link" to={href}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '状态',
          align: 'center',
          dataIndex: 'apprStatusName',
          key: 'apprStatusName',
          width: '10%',
        },
        {
          title: '申请权限能力',
          align: 'center',
          dataIndex: 'name',
          key: 'name',
          width: '20%',
          // sorter: true,
        },
        // {
        //   title: '当量系数',
        //   align: 'center',
        //   dataIndex: 'certNo',
        //   key: 'certNo',
        //   width: '15%',
        // },
        // {
        //   title: '能力描述',
        //   align: 'center',
        //   dataIndex: 'attachment',
        //   key: 'accessFlag',
        //   width: '15%',
        //   render: val => '附件',
        // },
        {
          title: '审批结果',
          align: 'center',
          dataIndex: 'accessFlag',
          key: 'accessFlag',
          width: '10%',
        },
        {
          title: '申请时间',
          align: 'center',
          dataIndex: 'applyDate',
          key: 'applyDate',
        },
      ],
    };
    return (
      <PageHeaderWrapper title="能力权限申请记录">
        <Card className="tw-card-rightLine">
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            onClick={() => closeThenGoto('/user/center/growth')}
          >
            {formatMessage({ id: `misc.rtn`, desc: '返回' })}
          </Button>
        </Card>
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default GrowthRecordAbilityAccess;
