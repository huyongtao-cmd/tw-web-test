import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Card, Input, Modal, Form } from 'antd';
import FieldList from '@/components/layout/FieldList';
import { isEmpty, isNil } from 'ramda';
import { Selection, DatePicker } from '@/pages/gen/field';
import { mountToTab } from '@/layouts/routerControl';
import moment from 'moment';

const { Field } = FieldList;
const DOMAIN = 'vacationMgmt';

@connect(({ loading, dispatch, vacationMgmt, user }) => ({
  loading: loading.effects[`${DOMAIN}/paramConfigSave`],
  dispatch,
  vacationMgmt,
  user,
}))
@Form.create({
  onValuesChange(props, changedValues, allValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
@mountToTab()
class ParamConfigModal extends PureComponent {
  componentDidMount() {}

  handleSave = () => {
    const { form, closeModal, dispatch } = this.props;
    form.validateFields((error, values) => {
      if (error) {
        return;
      }
      dispatch({
        type: `${DOMAIN}/paramConfigSave`,
      }).then(data => {
        closeModal('YES');
      });
    });
  };

  render() {
    const {
      loading,
      visible,
      closeModal,
      form: { getFieldDecorator },
      vacationMgmt: { formData },
    } = this.props;
    return (
      <Modal
        centered
        title="参数修改"
        visible={visible}
        destroyOnClose
        onCancel={closeModal}
        width="40%"
        footer={[
          <Button
            key="confirm"
            type="primary"
            size="large"
            htmlType="button"
            loading={loading}
            onClick={() => this.handleSave()}
          >
            保存
          </Button>,
          <Button key="cancel" type="primary" size="large" onClick={() => closeModal()}>
            取消
          </Button>,
        ]}
      >
        <Card bordered={false} className="tw-card-adjust">
          <FieldList getFieldDecorator={getFieldDecorator} col={1}>
            <Field
              name="expirationDate"
              label="默认调休有效期"
              fieldCol={1}
              labelCol={{ span: 10 }}
              wrapperCol={{ span: 14 }}
              decorator={{
                initialValue: formData.expirationDate ? moment(formData.expirationDate) : null,
                rules: [{ required: true, message: '请输入默认调休有效期' }],
              }}
            >
              <DatePicker className="x-fill-100" placeholder="默认调休有效期" format="YYYY-MM-DD" />
            </Field>
          </FieldList>
        </Card>
      </Modal>
    );
  }
}

export default ParamConfigModal;
