import React from 'react';
import { connect } from 'dva';
import { Button, Card, InputNumber, Form, Input, Row, Col } from 'antd';
import { formatMessage } from 'umi/locale';
import classnames from 'classnames';
import { isEmpty, isNil } from 'ramda';
import { closeThenGoto, mountToTab } from '@/layouts/routerControl';
import { FileManagerEnhance, Selection, DatePicker } from '@/pages/gen/field';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';

const { Field, FieldLine } = FieldList;

const DOMAIN = 'opporPartner'; //

@connect(({ loading, dispatch, user, opporPartner }) => ({
  loading,
  dispatch,
  user,
  opporPartner,
}))
@Form.create()
@mountToTab()
class CreateFlow extends React.Component {
  // componentDidMount() {
  //   const { dispatch } = this.props;
  //   dispatch({ type: `${DOMAIN}/query` });
  // }

  componentWillUnmount() {
    const {
      dispatch,
      form: { getFieldsValue },
    } = this.props;
    dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: getFieldsValue(),
    });
  }

  handleSave = () => {
    const {
      user: {
        user: { extInfo },
      },
      dispatch,
      form: { validateFieldsAndScroll },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/create`,
          payload: {
            // submitted,
            ...values,
            reportedResId: extInfo.resId,
          },
        });
      }
    });
  };

  render() {
    const {
      dispatch,
      loading,
      user: {
        user: { extInfo },
      },
      opporPartner: { formData },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
    } = this.props;
    const preparing = loading.effects[`${DOMAIN}/query`];
    const submitting = loading.effects[`${DOMAIN}/create`];

    return (
      <PageHeaderWrapper title="合作伙伴准入">
        <Card className="tw-card-rightLine">
          {/* <Button
            className="tw-btn-primary"
            icon="save"
            size="large"
            disabled={preparing || submitting}
            onClick={this.handleSave(false)}
          >
            {formatMessage({ id: `misc.save`, desc: '保存' })}
          </Button> */}
          <Button
            className="tw-btn-primary"
            icon="save"
            size="large"
            disabled={preparing || submitting}
            onClick={() => this.handleSave()}
          >
            提交
          </Button>
          {/* <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            onClick={() => closeThenGoto('/user/flow/Panel')}
          >
            {formatMessage({ id: `misc.rtn`, desc: '返回' })}
          </Button> */}
        </Card>
        <Card
          className="tw-card-adjust"
          bordered={false}
          // title={<Title icon="profile" text="员工借款申请新增" />}
        >
          <div className="tw-card-title">基本信息</div>
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="coopCompanyName"
              label="合作伙伴公司名称"
              decorator={{
                initialValue: formData.coopCompanyName,
                rules: [{ required: true, message: '请填写合作伙伴公司名称' }],
              }}
            >
              <Input />
            </Field>

            <Field
              name="coopPicName"
              label="合作伙伴对接人"
              decorator={{
                initialValue: formData.coopPicName,
                rules: [{ required: true, message: '请填写合作伙伴对接人' }],
              }}
            >
              <Input />
            </Field>
            <Field
              name="coopIndustry"
              label="合作伙伴行业"
              decorator={{
                initialValue: formData.coopIndustry,
              }}
            >
              <Input />
            </Field>
            <Field
              name="coopProducts"
              label="合作伙伴产品"
              decorator={{
                initialValue: formData.coopProducts,
              }}
            >
              <Input />
            </Field>
            <Field
              name="coopPicPosition"
              label="对接人职位"
              decorator={{
                initialValue: formData.coopPicPosition,
              }}
            >
              <Input />
            </Field>
            <Field
              name="coopPicContact"
              label="联系方式"
              decorator={{
                initialValue: formData.coopPicContact,
              }}
            >
              <Input />
            </Field>

            <Field
              name="reportedResId"
              label="提报人"
              decorator={{
                initialValue: extInfo.resName,
                rules: [
                  {
                    required: true,
                    message: '请选择提报人',
                  },
                ],
              }}
            >
              <Input disabled />
            </Field>
            <Field
              name="reportedDate"
              label="报备日期"
              decorator={{
                initialValue: formData.reportedDate,
              }}
            >
              <DatePicker className="x-fill-100" disabled />
            </Field>
          </FieldList>

          <br />
          <div style={{ marginTop: 60 }} />
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CreateFlow;
