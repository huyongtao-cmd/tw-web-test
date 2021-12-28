/* eslint-disable arrow-body-style */
import React from 'react';
import { connect } from 'dva';
import { Button, Card, InputNumber, Form, Input, Row, Col, Radio, Select } from 'antd';
import { formatMessage } from 'umi/locale';
import classnames from 'classnames';
import { isEmpty, isNil } from 'ramda';
import { closeThenGoto, mountToTab } from '@/layouts/routerControl';
import { FileManagerEnhance, Selection, DatePicker, UdcSelect } from '@/pages/gen/field';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import AsyncSelect from '@/components/common/AsyncSelect';
import styles from './style.less';
import createMessage from '@/components/core/AlertMessage';

const RadioGroup = Radio.Group;
const { Option } = Select;
const { Field, FieldLine } = FieldList;

const DOMAIN = 'applyAdviser'; //

@connect(({ loading, dispatch, user, applyAdviser }) => ({
  loading,
  dispatch,
  user,
  applyAdviser,
}))
@Form.create()
@mountToTab()
class ApplyAdviser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reasonFlag: '',
    };
  }

  componentDidMount() {
    const {
      dispatch,
      user: {
        user: { extInfo, roles },
      },
    } = this.props;
    const saleFlag = roles.indexOf('SALES') !== -1;
    const preSaleFlag = roles.indexOf('PRESALES') !== -1;
    dispatch({ type: `${DOMAIN}/fetchSelectCapasetLevel` });
    dispatch({ type: `${DOMAIN}/queryReason`, payload: extInfo.resId });
    // console.log(this.props.user,56789);
    // const param = {
    //   offset: 0,
    //   limit: !preSaleFlag&&!saleFlag?0:100,
    //   sortBy: 'id',
    //   sortDirection: 'DESC',
    //   forecastWinDateRange: 0,
    //   preSaleResId: preSaleFlag?extInfo.userId:undefined,
    //   oppoStatusArry:['0','ACTIVE'],
    //   // oppoStatusArry[0]: 0,
    //   // oppoStatusArry[1]: 'ACTIVE',
    //   createUserId: saleFlag?extInfo.userId:undefined
    // }
    dispatch({ type: `${DOMAIN}/queryOppos` });
  }

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

  changeReasonType = value => {
    this.setState({ reasonFlag: value });
    const { form } = this.props;
    form.setFieldsValue({
      reasonId: undefined,
    });
  };

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
        const startTime = new Date(values?.expectedStartDate).getTime();
        const endTime = new Date(values?.expectedEndDate).getTime();
        if (startTime > endTime) {
          createMessage({ type: 'error', description: '预计结束日期不能早于预计开始日期' });
        } else {
          dispatch({
            type: `${DOMAIN}/create`,
            payload: {
              // submitted,
              ...values,
              applyResId: extInfo.resId,
            },
          });
        }
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
      applyAdviser: { formData, abilityList, projectList = [], preSaleTaskList = [] },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
      capasetLeveldList = [],
    } = this.props;
    const { reasonFlag } = this.state;
    const preparing = loading.effects[`${DOMAIN}/query`];
    const submitting = loading.effects[`${DOMAIN}/create`];
    let reasonList = [];
    reasonList = reasonFlag === 'PROJ' ? projectList : preSaleTaskList;
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
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">创建派工单</div>
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="applyName"
              label="派工单名称"
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              fieldCol={1}
              decorator={{
                initialValue: formData.applyName,
                rules: [
                  {
                    required: true,
                    message: '请填写派工单名称',
                  },
                ],
              }}
            >
              <Input />
            </Field>

            <Field
              name="reasonType"
              label="事由类型"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.reasonType,
                rules: [
                  {
                    required: true,
                    message: '请填写事由类型',
                  },
                ],
              }}
            >
              {/* <UdcSelect code="TSK.REASON_TYPE" placeholder="请选择事由类型" /> */}
              <Select style={{ width: '100%' }} onChange={value => this.changeReasonType(value)}>
                <Option value="PROJ">项目</Option>
                <Option value="OPPO">售前</Option>
              </Select>
            </Field>

            <Field
              name="reasonId"
              label="事由号"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.reasonId,
                rules: [
                  {
                    required: true,
                    message: '请填写事由号',
                  },
                ],
              }}
            >
              {/* <Input /> */}
              <Select
                filterOption={
                  (input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  // console.log(option.props.children)
                }
                showSearch
                style={{ width: '100%' }}
              >
                {reasonList.map((item, index) => {
                  return (
                    <Option value={item.id} key={item.id}>
                      {reasonFlag === 'PROJ' ? item.name : item.oppoName}
                    </Option>
                  );
                })}
              </Select>
            </Field>

            <Field
              name="consultantName"
              label="顾问姓名"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.consultantName,
                rules: [
                  {
                    required: true,
                    message: '请填写顾问姓名',
                  },
                ],
              }}
            >
              <Input />
            </Field>
            <Field
              name="capasetLevelId"
              label="复合能力"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.capasetLevelId,
                rules: [
                  {
                    required: true,
                    message: '请选择复合能力',
                  },
                ],
              }}
            >
              <Selection
                // value={value}
                source={abilityList}
                placeholder="请选择复合能力（系数）"
                // onChange={this.onCellChanged(index, 'capasetLevelId')}
              />
            </Field>

            <Field
              name="expectedStartDate"
              label="预计入场日期"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.expectedStartDate,
                rules: [
                  {
                    required: true,
                    message: '请选择预计入场日期',
                  },
                ],
              }}
            >
              <DatePicker className="x-fill-100" />
            </Field>

            <Field
              name="expectedEndDate"
              label="预计结束日期"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.expectedEndDate,
                rules: [
                  {
                    required: true,
                    message: '请选择预计结束日期',
                  },
                ],
              }}
            >
              <DatePicker className="x-fill-100" />
            </Field>
            <Field
              name="serviceFee"
              label="服务费(元/人天)"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.serviceFee,
                rules: [
                  {
                    required: true,
                    message: '请填写服务费(元/人天)',
                  },
                ],
              }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Field>

            <Field
              name="isTax"
              label="是否含税"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.isTax,
                rules: [
                  {
                    required: true,
                    message: '请选择是否含税',
                  },
                ],
              }}
            >
              <RadioGroup>
                <Radio value={1}>是</Radio>
                <Radio value={0}>否</Radio>
              </RadioGroup>
            </Field>

            <Field
              name="situationDescribe"
              label="资源引入情况说明"
              fieldCol={1}
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              decorator={{
                initialValue: formData.situationDescribe,
                rules: [
                  {
                    required: true,
                    message: '请输入资源引入情况说明',
                  },
                ],
              }}
            >
              <Input.TextArea placeholder="请输入资源引入情况说明" rows={3} />
            </Field>

            <Field
              name="personalInfo"
              label="独立顾问个人信息"
              fieldCol={1}
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              decorator={{
                initialValue: formData.personalInfo,
                rules: [
                  {
                    required: true,
                    message: '请输入独立顾问个人信息',
                  },
                ],
              }}
            >
              <Input.TextArea
                placeholder="请输入独立顾问个人信息(姓名、身份证号、手机号、银行卡账号、开户行信息)"
                rows={3}
                className={styles['adviser-info']}
              />
            </Field>
            <p style={{ margin: '5px 20% ', fontSize: 14, color: 'red' }}>
              填写顾问个人信息请务必包含姓名、身份证号、手机号、银行卡账号、开户行信息
            </p>
            <Field
              name="isUpdateResume"
              label="被推荐人简历"
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              fieldCol={1}
              decorator={{
                initialValue: formData.id || '',
                rules: [
                  {
                    required: true,
                    message: '请上传被推荐人简历',
                  },
                ],
              }}
            >
              <FileManagerEnhance
                api="/api/person/v1/workOrderApply/sfs/resume/token"
                listType="text"
                dataKey=""
                multiple={false}
              />
            </Field>
            <Field
              name="isUpdateOrder"
              label="派工单上传"
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              fieldCol={1}
              decorator={{
                initialValue: formData.id || '',
                rules: [
                  {
                    required: true,
                    message: '请上传派工单',
                  },
                ],
              }}
            >
              <FileManagerEnhance
                api="/api/person/v1/workOrderApply/sfs/workOrder/token"
                listType="text"
                dataKey=""
                multiple={false}
              />
            </Field>
          </FieldList>

          {/* <Row style={{ width: '80%' }}>
            <Col span={4} style={{ textAlign: 'right', paddingRight: 10 }}>
              简历上传:
            </Col>
            <Col span={12}>
              <FileManagerEnhance
                // api="/api/person/v1/res/personResume/sfs/token"
                api="/api/person/v1/workOrderApply/sfs/resume/token"
                dataKey={null}
                required
                listType="text"
                disabled={false}
              />
            </Col>
          </Row>

          <Row style={{ width: '80%', marginTop: 10 }}>
            <Col span={4} style={{ textAlign: 'right', paddingRight: 10 }}>
              派工单上传:
            </Col>
            <Col span={12}>
              <FileManagerEnhance
                // api="/api/person/v1/res/personResume/sfs/token"
                api="/api/person/v1/workOrderApply/sfs/workOrder/token"
                dataKey={null}
                required
                listType="text"
                disabled={false}
              />
            </Col>
          </Row> */}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ApplyAdviser;
