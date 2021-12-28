/* eslint-disable arrow-body-style */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { mountToTab } from '@/layouts/routerControl';

import Link from 'umi/link';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, BuVersion } from '@/pages/gen/field';
import SelectWithCols from '@/components/common/SelectWithCols';
import { Input, Radio, InputNumber, Select } from 'antd';
import SyntheticField from '@/components/common/SyntheticField';
import { getBuVersionAndBuParams } from '@/utils/buVersionUtils';

const DOMAIN = 'adviserList';
const formItemLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
const { Option } = Select;

@connect(({ loading, adviserList, user, dispatch }) => ({
  loading: loading.effects[`${DOMAIN}/query`],
  user,
  adviserList,
  dispatch,
}))
@mountToTab()
class AdviserList extends PureComponent {
  componentDidMount() {
    // const { dispatch } = this.props;

    const {
      dispatch,
      user: {
        user: { extInfo },
      },
    } = this.props;
    this.fetchData();
    // dispatch({ type: `applyAdviser/fetchSelectCapasetLevel` });
    // dispatch({ type: `applyAdviser/queryReason`, payload: extInfo.resId });;
  }

  fetchData = async params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
        // ...getBuVersionAndBuParams(params.baseBuId, 'baseBuId', 'baseBuVersionId'),
      },
    });
  };

  render() {
    const {
      dispatch,
      loading,
      // applyAdviser: { abilityList, projectList, preSaleTaskList },
      adviserList: {
        dataSource,
        total,
        searchForm,
        baseBuData,
        baseBuDataSource,
        capasetData,
        capaData,
        pageConfig,
      },
    } = this.props;
    // console.warn(dataSource)
    const tableProps = {
      columnsCache: DOMAIN,
      dispatch,
      loading,
      expirys: 0,
      total,
      rowKey: 'id',
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: {
        x: '150%',
      },
      // showExport,
      enableSelection: false,
      // filterMultiple: false,
      dataSource,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: {
            ...allValues,
          },
        });
      },
      searchBarForm: [
        {
          title: '事由类型',
          dataIndex: 'reasonType',
          options: {
            initialValue: searchForm.reasonType,
          },
          formItemLayout,
          tag: (
            <Select style={{ width: '100%' }}>
              <Option value="PROJ">项目</Option>
              <Option value="OPPO">售前</Option>
            </Select>
          ),
        },
        {
          title: '事由号',
          dataIndex: 'reasonId',
          options: {
            initialValue: searchForm.reasonId,
          },
          formItemLayout,
          tag: <Input placeholder="请输入事由号" />,
        },
        {
          title: '顾问姓名',
          dataIndex: 'consultantName',
          options: {
            initialValue: searchForm.consultantName,
          },
          formItemLayout,
          tag: <Input placeholder="请输入顾问姓名" />,
        },
        {
          title: '申请人',
          dataIndex: 'applyResName',
          options: {
            initialValue: searchForm.applyResName,
          },
          formItemLayout,
          tag: <Input placeholder="请输入申请人" />,
        },
      ],
      columns: [
        {
          title: '派工单编号',
          dataIndex: 'applyNo',
          width: 120,
          align: 'center',
          render: (value, rowData) => {
            const { id } = rowData;
            // const href = `/hr/res/resFindDetail?id=${id}`;
            const href = `/hr/res/adviserView?id=${id}`;
            return (
              <Link className="tw-link" to={href}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '派工单名称',
          dataIndex: 'applyName',
          align: 'center',
          render: (value, rowData) => {
            const { id } = rowData;
            // const href = `/hr/res/resFindDetail?id=${id}`;
            const href = `/hr/res/adviserView?id=${id}`;
            return (
              <Link className="tw-link" to={href}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '事由类型',
          dataIndex: 'reasonType',
          align: 'center',
          render: value => {
            return <span>{value === 'PROJ' ? '项目' : '售前'}</span>;
          },
        },
        {
          title: '事由号',
          dataIndex: 'reasonName',
          align: 'center',
        },
        {
          title: '顾问姓名',
          dataIndex: 'consultantName',
          align: 'center',
        },
        {
          title: '复合能力',
          dataIndex: 'capasetLevelName',
          align: 'center',
          // render: (value,rowData) => {
          //   const capItem = abilityList.filter((item)=>item.id===value);
          //   return <span>{capItem.name}</span>
          // }
        },
        {
          title: '人天单价',
          dataIndex: 'serviceFee',
          align: 'center',
          // width: '20%',
        },
        {
          title: '是否含税',
          dataIndex: 'isTax',
          align: 'center',
          render: value => {
            return <span>{value ? '是' : '否'}</span>;
          },
        },
        {
          title: '预计入场日期',
          dataIndex: 'expectedStartDate',
          align: 'center',
        },
        {
          title: '预计结束日期',
          dataIndex: 'expectedEndDate',
          align: 'center',
        },
        {
          title: '申请人',
          dataIndex: 'applyResName',
          align: 'center',
        },
        {
          title: '申请日期',
          dataIndex: 'applyDate',
          align: 'center',
        },
        {
          title: '审批状态',
          dataIndex: 'apprStatusName',
          align: 'center',
        },
      ],
    };

    return (
      <PageHeaderWrapper title="派工单列表">
        <DataTable {...tableProps} />
        {/* 列表页 */}
      </PageHeaderWrapper>
    );
  }
}

export default AdviserList;
