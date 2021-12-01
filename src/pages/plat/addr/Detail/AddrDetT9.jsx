import React from 'react';

import Title from '@/components/layout/Title';
import DescriptionList from '@/components/layout/DescriptionList';
import { UdcSelect } from '@/pages/gen/field';
import FileUpload from '@/components/common/FileUpload';
import { AddrViewContext } from './index';

const { Description } = DescriptionList;

// 注意-> 真正的上下文在Consumer里面，多个Tab共享父页面的上下文
const AddrDetT9 = props => (
  <AddrViewContext.Consumer>
    {({ custData }) => (
      <DescriptionList size="large" title="个人信息" col={2}>
        <Description term="客户编号">{custData.abNo}</Description>
        <Description term="客户类别">{custData.custCat1Name}</Description>
        <Description term="行业类别">{custData.custCat2Name}</Description>
        <Description term="客户属地">{custData.custCat3Name}</Description>
        <Description term="分属集团">{custData.custRegion}</Description>
        <Description term="最终客户关系">{custData.custCat4Name}</Description>
        <Description term="附件">
          <FileUpload fileList={custData.attachments} preview />
        </Description>
      </DescriptionList>
    )}
  </AddrViewContext.Consumer>
);

AddrDetT9.Title = props => (
  <AddrViewContext.Consumer>
    {({ tabModified, formData }) => (
      <span className={!formData.abNo ? 'tw-card-multiTab-disabled' : void 0}>
        <Title dir="right" icon={tabModified[8] ? 'warning' : null} text="客户" />
      </span>
    )}
  </AddrViewContext.Consumer>
);

export default AddrDetT9;
