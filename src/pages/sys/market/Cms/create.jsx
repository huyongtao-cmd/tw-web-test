import React, { PureComponent } from 'react';
import { connect } from 'dva';
import TextArea from 'antd/lib/input/TextArea';
import { Button, Form, Card, Input, Switch, DatePicker } from 'antd';
import { formatMessage } from 'umi/locale';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import classnames from 'classnames';
import moment from 'moment';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import { UdcSelect } from '@/pages/gen/field';
import RichText from '@/components/common/RichText';

const DOMAIN = 'sysCmsCreate';
const { Field } = FieldList;
const FieldListLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

@connect(({ loading, sysCmsCreate, dispatch }) => ({
  loading,
  sysCmsCreate,
  dispatch,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (changedFields && Object.values(changedFields)[0]) {
      const { name, value } = Object.values(changedFields)[0];
      let val = null;

      if (name === 'enableFlag') {
        val = value ? 1 : 0;
      } else if (name === 'pdefId') {
        val = value.code;
      } else if (name === 'releaseTime') {
        val = moment(value).format('YYYY-MM-DD');
      } else if (name === 'contents' && value === undefined) {
        val = '<p></p>';
      } else {
        val = value;
      }
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: val },
      });
    }
  },
})
@mountToTab()
class CmsCreate extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    const { defId } = fromQs();

    if (defId) {
      dispatch({
        type: `${DOMAIN}/query`,
        payload: defId,
      });
    } else {
      dispatch({
        type: `${DOMAIN}/clearForm`,
      });
    }
  }

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
    } = this.props;

    const { defId } = fromQs();
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        if (defId) {
          dispatch({
            type: `${DOMAIN}/edit`,
            payload: { defId },
          });
        } else {
          dispatch({
            type: `${DOMAIN}/create`,
          });
        }
      }
    });
  };

  handleCancel = () => {
    closeThenGoto('/plat/contentMgmt/cms');
  };

  render() {
    const {
      sysCmsCreate: { formData },
      form: { getFieldDecorator },
    } = this.props;
    const True = true;

    return (
      <PageHeaderWrapper title="????????????">
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            onClick={this.handleSave}
          >
            {formatMessage({ id: `misc.save`, desc: '??????' })}
          </Button>

          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            onClick={this.handleCancel}
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>

        <Card
          className="tw-card-adjust"
          bordered={false}
          title={<Title icon="profile" id="sys.system.basicInfo" defaultMessage="????????????" />}
        >
          <FieldList
            layout="horizontal"
            getFieldDecorator={getFieldDecorator}
            col={2}
            hasSeparator={1}
          >
            <Field
              name="title"
              label="??????"
              {...FieldListLayout}
              decorator={{
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <Input placeholder="?????????????????????" />
            </Field>

            <Field
              name="cmsNo"
              label="??????"
              {...FieldListLayout}
              decorator={{
                rules: [
                  {
                    required: true,
                    message: '?????????????????????',
                  },
                ],
              }}
            >
              <Input placeholder="?????????????????????" />
            </Field>

            <Field
              name="categoryCode"
              label="??????"
              {...FieldListLayout}
              decorator={{
                rules: [
                  {
                    required: true,
                    message: '?????????',
                  },
                ],
              }}
            >
              <UdcSelect code="OPE:CMS_APP" placeholder="?????????" />
            </Field>

            <Field
              name="enableFlag"
              label="????????????"
              decorator={{
                initialValue: formData.enableFlag ? True : false,
                valuePropName: 'checked',
                rules: [
                  {
                    required: false,
                    message: '????????????????????????',
                  },
                ],
              }}
              {...FieldListLayout}
            >
              <Switch checkedChildren="???" unCheckedChildren="???" />
            </Field>

            <Field
              name="releaseTime"
              label="????????????"
              {...FieldListLayout}
              decorator={{
                required: true,
                initialValue: formData.releaseTime && moment(formData.releaseTime),
              }}
            >
              <DatePicker placeholder="????????????" format="YYYY-MM-DD" />
            </Field>

            <Field
              name="remark"
              label="??????"
              fieldCol={1}
              labelCol={{ span: 3, xxl: 3 }}
              wrapperCol={{ span: 21, xxl: 21 }}
              decorator={{
                rules: [
                  {
                    required: false,
                    message: '',
                  },
                ],
              }}
            >
              <TextArea placeholder="" />
            </Field>

            <Field
              name="contents"
              label="????????????"
              fieldCol={1}
              labelCol={{ span: 3 }}
              wrapperCol={{ span: 21 }}
            >
              <RichText />
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CmsCreate;
