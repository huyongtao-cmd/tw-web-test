import React from 'react';
import { Input } from 'antd';

import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import { AddrEditContext } from './index';
import BaseSelect from '@/components/production/basic/BaseSelect.tsx';
import BaseInput from '@/components/production/basic/BaseInput.tsx';
import BaseInputAmt from '@/components/production/basic/BaseInputAmt.tsx';
import BaseInputTextArea from '@/components/production/basic/BaseInputTextArea.tsx';
import BaseDatePicker from '@/components/production/basic/BaseDatePicker.tsx';

const { Field } = FieldList;

// 注意-> 真正的上下文在Consumer里面，多个Tab共享父页面的上下文
const AddrEditT3 = props => (
  <AddrEditContext.Consumer>
    {({ form: { getFieldDecorator }, ouData, addrSel }) => (
      <FieldList
        layout="horizontal"
        legend="公司信息"
        getFieldDecorator={getFieldDecorator}
        col={2}
      >
        <Field
          name="ouName"
          label="公司名"
          decorator={{
            initialValue: ouData.ouName,
            rules: [
              {
                required: true,
                message: '请输入公司名',
              },
            ],
          }}
        >
          <Input placeholder="请输入公司名" />
        </Field>
        <Field
          name="briefName"
          label="公司简称"
          decorator={{
            initialValue: ouData.briefName,
            rules: [
              {
                required: true,
                message: '请输入公司简称',
              },
            ],
          }}
        >
          <Input placeholder="请输入公司简称" />
        </Field>
        <Field
          name="ouType"
          label="公司类型"
          decorator={{
            initialValue: ouData.ouType,
            rules: [
              {
                required: true,
                message: '请选择公司类型',
              },
            ],
          }}
        >
          <BaseSelect parentKey="COM:AB:OU_TYPE" placeholder="请选择公司类型" />
        </Field>
        <Field
          name="taxRegNo"
          label="税号"
          decorator={{
            initialValue: ouData.taxRegNo,
            rules: [
              {
                required: true,
                message: '请输入税号',
              },
            ],
          }}
        >
          <Input placeholder="请输入税号" />
        </Field>

        <Field
          name="taxRate"
          label="税率"
          decorator={{
            initialValue: ouData.taxRate,
            rules: [
              {
                required: false,
                message: '请选择税率',
              },
            ],
          }}
        >
          <BaseSelect parentKey="COM:AB:OU_TAX_RATE" />
        </Field>

        <Field
          name="innerType"
          label="内部/外部"
          decorator={{
            initialValue: ouData.innerType,
            rules: [
              {
                required: true,
                message: '请选择内部/外部',
              },
            ],
          }}
        >
          <BaseSelect parentKey="COM:AB:OU_INNER_TYPE" />
        </Field>
        <Field
          name="ouProp"
          label="公司性质"
          decorator={{
            initialValue: ouData.ouProp,
          }}
        >
          <BaseSelect parentKey="COM:AB:OU_PROP" />
        </Field>
        <Field
          name="regionCode"
          label="公司区域"
          decorator={{
            initialValue: ouData.regionCode,
          }}
        >
          <BaseSelect parentKey="FUNCTION:REGION:NAME" />
        </Field>
        <Field
          name="pid"
          label="母公司"
          decorator={{
            initialValue: ouData.pid && ouData.pid + '',
          }}
        >
          <BaseSelect descList={addrSel} />
        </Field>
        <Field
          name="website"
          label="企业主页"
          decorator={{
            initialValue: ouData.website,
          }}
        >
          <Input className="x-fill-100" addonBefore="http://" placeholder="请输入企业主页" />
        </Field>
        <Field
          name="industry"
          label="所属行业"
          decorator={{
            initialValue: ouData.industry,
          }}
        >
          <BaseSelect parentKey="COM:AB:OU_IDST" />
        </Field>
        <Field
          name="scaleType"
          label="单位规模"
          decorator={{
            initialValue: ouData.scaleType,
          }}
        >
          <BaseSelect parentKey="COM:AB:OU_SCALE" />
        </Field>
        <Field
          name="currCode"
          label="主交易货币"
          decorator={{
            initialValue: ouData.currCode,
          }}
        >
          <BaseSelect parentKey="COMMON_CURRENCY" />
        </Field>
        <Field
          name="langCode"
          label="主要语言"
          decorator={{
            initialValue: ouData.langCode,
          }}
        >
          <BaseSelect parentKey="COMMON:LANGUAGE" />
        </Field>
        <Field
          name="ouStatus"
          label="是否可用"
          decorator={{
            initialValue: ouData.ouStatus,
          }}
        >
          <BaseSelect parentKey="COMMON:YES-OR-NO" />
        </Field>
        <Field
          name="registeredAddress"
          label="注册地址"
          decorator={{
            initialValue: ouData.registeredAddress,
          }}
        >
          <BaseInput />
        </Field>
        <Field
          name="legalRepresentative"
          label="法定代表人"
          decorator={{
            initialValue: ouData.legalRepresentative,
          }}
        >
          <BaseInput />
        </Field>
        <Field
          name="registeredCapital"
          label="注册资本"
          decorator={{
            initialValue: ouData.registeredCapital,
          }}
        >
          <BaseInputAmt style={{ width: '100%' }} />
        </Field>
        <Field
          name="incorporationDate"
          label="成立日期"
          decorator={{
            initialValue: ouData.incorporationDate,
          }}
        >
          <BaseDatePicker />
        </Field>
        <Field
          name="modeScope"
          label="经营方式和范围"
          decorator={{
            initialValue: ouData.modeScope,
          }}
        >
          <BaseInputTextArea />
        </Field>
      </FieldList>
    )}
  </AddrEditContext.Consumer>
);

AddrEditT3.Title = props => (
  <AddrEditContext.Consumer>
    {({ tabModified, formData }) => (
      <span
        className={
          !formData.abNo || formData.abType !== '02' ? 'tw-card-multiTab-disabled' : void 0
        }
      >
        <Title dir="right" icon={tabModified[2] ? 'warning' : null} text="公司信息" />
      </span>
    )}
  </AddrEditContext.Consumer>
);

export default AddrEditT3;
