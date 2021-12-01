import React from 'react';
import { Input } from 'antd';

import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import { UdcSelect } from '@/pages/gen/field';
import FileUpload from '@/components/common/FileUpload';
import { AddrEditContext } from './index';
import BaseSelect from '@/components/production/basic/BaseSelect.tsx';
import BaseInput from '@/components/production/basic/BaseInput.tsx';

const { Field } = FieldList;

// 注意-> 真正的上下文在Consumer里面，多个Tab共享父页面的上下文
const AddrEditT9 = props => (
  <AddrEditContext.Consumer>
    {({ form: { getFieldDecorator }, custData }) => (
      <FieldList
        layout="horizontal"
        legend="基本信息"
        getFieldDecorator={getFieldDecorator}
        col={2}
      >
        <Field
          name="abNo"
          label="客户编号"
          decorator={{
            initialValue: custData.abNo,
          }}
        >
          <Input disabled placeholder="[系统自动生成]" />
        </Field>
        <Field
          name="custCat1"
          label="客户类别"
          decorator={{
            initialValue: custData.custCat1,
          }}
        >
          <BaseSelect parentKey="COM:AB:CUST_TYPE1" />
        </Field>
        <Field
          name="custCat2"
          label="行业类别"
          decorator={{
            initialValue: custData.custCat2,
          }}
        >
          <BaseSelect parentKey="COM:AB:CUST_TYPE2" />
        </Field>
        <Field
          name="custCat3"
          label="客户属地"
          decorator={{
            initialValue: custData.custCat3,
          }}
        >
          <BaseSelect parentKey="FUNCTION:REGION:NAME" />
        </Field>
        <Field
          name="custRegion"
          label="分属集团"
          decorator={{
            initialValue: custData.custRegion,
          }}
        >
          <BaseInput />
        </Field>
        <Field
          name="custCat4"
          label="最终客户关系"
          decorator={{
            initialValue: custData.custCat4,
          }}
        >
          <BaseSelect parentKey="COM:AB:CUST_TYPE4" />
        </Field>
        <Field
          name="attachmentIds"
          label="附件"
          decorator={{
            initialValue: custData.attachmentIds,
          }}
        >
          <FileUpload fileList={custData.attachments} />
        </Field>
      </FieldList>
    )}
  </AddrEditContext.Consumer>
);

AddrEditT9.Title = props => (
  <AddrEditContext.Consumer>
    {({ tabModified, formData, custData }) => (
      <span
        className={
          !formData.abNo || !custData || !custData.abNo ? 'tw-card-multiTab-disabled' : void 0
        }
      >
        <Title dir="right" icon={tabModified[8] ? 'warning' : null} text="客户" />
      </span>
    )}
  </AddrEditContext.Consumer>
);

export default AddrEditT9;
