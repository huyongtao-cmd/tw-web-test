import React from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import { Card, Row, Col, Input, Form, Button, DatePicker, Modal, Radio } from 'antd';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { mountToTab, closeThenGoto, markAsTab } from '@/layouts/routerControl';
import Ueditor from '@/components/common/Ueditor';
import FieldList from '@/components/layout/FieldList';
import { Selection, FileManagerEnhance } from '@/pages/gen/field';
import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/stringUtils';
import { selectIamUsers } from '@/services/gen/list';
import ResModal from './components/ResChose';
import Loading from '@/components/core/DataLoading';
import DescriptionList from '@/components/layout/DescriptionList';

import styles from './index.less';

const { Field, FieldLine } = FieldList;
const { Description } = DescriptionList;
const FieldListLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

// import styles from './index.less';
const DOMAIN = 'timingMessageInfo';

@connect(({ loading, timingMessageInfo, dispatch, user }) => ({
  loading,
  timingMessageInfo,
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
class MessageInfo extends React.PureComponent {
  state = {
    resVisible: false,
    resReset: true,
    userId: '',
  };

  componentDidMount() {
    const {
      dispatch,
      user: {
        user: {
          extInfo: { userId },
        },
      },
    } = this.props;
    this.setState({
      userId,
    });

    const { id } = fromQs();
    dispatch({
      type: 'timingMessageInfo/updateState',
      payload: {
        formData: {},
        btnCanUse: true,
        // loading: true,
      },
    });
    id &&
      dispatch({
        type: 'timingMessageInfo/queryMessageInfo',
        payload: {
          id,
        },
      });
    dispatch({ type: `${DOMAIN}/selectUser` });
    dispatch({ type: `${DOMAIN}/selectBus` });
    dispatch({ type: `${DOMAIN}/queryRoleList` });
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'timingMessageInfo/updateState',
      payload: {
        loading: true,
        targetKeys: [],
      },
    });
  }

  preview = () => {
    const releaseBody = this.editor.getContent();
    this.setState({
      visible: true,
      releaseContent: releaseBody,
    });
  };

  handleSave = msgType => {
    const {
      form: { validateFieldsAndScroll },
      timingMessageInfo: { formData },
      dispatch,
    } = this.props;
    const releaseBody = this.editor.getContent();
    const { id } = fromQs();
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const form = {
          ...formData,
          ...values,
          releaseBody,
          isPublish: msgType,
          noticeScopeFlag:
            values.noticeScopeFlagTmp === 3 || values.noticeScopeFlagTmp === 4
              ? values.noticeScopeFlagTmp
              : formData.noticeScopeFlag,
        };
        if (
          (values.noticeScopeFlagTmp === -1 && !formData.noticeScope) ||
          (values.noticeScopeFlagTmp === -1 &&
            formData.noticeScope &&
            formData.noticeScope.length === 0)
        ) {
          createMessage({ type: 'error', description: '?????????????????????' });
          return;
        }
        if (id) {
          form.id = id;
        }
        const saveMsg = () => {
          dispatch({
            type: `${DOMAIN}/save`,
            payload: form,
          });
          dispatch({
            type: `${DOMAIN}/updateState`,
            payload: {
              btnCanUse: false,
            },
          });
        };
        saveMsg();
      }
    });
  };

  toggleRes = () => {
    const { resVisible } = this.state;
    this.setState({
      resVisible: !resVisible,
    });
  };

  toggleReset = () => {
    const { resReset } = this.state;
    this.setState({
      resReset: !resReset,
    });
  };

  toggleVisible = () => {
    const { visible } = this.state;
    this.setState({ visible: !visible });
  };

  render() {
    const { nowTitle, visible } = this.state;
    const {
      form,
      timingMessageInfo: { formData, btnCanUse, cmsInfo, loading = true },
      dispatch,
    } = this.props;
    const { getFieldDecorator } = form;
    const { resVisible, resReset, userId, releaseContent } = this.state;
    const { id } = fromQs();
    return (
      <PageHeaderWrapper title="????????????????????????">
        {loading && id ? (
          <Loading />
        ) : (
          <div>
            <Card className="tw-card-rightLine">
              <Button
                className="tw-btn-primary"
                type="primary"
                icon="save"
                size="large"
                disabled={!btnCanUse}
                // loading={loading}
                onClick={() => this.handleSave('save')}
              >
                ??????
              </Button>
            </Card>

            <Card title="????????????????????????">
              <FieldList
                layout="horizontal"
                getFieldDecorator={getFieldDecorator}
                col={2}
                className={styles.formWrap}
                // hasSeparator={1}
              >
                <Field
                  name="releaseTitle"
                  label="??????"
                  decorator={{
                    initialValue: formData.releaseTitle,
                    rules: [
                      {
                        required: true,
                        message: '???????????????',
                      },
                    ],
                  }}
                >
                  <Input placeholder="???????????????" />
                </Field>

                <Field
                  name="releaseSource"
                  label="????????????"
                  decorator={{
                    initialValue: formData.releaseSource,
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
                  name="releaseType"
                  label="????????????"
                  decorator={{
                    initialValue: formData.releaseType,
                    rules: [
                      {
                        required: true,
                        message: '?????????????????????',
                      },
                    ],
                  }}
                >
                  <Selection.UDC code="ACC:MESSAGE_TPYE" placeholder="?????????????????????" />
                </Field>

                <Field
                  name="releaseLevel"
                  label="????????????"
                  decorator={{
                    initialValue: formData.releaseLevel,
                    rules: [
                      {
                        required: true,
                        message: '?????????????????????',
                      },
                    ],
                  }}
                >
                  <Selection.UDC code="ACC:MESSAGE_LEVEL" placeholder="?????????????????????" />
                </Field>

                <Field
                  name="noticeWay"
                  label="????????????"
                  decorator={{
                    initialValue: Array.isArray(formData.noticeWay)
                      ? formData.noticeWay
                      : formData.noticeWay && formData.noticeWay.split(','),
                    rules: [
                      {
                        required: true,
                        message: '?????????????????????',
                      },
                    ],
                  }}
                >
                  <Selection.UDC
                    mode="multiple"
                    code="ACC:NOTICE_WAY"
                    placeholder="?????????????????????"
                  />
                </Field>
                <Field
                  name="timingUsable"
                  label="??????"
                  decorator={{
                    initialValue: formData.timingUsable,
                    rules: [
                      {
                        required: true,
                        message: '?????????????????????',
                      },
                    ],
                  }}
                >
                  <Selection.UDC code="COM:YESNO" placeholder="?????????????????????" />
                </Field>
                <div
                  className="ant-col-xs-24 ant-col-sm-24 ant-col-md-24 ant-col-lg-24 ant-col-xl-22 ant-col-xxl-19"
                  style={{
                    margin: '20px 0 20px 45px',
                    position: 'relative',
                  }}
                >
                  <Ueditor
                    id="messageEditor"
                    height="400"
                    width="100%"
                    initialContent={id ? formData.releaseBody : ''}
                    ref={editor => {
                      this.editor = editor;
                    }}
                  />
                </div>
                <Field
                  name="noticeScopeFlagTmp"
                  label="????????????"
                  decorator={{
                    initialValue: formData.noticeScopeFlagTmp,
                    rules: [
                      {
                        required: true,
                        message: '?????????????????????',
                      },
                    ],
                  }}
                  fieldCol={1}
                  labelCol={{ span: 4, xxl: 3 }}
                  wrapperCol={{ span: 12, xxl: 13 }}
                >
                  <Radio.Group
                    onChange={e => {
                      form.setFieldsValue({
                        noticeScope: null,
                      });
                    }}
                  >
                    <Radio value={3}>??????</Radio>
                    <Radio value={-1}>????????????</Radio>
                    <Radio value={4}>???????????????</Radio>
                  </Radio.Group>
                </Field>

                {formData.noticeScopeFlagTmp === 4 && (
                  <Field
                    name="noticeScope"
                    label="???????????????"
                    decorator={{
                      initialValue: formData.noticeScope,
                      rules: [
                        {
                          required: true,
                          message: '????????????????????????',
                        },
                      ],
                    }}
                  >
                    <Selection.UDC code="ACC:APM_CUSTOM_LOGIC" placeholder="?????????" />
                  </Field>
                )}
                {formData.noticeScopeFlagTmp === 4 && <Field presentational />}
                {formData.noticeScopeFlagTmp === -1 && (
                  <div
                    className="ant-col-xs-24 ant-col-sm-24 ant-col-md-24 ant-col-lg-24 ant-col-xl-22 ant-col-xxl-19"
                    style={{
                      margin: '10px 0 10px 45px',
                    }}
                  >
                    <Button
                      className="tw-btn-primary"
                      type="primary"
                      // icon="save"
                      size="large"
                      disabled={!btnCanUse}
                      // loading={loading}
                      onClick={() => {
                        this.setState({
                          resVisible: true,
                        });
                      }}
                    >
                      ??????????????????
                    </Button>
                    <div style={{ background: '#eee', padding: '5px 10px', margin: '10px 0 0 0' }}>
                      {formData.noticeScopeList && formData.noticeScopeList.join(',')}
                    </div>
                  </div>
                )}

                <Field
                  name="timingCode"
                  label="???????????????"
                  decorator={{
                    initialValue: formData.timingCode,
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
                <Field presentational />
              </FieldList>
            </Card>
            <ResModal
              visible={resVisible}
              reset={resReset}
              toggle={this.toggleRes}
              toggleReset={this.toggleReset}
              targetKeys={[]}
              form={form}
            />
          </div>
        )}
      </PageHeaderWrapper>
    );
  }
}

export default MessageInfo;
