import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import energize from '@/assets/img/productTheme/energize.svg';
import styles from '../index.less';

const DOMAIN = 'oldProductTheme';
@connect(({ loading, productTheme }) => ({
  productTheme,
  loading: loading.effects[`${DOMAIN}/query`],
}))
class Theme extends PureComponent {
  componentDidMount() {}

  render() {
    return (
      <PageHeaderWrapper title="个体赋能">
        <div className={styles['themes-wrap']}>
          <img src={energize} alt="energize" />
          <div />
        </div>
      </PageHeaderWrapper>
    );
  }
}

export default Theme;
