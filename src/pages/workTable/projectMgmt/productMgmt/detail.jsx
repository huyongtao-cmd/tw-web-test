import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import { Form } from 'antd';
import PageWrapper from '@/components/production/layout/PageWrapper';
import { fromQs } from '@/utils/production/stringUtil';
import FormComponent from './component/FormComponent';

const DOMAIN = 'productMgmtDetail';

@connect(({ loading, productMgmtDetail, dispatch }) => ({
  loading,
  ...productMgmtDetail,
  dispatch,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      fields[key] = Form.createFormField({ value: tempValue });
    });
    return fields;
  },
  onValuesChange(props, changedValues, allValues) {
    if (isEmpty(changedValues)) return;
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    const newFieldData = { [name]: value };

    switch (name) {
      default:
        break;
    }
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: newFieldData,
    });
  },
})
class index extends Component {
  componentDidMount() {
    const { dispatch } = this.props;

    const { id } = fromQs();
    if (id) {
      dispatch({
        type: `productMgmt/queryDetails`,
        payload: { id },
      }).then(res => {
        res &&
          dispatch({
            type: `${DOMAIN}/updateForm`,
            payload: {
              ...res,
            },
          });
      });
    }

    this.getPageConfig();
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/cleanState`,
    });
  }

  getPageConfig = () => {
    const { dispatch } = this.props;
    dispatch({
      type: `productMgmt/getPageConfig`,
      payload: { pageNo: 'PRODUCT_EDIT' },
    }).then(res => {
      res &&
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            pageConfig: res?.configInfo || {},
          },
        });
    });
  };

  render() {
    const { loading, formData, formMode, pageConfig, form } = this.props;

    const disabledPage = loading.effects[`productMgmt/queryDetails`];

    return (
      <PageWrapper>
        <FormComponent
          formData={formData}
          formMode={formMode}
          pageConfig={pageConfig}
          form={form}
          loading={disabledPage}
        />
      </PageWrapper>
    );
  }
}

export default index;
