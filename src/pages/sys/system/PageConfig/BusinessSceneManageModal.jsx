import React, { PureComponent } from 'react';
import { Button, Card, Input, Form, Modal } from 'antd';
import FieldList from '@/components/layout/FieldList';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/stringUtils';

const { Field, FieldLine } = FieldList;

const DOMAIN = 'businessSceneManageModal';

@connect(({ loading, businessSceneManageModal, dispatch }) => ({
  loading: loading.effects[`${DOMAIN}/save`],
  ...businessSceneManageModal,
  dispatch,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      fields[key] = Form.createFormField(formData[key]);
    });
    return fields;
  },
  onValuesChange(props, changedValues, allValues) {
    if (isEmpty(changedValues)) return;
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    const newFieldData = { [name]: value };

    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: newFieldData,
    });
  },
})
class BusinessSceneManageModal extends PureComponent {
  componentDidMount() {}

  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  handleSave = () => {
    const { form, dispatch, formData, onOk } = this.props;
    const { id } = fromQs();
    form.validateFields((error, values) => {
      if (error) {
        return;
      }
      dispatch({
        type: `${DOMAIN}/save`,
        payload: {
          pageId: id,
          ...formData,
        },
      }).then(data => {
        typeof onOk === 'function' && onOk(data);
      });
    });
  };

  render() {
    const {
      visible,
      onCancel,
      formData,
      form: { getFieldDecorator },
      dispatch,
    } = this.props;

    return (
      <Modal
        title="????????????"
        visible={visible}
        onOk={this.onSelectTmp}
        onCancel={onCancel}
        width="80%"
        footer={[
          <Button
            key="confirm"
            type="primary"
            size="large"
            htmlType="button"
            onClick={() => this.handleSave()}
          >
            ??????
          </Button>,
        ]}
      >
        <Card bordered={false} className="tw-card-adjust">
          <FieldList getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="sceneKey"
              label="??????KEY???"
              decorator={{
                initialValue: formData.sceneKey,
                rules: [{ required: true, message: '???????????????KEY???' }],
              }}
            >
              <Input style={{ width: '100%' }} />
            </Field>

            <Field
              name="sceneName"
              label="????????????"
              decorator={{
                initialValue: formData.sceneName,
                rules: [{ required: true, message: '?????????????????????' }],
              }}
            >
              <Input className="x-fill-100" />
            </Field>

            <Field
              name="remark"
              label="??????"
              fieldCol={1}
              labelCol={{ span: 3 }}
              wrapperCol={{ span: 21 }}
              decorator={{
                initialValue: formData.remark,
                rules: [{ required: false, message: '???????????????' }],
              }}
            >
              <Input.TextArea placeholder="???????????????" rows={3} />
            </Field>
          </FieldList>
        </Card>
      </Modal>
    );
  }
}

export default BusinessSceneManageModal;
