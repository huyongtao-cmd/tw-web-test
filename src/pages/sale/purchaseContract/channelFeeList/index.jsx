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

const DOMAIN = 'channelFeeList';

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];
@connect(({ loading, channelFeeList, dispatch, global }) => ({
  channelFeeList,
  loading,
  dispatch,
  global,
}))
class channelFeeList extends PureComponent {
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
      channelFeeList: { list = [], total = 0, searchForm },
      global: { userList },
    } = this.props;
    const { splitAmt, visible } = this.state;

    const tableLoading = loading.effects[`${DOMAIN}/query`];

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: { x: 4200 },
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
        // {
        //   title: '合同编号',
        //   dataIndex: 'contractNo',
        //   options: {
        //     initialValue: searchForm.contractNo || undefined,
        //   },
        //   tag: <Input placeholder="请输入合同编号" />,
        // },
        // {
        //   title: '合同名称',
        //   dataIndex: 'contractName',
        //   options: {
        //     initialValue: searchForm.contractName || undefined,
        //   },
        //   tag: <Input placeholder="请输入合同名称" />,
        // },
        {
          title: '渠道费用编号',
          dataIndex: 'channelCostNo',
          options: {
            initialValue: searchForm.channelCostNo || undefined,
          },
          tag: <Input placeholder="请输入渠道费用处理单号" />,
        },
        {
          title: '签单BU',
          key: 'signBuId',
          dataIndex: 'signBuId',
          options: {
            initialValue: searchForm.signBuId,
          },
          tag: <Selection source={() => selectBus()} placeholder="请选择签单BU" />,
        },
        // {
        //   title: '关联单据号',
        //   dataIndex: 'documentNumber',
        //   options: {
        //     initialValue: searchForm.documentNumber || undefined,
        //   },
        //   tag: <Input placeholder="请输入关联单据号" />,
        // },
        // {
        //   title: '关联单据类型',
        //   dataIndex: 'docType',
        //   options: {
        //     initialValue: searchForm.docType || undefined,
        //   },
        //   tag: <Selection.UDC code="TSK:DOC_TYPE" placeholder="请选择关联单据类型" />,
        // },
        {
          title: '申请人',
          dataIndex: 'applyResId',
          options: {
            initialValue: searchForm.applyResId,
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
        // {
        //   title: '申请BU',
        //   dataIndex: 'applyBuId',
        //   options: {
        //     initialValue: searchForm.applyBuId,
        //   },
        //   tag: <Selection.ColumnsForBu placeholder="请选择申请BU" />,
        // },
        {
          title: '申请日期',
          dataIndex: 'date',
          options: {
            initialValue: searchForm.date,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
        {
          title: '合同号',
          dataIndex: 'userdefinedNo',
          key: 'userdefinedNo',
          options: {
            initialValue: searchForm.userdefinedNo,
          },
          tag: <Input placeholder="请输入参考合同号" />,
        },
        {
          title: '客户',
          dataIndex: 'custId',
          key: 'custId',
          options: {
            initialValue: searchForm.custId,
          },
          tag: <Selection source={() => selectCust()} placeholder="请输入客户" />,
        },
        {
          title: '状态',
          dataIndex: 'applyStatus',
          options: {
            initialValue: searchForm.applyStatus,
          },
          tag: <Selection.UDC code="ACC:CHANNEL_COST_CON_D_STATUS" placeholder="请选择审批状态" />,
        },
      ],
      columns: [
        {
          title: '渠道费用单号',
          key: 'channelCostNo',
          dataIndex: 'channelCostNo',
          align: 'center',
          width: 150,
          fixed: true,
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
          title: '申请日期',
          key: 'applyDate',
          dataIndex: 'applyDate',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '申请BU',
          key: 'applyBuName',
          dataIndex: 'applyBuName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '销售合同号',
          key: 'userdefinedNo',
          dataIndex: 'userdefinedNo',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        // {
        //   title: '销售合同编号',
        //   key: 'contractNo',
        //   dataIndex: 'contractNo',
        //   align: 'center',
        //   width: 150,
        //   fixed: true,
        //   sorter: true,
        // },
        {
          title: '销售合同名称',
          key: 'contractName',
          dataIndex: 'contractName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '客户名称',
          key: 'custName',
          dataIndex: 'custName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '渠道费用备注',
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
        {
          title: '工作类型',
          key: 'workType',
          dataIndex: 'workTypeName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '具体理由',
          key: 'reason',
          dataIndex: 'reason',
          width: 250,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '伙伴类型',
          key: 'coopTypeName',
          dataIndex: 'coopTypeName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '合作方',
          key: 'channelCostRem',
          dataIndex: 'channelCostRem',
          width: 250,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '基于',
          key: 'baseName',
          dataIndex: 'baseName',
          align: 'center',
          width: 100,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '比例',
          key: 'proportion',
          dataIndex: 'proportion',
          align: 'center',
          width: 100,
          render: (value, row, index) => (row.minChannelCostConId ? '' : `${value || 0}%`),
        },
        {
          title: '金额(不含税)',
          key: 'amt',
          dataIndex: 'amt',
          align: 'right',
          width: 150,
          render: value => value?.toFixed(2) || '0.00',
        },
        {
          title: '税费率',
          key: 'taxRate',
          dataIndex: 'taxRate',
          align: 'center',
          width: 100,
          render: val => `${val || 0}%`,
        },
        {
          title: '税费',
          key: 'taxCost',
          dataIndex: 'taxCost',
          align: 'right',
          width: 100,
          render: val => (!isNil(val) && val.toFixed(2)) || '0.00',
        },
        {
          title: '税费承担方',
          key: 'reimExp',
          dataIndex: 'reimExpName',
          align: 'center',
          width: 150,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '净支付额',
          key: 'netPay',
          dataIndex: 'netPay',
          align: 'right',
          width: 150,
          render: val => (!isNil(val) && val.toFixed(2)) || '0.00',
        },
        {
          title: '具体支付方式',
          key: 'salaryMethod',
          dataIndex: 'salaryMethodName',
          align: 'center',
          width: 200,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '收款节点',
          key: 'receivingNode',
          dataIndex: 'receivingNodeName',
          align: 'center',
          width: 200,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '线下合同&沟通签署状态',
          key: 'contractStatus',
          dataIndex: 'contractStatus',
          align: 'center',
          width: 250,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '联系人姓名',
          key: 'contactName',
          dataIndex: 'contactName',
          align: 'center',
          width: 200,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '联系人电话',
          key: 'contactPhone',
          dataIndex: 'contactPhone',
          align: 'center',
          width: 200,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '关联单据类型',
          key: 'docType',
          dataIndex: 'docType',
          align: 'center',
          width: 150,
        },
        {
          title: '关联单据号',
          key: 'documentNumber',
          dataIndex: 'documentNumber',
          align: 'center',
          width: 200,
          render: (val, row) => {
            const href =
              row.docType === '采购合同'
                ? `/sale/purchaseContract/Detail?id=${
                    row.documentId
                  }&pageMode=purchase&from=CONTRACT`
                : `/plat/expense/normal/view?id=${row.documentId}`;
            return (
              <Link className="tw-link" to={href}>
                {val}
              </Link>
            );
          },
        },
        {
          title: '明细状态',
          key: 'channelCostConDStatus',
          dataIndex: 'channelCostConDStatusName',
          align: 'center',
          width: 100,
          render: (value, row, index) => (row.minChannelCostConId ? '' : value),
        },
        {
          title: '状态',
          key: 'applyStatus',
          dataIndex: 'applyStatusName',
          align: 'center',
          width: 100,
        },
      ],
      leftButtons: [
        {
          key: 'edit',
          className: 'tw-btn-primary',
          title: '生成采购合同',
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            !selectedRows.filter(v => v.minChannelCostConId).length ||
            selectedRows.filter(v => v.contractNo).length,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const target = list.filter(
              targetMinChannelCostCon =>
                targetMinChannelCostCon.id === selectedRows[0].minChannelCostConId
            )[0];
            const index = selectedRows.findIndex(
              item =>
                // item.minChannelCostConId
                list.filter(
                  minChannelCostCon => minChannelCostCon.id === item.minChannelCostConId
                )[0].contractId !== target.contractId
            );
            if (index > -1) {
              createMessage({
                type: 'warn',
                description: '不是同一合同，不可同时生成采购合同！',
              });
              return;
            }
            // if(selectedRows.findIndex(item=>(isNil(item.projectId))) > -1)  {
            if (isNil(target.projectId)) {
              createMessage({
                type: 'warn',
                description: '合同尚未关联项目，不能生成采购合同！',
              });
              return;
            }

            // if (selectedRows.findIndex(item=>(item.saleContractStatus !== 'ACTIVE')) > -1) {
            if (target.saleContractStatus !== 'ACTIVE') {
              createMessage({
                type: 'warn',
                description: '子合同尚未激活，不能生成采购合同！',
              });
              return;
            }
            if (
              selectedRows.findIndex(
                item =>
                  list.filter(
                    targetMinChannelCostCon =>
                      targetMinChannelCostCon.id === item.minChannelCostConId
                  )[0].applyStatus !== 'ACTIVE'
              ) > -1
            ) {
              createMessage({
                type: 'warn',
                description: '明细尚未激活，不能生成采购合同！',
              });
              return;
            }

            if (isEmpty(selectedRowKeys)) {
              createMessage({
                type: 'warn',
                description: '请选择需要生成采购合同的渠道费用子明细！',
              });
              return;
            }

            const tt = selectedRows.filter(v => v.docType || v.documentNumber);
            if (!isEmpty(tt)) {
              createMessage({
                type: 'warn',
                description:
                  '选择的渠道费用子明细包含有已经生成采购合同的明细，不能再生成采购合同！',
              });
              return;
            }

            const selectedSortNo = selectedRows.map(v => v.sortNo).join(',');
            router.push(
              `/sale/purchaseContract/Edit?mode=edit&purchaseType=CONTRACT&businessType=CHANNEL_COST&contractId=${
                target.contractId
              }&selectedSortNo=${selectedSortNo}&from=contract&fromTab=ChannelFee`
            );

            // dispatch({
            //   type: `${DOMAIN}/save`,
            // }).then(res => {
            //   if (res.ok) {
            //     const selectedSortNo = selectedRows.map(v => v.sortNo).join(',');
            //     router.push(
            //       `/sale/purchaseContract/Edit?mode=edit&purchaseType=CONTRACT&businessType=CHANNEL_COST&contractId=${
            //         fromQs().id
            //       }&selectedSortNo=${selectedSortNo}&from=contract&fromTab=ChannelFee`
            //     );
            //   }
            // });
          },
        },
        {
          key: 'split',
          icon: 'scissor',
          className: 'tw-btn-primary',
          title: '按金额拆分',
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            selectedRows.length !== 1 ||
            selectedRows.filter(v => v.minChannelCostConId).length > 0 ||
            !selectedRows.filter(v => v.contractNo).length,
          // selectedRows.filter(v => v.contractStatus !== 'CREATE').length,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            if (selectedRows.findIndex(item => item.minChannelCostConId) > -1) {
              createMessage({
                type: 'warn',
                description: '只能对主明细进行拆分操作！',
              });
              return;
            }

            if (selectedRows.findIndex(item => item.applyStatus !== 'ACTIVE') > -1) {
              createMessage({
                type: 'warn',
                description: '明细尚未激活，不能按金额拆！',
              });
              return;
            }

            // if (isNil(selectedRows[0].amt)) {
            //   createMessage({
            //     type: 'warn',
            //     description: '请先填写所选主明细金额，拆分明细后将不可更改！',
            //   });
            //   return;
            // }

            // if (isNil(selectedRows[0].taxRate)) {
            //   createMessage({
            //     type: 'warn',
            //     description: '请先填写所选主明细税费率，拆分明细后将不可更改！',
            //   });
            //   return;
            // }

            this.setState({
              splitAmtSelectedRows: selectedRows,
            });

            this.toggleVisible();
          },
        },
        {
          key: 'reimbursement',
          className: 'tw-btn-primary',
          title: '生成报销单',
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            !selectedRows.filter(v => v.minChannelCostConId).length ||
            selectedRows.filter(v => v.contractNo).length ||
            selectedRows.findIndex(
              item =>
                list.filter(
                  targetMinChannelCostCon => targetMinChannelCostCon.id === item.minChannelCostConId
                )[0].salaryMethod !== 'PROJECT'
            ) > -1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const target = list.filter(
              targetMinChannelCostCon =>
                targetMinChannelCostCon.id === selectedRows[0].minChannelCostConId
            )[0];
            const index = selectedRows.findIndex(
              item =>
                // item.minChannelCostConId
                list.filter(
                  minChannelCostCon => minChannelCostCon.id === item.minChannelCostConId
                )[0].contractId !== target.contractId
            );
            if (index > -1) {
              createMessage({
                type: 'warn',
                description: '不是同一合同，不能生成报销单！',
              });
              return;
            }

            if (target.saleContractStatus !== 'ACTIVE') {
              createMessage({
                type: 'warn',
                description: '子合同尚未激活，不能生成报销单！',
              });
              return;
            }

            if (
              selectedRows.findIndex(
                item =>
                  list.filter(
                    targetMinChannelCostCon =>
                      targetMinChannelCostCon.id === item.minChannelCostConId
                  )[0].applyStatus !== 'ACTIVE'
              ) > -1
            ) {
              createMessage({
                type: 'warn',
                description: '明细尚未激活，不能生成报销单！',
              });
              return;
            }

            if (isEmpty(selectedRowKeys)) {
              createMessage({
                type: 'warn',
                description: '请选择需要生成报销单渠道费用子明细！',
              });
              return;
            }

            const tt = selectedRows.filter(v => v.docType || v.documentNumber);
            if (!isEmpty(tt)) {
              createMessage({
                type: 'warn',
                description: '选择的渠道费用子明细已经生成报销单，不能再生成报销单！',
              });
              return;
            }

            const selectedSortNo = selectedRows.map(v => v.id).join(',');
            router.push(
              `/plat/expense/normal/create?contractNo=${target.contractNo}&contractId=${
                target.id
              }&contractName=${
                target.contractName
              }&channelCostConDIds=${selectedSortNo}&netPay=${selectedRows.reduce(
                (p, e) => add(p, e.netPay),
                0
              )}`
            );
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper title="渠道费用列表查询">
        <DataTable {...tableProps} />
        {/*<SearchTable {...tableProps} />*/}

        <Modal
          destroyOnClose
          title="主明细拆分"
          visible={visible}
          onOk={() => {
            this.splitAmt();
          }}
          onCancel={() => this.toggleVisible()}
          width="50%"
        >
          <FieldList col={2}>
            <Field
              name="artSubTitle"
              label="拆分金额"
              decorator={{
                initialValue: splitAmt || null,
              }}
              presentational
            >
              <InputNumber
                className="x-fill-100"
                precision={2}
                min={0}
                placeholder="请输入拆分金额"
                onChange={e => {
                  this.setState({
                    splitAmt: e,
                  });
                }}
              />
            </Field>
          </FieldList>
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default channelFeeList;
