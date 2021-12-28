/* eslint-disable react/destructuring-assignment */
/* eslint-disable arrow-body-style */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Table, Input, Form, Checkbox, Row, Col, Select } from 'antd';
import { DatePicker, Selection } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto, markAsNoTab } from '@/layouts/routerControl';
import FieldList from '@/components/layout/FieldList';
import moment from 'moment';
import { getUrl } from '@/utils/flowToRouter';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { isEmpty } from 'ramda';
import createMessage from '@/components/core/AlertMessage';

const DOMAIN = 'promptFlow';
const { Field } = FieldList;
const { Option } = Select;

@connect(({ loading, dispatch, promptFlow, user }) => ({
  loading,
  dispatch,
  promptFlow,
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
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     flag1: false,
  //     flag2: false,
  //     flag3: false,
  //   };
  // }

  componentDidMount() {
    this.props.onRef(this);
  }

  handleSave = props => {
    const {
      dispatch,
      user: {
        user: { extInfo },
      },
      promptFlow: { detailData },
      form: { validateFieldsAndScroll },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/updatePrompt`,
          payload: {
            ...props,
            ...values,
            applyStatus: detailData.applyStatus,
            apprStatus: detailData.apprStatus,
            id: detailData.id,
            reportedResId: extInfo.resId,
            reportedDate: formatDT(detailData.reportedDate, 'YYYY-MM-DD HH:mm:ss'),
          },
        }).then(response => {
          if (response.ok) {
            createMessage({ type: 'success', description: '操作成功' });
            const url = getUrl().replace('edit', 'view');
            closeThenGoto(url);
          }
        });
      }
    });
  };

  disabledDate = current => {
    // Can not select days before today and today
    const {
      promptFlow: { days = '60', startDay },
    } = this.props;
    // console.log(startDay, 'days', moment().valueOf());
    const daysN = parseInt(days, 0);
    const mDay = moment(startDay)
      .add(daysN, 'days')
      .calendar();
    return current > moment(mDay) || current < moment();
  };

  render() {
    const {
      promptFlow: {
        closeReason,
        fieldsConfig,
        detailData: formData,
        recvPlanDetail = {},
        logList = [],
        startDay,
        days,
        maxTime,
      },
      dispatch,
      loading,
      form: { getFieldDecorator },
    } = this.props;
    // console.log(startDay, '2222222');
    const { pageMode, taskId, mode } = fromQs();
    const { taskKey } = fieldsConfig;
    // const { flag1, flag2, flag3 } = this.state;
    // const flag = !flag1 && !flag2 && !flag3;
    const saleFlag = taskId && taskKey === 'ACC_A115_02_SALE_b' && mode === 'edit';
    const proFlag = taskId && taskKey === 'ACC_A115_03_PM_b' && mode === 'edit';
    const columns = [
      {
        title: '调整日期',
        dataIndex: 'createTime',
        key: 'createTime',
        render: value => <span>{formatDT(moment(value))}</span>,
      },
      {
        title: '调整人',
        dataIndex: 'createUserName',
        key: 'createUserName',
      },
      {
        title: '调整前日期',
        dataIndex: 'oldRecvOrInvDate',
        key: 'oldRecvOrInvDate',
      },
      {
        title: '调整后日期',
        key: 'recvOrInvDate',
        dataIndex: 'recvOrInvDate',
      },
      {
        title: '发催款函',
        dataIndex: 'flag1',
        key: 'flag1',
        render: value => <span>{value ? '是' : '否'}</span>,
      },
      {
        title: '修改原因',
        dataIndex: 'reason',
        key: 'reason',
      },
    ];
    let dateFlag = false;
    if (proFlag) {
      dateFlag = formData?.pmConfirm;
    } else if (saleFlag) {
      dateFlag = !formData?.pmConfirm && !formData?.recvDateConfirm && !formData?.financeConfirm;
    }
    const recvDateConfirmFlag = formData.tipsType === '1' && (saleFlag || proFlag);
    const tipsArr = [
      `此收款计划，预计收款日期临近，请确认收款日期，如收款日期有变动，请做调整。`,
      `此收款计划，预计收款日期已过，请重新确认收款日期，并做调整。`,
      `此收款计划，已经开出发票，预计收款日期已过，请重新确认收款日期，并做调整。`,
      `此收款计划，已经开出发票，预计收款日期已过，只收到了部分款项，请重新确认收款日期，并做调整。`,
    ];
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
        <div style={{ color: 'red', fontSize: 18 }}>
          <p>{tipsArr[parseInt(formData.tipsType, 0) - 1]}</p>
          <p>
            {`调整后的收款日期不得超出${
              formData.tipsType === '1' ? '原定预计收款日期' : '当前日'
            }之后${days}天的范围。`}
          </p>
          <p>
            {`如果本收款计划发生调整预计收款日期${maxTime}次以上，系统流程会升级到销售BU负责人和项目交付负责人。`}
          </p>
          <br />
          {logList.length > maxTime ? (
            <p>
              {`本收款计划已经合计调整预计收款日期次数超过${maxTime}次，将提示销售BU负责人，交付负责人做重点关注！`}
            </p>
          ) : (
            ''
          )}
        </div>
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">收款计划</div>
          <FieldList layout="horizontal" col={3}>
            <Row>
              <Col span={8}>
                <Row>
                  <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                    客户名:
                  </Col>
                  <Col span={16}>
                    <Input disabled value={recvPlanDetail?.custName} />
                  </Col>
                </Row>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  子合同名称:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.contractName} />
                </Col>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  子合同号:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.contractNo} />
                </Col>
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Row>
                  <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                    收款号:
                  </Col>
                  <Col span={16}>
                    <Input disabled value={recvPlanDetail?.recvNo} />
                  </Col>
                </Row>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  收款阶段:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.phaseDesc} />
                </Col>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  收款状态:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.recvStatusDesc} />
                </Col>
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Row>
                  <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                    当期收款金额:
                  </Col>
                  <Col span={16}>
                    <Input disabled value={recvPlanDetail?.recvAmt} />
                  </Col>
                </Row>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  当期收款比例%:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.recvRatio} />
                </Col>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  税率:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.taxRate} />
                </Col>
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Row>
                  <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                    预计收款日期:
                  </Col>
                  <Col span={16}>
                    <Input disabled value={recvPlanDetail?.expectRecvDate} />
                  </Col>
                </Row>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  开票状态:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.batchStatusDesc} />
                </Col>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  开票日期:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.invDate} />
                </Col>
              </Col>
            </Row>
            <Row>
              <Col span={8}>
                <Row>
                  <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                    已开票金额:
                  </Col>
                  <Col span={16}>
                    <Input disabled value={recvPlanDetail?.invAmt} />
                  </Col>
                </Row>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  未开票金额:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.unInvAmt} />
                </Col>
              </Col>
              <Col span={8}>
                <Col span={6} style={{ textAlign: 'right', paddingRight: 10 }}>
                  已收款金额:
                </Col>
                <Col span={16}>
                  <Input disabled value={recvPlanDetail?.actualRecvAmt} />
                </Col>
              </Col>
            </Row>
          </FieldList>
        </Card>
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">确认单信息</div>
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={3}>
            <Field
              name="salesManResName"
              label="销售负责人"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: recvPlanDetail?.salesManResName,
              }}
            >
              <Input disabled />
            </Field>

            <Field
              name="projectManager"
              label="项目经理"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: recvPlanDetail?.projectManager,
              }}
            >
              <Input disabled />
            </Field>

            <Field
              name="pmoResName"
              label="PMO"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: recvPlanDetail?.pmoResName,
              }}
            >
              <Input disabled />
            </Field>

            <Field
              name="salesRemark"
              label="修改原因(销售)"
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              fieldCol={1}
              decorator={{
                initialValue: formData?.salesRemark,
                rules: [
                  {
                    max: 200,
                    message: '修改原因不能超过200字',
                  },
                  {
                    required: saleFlag,
                    message: '请填写修改原因(销售)',
                  },
                ],
              }}
            >
              <Input.TextArea placeholder="修改原因(销售)" rows={3} disabled={!saleFlag} />
            </Field>
            <Field
              name="pmRemark"
              label="修改原因(项目经理)"
              labelCol={{ span: 6, xxl: 4 }}
              wrapperCol={{ span: 18, xxl: 20 }}
              fieldCol={1}
              decorator={{
                initialValue: formData?.pmRemark,
                rules: [
                  {
                    max: 200,
                    message: '修改原因不能超过200字',
                  },
                  {
                    required: proFlag,
                    message: '修改原因(项目经理)',
                  },
                ],
              }}
            >
              <Input.TextArea placeholder="修改原因(项目经理)" rows={3} disabled={!proFlag} />
            </Field>
            <Field
              name="adjExpectRecvDate"
              label="预计收款日期调整"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: formData?.adjExpectRecvDate,
                rules: [
                  {
                    required: dateFlag,
                    message: '请选择预计收款日期调整',
                  },
                ],
              }}
            >
              <DatePicker
                className="x-fill-100"
                disabled={!dateFlag}
                disabledDate={this.disabledDate}
              />
            </Field>
            <Field
              name="pmConfirm"
              label="由项目经理确认"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: formData?.pmConfirm ?? false,
              }}
            >
              {/* <Checkbox
                onChange={e => this.setState({ flag1: e.target.checked })}
                defaultChecked={formData?.pmConfirm}
                disabled={!saleFlag}
              /> */}
              <Select
                // onChange={value => this.setState({ flag1: value })}
                disabled={!saleFlag}
              >
                <Option value>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Field>

            <Field
              name="sendPaymentRequest"
              label="是否发送催款函"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: formData?.sendPaymentRequest ?? false,
              }}
            >
              {/* <Checkbox
                defaultChecked={formData?.sendPaymentRequest}
                disabled={!(saleFlag || proFlag)}
              /> */}
              <Select disabled={!(saleFlag || proFlag)}>
                <Option value>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Field>

            <Field
              name="recvDateConfirm"
              label="预计收款日期无误"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: formData?.recvDateConfirm ?? false,
              }}
            >
              {/* <Checkbox
                onChange={e => this.setState({ flag2: e.target.checked })}
                disabled={!(saleFlag || proFlag)}
                defaultChecked={formData?.recvDateConfirm}
              /> */}
              <Select
                // onChange={value => this.setState({ flag2: value })}
                disabled={!recvDateConfirmFlag}
              >
                <Option value>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Field>

            <Field
              name="financeConfirm"
              label="已付款需财务确认"
              labelCol={{ span: 12 }}
              wrapperCol={{ span: 12 }}
              decorator={{
                initialValue: formData?.financeConfirm ?? false,
              }}
            >
              {/* <Checkbox
                onChange={e => this.setState({ flag3: e.target.checked })}
                disabled={!(saleFlag || proFlag)}
                defaultChecked={formData?.financeConfirm}
              /> */}
              <Select
                // onChange={value => this.setState({ flag3: value })}
                disabled={!(saleFlag || proFlag)}
              >
                <Option value>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Field>
          </FieldList>
        </Card>
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">收款计划调整历史</div>
          <Table columns={columns} dataSource={logList} />
        </Card>
      </>
    );
  }
}

export default Detail;
