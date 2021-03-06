import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import classnames from 'classnames';
import {
  Button,
  Form,
  Card,
  Input,
  List,
  Row,
  Col,
  Radio,
  DatePicker,
  Icon,
  Divider,
  Popover,
  Rate,
  Tooltip,
} from 'antd';

import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import { FileManagerEnhance, UdcSelect, Selection } from '@/pages/gen/field';
import DataTable from '@/components/common/DataTable';
import EditableDataTable from '@/components/common/EditableDataTable';
import Title from '@/components/layout/Title';
import { fromQs } from '@/utils/stringUtils';
import { selectUsersWithBu } from '@/services/gen/list';
import { genFakeId } from '@/utils/mathUtils';
import update from 'immutability-helper';
import createMessage from '@/components/core/AlertMessage';

const { Field } = FieldList;
const DOMAIN = 'growthCheckPoint';
const RadioGroup = Radio.Group;

@connect(({ growthCheckPoint }) => ({ growthCheckPoint }))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const { name, value } = Object.values(changedFields)[0];
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { [name]: value },
    });
  },
})
@mountToTab()
class CheckPoint extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/clean`,
    }).then(res => {
      this.fetchData();
    });
  }

  fetchData = () => {
    const { dispatch } = this.props;
    const { id } = fromQs();
    dispatch({
      type: `${DOMAIN}/getPointFnHandle`,
      payload: {
        id,
      },
    });
    dispatch({
      type: `${DOMAIN}/getSelectProj`,
    });
    dispatch({
      type: `${DOMAIN}/getSelectTaskEval`,
    });
  };

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      growthCheckPoint: { formData = {}, aboutProject, taskDataSource },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        let flag = true;
        aboutProject.forEach(i => {
          if (!i.projectId) {
            flag = false;
            createMessage({ type: 'warn', description: '????????????????????????' });
          }
        });
        taskDataSource.forEach(i => {
          if (!i.id) {
            flag = false;
            createMessage({ type: 'warn', description: '????????????????????????' });
          }
        });
        if (flag) {
          const examProjectList = aboutProject.map(item => ({
            projectId: item.projectId,
            startDate: item.time && item.time[0] && item.time[0].format('YYYY-MM-DD'),
            endDate: item.time && item.time[1] && item.time[1].format('YYYY-MM-DD'),
            relatedField: item.relatedField,
            projectBrief: item.projectBrief,
            dutyDesc: item.dutyDesc,
          }));
          let taskString = [];
          taskDataSource.forEach(i => {
            taskString.push(i.id);
          });
          taskString = taskString.join(',');
          dispatch({
            type: `${DOMAIN}/savePoint`,
            payload: {
              ...formData,
              ...values,
              examProjectList,
              taskString,
            },
          });
        }
      }
    });
  };

  handleCancel = () => {
    closeThenGoto('/user/center/growth');
  };

  // ????????????????????? - ??????????????????
  onCellChanged = (index, value, name) => {
    const {
      growthCheckPoint: { aboutProject },
      dispatch,
    } = this.props;

    const newDataSource = aboutProject;
    newDataSource[index] = {
      ...newDataSource[index],
      [name]: value,
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { aboutProject: newDataSource },
    });
  };

  onTaskCellChanged = (index, value) => {
    const {
      growthCheckPoint: { taskList, taskDataSource },
      dispatch,
    } = this.props;
    const obj = taskList.filter(i => String(i.id) === value)[0];
    const newData = [...taskDataSource];
    newData[index] = { ...newData[index], ...obj }; // ????????????myFakeId
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        taskDataSource: newData,
      },
    });
  };

  render() {
    const { form, growthCheckPoint, loading, dispatch } = this.props;
    const { getFieldDecorator } = form;
    const {
      formData = {},
      aboutProject,
      aboutTask,
      projectList,
      taskList,
      taskDataSource,
    } = growthCheckPoint;
    const { listIds = [] } = formData;
    const tableProps = {
      sortBy: 'id',
      rowKey: 'myFakeId',
      sortDirection: 'ASC',
      dataSource: taskDataSource,
      rowSelection: {
        // selectedRowKeys: _selectedRowKeys,
        // onChange: (selectedRowKeys, selectedRows) => {
        //   this.setState({
        //     _selectedRowKeys: selectedRowKeys,
        //   });
        // },
      },
      showCopy: false,
      onAdd: newRow => {
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            taskDataSource: update(taskDataSource, {
              $push: [
                {
                  ...newRow,
                  myFakeId: genFakeId(-1),
                },
              ],
            }),
          },
        });
      },
      onDeleteItems: (selectedRowKeys, selectedRows) => {
        const newData = taskDataSource.filter(i => !selectedRowKeys.includes(i.myFakeId));
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            taskDataSource: newData,
          },
        });
      },
      columns: [
        {
          title: '??????',
          dataIndex: 'task',
          required: true,
          width: '20%',
          render: (value, row, index) => (
            <Selection.Columns
              source={taskList}
              value={row.id > 0 ? row.id : void 0}
              transfer={{ key: 'id', code: 'id', name: 'taskName' }}
              placeholder="???????????????"
              showSearch
              allowClear={false}
              onChange={val => {
                this.onTaskCellChanged(index, val);
              }}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'reasonTypeName',
          align: 'center',
          width: '8%',
          render: (value, row, index) => <Input value={value} disabled />,
        },
        {
          title: '??????',
          dataIndex: 'evalTarget',
          width: '20%',
          render: (value, row, index) => <Input value={value} disabled />,
        },
        {
          title: '????????????',
          dataIndex: 'ability',
          width: '20%',
          render: (value, row, index) => (
            <Input
              value={
                row.jobType1Name
                  ? `${row.jobType1Name} - ${row.jobType2Name} - ${row.leveldName}`
                  : ''
              }
              disabled
            />
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
                  content={<EvalContent type="task" item={row} list={row.projEvalViewList} />}
                  trigger="hover"
                >
                  <span style={{ color: '#1890FF', cursor: 'pointer' }}>&nbsp;&nbsp;????????????</span>
                </Popover>
              ) : null}
            </div>
          ),
        },
      ],
    };
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
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            disabled={false}
            onClick={this.handleSave}
          >
            {formatMessage({ id: `misc.submit`, desc: '??????' })}
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

            {formData.apprType === 'ASSIGN_RES' || formData.apprType === 'BY_CAPASET' ? (
              <Field
                name="apprRes"
                label="?????????"
                decorator={{
                  initialValue: formData.apprRes ? parseInt(formData.apprRes, 10) : '',
                  rules: [{ required: true, message: '??????????????????' }],
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
                />
              </Field>
            ) : (
              ''
            )}

            <Field name="attache" label="??????">
              <FileManagerEnhance
                api="/api/base/v1/resCapaExamApply/sfs/token"
                listType="text"
                dataKey={formData.id}
                disabled={false}
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
              <Input.TextArea rows={3} placeholder="???????????????" />
            </Field>
          </FieldList>
          <Divider dashed />
          ??????????????????
          {aboutProject.map((item, index) => (
            <Card
              key={item.myFakeId}
              bordered
              style={{
                borderRadius: '6px',
                marginBottom: '10px',
                width: '80%',
              }}
            >
              <Icon
                type="close-circle"
                theme="filled"
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const newDataSource = aboutProject.filter(row => row.projId !== item.projId);
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      aboutProject: newDataSource,
                    },
                  });
                }}
              />
              <FieldList getFieldDecorator={getFieldDecorator} col={2}>
                <Field
                  name="projectId"
                  label={<span className="ant-form-item-required">??????</span>}
                  presentational
                >
                  <Selection.Columns
                    source={projectList}
                    value={item.projectId}
                    transfer={{ key: 'id', code: 'id', name: 'code' }}
                    placeholder="???????????????"
                    showSearch
                    onChange={val => {
                      this.onCellChanged(index, val, 'projectId');
                      dispatch({
                        type: `${DOMAIN}/getSelectProjRole`,
                        payload: { id: val, index },
                      });
                    }}
                  />
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
                  <DatePicker.RangePicker
                    format="YYYY-MM-DD"
                    onChange={val => {
                      this.onCellChanged(index, val, 'time');
                    }}
                  />
                </Field>
                <Field name="relatedField" label="????????????/??????" presentational>
                  <Input
                    onChange={e => {
                      this.onCellChanged(index, e.target.value, 'relatedField');
                    }}
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
                    rows={3}
                    placeholder="?????????????????????"
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
                    rows={3}
                    placeholder="???????????????&??????"
                    onChange={e => {
                      this.onCellChanged(index, e.target.value, 'dutyDesc');
                    }}
                  />
                </Field>
              </FieldList>
            </Card>
          ))}
          <div>
            <a
              style={{ cursor: 'pointer' }}
              onClick={() => {
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: {
                    aboutProject: update(aboutProject, {
                      $push: [
                        {
                          myFakeId: genFakeId(-1),
                        },
                      ],
                    }),
                  },
                });
              }}
            >
              <Icon type="plus-circle" />
              &nbsp; ??????????????????
            </a>
          </div>
          <Divider dashed />
          <div>
            ??????????????????
            <EditableDataTable {...tableProps} />
          </div>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CheckPoint;
