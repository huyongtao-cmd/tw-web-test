import React, { PureComponent } from 'react';
import { connect } from 'dva';
import classnames from 'classnames';
import { isEmpty } from 'ramda';
import { Button, Card, Form, Input, Divider, InputNumber } from 'antd';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto, markAsTab } from '@/layouts/routerControl';
import FieldList from '@/components/layout/FieldList';
import AsyncSelect from '@/components/common/AsyncSelect';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { formatMessage } from 'umi/locale';
import { Selection, DatePicker, FileManagerEnhance, UdcSelect } from '@/pages/gen/field';
import { selectUsersWithBu } from '@/services/gen/list';
import createMessage from '@/components/core/AlertMessage';
import router from 'umi/router';
import { selectProjectTmpl } from '@/services/user/project/project';
import moment from 'moment';

const { Field, FieldLine } = FieldList;

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];
const DOMAIN = 'emergencyPayment';
const arr = [
  'A90',
  'A96',
  'A86',
  'A98',
  'A93',
  'A92',
  'A100',
  'A101',
  'A102',
  'A104',
  'A105',
  'A106',
  'A107',
  'A108',
  'A87',
  'A110',
];

@connect(({ loading, emergencyPayment, dispatch, user }) => ({
  emergencyPayment,
  loading,
  dispatch,
  user,
}))
@Form.create({
  onValuesChange(props, changedValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
@mountToTab()
class EmergencyPayment extends PureComponent {
  componentDidMount() {
    const {
      dispatch,
      user: { user },
    } = this.props;
    const { extInfo } = user;
    dispatch({
      type: `${DOMAIN}/isAPAccountant`,
      payload: { userId: extInfo.userId, roleCode: 'FIN_ACCOUNT' },
    }).then(value => {
      if (value === false) {
        createMessage({
          type: 'warn',
          description: '无权限访问',
        }).then(closeThenGoto(`/user/flow/panel`));
      }
    });
  }

  countersign = () => {
    const {
      dispatch,
      emergencyPayment: { formData },
      form: { validateFieldsAndScroll },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (arr.some(v => values.flowNo.indexOf(v) > -1)) {
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            remark: values.remark,
            flowNo: values.flowNo,
          },
        });
        if (formData.paymentApplicationType === 'ADVANCEPAY') {
          closeThenGoto(
            `/sale/purchaseContract/prePaymentApply/edit?mode=edit&id=${formData.id}&scene=${
              formData.scene
            }&flowNo=${values.flowNo}&status=urgency&entrance=flow`
          ); // 预付款
        } else {
          closeThenGoto(
            `/sale/purchaseContract/paymentApplyList/edit?mode=edit&id=${formData.id}&scene=${
              formData.scene
            }&flowNo=${values.flowNo}&status=urgency&entrance=flow`
          ); // 付款
        }
      } else {
        createMessage({ type: 'error', description: '此流程不能进行紧急付款！' });
      }
    });
  };

  selectByFlow = e => {
    const { dispatch } = this.props;
    const value = e.target.value.trim();
    if (arr.some(v => value.indexOf(v) > -1)) {
      dispatch({
        type: `${DOMAIN}/selectFlow`,
        payload: { flowNo: value },
      }).then(res => {
        if (!res.ok) {
          createMessage({ type: 'error', description: res.datum || '操作失败' });
        }
        if (!res.datum) {
          createMessage({ type: 'error', description: '查询失败！请检查流程编号是否正确' });
        }
      });
    } else {
      createMessage({ type: 'error', description: '此流程不能进行紧急付款！' });
    }
  };

  render() {
    const {
      loading,
      dispatch,
      emergencyPayment: { formData },
      form: { getFieldDecorator, setFieldsValue },
    } = this.props;
    const { mode } = fromQs();
    return (
      <PageHeaderWrapper>
        <Card className="tw-card-adjust" style={{ marginTop: '6x' }} bordered={false}>
          <FieldList
            layout="horizontal"
            getFieldDecorator={getFieldDecorator}
            col={2}
            legend="主要信息"
          >
            <Field name="paymentNo" label="申请编号">
              <Input placeholder="[自动生成]" disabled />
            </Field>
            <Field name="applyResId" label="申请人">
              <Input placeholder="[自动生成]" disabled />
            </Field>
            <Field
              name="remark"
              label="备注"
              fieldCol={1}
              labelCol={{ span: 4, xxl: 3 }}
              wrapperCol={{ span: 19, xxl: 20 }}
            >
              <Input.TextArea rows={3} />
            </Field>
          </FieldList>
          <FieldList
            layout="horizontal"
            getFieldDecorator={getFieldDecorator}
            col={2}
            legend="付款申请单"
          >
            <Field name="flowNo" label="流程编号">
              <Input
                style={{ display: 'inline' }}
                onPressEnter={e => {
                  this.selectByFlow(e);
                }}
              />
            </Field>
            <Button
              className="tw-btn-primary"
              style={{ display: 'inline' }}
              size="large"
              onClick={() => this.countersign()}
            >
              确认
            </Button>
            <Field
              name="purchasePaymentNo"
              label="付款申请编号"
              decorator={{
                initialValue: formData.paymentNo || undefined,
              }}
            >
              <Input placeholder="[自动带入]" disabled />
            </Field>
            <Field
              name="purchasePaymentName"
              label="付款申请名称"
              decorator={{
                initialValue: formData.purchaseName || undefined,
              }}
            >
              <Input placeholder="[自动带入]" disabled />
            </Field>
            <Field
              name="purchaseInchargeResId"
              label="付款申请人"
              decorator={{
                initialValue: formData.purchaseInchargeUsername || undefined,
                rules: [
                  {
                    message: '[自动带入]',
                  },
                ],
              }}
            >
              <Input placeholder="[自动带入]" disabled />
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default EmergencyPayment;
