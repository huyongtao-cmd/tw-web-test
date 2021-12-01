import React from 'react';
import { Input } from 'antd';

import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import { UdcSelect } from '@/pages/gen/field';

import { AddrEditContext } from './index';
import BaseSelect from '@/components/production/basic/BaseSelect.tsx';
import FileUpload from '@/components/common/FileUpload';

const { Field } = FieldList;

// 注意-> 真正的上下文在Consumer里面，多个Tab共享父页面的上下文
const AddrEditT10 = props => (
  <AddrEditContext.Consumer>
    {({ form: { getFieldDecorator }, supplierData }) => (
      <FieldList
        layout="horizontal"
        legend="供应商信息"
        getFieldDecorator={getFieldDecorator}
        col={2}
      >
        <Field
          name="supplierNo"
          label="供应商编号"
          decorator={{
            initialValue: supplierData.abNo,
          }}
        >
          <Input disabled placeholder="[系统自动生成]" />
        </Field>

        <Field
          name="supplierStatus"
          label="供应商状态"
          decorator={{
            initialValue: supplierData.supplierStatus,
          }}
        >
          <BaseSelect parentKey="COM:AB:SUPPLIER_STATUS" />
        </Field>

        <Field
          name="supplierType1"
          label="供应商大类"
          decorator={{
            initialValue: supplierData.supplierType1,
          }}
        >
          <BaseSelect parentKey="COM:AB:SUPPLIER_TYPE1" />
        </Field>
        <Field
          name="supplierType2"
          label="供应商小类"
          decorator={{
            initialValue: supplierData.supplierType2,
          }}
        >
          <BaseSelect parentKey="COM:AB:SUPPLIER_TYPE2" />
        </Field>
        <Field
          name="supplierType3"
          label="代理层级"
          decorator={{
            initialValue: supplierData.supplierType3,
          }}
        >
          <BaseSelect parentKey="COM:AB:SUPPLIER_TYPE7" />
        </Field>
        <Field
          name="supplierType4"
          label="分布性质"
          decorator={{
            initialValue: supplierData.supplierType4,
          }}
        >
          <BaseSelect parentKey="COM:AB:SUPPLIER_TYPE8" />
        </Field>
        <Field
          name="supplierType5"
          label="投放区域"
          decorator={{
            initialValue: supplierData.supplierType5,
          }}
        >
          <BaseSelect parentKey="COM:AB:SUPPLIER_TYPE5" />
        </Field>
        <Field
          name="supplierType6"
          label="合作方式"
          decorator={{
            initialValue: supplierData.supplierType6,
          }}
        >
          <BaseSelect parentKey="COM:AB:SUPPLIER_TYPE6" />
        </Field>
        <Field
          name="supplierType7"
          label="所属集团公司"
          decorator={{
            initialValue: supplierData.supplierType7,
          }}
        >
          <Input placeholder="请输入" />
        </Field>
        <Field
          name="attachmentIds"
          label="附件"
          decorator={{
            initialValue: supplierData.attachmentIds,
          }}
        >
          <FileUpload fileList={supplierData.attachments} />
        </Field>
      </FieldList>
    )}
  </AddrEditContext.Consumer>
);

AddrEditT10.Title = props => (
  <AddrEditContext.Consumer>
    {({ tabModified, formData, supplierData }) => (
      <span
        className={
          !formData.abNo || !supplierData || !supplierData.abNo
            ? 'tw-card-multiTab-disabled'
            : void 0
        }
      >
        <Title dir="right" icon={tabModified[9] ? 'warning' : null} text="供应商" />
      </span>
    )}
  </AddrEditContext.Consumer>
);

export default AddrEditT10;
