import React, { PureComponent } from 'react';
import { Card, Form, Input, DatePicker, Divider, Table, Badge } from 'antd';
import { formatDTHM } from '@/utils/tempUtils/DateTime';

export const progressColumns = [
  {
    title: '变更历史',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '10%',
    render: createTime => formatDTHM(createTime),
  },
  {
    title: '变更人',
    dataIndex: 'createUserName',
    key: 'createUserName',
    width: '10%',
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: '10%',
  },
  {
    title: '变更前信息',
    dataIndex: 'preDocumentChange',
    key: 'preDocumentChange',
    width: '35%',
    render: value => {
      // render: preDocumentChange => {
      let preDocumentChange = '';
      try {
        preDocumentChange = JSON.parse(value);
      } catch (e) {
        console.log('采购合同变更前信息JSON解析异常');
      }
      const { purchaseDetailsViews, purchasePaymentPlanViews } = preDocumentChange;
      // console.info(purchaseDetailsViews);
      const columnsPurchaseDetailsViews = [
        {
          title: '关联产品',
          dataIndex: 'relatedProductName',
        },
        {
          title: '说明',
          dataIndex: 'note',
        },
        {
          title: '含税单价',
          dataIndex: 'taxPrice',
          key: 'keyTaxPrice',
        },
        {
          title: '含税总额',
          dataIndex: 'taxAmt',
          key: 'keyTaxAmt',
        },
      ];
      const columnsPurchasePaymentPlanViews = [
        {
          title: '付款阶段',
          dataIndex: 'paymentStage',
          key: 'keyPaymentStage',
        },
        {
          title: '本次付款金额',
          dataIndex: 'currentPaymentAmt',
          key: 'keyCurrentPaymentAmt',
        },
        {
          title: '付款金额',
          dataIndex: 'paymentAmt',
          key: 'keyPaymentAmt',
        },
        // {
        //   title: '付款申请单号',
        //   dataIndex: 'paymentNo',
        //   key: 'paymentNo',
        // },
        {
          title: '预计付款时间',
          dataIndex: 'estimatedPaymentDate',
          key: 'estimatedPaymentDate',
        },
      ];

      return (
        <ul key={preDocumentChange.id}>
          <li>
            采购合同名称：
            {preDocumentChange.contractName}
          </li>
          <li>
            采购公司/法人号：
            {preDocumentChange.purchaseLegalName}
          </li>
          <li>
            采购BU：
            {preDocumentChange.purchaseBuName}
          </li>
          <li>
            采购负责人：
            {preDocumentChange.purchaseInchargeResName}
          </li>
          <li>
            供应商/法人号：
            {preDocumentChange.supplierLegalName}
          </li>
          <li>
            开票方：
            {preDocumentChange.invoiceName}
          </li>
          <li>
            金额：
            {preDocumentChange.amt}
          </li>
          <li>
            税率/税额：
            {preDocumentChange.taxRate} / {preDocumentChange.taxAmt}
          </li>
          <li>
            备注说明：
            {preDocumentChange.remark}
          </li>
          <li>
            付款明细：
            <Table
              columns={columnsPurchaseDetailsViews}
              dataSource={purchaseDetailsViews}
              size="small"
              pagination={false}
              rowKey="key"
            />
          </li>
          <li>
            付款计划：
            <Table
              columns={columnsPurchasePaymentPlanViews}
              dataSource={purchasePaymentPlanViews}
              size="small"
              pagination={false}
              rowKey="key"
            />
          </li>
        </ul>
      );
    },
  },

  {
    title: '变更后信息',
    dataIndex: 'proDocumentChange',
    key: 'proDocumentChange',
    width: '35%',
    render: value => {
      let proDocumentChange = '';
      try {
        proDocumentChange = JSON.parse(value);
      } catch (e) {
        console.log('采购合同变更后信息JSON解析异常');
      }
      const { purchaseDetailsViews, purchasePaymentPlanViews } = proDocumentChange;
      const columnsPurchaseDetailsViews = [
        {
          title: '关联产品',
          dataIndex: 'relatedProductName',
          key: 'keyRelatedProductName',
        },
        {
          title: '说明',
          dataIndex: 'note',
          key: 'keyNote',
        },
        {
          title: '含税单价',
          dataIndex: 'taxPrice',
          key: 'keyTaxPrice',
        },
        {
          title: '含税总额',
          dataIndex: 'taxAmt',
          key: 'keyTaxAmt',
        },
      ];
      const columnsPurchasePaymentPlanViews = [
        {
          title: '付款阶段',
          dataIndex: 'paymentStage',
          key: 'keyPaymentStage',
        },
        {
          title: '本次付款金额',
          dataIndex: 'currentPaymentAmt',
          key: 'keyCurrentPaymentAmt',
        },
        {
          title: '付款金额',
          dataIndex: 'paymentAmt',
          key: 'keyPaymentAmt',
        },
        // {
        //   title: '付款申请单号',
        //   dataIndex: 'paymentNo',
        //   key: 'paymentNo',
        // },
        {
          title: '预计付款时间',
          dataIndex: 'estimatedPaymentDate',
          key: 'estimatedPaymentDate',
        },
      ];
      return (
        <ul key={proDocumentChange.id}>
          <li>
            采购合同名称：
            {proDocumentChange.contractName}
          </li>
          <li>
            采购公司/法人号：
            {proDocumentChange.purchaseLegalName}
          </li>
          <li>
            采购BU：
            {proDocumentChange.purchaseBuName}
          </li>
          <li>
            采购负责人：
            {proDocumentChange.purchaseInchargeResName}
          </li>
          <li>
            供应商/法人号：
            {proDocumentChange.supplierLegalName}
          </li>
          <li>
            开票方：
            {proDocumentChange.invoiceName}
          </li>
          <li>
            金额：
            {proDocumentChange.amt}
          </li>
          <li>
            税率/税额：
            {proDocumentChange.taxRate} / {proDocumentChange.taxAmt}
          </li>
          <li>
            备注说明：
            {proDocumentChange.remark}
          </li>
          <li>
            付款明细：
            <Table
              columns={columnsPurchaseDetailsViews}
              dataSource={purchaseDetailsViews}
              size="small"
              pagination={false}
              rowKey="key"
            />
          </li>
          <li>
            付款计划：
            <Table
              columns={columnsPurchasePaymentPlanViews}
              dataSource={purchasePaymentPlanViews}
              size="small"
              pagination={false}
              rowKey="key"
            />
          </li>
        </ul>
      );
    },
  },
];
