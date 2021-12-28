import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, has } from 'ramda';
import { DatePicker, Modal, Form } from 'antd';
import Link from 'umi/link';
import router from 'umi/router';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { flowToRouter } from '@/utils/flowToRouter';
import { getType } from '@/services/user/equivalent/equivalent';
import { Selection } from '@/pages/gen/field';
import { selectIamAllUsers, selectIamUsers } from '@/services/gen/list';
import FieldList from '@/components/layout/FieldList';

const DOMAIN = 'flowTodo';
const { Field } = FieldList;
const hasStartTime = has('startTime');
const accColumns = [
  { title: '用户ID', dataIndex: 'code', span: 10 },
  { title: '姓名', dataIndex: 'name', span: 7 },
];

@connect(({ dispatch, loading, flowTodo }) => ({
  dispatch,
  flowTodo,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
@Form.create({
  onValuesChange(props, changedValues, allValues) {
    // console.log(props, changedValues, allValues)
  },
})
class Todo extends Component {
  state = {
    visible: false,
    confirmLoading: false,
    lastApproverIsShow: false,
    parmas: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    this.fetchData({ sortBy: 'no', sortDirection: 'DESC', limit: 10 });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/query`, payload: params });
  };

  requestRealType = async rowData => {
    const { id, taskId, docId } = rowData;
    const { status, response } = await getType(docId);
    if (status === 200 && response.ok) {
      const defKey =
        // eslint-disable-next-line
        response.datum === 'TASK_BY_PACKAGE'
          ? 'ACC_A22.SUM'
          : response.datum === 'TASK_BY_MANDAY'
            ? 'ACC_A22.SINGLE'
            : 'ACC_A22.COM';
      const route = flowToRouter(defKey, {
        // 此处不用进行流程标识改造
        id,
        taskId,
        docId,
        mode: 'edit',
        originalUrl: window.location.origin + '/user/flow/process?type=todo',
      });
      router.push(route);
    }
  };

  renderLink = (value, rowData) => {
    const { defKey, id, taskId, apprStatus, docId, procIden } = rowData;
    if (procIden === 'ACC_A22') {
      return (
        <a className="tw-link" onClick={() => this.requestRealType(rowData)}>
          {value}
        </a>
      );
    }

    const route = flowToRouter(procIden, {
      id,
      taskId,
      docId,
      mode: 'edit',
      originalUrl: window.location.origin + '/user/flow/process?type=todo',
    });
    return (
      <Link className="tw-link" to={route}>
        {value}
      </Link>
    );
  };

  tableCfg = () => {
    const { loading, flowTodo, dispatch } = this.props;
    const { searchForm, list, total } = flowTodo;
    const tableProps = {
      rowKey: 'taskId',
      sortBy: 'no',
      sortDirection: 'DESC',
      scroll: {
        // x: '120%',
        // y: 330,
      },
      columnsCache: DOMAIN,
      dispatch,
      loading,
      expirys: 0,
      total,
      dataSource: list,
      searchForm,
      // enableSelection: false,
      onChange: filters => {
        if (hasStartTime(filters)) {
          const { startTime } = filters;
          const convertTime = startTime ? formatDT(startTime) : undefined;
          this.fetchData({ ...filters, startTime: convertTime });
        } else {
          this.fetchData(filters);
        }
      },
      onSearchBarChange: (_, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchBarForm: [
        {
          title: '流程编号',
          dataIndex: 'no',
          options: {
            initialValue: searchForm.no,
          },
        },
        {
          title: '流程名',
          dataIndex: 'nameLike',
          options: {
            initialValue: searchForm.nameLike,
          },
        },
        {
          title: '当前节点名',
          dataIndex: 'taskName',
          options: {
            initialValue: searchForm.taskName,
          },
        },
        {
          title: '流程类型',
          // dataIndex: 'defKey',
          dataIndex: 'procIden',
          options: {
            initialValue: searchForm.defKey,
          },
          tag: <Selection.UDC code="COM.WF_DEFINE" placeholder="请选择流程类型" />,
        },
        {
          title: '相关信息',
          dataIndex: 'infoLike',
          options: {
            initialValue: searchForm.infoLike,
          },
        },
        {
          title: '发起人',
          dataIndex: 'initiator',
          options: {
            initialValue: searchForm.initiator,
          },
          tag: <Selection source={() => selectIamAllUsers()} placeholder="请选择发起人" />,
        },
        {
          title: '创建日期(从)',
          dataIndex: 'sinceDate',
          options: {
            initialValue: searchForm.sinceDate,
          },
          tag: <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />,
        },
        {
          title: '创建日期(至)',
          dataIndex: 'untilDate',
          options: {
            initialValue: searchForm.untilDate,
          },
          tag: <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />,
        },
      ],
      columns: [
        {
          title: '流程编号',
          dataIndex: 'no',
          className: 'text-center',
          width: 150,
          render: this.renderLink,
        },
        {
          title: '流程名称',
          dataIndex: 'docName',
          render: this.renderLink,
        },
        {
          title: '相关信息',
          dataIndex: 'docInfo',
          width: 220,
        },
        {
          title: '创建时间',
          dataIndex: 'startTime',
          sorter: true,
          render: value => formatDT(value, 'YYYY-MM-DD HH:mm:ss'),
          // render: value => formatDT(value),
          width: 200,
        },
        {
          title: '发起人',
          dataIndex: 'initiatorName',
          width: 80,
          className: 'text-center',
        },
        {
          title: '当前处理人',
          dataIndex: 'currentName',
          width: 80,
          className: 'text-center',
          render: (_, record) => {
            const current = record.todoInfo || {};
            if (isEmpty(current)) return <span>空</span>;
            return <span>{current.workerNames}</span>;
          },
        },
        {
          title: '当前节点名',
          dataIndex: 'currentTask',
          width: 200,
          className: 'text-center',
          render: (_, record) => {
            const current = record.todoInfo || {};
            if (isEmpty(current)) return <span>空</span>;
            return <span>{current.taskNames}</span>;
          },
        },
        // {
        //   title: '下一节点处理人',
        //   dataIndex: 'nextName',
        //   width: '15%',
        //   render: (_, record) => {
        //     const current = (record.taskInfo || []).filter(task => Number(task.taskSeq) === 1);
        //     if (isEmpty(current)) return <span>空</span>;
        //     return <span>{current[0].taskNames}</span>;
        //   },
        // },
        // {
        //   title: '下一节点名',
        //   dataIndex: 'nextTask',
        //   width: '15%',
        //   render: (_, record) => {
        //     const current = (record.taskInfo || []).filter(task => Number(task.taskSeq) === 1);
        //     if (isEmpty(current)) return <span>空</span>;
        //     return <span>{current[0].candidates}</span>;
        //   },
        // },
      ],
      leftButtons: [
        {
          key: 'changeApprover',
          title: '转交',
          className: 'tw-btn-primary',
          icon: 'mr',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const idList = selectedRows.map(({ taskId }) => taskId).join(',');
            this.setState({
              visible: true,
              lastApproverIsShow: false,
              parmas: {
                idList,
              },
            });
          },
        },
      ],
    };
    return tableProps;
  };

  handleOk = () => {
    this.setState({
      confirmLoading: true,
    });
    const { lastApproverIsShow } = this.state;
    const { form } = this.props;
    form.validateFields((err, values) => {
      if (lastApproverIsShow && !values.lastApprover) {
        // createMessage({ type: 'error', description: '请选择原申请人' });
        return null;
      }
      if (!values.changeApprover) {
        // createMessage({ type: 'error', description: '请选择变更后审批人' });
        return null;
      }
      const { parmas } = this.state;
      this.setState(
        {
          parmas: {
            ...parmas,
            ...values,
          },
        },
        () => {
          const { dispatch } = this.props;
          const { parmas: newParams } = this.state;
          dispatch({
            type: `${DOMAIN}/changeApproverByTaskId`,
            payload: {
              newParams,
            },
          });
          this.setState({
            visible: false,
            confirmLoading: false,
          });
        }
      );
      return null;
    });
    form.resetFields();
  };

  handleCancel = () => {
    const { form } = this.props;
    this.setState({
      visible: false,
    });
    form.resetFields();
  };

  render() {
    const {
      dispatch,
      loading,
      // prePayCreate: { formData, accList, contractList, reasonList },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
    } = this.props;
    const { lastApproverIsShow, visible, confirmLoading } = this.state;

    return (
      <PageHeaderWrapper title="我的代办">
        <DataTable {...this.tableCfg()} />
        <Modal
          centered
          title={lastApproverIsShow ? '批量变更审批人' : '变更审批人'}
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
          width={800}
        >
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2} noReactive>
            {lastApproverIsShow ? (
              <Field
                name="lastApprover"
                label="原审批人"
                decorator={
                  {
                    // initialValue: '请选择原审批人',
                  }
                }
              >
                <Selection
                  transfer={{ code: 'id', name: 'name' }}
                  source={() => selectIamAllUsers()}
                  placeholder="请选择原审批人"
                />
              </Field>
            ) : null}
            <Field
              name="changeApprover"
              label="变更后审批人"
              labelCol={{ span: 10 }}
              wrapperCol={{ span: 14 }}
              decorator={
                {
                  // initialValue: '请选择变更后审批人',
                }
              }
            >
              <Selection.Columns
                className="x-fill-100"
                source={() => selectIamUsers()}
                columns={accColumns}
                transfer={{ key: 'id', code: 'id', name: 'name' }}
                dropdownMatchSelectWidth={false}
                showSearch
                mode={!lastApproverIsShow ? 'multiple' : ''}
                placeholder="请选择变更后审批人"
              />
            </Field>
          </FieldList>
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default Todo;
