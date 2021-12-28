import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Input, InputNumber, Form, Modal, Popconfirm, Card, Table } from 'antd';
import { Selection, DatePicker } from '@/pages/gen/field';
import router from 'umi/router';
import { fromQs } from '@/utils/stringUtils';
import Link from 'umi/link';
import EditableDataTable from '@/components/common/EditableDataTable';
import DataTable from '@/components/common/DataTable';
import FieldList from '@/components/layout/FieldList';
import createMessage from '@/components/core/AlertMessage';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import Title from '@/components/layout/Title';
import BusinessForm from '@/components/production/business/BusinessForm';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import FormItem from '@/components/production/business/FormItem';
import { isEmpty, isNil, clone } from 'ramda';
import update from 'immutability-helper';
import {
  pageBasicBlockConfig,
  pageFormBlockConfig,
  pageColumnsBlockConfig,
} from '@/utils/pageConfigUtils';
import { add, div, mul, sub, genFakeId } from '@/utils/mathUtils';
import { save } from '../../../../services/sys/system/datapower';

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];

const { Field } = FieldList;

const DOMAIN = 'channelFeeDetail';

@connect(({ loading, dispatch, channelFeeDetail, userContractEditSub, global }) => ({
  loading,
  dispatch,
  channelFeeDetail,
  userContractEditSub,
  global,
}))
@Form.create({
  onValuesChange(props, changedValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });

      props.dispatch({
        type: `userContractEditSub/updateState`,
        payload: {
          flag7: 1,
        },
      });
    }
  },
})
class ChannelFeeDetail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      splitAmt: null,
      // splitAmtSelectedRows: [],
    };
  }

  componentDidMount() {
    // 初始得到主合同id给formData赋值
    const { dispatch } = this.props;
    const { id, taskId } = fromQs();
    console.log(taskId);
    id &&
      dispatch({
        type: `${DOMAIN}/query`,
        payload: { channelCostCosDID: id },
      });
    taskId
      ? dispatch({
          type: `${DOMAIN}/fetchConfig`,
          payload: taskId,
        })
      : dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            fieldsConfig: {},
          },
        });
  }

  // 行编辑触发事件
  onCellChanged = (index, value, name) => {
    const {
      channelFeeDetail: { dataSource },
      dispatch,
    } = this.props;
    const findIndex = dataSource.findIndex(item => `${item.id}` === fromQs().id);
    // debugger
    const newDataSource = dataSource;
    newDataSource[findIndex] = {
      ...newDataSource[findIndex],
      [name]: value,
    };

    if (
      Array.isArray(newDataSource[findIndex].children) &&
      !isEmpty(newDataSource[findIndex].children)
    ) {
      newDataSource[findIndex] = {
        ...newDataSource[findIndex],
        children: newDataSource[findIndex].children.map(v => ({ ...v, [name]: value })),
      };
    }

    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { dataSource: newDataSource },
    });

    // // 影响表单的需求总金额字段
    // if (name === 'taxAmt') {
    //   dispatch({
    //     type: `${DOMAIN}/updateForm`,
    //     payload: {
    //       demandTotalAmo: newDataSource.map(v => v.taxAmt).reduce((x, y) => add(x || 0, y || 0)),
    //     },
    //   });
    // }
    dispatch({
      type: 'userContractEditSub/updateState',
      payload: { flag7: 1 },
    });
  };

  // 配置所需要的内容
  renderPage = () => {
    const {
      dispatch,
      channelFeeDetail: { formData, pageConfig = {} },
      global: { userList },
      form: { getFieldDecorator, setFieldsValue },
      form,
    } = this.props;
    const disabledFlag = formData.contractStatus !== 'CREATE' && false;
    const fields = [
      <BusinessFormTitle title="基本信息" />,
      <FormItem
        fieldType="BaseInput"
        label="渠道费用处理单号"
        fieldKey="channelCostNo"
        descriptionField="channelCostNo"
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="关联销售合同"
        fieldKey="contractNo"
        descriptionField="contractNo"
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="关联商机"
        fieldKey="oppoId"
        descriptionField="oppoId"
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="申请人"
        fieldKey="applyResId"
        descriptionField="applyResName"
        required
      />,
      <FormItem
        label="申请日期"
        key="applyDate"
        fieldKey="applyDate"
        fieldType="BaseDatePicker"
        required
      />,
      <FormItem label="申请BU" key="buName" fieldKey="buName" fieldType="BaseInput" required />,
      <FormItem
        label="渠道费用备注说明"
        key="channelCostRem"
        fieldKey="channelCostRem"
        fieldType="BaseInputTextArea"
      />,
    ];

    const fieldsConfig = pageFormBlockConfig(
      pageConfig,
      'blockKey',
      'SALE_CONTRACT_EDIT_SUB_CHANNELFEE_FORM',
      fields
    );
    return (
      <BusinessForm formData={formData} form={form} formMode="DESCRIPTION" defaultColumnStyle={8}>
        {fieldsConfig}
      </BusinessForm>
    );
    // return (
    //   <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={3} noReactive>
    //     {fieldsConfig}
    //   </FieldList>
    // );
  };

  tablePropsConfig = param => {
    const {
      loading,
      dispatch,
      channelFeeDetail: {
        formData,
        dataSource,
        channelConstCon,
        delChannelCostConD,
        collectionPlanView,
        pageConfig = {},
      },
      userContractEditSub: { flag7 },
    } = this.props;

    const disabledFlag = formData.contractStatus !== 'CREATE' && false; // 董老师要求临时开放权限

    const newTableProps = {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      scroll: { x: 3750 },
      loading: loading.effects[`${DOMAIN}/query`],
      dataSource: dataSource.filter(item => `${item.id}` === fromQs().id),
      showColumn: false,
      onRow: () => {},
      enableDoubleClick: false,
      showCopy: false,
      showAdd: false,
      showDelete: false,
      readOnly: true,
      columns: pageColumnsBlockConfig(
        pageConfig,
        'blockKey',
        'SALE_CONTRACT_EDIT_SUB_CHANNELFEE_TABLE',
        [
          {
            title: '序号',
            key: 'sortNo',
            dataIndex: 'sortNo',
            align: 'center',
            width: 100,
            fixed: true,
          },
          {
            title: '工作类型',
            key: 'workType',
            dataIndex: 'workType',
            align: 'center',
            width: 200,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Selection.UDC
                  value={value}
                  code="CON:WORK_TYPE"
                  placeholder="请选择工作类型"
                  onChange={e => {
                    this.onCellChanged(index, e, 'workType');
                  }}
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                  //                   // disabled={row.applyStatus !== 'CREATE' && row.applyStatus !== 'REJECTED'}
                />
              ),
          },
          {
            title: '具体理由',
            key: 'reason',
            dataIndex: 'reason',
            align: 'center',
            width: 250,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Input.TextArea
                  className="x-fill-100"
                  value={value}
                  autosize={{ minRows: 1, maxRows: 3 }}
                  onChange={e => {
                    this.onCellChanged(index, e.target.value, 'reason');
                  }}
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                  placeholder="请输入具体理由"
                />
              ),
          },
          {
            title: '伙伴类型',
            key: 'coopType',
            dataIndex: 'coopType',
            align: 'center',
            width: 200,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Selection.UDC
                  value={value}
                  code="CON:PARTNER_TYPE"
                  placeholder="请选择伙伴类型"
                  onChange={e => {
                    this.onCellChanged(index, e, 'coopType');
                  }}
                  disabled={
                    !!row.contractNo ||
                    !!row.minChannelCostConId ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '合作方',
            key: 'channelCostRem',
            dataIndex: 'channelCostRem',
            align: 'center',
            width: 250,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Input
                  value={value}
                  onChange={e => {
                    this.onCellChanged(index, e.target.value, 'channelCostRem');
                  }}
                  placeholder="请输入合作方"
                  disabled={
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '基于',
            key: 'base',
            dataIndex: 'base',
            align: 'center',
            width: 150,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Selection.UDC
                  value={value}
                  code="CON:BASE"
                  placeholder="请选择基于"
                  onChange={e => {
                    this.onCellChanged(index, e, 'base');
                  }}
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '比例',
            key: 'proportion',
            dataIndex: 'proportion',
            align: 'center',
            width: 150,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <InputNumber
                  precision={2}
                  className="x-fill-100"
                  value={value}
                  min={0}
                  max={100}
                  onChange={e => {
                    this.onCellChanged(index, e || 0, 'proportion');
                    // // 更新含税总额
                    // this.onCellChanged(index, mul(+row.demandNum, +e), 'taxAmt');
                    // // 更新不含税总额
                    // this.onCellChanged(
                    //   index,
                    //   div(mul(mul(+row.demandNum, +e), 100), add(+row.taxRate || 0, 100)),
                    //   'taxNotamt'
                    // );
                  }}
                  placeholder="请输入比例"
                  formatter={val => (val ? `${val}%` : '')}
                  parser={val => val.replace('%', '')}
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '金额(不含税)',
            key: 'amt',
            dataIndex: 'amt',
            align: 'right',
            width: 200,
            render: (value, row, index) => (
              <InputNumber
                precision={2}
                className="x-fill-100"
                value={value}
                onChange={e => {
                  this.onCellChanged(index, e, 'amt');
                  // 更新税费
                  this.onCellChanged(index, mul(div(+row.taxRate || 0, 100), +e), 'taxCost');
                  // 更新净支付额
                  this.onCellChanged(
                    index,
                    mul(div(e, 100), add(+row.taxRate || 0, 100)),
                    'netPay'
                  );
                }}
                placeholder="请输入金额"
                disabled={
                  !!row.contractNo ||
                  row?.children?.length > 0 ||
                  !!row.minChannelCostConId ||
                  disabledFlag ||
                  (row.applyStatus !== 'CREATE' &&
                    row.applyStatus !== 'REJECTED' &&
                    row.applyStatus)
                }
              />
            ),
          },
          {
            title: '税费率',
            key: 'taxRate',
            dataIndex: 'taxRate',
            align: 'center',
            width: 150,
            render: (value, row, index) => (
              <Selection.UDC
                value={value}
                code="COM.TAX_RATE"
                placeholder="请选择税费率"
                onChange={e => {
                  this.onCellChanged(index, e || 0, 'taxRate');
                  // 更新税费
                  this.onCellChanged(index, mul(div(e || 0, 100), +row.amt), 'taxCost');
                  // 更新净支付额
                  this.onCellChanged(index, mul(div(row.amt, 100), add(+e || 0, 100)), 'netPay');
                }}
                disabled={
                  !!row.contractNo ||
                  row?.children?.length > 0 ||
                  !!row.minChannelCostConId ||
                  row.reimExp === 'OUTSIDE' ||
                  disabledFlag ||
                  (row.applyStatus !== 'CREATE' &&
                    row.applyStatus !== 'REJECTED' &&
                    row.applyStatus)
                }
              />
            ),
          },
          {
            title: '税费',
            key: 'taxCost',
            dataIndex: 'taxCost',
            align: 'right',
            width: 200,
            render: val => !isNil(val) && val.toFixed(2),
          },
          {
            title: '税费承担方',
            key: 'reimExp',
            dataIndex: 'reimExp',
            align: 'center',
            width: 200,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Selection.UDC
                  value={value}
                  code="CON:TAXRATE"
                  placeholder="请选择税费承担方"
                  onChange={e => {
                    this.onCellChanged(index, e, 'reimExp');
                    if (e === 'OUTSIDE') {
                      // 更新税率
                      this.onCellChanged(index, 0, 'taxRate');
                      // 税费
                      this.onCellChanged(index, 0, 'taxCost');
                      // 更新净支付额
                      this.onCellChanged(index, mul(div(row.amt, 100), add(0, 100)), 'netPay');
                    }
                  }}
                  disabled={
                    !!row.contractNo ||
                    !!row.minChannelCostConId ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '净支付额',
            key: 'netPay',
            dataIndex: 'netPay',
            align: 'right',
            width: 200,
            render: val => !isNil(val) && val.toFixed(2),
          },
          {
            title: '具体支付方式',
            key: 'salaryMethod',
            dataIndex: 'salaryMethod',
            align: 'center',
            width: 200,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Selection.UDC
                  value={value}
                  code="CON:PAYMENT_MODE"
                  placeholder="请选择具体支付方式"
                  onChange={e => {
                    this.onCellChanged(index, e || 0, 'salaryMethod');
                  }}
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '收款节点',
            key: 'receivingNode',
            dataIndex: 'receivingNode',
            align: 'center',
            width: 200,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Selection
                  value={value}
                  className="x-fill-100"
                  source={collectionPlanView}
                  transfer={{ key: 'id', code: 'id', name: 'phaseDesc' }}
                  dropdownMatchSelectWidth={false}
                  showSearch
                  placeholder="请选择收款节点"
                  onChange={e => {
                    this.onCellChanged(index, e, 'receivingNode');
                  }}
                  disabled={
                    row.applyStatus !== 'CREATE' &&
                    row.applyStatus !== 'REJECTED' &&
                    row.applyStatus
                  }
                />
              ),
          },
          {
            title: '线下合同&沟通签署状态',
            key: 'contractStatus',
            dataIndex: 'contractStatus',
            align: 'center',
            width: 250,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Input
                  className="x-fill-100"
                  value={value}
                  onChange={e => {
                    this.onCellChanged(index, e.target.value, 'contractStatus');
                  }}
                  placeholder="请选择线下合同&沟通签署状态"
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '联系人姓名',
            key: 'contactName',
            dataIndex: 'contactName',
            align: 'center',
            width: 200,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Input
                  className="x-fill-100"
                  value={value}
                  onChange={e => {
                    this.onCellChanged(index, e.target.value, 'contactName');
                  }}
                  placeholder="联系人姓名"
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
          },
          {
            title: '联系人电话',
            key: 'contactPhone',
            dataIndex: 'contactPhone',
            align: 'center',
            width: 200,
            render: (value, row, index) =>
              row.minChannelCostConId ? (
                ''
              ) : (
                <Input
                  className="x-fill-100"
                  value={value}
                  onChange={e => {
                    this.onCellChanged(index, e.target.value, 'contactPhone');
                  }}
                  placeholder="联系人电话"
                  disabled={
                    !!row.contractNo ||
                    disabledFlag ||
                    (row.applyStatus !== 'CREATE' &&
                      row.applyStatus !== 'REJECTED' &&
                      row.applyStatus)
                  }
                />
              ),
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
            width: 180,
            render: (val, row) => {
              const href = `/sale/purchaseContract/Detail?id=${
                row.documentId
              }&pageMode=purchase&from=CONTRACT`;
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
            width: 150,
          },
          {
            title: '状态',
            key: 'applyStatusName',
            dataIndex: 'applyStatusName',
            align: 'center',
            width: 150,
          },
        ]
      ),
    };
    const tableProps = {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      scroll: { x: 3250 },
      loading: loading.effects[`${DOMAIN}/query`],
      dataSource: channelConstCon,
      pagination: false,
      showExport: false,
      showColumn: false,
      showSearch: false,
      enableSelection: false,
      columns: pageColumnsBlockConfig(
        pageConfig,
        'blockKey',
        'SALE_CONTRACT_EDIT_SUB_CHANNELFEE_TABLE',
        [
          {
            title: '序号',
            key: 'sortNo',
            dataIndex: 'sortNo',
            align: 'center',
            width: 100,
            fixed: true,
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
            key: 'coopType',
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
            key: 'base',
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
              const href = `/sale/purchaseContract/Detail?id=${
                row.documentId
              }&pageMode=purchase&from=CONTRACT`;
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
        ]
      ),
    };

    if (param) {
      // const list = dataSource.filter(item => `${item.id}` === fromQs().id);
      // newTableProps.dataSource = list;
      return newTableProps;
    }
    return tableProps;
  };

  toggleVisible = () => {
    const { visible } = this.state;
    this.setState({ visible: !visible });
  };

  render() {
    const {
      loading,
      dispatch,
      channelFeeDetail: { oppoChannelCosttViews, dataSource, fieldsConfig, formData, flowForm },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
      form,
    } = this.props;
    const { splitAmt, visible } = this.state;
    const { taskId, mode } = fromQs();
    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      dispatch,
      loading: loading.effects[`${DOMAIN}/query`],
      pagination: false,
      showExport: false,
      showColumn: false,
      dataSource: oppoChannelCosttViews,
      showSearch: false,
      enableSelection: false,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchBarForm: [],
      leftButtons: [],
      columns: [
        {
          title: '序号',
          dataIndex: 'sortNo',
          align: 'center',
        },
        {
          title: '审批状态',
          dataIndex: 'approvalStatusName',
          align: 'center',
        },
        {
          title: '费用描述',
          dataIndex: 'costDesc',
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
      ],
    };

    const formItems = [
      <FormItem
        fieldType="BaseInput"
        label="渠道费用处理单号"
        fieldKey="channelCostNo"
        descriptionField="channelCostNo"
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="关联销售合同"
        fieldKey="contractName"
        descriptionField="contractName"
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="关联商机"
        fieldKey="oppoId"
        descriptionField="oppoId"
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="申请人"
        fieldKey="applyResId"
        descriptionField="applyResName"
        required
      />,
      <FormItem
        label="申请日期"
        key="applyDate"
        fieldKey="applyDate"
        fieldType="BaseDatePicker"
        required
      />,
      <FormItem label="申请BU" key="buName" fieldKey="buName" fieldType="BaseInput" required />,
      <FormItem
        label="渠道费用备注说明"
        key="channelCostRem"
        fieldKey="channelCostRem"
        fieldType="BaseInputTextArea"
      />,
    ];

    return (
      <PageHeaderWrapper title="创建销售列表">
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { taskKey } = fieldsConfig;
            const { key } = operation;
            const payload = {
              taskId,
              remark: bpmForm.remark,
            };

            // if (key === 'APPROVED') {
            //   // promise 为true,默认走后续组件流程的方法
            //   return Promise.resolve(true);
            // }
            //
            //
            if (key === 'FLOW_COMMIT') {
              dispatch({
                type: `${DOMAIN}/save`,
              });
              return Promise.resolve(true);
            }
            return Promise.resolve(true);

            // // promise 为false,后续组件方法不走,走自己的逻辑
            // return Promise.resolve(false);
          }}
        >
          {/*<Card>*/}
          {/*  <FieldList legend="基本信息" getFieldDecorator={getFieldDecorator} col={3}>*/}
          {/*    {this.renderPage()}*/}
          {/*  </FieldList>*/}
          {/*</Card>*/}
          <BusinessForm
            title="基本信息"
            formData={formData}
            form={form}
            formMode="DESCRIPTION"
            defaultColumnStyle={8}
          >
            {formItems}
          </BusinessForm>
          <br />

          <Card>
            <FieldList legend="新增费用明细" getFieldDecorator={getFieldDecorator} col={1} />
            <EditableDataTable {...this.tablePropsConfig('new')} />
          </Card>
          <br />
          <Card>
            <FieldList legend="商机费用明细" getFieldDecorator={getFieldDecorator} col={1} />
            <DataTable {...tableProps} />
          </Card>
          <br />
          <Card>
            <FieldList legend="确认费用明细" getFieldDecorator={getFieldDecorator} col={1} />
            <DataTable {...this.tablePropsConfig()} />
          </Card>
          <br />
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default ChannelFeeDetail;
