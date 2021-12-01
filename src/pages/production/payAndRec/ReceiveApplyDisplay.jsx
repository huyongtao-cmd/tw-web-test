import React, { PureComponent } from 'react';

import router from 'umi/router';

import { connect } from 'dva';

import PageWrapper from '@/components/production/layout/PageWrapper';

import DataTable from '@/components/common/DataTable';

import Title from '@/components/layout/Title';

class Index extends PureComponent {
  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return <PageWrapper />;
  }
}

export default Index;
