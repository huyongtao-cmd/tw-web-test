/* eslint-disable react/destructuring-assignment */
/* eslint-disable arrow-body-style */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Card,
  Button,
  Divider,
  Radio,
  Tooltip,
  Input,
  Form,
  Select,
  InputNumber,
  Row,
  Col,
} from 'antd';
import DescriptionList from '@/components/layout/DescriptionList';
import DataTable from '@/components/common/DataTable';
import { FileManagerEnhance, DatePicker, Selection } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto, markAsNoTab } from '@/layouts/routerControl';
import { formatDT } from '@/utils/tempUtils/DateTime';
import router from 'umi/router';
import createMessage from '@/components/core/AlertMessage';
import Link from 'umi/link';
import { getLink } from '@/pages/sale/purchaseContract/linkConfig';
import { formatMessage } from 'umi/locale';
import FieldList from '@/components/layout/FieldList';
import moment from 'moment';
import { isEmpty } from 'ramda';
import styles from '../style.less';

const DOMAIN = 'adviserFlow';
const { Description } = DescriptionList;
const { Field } = FieldList;
const { Option } = Select;
const RadioGroup = Radio.Group;

@connect(({ loading, dispatch, adviserFlow, user, applyAdviser }) => ({
  loading,
  dispatch,
  adviserFlow,
  applyAdviser,
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
class Detail extends PureComponent {
  componentDidMount() {
    this.props.onRef(this);
    const {
      dispatch,
      user: {
        user: { extInfo },
      },
    } = this.props;
    dispatch({ type: `applyAdviser/fetchSelectCapasetLevel` });
    dispatch({ type: `applyAdviser/queryReason`, payload: extInfo.resId });
    dispatch({ type: `applyAdviser/queryOppos` });
  }

  changeReasonType = value => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        reasonFlag: value,
      },
    });
    const { form } = this.props;
    form.setFieldsValue({
      reasonId: undefined,
    });
  };

  handleSave = () => {
    const {
      dispatch,
      user: {
        user: { extInfo },
      },
      adviserFlow: { detailData },
      form: { validateFieldsAndScroll },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/updateCoop`,
          payload: {
            ...values,
            applyStatus: detailData.applyStatus,
            apprStatus: detailData.apprStatus,
            id: detailData.id,
            reportedResId: extInfo.resId,
            reportedDate: formatDT(detailData.reportedDate, 'YYYY-MM-DD HH:mm:ss'),
          },
        });
      }
    });
  };

  render() {
    const {
      adviserFlow: { closeReason, pageConfig, fieldsConfig, detailData: formData, reasonFlag },
      dispatch,
      loading,
      applyAdviser: { abilityList, preSaleTaskList = [], projectList = [] },
      form: { getFieldDecorator },
    } = this.props;
    const { pageMode, taskId, mode } = fromQs();
    const { taskKey } = fieldsConfig;
    const isEdit = !(taskId && taskKey === 'ORG_G04_01_SUBMIT_i' && mode === 'edit');
    let taskList = [];
    taskList = reasonFlag === 'OPPO' ? preSaleTaskList : projectList;
    if (isEdit) {
      taskList = [
        {
          id: formData.reasonId,
          oppoName: formData.reasonType === 'OPPO' ? formData.reasonName : undefined,
          name: formData.reasonType === 'PROJ' ? formData.reasonName : undefined,
        },
      ];
    }
    return (
      <>
        {pageMode === 'over' ? (
          <Card className="tw-card-adjust" bordered={false}>
            <div className="tw-card-title">终止原因</div>
            <Input.TextArea
              style={{
                width: '80%',
                margin: '10px 0 0 50px',
              }}
              defaultValue={closeReason}
              rows={5}
              onChange={e => {
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: { closeReason: e.target.value },
                });
              }}
              disabled
            />
          </Card>
        ) : (
          ''
        )}
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">独立顾问派工单详情</div>
          {/*<DescriptionList size="large" col={3} className={style.fill}>*/}
          {/*</DescriptionList>*/}
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
              <Input disabled={isEdit} />
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
              <Select
                disabled={isEdit}
                style={{ width: '100%' }}
                onChange={value => this.changeReasonType(value)}
              >
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
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                disabled={isEdit}
              >
                {taskList?.map((item, index) => {
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
              <Input disabled={isEdit} />
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
                disabled={isEdit}
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
              <DatePicker className="x-fill-100" disabled={isEdit} />
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
              <DatePicker className="x-fill-100" disabled={isEdit} />
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
              <InputNumber min={0} style={{ width: '100%' }} disabled={isEdit} />
            </Field>

            <Field
              name="isTax"
              label="是否含税"
              labelCol={{ span: 6, xxl: 8 }}
              wrapperCol={{ span: 18, xxl: 16 }}
              decorator={{
                initialValue: formData.isTax ? 1 : 0,
                rules: [
                  {
                    required: true,
                    message: '请选择是否含税',
                  },
                ],
              }}
            >
              <RadioGroup disabled={isEdit}>
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
              <Input.TextArea placeholder="请输入资源引入情况说明" rows={3} disabled={isEdit} />
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
                disabled={isEdit}
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
                initialValue: formData.isUpdateResume || '',
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
                dataKey={formData.id}
                multiple={false}
                disabled={isEdit}
                preview={isEdit}
              />
            </Field>
            <Field
              name="isUpdateOrder"
              label="派工单上传"
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              fieldCol={1}
              decorator={{
                initialValue: formData.isUpdateOrder || '',
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
                dataKey={formData.id}
                multiple={false}
                disabled={isEdit}
                preview={isEdit}
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
                dataKey={1}
                required
                listType="text"
                disabled={isEdit}
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
                dataKey={1}
                required
                listType="text"
                disabled={isEdit}
              />
            </Col>
          </Row> */}
        </Card>
      </>
    );
  }
}

export default Detail;
