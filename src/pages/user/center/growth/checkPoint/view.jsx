import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, hasIn } from 'ramda';
import {
  Card,
  Form,
  Input,
  Divider,
  Tooltip,
  InputNumber,
  Radio,
  Popover,
  Rate,
  Table,
} from 'antd';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import FieldList from '@/components/layout/FieldList';
import { FileManagerEnhance, UdcSelect, Selection } from '@/pages/gen/field';
import DataTable from '@/components/common/DataTable';
import EditableDataTable from '@/components/common/EditableDataTable';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import { pushFlowTask } from '@/services/gen/flow';
import { createConfirm } from '@/components/core/Confirm';
import { selectUsersWithBu } from '@/services/gen/list';
import { add, genFakeId } from '@/utils/mathUtils';
import moment from 'moment';
import { getUrl } from '@/utils/flowToRouter';
import { fromQs } from '@/utils/stringUtils';
import styles from '../index.less';

const { Field, FieldLine } = FieldList;
const RadioGroup = Radio.Group;

const DOMAIN = 'growthCheckPoint';

@connect(({ loading, growthCheckPoint, dispatch }) => ({
  loading,
  growthCheckPoint,
  dispatch,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const { name, value } = Object.values(changedFields)[0];
    if (value || value === 0) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: value },
      });
    }
  },
})
@mountToTab()
class PrefCheckFlow extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
    const { dispatch } = this.props;
    const { id, taskId } = fromQs();
    dispatch({
      type: `${DOMAIN}/getPointFnHandle`,
      payload: {
        id,
      },
    });
    taskId &&
      dispatch({
        type: `${DOMAIN}/fetchConfig`,
        payload: taskId,
      });
  };

  render() {
    const {
      loading,
      dispatch,
      form: { validateFieldsAndScroll, getFieldDecorator, setFields },
      growthCheckPoint: {
        formData,
        flowForm,
        fieldsConfig,
        examTmplPointViewList,
        dataSource = [],
        total = 0,
      },
    } = this.props;
    const { listIds = [] } = formData;
    const { id, taskId, prcId, from, mode } = fromQs();
    const flowCanEdit = !(
      fieldsConfig.buttons &&
      fieldsConfig.buttons[0] &&
      fieldsConfig.buttons[0].branches &&
      fieldsConfig.buttons[0].branches[0] &&
      fieldsConfig.buttons[0].branches[0].code === 'FLOW_PASS'
    );
    const EvalContent = props => {
      const { type, item, list } = props;
      return (
        <div>
          <div style={{ fontWeight: 'bold', marginLeft: 10, marginBottom: 10 }}>
            {item.evalTarget}
            <span style={{ fontSize: '12px', color: '#999', marginLeft: 20 }}>
              &nbsp;&nbsp;????????????:&nbsp;&nbsp;
              {item.evalDate}
            </span>
          </div>
          <div style={{ marginLeft: 10 }}>
            <Rate disabled count={10} value={Number(item.avg) || 0} />
            <div style={{ fontSize: 12 }}>
              <pre>{item.evalComment}</pre>
              <Divider />
            </div>
          </div>
          <div style={{ paddingBottom: 15 }}>
            {list &&
              list.map(score => (
                <div key={score.id}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 120,
                      textAlign: 'right',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Tooltip title={score.evalPoint}>{score.evalPoint}</Tooltip>
                  </span>
                  &nbsp;&nbsp;
                  <Rate disabled count={10} value={score.evalScore || 0} />
                  <Tooltip placement="topLeft" title={<pre>{score.evalComment}</pre>}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'top',
                        paddingTop: 5,
                      }}
                    >
                      {score.evalComment}
                    </span>
                  </Tooltip>
                </div>
              ))}
          </div>
        </div>
      );
    };
    return (
      <PageHeaderWrapper>
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
            const { remark, branch } = bpmForm;
            const { key, branches } = operation;
            const resultParams = {
              FLOW_PASS: 'APPROVED',
              FLOW_COMMIT: 'APPLIED',
              FLOW_RETURN: 'REJECTED',
            };
            validateFieldsAndScroll((error, values) => {
              if (!error) {
                const params = {
                  ...formData,
                  ...values,
                  flow: {
                    branch,
                    remark,
                    result: resultParams[key],
                    taskId,
                  },
                };
                dispatch({
                  type: `${DOMAIN}/saveFlowHandle`,
                  payload: params,
                });
              }
            });
            return Promise.resolve(false);
          }}
        >
          <Card
            className="tw-card-adjust"
            style={{ marginTop: '6px' }}
            title={<Title icon="profile" text="???????????????????????????" />}
            bordered={false}
          >
            <FieldList getFieldDecorator={getFieldDecorator} col={2}>
              <Field
                name="applyResName"
                label="?????????"
                decorator={{
                  initialValue: formData.applyResName,
                }}
              >
                <Input placeholder="" disabled />
              </Field>
              <Field
                name="applyDate"
                label="????????????"
                decorator={{
                  initialValue: formData.applyDate,
                }}
              >
                <Input placeholder="" disabled />
              </Field>
              <Field
                name="capaLevelName"
                label="????????????"
                decorator={{
                  initialValue: formData.capaLevelName,
                }}
              >
                <Input placeholder="" disabled />
              </Field>

              <Field
                name="capaAbilityName"
                label="?????????"
                decorator={{
                  initialValue: formData.capaAbilityName,
                }}
              >
                <Input placeholder="" disabled />
              </Field>

              <Field name="attache" label="??????">
                <FileManagerEnhance
                  api="/api/base/v1/resCapaExamApply/sfs/token"
                  dataKey={formData.id}
                  listType="text"
                  disabled={flowCanEdit || mode === 'view'}
                />
              </Field>

              <Field
                name="selfDesc"
                label="??????"
                decorator={{
                  initialValue: formData.selfDesc,
                }}
                fieldCol={1}
                labelCol={{ span: 4, xxl: 3 }}
                wrapperCol={{ span: 19, xxl: 20 }}
              >
                <Input.TextArea rows={3} placeholder="" disabled={flowCanEdit || mode === 'view'} />
              </Field>
              {(formData.apprType === 'ASSIGN_RES' || formData.apprType === 'BY_CAPASET') &&
              !flowCanEdit ? (
                <Field
                  name="apprRes"
                  label="?????????"
                  decorator={{
                    initialValue: formData.apprRes ? parseInt(formData.apprRes, 10) : '',
                    rules: [{ required: !flowCanEdit && mode === 'edit', message: '??????????????????' }],
                  }}
                >
                  <Selection.Columns
                    source={listIds}
                    columns={[
                      { dataIndex: 'code', title: '??????', span: 10 },
                      { dataIndex: 'name', title: '??????', span: 14 },
                    ]}
                    transfer={{ key: 'id', code: 'id', name: 'name' }}
                    placeholder="??????????????????"
                    showSearch
                    disabled={flowCanEdit || mode === 'view'}
                  />
                </Field>
              ) : (
                ''
              )}

              <Field
                name="apprResult"
                label="????????????"
                decorator={{
                  initialValue: formData.apprResult,
                  rules: [{ required: !flowCanEdit || mode !== 'view', message: '?????????????????????' }],
                }}
                fieldCol={1}
                labelCol={{ span: 4, xxl: 3 }}
                wrapperCol={{ span: 19, xxl: 20 }}
              >
                <RadioGroup disabled={!flowCanEdit || mode === 'view'}>
                  <Radio value="YES">????????????</Radio>
                  <Radio value="NO">???????????????</Radio>
                </RadioGroup>
              </Field>

              <Field
                name="apprDesc"
                label="????????????"
                decorator={{
                  initialValue: formData.apprDesc,
                }}
                fieldCol={1}
                labelCol={{ span: 4, xxl: 3 }}
                wrapperCol={{ span: 19, xxl: 20 }}
              >
                <Input.TextArea
                  rows={3}
                  placeholder=""
                  disabled={!flowCanEdit || mode === 'view'}
                />
              </Field>
            </FieldList>
            <Divider dashed />
            ??????????????????
            {formData.projRoleViewList &&
              formData.projRoleViewList.map((item, index) => (
                <Card
                  key={item.id}
                  bordered
                  style={{
                    borderRadius: '6px',
                    marginBottom: '10px',
                    width: '80%',
                  }}
                >
                  <FieldList getFieldDecorator={getFieldDecorator} col={2}>
                    <Field name="projectId" label={<span>??????</span>} presentational>
                      <Input value={item.projName} disabled />
                    </Field>
                    <Field name="role" label="????????????" presentational>
                      <Input value={item.role} disabled />
                    </Field>
                    <Field name="mulAbility" label="????????????" presentational>
                      <Input
                        value={
                          (item.jobType1Name &&
                            `${item.jobType1Name} - ${item.jobType2Name} - ${item.leveldName}`) ||
                          ''
                        }
                        disabled
                      />
                    </Field>
                    <Field name="avg" label="????????????" presentational>
                      <Input value={item.avg} disabled />
                      {item.projEvalViewList && item.projEvalViewList.length ? (
                        <div
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            color: '#1890FF',
                            top: -10,
                            right: -70,
                          }}
                        >
                          <Popover
                            placement="left"
                            content={<EvalContent item={item} list={item.projEvalViewList} />}
                            trigger="hover"
                          >
                            ????????????
                          </Popover>
                        </div>
                      ) : null}
                    </Field>
                    <Field name="time" label="??????" presentational>
                      <Input
                        value={item.startDate ? `${item.startDate}~${item.endDate}` : ''}
                        disabled
                      />
                    </Field>
                    <Field name="relatedField" label="????????????/??????" presentational>
                      <Input
                        onChange={e => {
                          this.onCellChanged(index, e.target.value, 'relatedField');
                        }}
                        value={item.relatedField}
                        disabled
                      />
                    </Field>
                    <Field
                      name="projectBrief"
                      label="????????????"
                      fieldCol={1}
                      labelCol={{ span: 4, xxl: 3 }}
                      wrapperCol={{ span: 19, xxl: 20 }}
                      presentational
                    >
                      <Input.TextArea
                        disabled
                        value={item.projectBrief}
                        rows={3}
                        placeholder=""
                        onChange={e => {
                          this.onCellChanged(index, e.target.value, 'projectBrief');
                        }}
                      />
                    </Field>
                    <Field
                      name="dutyDesc"
                      label="??????&??????"
                      fieldCol={1}
                      labelCol={{ span: 4, xxl: 3 }}
                      wrapperCol={{ span: 19, xxl: 20 }}
                      presentational
                    >
                      <Input.TextArea
                        disabled
                        value={item.dutyDesc}
                        rows={3}
                        placeholder=""
                        onChange={e => {
                          this.onCellChanged(index, e.target.value, 'dutyDesc');
                        }}
                      />
                    </Field>
                  </FieldList>
                </Card>
              ))}
            <div>
              <Divider dashed />
              ??????????????????
              <Table
                bordered
                columns={[
                  {
                    title: '??????',
                    dataIndex: 'taskName',
                    width: '20%',
                  },
                  {
                    title: '????????????',
                    dataIndex: 'reasonTypeName',
                    align: 'center',
                    width: '8%',
                  },
                  {
                    title: '??????',
                    dataIndex: 'evalTarget',
                    width: '20%',
                  },
                  {
                    title: '????????????',
                    dataIndex: 'ability',
                    width: '20%',
                    render: (val, row) => (
                      <span>
                        {row.jobType1Name}
                        {row.jobType2Name ? `-${row.jobType2Name}` : ''}
                        {row.leveldName ? `-${row.leveldName}` : ''}
                      </span>
                    ),
                  },
                  {
                    title: '????????????',
                    dataIndex: 'avg',
                    align: 'center',
                    render: (value, row, index) => (
                      <div>
                        <Input style={{ width: '70%' }} value={value} disabled />
                        {row.projEvalViewList && row.projEvalViewList.length ? (
                          <Popover
                            placement="left"
                            content={
                              <EvalContent type="task" item={row} list={row.projEvalViewList} />
                            }
                            trigger="hover"
                          >
                            <span style={{ color: '#1890FF', cursor: 'pointer' }}>
                              &nbsp;&nbsp;????????????
                            </span>
                          </Popover>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
                dataSource={formData.taskRoleViewList || []}
                pagination={false}
              />
            </div>
          </Card>
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default PrefCheckFlow;
