import React, { PureComponent } from 'react';
import { connect } from 'dva';
import Link from 'umi/link';
import { Input, InputNumber, Modal, Tooltip } from 'antd';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker, BuVersion } from '@/pages/gen/field';
import { isEmpty, isNil } from 'ramda';
import router from 'umi/router';
import createMessage from '@/components/core/AlertMessage';
import FieldList from '@/components/layout/FieldList';
import { add, div, mul, sub, genFakeId } from '@/utils/mathUtils';
import { selectCust } from '@/services/user/Contract/sales';
import { selectBus } from '@/services/org/bu/bu';
import { log } from 'lodash-decorators/utils';

const { Field } = FieldList;

const DOMAIN = 'emergencyPaymentList';

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];
@connect(({ loading, emergencyPaymentList, dispatch, global }) => ({
  emergencyPaymentList,
  loading,
  dispatch,
  global,
}))
class EmergencyPaymentList extends PureComponent {
  state = {
    splitAmtSelectedRows: [],
    splitAmt: null,
    visible: false,
  };

  componentDidMount() {
    this.fetchData({
      offset: 0,
      limit: 10,
      sortBy: 'id',
      sortDirection: 'DESC',
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...params,
      },
    });
  };

  // 行编辑触发事件
  onCellChanged = (index, value, name) => {
    const {
      channelFeeList: { list },
      dispatch,
    } = this.props;

    const newDataSource = list;
    newDataSource[index] = {
      ...newDataSource[index],
      [name]: value,
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { list: newDataSource },
    });
  };

  splitAmt = () => {
    const {
      channelFeeList: { list, searchForm },
      dispatch,
    } = this.props;
    const { splitAmtSelectedRows = [], splitAmt } = this.state;

    const arrIndex = list.findIndex(v => v.id === splitAmtSelectedRows[0].id);

    const allAmt = list[arrIndex]?.children?.map(v => v.amt).reduce((x, y) => add(x, y), 0) || 0;

    // 子明细总金额不能超过主明细金额
    if (add(+allAmt, +splitAmt) > +list[arrIndex].amt) {
      createMessage({
        type: 'warn',
        description: '子明细总金额不能超过主明细金额！',
      });
      return;
    }

    list[arrIndex].children = [
      ...(list[arrIndex].children || []),
      {
        ...splitAmtSelectedRows[0],
        minChannelCostConId: splitAmtSelectedRows[0].id,
        sortNo: `${splitAmtSelectedRows[0].sortNo}.${(list[arrIndex]?.children || []).length + 1}`,
        id: genFakeId(-1),
        amt: splitAmt,
        taxCost: mul(div(splitAmtSelectedRows[0].taxRate || 0, 100), splitAmt), // 计算税率
        netPay: mul(div(splitAmt, 100), add(+splitAmtSelectedRows[0].taxRate || 0, 100)), // 计算净支付额
        applyStatus: null,
        applyStatusName: null,
        apprStatus: null,
        apprStatusName: null,
      },
    ];

    dispatch({
      type: `${DOMAIN}/save`,
      payload: { ...list[arrIndex] },
    }).then(res => {
      if (res && res.ok) {
        // createMessage({ type: 'error', description: "保存成功" });
        this.fetchData({
          ...searchForm,
        });
      } else {
        createMessage({ type: 'error', description: res.reason || '保存失败' });
      }
    });

    this.toggleVisible();
    // 关闭弹窗，清除数据
    this.setState({
      splitAmt: null,
      splitAmtSelectedRows: [],
    });
  };

  toggleVisible = () => {
    const { visible } = this.state;
    this.setState({ visible: !visible });
  };

  render() {
    const {
      loading,
      dispatch,
      emergencyPaymentList: { list = [], total = 0, searchForm },
      global: { userList },
    } = this.props;
    const { splitAmt, visible } = this.state;

    const tableLoading = loading.effects[`${DOMAIN}/query`];

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      loading: tableLoading,
      total,
      dataSource: list,
      // enableSelection: false,
      onChange: filters => this.fetchData(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchForm,
      searchBarForm: [
        {
          title: '申请单编号',
          dataIndex: 'paymentNo',
          options: {
            initialValue: searchForm.paymentNo || undefined,
          },
          tag: <Input placeholder="请输入渠道费用处理单号" />,
        },
        {
          title: '申请人',
          key: 'applyResName',
          dataIndex: 'applyResName',
          options: {
            initialValue: searchForm.applyResName || undefined,
          },
          tag: (
            <Selection.Columns
              className="x-fill-100"
              source={userList}
              columns={particularColumns}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              dropdownMatchSelectWidth
              showSearch
              onColumnsChange={value => {}}
              placeholder="请选择申请人"
            />
          ),
        },
        {
          title: '流程编号',
          dataIndex: 'flowNo',
          options: {
            initialValue: searchForm.flowNo || undefined,
          },
          tag: <Input placeholder="请输入流程编号" />,
        },
        {
          title: '付款申请单编号',
          dataIndex: 'purchasePaymentNo',
          options: {
            initialValue: searchForm.purchasePaymentNo || undefined,
          },
          tag: <Input placeholder="请输入付款申请单编号" />,
        },
        {
          title: '付款申请单名称',
          dataIndex: 'purchasePaymentName',
          key: 'purchasePaymentName',
          // options: {
          //   initialValue: searchForm.purchasePaymentName,
          // },
          tag: <Selection source={() => selectCust()} placeholder="请输入客户" />,
        },
        {
          title: '付款申请人',
          dataIndex: 'purchaseInchargeResId',
          options: {
            initialValue: searchForm.purchaseInchargeResId || undefined,
          },
          tag: (
            <Selection.Columns
              className="x-fill-100"
              source={userList}
              columns={particularColumns}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              dropdownMatchSelectWidth
              showSearch
              onColumnsChange={value => {}}
              placeholder="请选择付款申请人"
            />
          ),
        },
      ],
      columns: [
        {
          title: '申请单编号',
          key: 'paymentNo',
          dataIndex: 'paymentNo',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '申请人',
          key: 'applyResName',
          dataIndex: 'applyResName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '流程编号',
          key: 'flowNo',
          dataIndex: 'flowNo',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '付款申请单编号',
          key: 'purchasePaymentNo',
          dataIndex: 'purchasePaymentNo',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '付款申请单名称',
          key: 'purchasePaymentName',
          dataIndex: 'purchasePaymentName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        // {
        //   title: '付款申请人',
        //   key: 'purchaseInchargeResId',
        //   dataIndex: 'purchaseInchargeResId',
        //   align: 'center',
        //   width: 150,
        //   render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        // },
        {
          title: '付款申请人名称',
          key: 'purchaseInchargeResName',
          dataIndex: 'purchaseInchargeResName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '备注',
          key: 'remark',
          dataIndex: 'remark',
          align: 'center',
          width: 150,
          render: (value, row, key) =>
            value && value.length > 12 ? (
              <Tooltip placement="left" title={<pre>{value}</pre>}>
                <span>{`${value.substr(0, 12)}...`}</span>
              </Tooltip>
            ) : (
              <span>{value}</span>
            ),
        },
      ],
      leftButtons: [],
    };

    return (
      <PageHeaderWrapper title="紧急付款列表查询">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default EmergencyPaymentList;
