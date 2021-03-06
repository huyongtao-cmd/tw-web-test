import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Form, Card, Input, Switch } from 'antd';
import { formatMessage } from 'umi/locale';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import classnames from 'classnames';

import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import SelectWithCols from '@/components/common/SelectWithCols';

const DOMAIN = 'sysUdcInfo';
const { Field } = FieldList;
const FieldListLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

@connect(({ loading, sysUdcInfo, dispatch }) => ({
  loading,
  sysUdcInfo,
  dispatch,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (changedFields && Object.values(changedFields)[0]) {
      const { name, value } = Object.values(changedFields)[0];
      let val = null;
      if (name === 'isBuiltIn') {
        val = value ? 1 : 0;
      } else if (name === 'pdefId') {
        val = value.code;
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
class UdcInfo extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    const { defId } = fromQs();

    dispatch({ type: `${DOMAIN}/selectUdc` });
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
    closeThenGoto('/sys/system/udc');
  };

  render() {
    const {
      dispatch,
      sysUdcInfo: { formData, udcData = [], udcDataSource = [] },
      form: { getFieldDecorator },
    } = this.props;
    const True = true;

    return (
      <PageHeaderWrapper title="??????????????????">
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
              name="defId"
              label="???????????????"
              {...FieldListLayout}
              decorator={{
                initialValue: formData.defId,
                rules: [
                  {
                    required: true,
                    message: '????????????????????????',
                  },
                ],
              }}
            >
              <Input placeholder="????????????????????????" />
            </Field>

            <Field
              name="defName"
              label="UDC??????"
              {...FieldListLayout}
              decorator={{
                initialValue: formData.defName,
                rules: [
                  {
                    required: true,
                    message: '?????????UDC??????',
                  },
                ],
              }}
            >
              <Input placeholder="?????????UDC??????" />
            </Field>

            <Field
              name="isBuiltIn"
              label="???????????????"
              decorator={{
                initialValue: formData.isBuiltIn ? True : false,
                valuePropName: 'checked',
                rules: [
                  {
                    required: true,
                    message: '????????????????????????',
                  },
                ],
              }}
              {...FieldListLayout}
            >
              <Switch checkedChildren="???" unCheckedChildren="???" />
            </Field>

            <Field
              name="pdefId"
              label="??????UDC"
              decorator={{
                initialValue: {
                  code: formData.pdefId,
                  name: formData.pdefName,
                },
              }}
              {...FieldListLayout}
            >
              <SelectWithCols
                labelKey="name"
                placeholder="???????????????UDC"
                columns={[
                  { dataIndex: 'code', title: '?????????', span: 10 },
                  { dataIndex: 'name', title: '??????', span: 10 },
                ]}
                dataSource={udcDataSource}
                selectProps={{
                  showSearch: true,
                  onSearch: value => {
                    dispatch({
                      type: `${DOMAIN}/updateState`,
                      payload: {
                        udcDataSource: udcData.filter(
                          d =>
                            d.code.indexOf(value) > -1 ||
                            d.name.toLowerCase().indexOf(value.toLowerCase()) > -1
                        ),
                      },
                    });
                  },
                  allowClear: true,
                  style: { width: '100%' },
                }}
              />
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default UdcInfo;
