import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import classnames from 'classnames';
import { Button, Form, Card, Input, Select, InputNumber } from 'antd';
import AsyncSelect from '@/components/common/AsyncSelect';
import { FileManagerEnhance, Selection } from '@/pages/gen/field';

import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import { fromQs } from '@/utils/stringUtils';

const { Field } = FieldList;
const DOMAIN = 'HomeConfigLogo';
const { Option } = Select;

@connect(({ loading, dispatch, HomeConfigLogo }) => ({
  loading,
  dispatch,
  HomeConfigLogo,
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
class LogoEdit extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/clearForm`,
    });
    dispatch({
      type: `${DOMAIN}/getDetails`,
    });
  }

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      HomeConfigLogo: { formData = {} },
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const params = {
          ...values,
          ...formData,
        };
        if (params.id) {
          params.type = 'edit';
        }
        dispatch({
          type: `${DOMAIN}/save`,
          payload: { ...params },
        });
      }
    });
  };

  handleCancel = () => {
    closeThenGoto('/sys/system/homeConfig');
  };

  render() {
    const {
      loading,
      form,
      HomeConfigLogo: { formData },
      form: { getFieldDecorator },
    } = this.props;

    const submitting = loading.effects[`${DOMAIN}/save`];
    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            disabled={submitting}
            onClick={this.handleSave}
          >
            {formatMessage({ id: `misc.save`, desc: '??????' })}
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={this.handleCancel}
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="??????Logo?????????">
            <Field name="icon" label="logo ??????" required>
              <FileManagerEnhance
                api="/api/common/v1/logoWork/icon/sfs/token"
                dataKey={formData.id}
                listType="text"
                disabled={false}
                accept=".jpg,.gif,.png"
                multiple={false}
              />
            </Field>
            <Field presentational style={{ color: 'red', fontSize: '12px', whiteSpace: 'nowrap' }}>
              ????????????: ??????180???????????????36?????????????????????.png???.gif???????????????,????????????10KB???
            </Field>
            <Field
              name="logoLink"
              label="??????"
              decorator={{
                initialValue: formData.logoLink || '',
                rules: [{ required: true, message: '???????????????' }],
              }}
            >
              <Input placeholder="??????????????? logo ????????????????????????" />
            </Field>

            <Field
              name="logoSlogan"
              label="slogan"
              decorator={{
                initialValue: formData.logoSlogan || '',
              }}
            >
              <Input placeholder="????????? slogan, ????????????????????? slogan" />
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default LogoEdit;
