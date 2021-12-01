import React from 'react';

import Title from '@/components/layout/Title';
import DescriptionList from '@/components/layout/DescriptionList';
import { UdcSelect } from '@/pages/gen/field';
import FileUpload from '@/components/common/FileUpload';
import { AddrViewContext } from './index';

const { Description } = DescriptionList;

// 注意-> 真正的上下文在Consumer里面，多个Tab共享父页面的上下文
const AddrDetT10 = props => (
  <AddrViewContext.Consumer>
    {({ supplierData }) => (
      <DescriptionList size="large" title="供应商信息" col={2}>
        <Description term="供应商编号">{supplierData.abNo}</Description>
        <Description term="供应商ID">{supplierData.id}</Description>
        <Description term="供应商名称">{supplierData.supplierName}</Description>
        <Description term="供应商状态">{supplierData.supplierStatusDesc}</Description>
        <Description term="供应商大类">{supplierData.supplierType1Desc}</Description>
        <Description term="供应商小类">{supplierData.supplierType2Desc}</Description>
        <Description term="代理层级">{supplierData.supplierType3Desc}</Description>
        <Description term="分布性质">{supplierData.supplierType4Desc}</Description>
        <Description term="投放区域">{supplierData.supplierType5Desc}</Description>
        <Description term="合作方式">{supplierData.supplierType6Desc}</Description>
        <Description term="所属集团公司">{supplierData.supplierType7}</Description>
        <Description term="附件">
          <FileUpload fileList={supplierData.attachments} preview />
        </Description>
      </DescriptionList>
    )}
  </AddrViewContext.Consumer>
);

AddrDetT10.Title = props => (
  <AddrViewContext.Consumer>
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
  </AddrViewContext.Consumer>
);

export default AddrDetT10;
