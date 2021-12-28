import { Icon } from 'antd';
import React from 'react';

const CopyRight = () => (
  <>
    Copyright <Icon type="copyright" /> 2004-
    {new Date().getFullYear()} &nbsp;
    <a href="http://www.elitesland.com/" target="_blank" rel="noopener noreferrer">
      上海泰列渥克信息科技有限公司
    </a>
  </>
);

export default CopyRight;
