import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Form, Input, DatePicker, Divider } from 'antd';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DescriptionList from '@/components/layout/DescriptionList';
import FieldList from '@/components/layout/FieldList';
import createMessage from '@/components/core/AlertMessage';
import Title from '@/components/layout/Title';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import { pushFlowTask } from '@/services/gen/flow';
import { fromQs } from '@/utils/stringUtils';
import moment from 'moment';

const { Description } = DescriptionList;
const { Field } = FieldList;
const DOMAIN = 'platResEnrollDetail';
const ACC_A28_01 = 'ACC_A28_01_RES_ENTRY_SUBMIT_i';
const ACC_A28_02 = 'ACC_A28_02_RES_ENTRY_b';
const ACC_A28_03 = 'ACC_A28_03_RES_ENTRY_b';
const ACC_A28_04 = 'ACC_A28_04_FINAL_CHECK';

@connect(({ dispath, platResEnrollDetail, user }) => ({
  dispath,
  platResEnrollDetail,
  user,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const { name, value } = Object.values(changedFields)[0];
    if (value) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: value },
      });
    }
  },
})
@mountToTab()
class EnrollDetail extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id, taskId } = fromQs();
    id &&
      dispatch({
        type: `${DOMAIN}/query`,
        payload: { resId: id },
      }) &&
      dispatch({
        type: `${DOMAIN}/queryCreate`,
        payload: { resId: id },
      }) &&
      dispatch({
        type: `${DOMAIN}/queryCreateInfo`,
        payload: { resId: id },
      });

    taskId
      ? dispatch({
          type: `${DOMAIN}/fetchConfig`,
          payload: taskId,
        })
      : dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            fieldsConfig: {},
          },
        });
  }

  handleChange = e => {
    const {
      dispatch,
      platResEnrollDetail: { haveLoginName },
    } = this.props;
    if (!haveLoginName) {
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: {
          loginName: e.target.value,
        },
      });
    }
  };

  render() {
    const {
      dispatch,
      form: { validateFieldsAndScroll, getFieldDecorator },
      platResEnrollDetail: { formDataSource, formData, fieldsConfig, flowForm, createData },
      user: {
        user: { roles = [] },
      },
    } = this.props;
    const { id, taskId, prcId, from } = fromQs();

    return (
      <PageHeaderWrapper title="??????????????????">
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { taskKey } = fieldsConfig;
            const { remark } = bpmForm;
            const { key } = operation;
            // ?????? ??????
            if (taskKey === ACC_A28_01) {
              if (key === 'EDIT') {
                closeThenGoto(
                  `/hr/res/profile/list/resEnroll?id=${id}&taskId=${taskId}&remark=${remark}`
                );
                return Promise.resolve(false);
              }
            }
            // ?????? ??????/??????
            if (taskKey === ACC_A28_02 || taskKey === ACC_A28_03) {
              // bu????????? ?????? ???????????? ????????????
              return pushFlowTask(taskId, { remark, result: key, branch: key }).then(
                ({ status, response }) => {
                  if (status === 200) {
                    createMessage({ type: 'success', description: '????????????' });
                    closeThenGoto(
                      `/hr/res/profile/list/resEnroll/detail?id=${id}&prcId=${prcId}&taskId=${taskId}&mode=view&from=${from}`
                    );
                  }
                  return Promise.resolve(false);
                }
              );
            }
            // ??????????????????
            if (taskKey === ACC_A28_04) {
              if (key === 'APPROVED') {
                validateFieldsAndScroll((error, values) => {
                  if (!error) {
                    dispatch({
                      type: `${DOMAIN}/create`,
                    }).then(
                      res =>
                        res &&
                        pushFlowTask(taskId, { remark, result: key, branch: key }).then(
                          ({ status, response }) => {
                            if (status === 200) {
                              createMessage({ type: 'success', description: '????????????' });
                              closeThenGoto(
                                `/hr/res/profile/list/resEnroll/detail?id=${id}&prcId=${prcId}&taskId=${taskId}&mode=view&from=${from}`
                              );
                            }
                            return Promise.resolve(false);
                          }
                        )
                    );
                  }
                });
              } else if (key === 'REJECTED') {
                dispatch({
                  type: `${DOMAIN}/del`,
                  payload: { resId: id },
                }).then(
                  res =>
                    res &&
                    pushFlowTask(taskId, { remark, result: key, branch: key }).then(
                      ({ status, response }) => {
                        if (status === 200) {
                          dispatch({
                            type: `${DOMAIN}/cancel`,
                            payload: prcId,
                          });
                        }
                        return Promise.resolve(false);
                      }
                    )
                );
              }
              return Promise.resolve(false);
            }
            return Promise.resolve(true);
          }}
        >
          {fieldsConfig.taskKey !== ACC_A28_04 &&
            roles.indexOf('PLAT_IT_ADMIN') < 0 && (
              <Card
                className="tw-card-adjust"
                bordered={false}
                title={
                  <Title
                    icon="profile"
                    id="ui.menu.plat.res.resEnroll"
                    defaultMessage="??????????????????"
                  />
                }
              >
                <DescriptionList size="large" col={2}>
                  <Description term="??????">{formDataSource.personName}</Description>
                  <Description term="?????????">{formDataSource.foreignName}</Description>
                  <Description term="??????">{formDataSource.genderName}</Description>
                  <Description term="????????????">{formDataSource.birthday}</Description>
                  <Description term="????????????">{formDataSource.idTypeName}</Description>
                  <Description term="????????????">{formDataSource.idNo}</Description>
                  <Description term="???????????????">{formDataSource.resType1Name}</Description>
                  <Description term="???????????????">{formDataSource.resType2Name}</Description>
                  <Description term="??????????????????">{formDataSource.enrollDate}</Description>
                  <Description term="????????????">{formDataSource.ouName}</Description>
                  <Description term="BaseBU">{formDataSource.baseBuName}</Description>
                  <Description term="Base???">{formDataSource.baseCityName}</Description>
                  <Description term="????????????">{formDataSource.presName}</Description>
                  <Description term="??????">{formDataSource.jobGrade}</Description>
                  <Description term="????????????">{formDataSource.eqvaRatio}</Description>
                  <Description term="??????">{formDataSource.empNo}</Description>
                  <Description term="????????????">{formDataSource.compfeeQuota}</Description>
                  <Description term="????????????">{formDataSource.telfeeQuota}</Description>
                  <Description term="????????????">{formDataSource.salaryMethodName}</Description>
                  <Description term="????????????">{formDataSource.salaryPeriodName}</Description>
                  <Description term="BU??????">{formDataSource.roleCodeName}</Description>
                  <Description term="????????????">{formDataSource.serviceTypeName}</Description>
                  <Description term="???????????????">
                    {formDataSource.serviceClockFrom}~{formDataSource.serviceClockTo}
                  </Description>
                  <Description term="????????????">
                    {formDataSource.busitripFlag ? '???' : '???'}
                  </Description>
                </DescriptionList>
              </Card>
            )}
          {fieldsConfig.taskKey === ACC_A28_04 && (
            <Card
              className="tw-card-adjust"
              bordered={false}
              title={
                <Title
                  icon="profile"
                  id="ui.menu.plat.res.resCreate"
                  defaultMessage="??????????????????"
                />
              }
            >
              <FieldList
                layout="horizontal"
                legend={formatMessage({
                  id: `app.settings.menuMap.basicMessage`,
                  desc: '????????????',
                })}
                getFieldDecorator={getFieldDecorator}
                col={2}
              >
                <Field
                  name="personName"
                  label="??????"
                  decorator={{
                    initialValue: formData.personName,
                  }}
                >
                  <Input placeholder="???????????????" disabled />
                </Field>
                <Field
                  name="foreignName"
                  label="?????????"
                  decorator={{
                    initialValue: formData.foreignName,
                  }}
                >
                  <Input placeholder="??????????????????" disabled />
                </Field>
                <Field
                  name="enrollDate"
                  label="??????????????????"
                  Presentational
                  decorator={{
                    initialValue: formData.enrollDate,
                  }}
                >
                  <Input placeholder="???????????????????????????" disabled />
                </Field>
                <Field
                  name="newEnrollDate"
                  label="??????????????????"
                  decorator={{
                    initialValue: formData.newEnrollDate ? moment(formData.newEnrollDate) : null,
                    rules: [{ required: true, message: '???????????????????????????' }],
                  }}
                >
                  <DatePicker className="x-fill-100" />
                </Field>
              </FieldList>
              <Divider dashed />
              <FieldList
                layout="horizontal"
                legend="????????????"
                getFieldDecorator={getFieldDecorator}
                col={2}
              >
                <Field
                  name="mobile"
                  label="?????????"
                  decorator={{
                    initialValue: formData.mobile,
                    rules: [
                      {
                        required: true,
                        message: '??????????????????',
                      },
                    ],
                  }}
                >
                  <Input placeholder="??????????????????" />
                </Field>
                <Field
                  name="emailAddr"
                  label="??????"
                  decorator={{
                    initialValue: formData.emailAddr,
                    rules: [
                      {
                        required: true,
                        message: '???????????????',
                      },
                    ],
                  }}
                >
                  <Input placeholder="???????????????" onChange={this.handleChange} />
                </Field>
                <Field
                  name="userName"
                  label="?????????"
                  decorator={{
                    initialValue: formData.userName,
                    rules: [
                      {
                        required: true,
                        message: '??????????????????',
                      },
                    ],
                  }}
                >
                  <Input placeholder="??????????????????" disabled />
                </Field>
                <Field
                  name="userTitle"
                  label="??????"
                  decorator={{
                    initialValue: formData.userTitle,
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
                  name="loginName"
                  label="?????????"
                  decorator={{
                    initialValue: formData.loginName,
                  }}
                >
                  <Input placeholder="??????????????????" disabled />
                </Field>
                <Field
                  name="loginPassword"
                  label="??????"
                  decorator={{
                    initialValue: formData.loginPassword,
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
              </FieldList>
            </Card>
          )}
          {fieldsConfig.taskKey !== ACC_A28_04 &&
            roles.indexOf('PLAT_IT_ADMIN') > -1 && (
              <Card
                className="tw-card-adjust"
                bordered={false}
                title={
                  <Title
                    icon="profile"
                    id="ui.menu.plat.res.resCreate"
                    defaultMessage="??????????????????"
                  />
                }
              >
                <DescriptionList size="large" col={2} title="????????????">
                  <Description term="??????">{createData.personName}</Description>
                  <Description term="?????????">{createData.foreignName}</Description>
                  <Description term="????????????">{createData.enrollDate}</Description>
                </DescriptionList>
                <DescriptionList size="large" col={2} title="????????????">
                  <Description term="?????????">{createData.mobile}</Description>
                  <Description term="??????">{createData.emailAddr}</Description>
                  <Description term="?????????">{createData.userName}</Description>
                  <Description term="??????">{createData.userTitle}</Description>
                  <Description term="?????????">{createData.loginName}</Description>
                </DescriptionList>
              </Card>
            )}

          {!taskId && <BpmConnection source={[{ docId: id, procDefKey: 'ACC_A28' }]} />}
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default EnrollDetail;
