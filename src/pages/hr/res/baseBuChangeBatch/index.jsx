import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import { Button, Card, Form, Divider } from 'antd';
import FieldList from '@/components/layout/FieldList';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import EditableDataTable from '@/components/common/EditableDataTable';
import { createConfirm } from '@/components/core/Confirm';
import { Selection, DatePicker } from '@/pages/gen/field';
import moment from 'moment';
import { genFakeId } from '@/utils/mathUtils';
import update from 'immutability-helper';
import createMessage from '@/components/core/AlertMessage';

const { Field } = FieldList;

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];

const DOMAIN = 'baseBuChangeBatch';

@connect(({ loading, baseBuChangeBatch, global, dispatch }) => ({
  loading,
  baseBuChangeBatch,
  global,
  dispatch,
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
class BaseBuChangeBatch extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  // 行编辑触发事件
  onCellChanged = (index, value, name) => {
    const {
      baseBuChangeBatch: { dataSource },
      dispatch,
    } = this.props;

    const newDataSource = dataSource;
    newDataSource[index] = {
      ...newDataSource[index],
      [name]: value,
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { dataSource: newDataSource },
    });
  };

  handleSubmit = () => {
    const {
      form: { validateFieldsAndScroll },
      baseBuChangeBatch: {
        dataSource,
        formData: { date },
      },
      dispatch,
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        if (isEmpty(dataSource)) {
          createMessage({ type: 'warn', description: '明细不能为空！' });
          return;
        }

        const tt = dataSource.filter(v => !v.newBu || !v.newPResId);
        if (!isEmpty(tt)) {
          createMessage({ type: 'warn', description: '请补全明细中的新BU和新上级！' });
          return;
        }

        createConfirm({
          content: (
            <p>
              老BU当量系数截止至
              {moment(date)
                .add(-1, 'days')
                .format('YYYY-MM-DD')}
              <br />
              新BU当量系数起始于
              {date}
              <br />
              是否继续？
            </p>
          ),
          onOk: () => {
            dispatch({
              type: `${DOMAIN}/submit`,
              payload: {
                date,
                dataSource,
                date1: moment(date)
                  .add(-1, 'days')
                  .format('YYYY-MM-DD'),
              },
            }).then(res => {
              if (res.ok) {
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: { dataSource: [] },
                });
              }
            });
          },
        });
      }
    });
  };

  render() {
    const {
      loading,
      dispatch,
      form: { getFieldDecorator, setFieldsValue },
      baseBuChangeBatch: { formData, dataSource },
      global: { userList = [] },
    } = this.props;

    const activeUserList = userList.filter(v => v.resStatus === '3');

    // loading完成之前将按钮设为禁用
    const tableLoading =
      loading.effects[`${DOMAIN}/queryResDetail`] || loading.effects[`${DOMAIN}/submit`];

    const tableProps = {
      sortBy: 'id',
      rowKey: 'id',
      loading: tableLoading,
      dataSource,
      showCopy: false,
      onAdd: newRow => {
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataSource: update(dataSource, {
              $push: [
                {
                  ...newRow,
                  id: genFakeId(-1),
                },
              ],
            }),
          },
        });
      },
      onDeleteItems: (selectedRowKeys, selectedRows) => {
        const newDataSource = dataSource.filter(
          row => !selectedRowKeys.filter(keyValue => keyValue === row.id).length
        );
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataSource: newDataSource,
          },
        });
      },
      columns: [
        {
          title: '资源',
          dataIndex: 'resId',
          align: 'center',
          width: 250,
          render: (value, row, index) => (
            <Selection.Columns
              value={value}
              className="x-fill-100"
              source={activeUserList}
              columns={particularColumns}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              dropdownMatchSelectWidth={false}
              showSearch
              allowClear={false}
              onColumnsChange={values => {
                const { id, baseBuId, baseBuName, presId, presName } = values;
                this.onCellChanged(index, id, 'resId');
                this.onCellChanged(index, baseBuId, 'oldBu');
                this.onCellChanged(index, baseBuName, 'oldBuName');
                this.onCellChanged(index, presId, 'oldPresId');
                this.onCellChanged(index, presName, 'oldPresName');
              }}
              placeholder="请选择资源"
            />
          ),
        },
        {
          title: '原BU',
          dataIndex: 'oldBuName',
          align: 'center',
        },
        {
          title: '原上级',
          dataIndex: 'oldPresName',
          align: 'center',
        },
        {
          title: '新BU',
          dataIndex: 'newBu',
          align: 'center',
          required: true,
          width: 250,
          render: (value, row, index) => (
            <Selection.ColumnsForBu
              allowClear={false}
              onChange={e => {
                this.onCellChanged(index, e, 'newBu');
              }}
            />
          ),
        },
        {
          title: '新上级',
          dataIndex: 'newPResId',
          align: 'center',
          required: true,
          width: 250,
          render: (value, row, index) => (
            <Selection.Columns
              className="x-fill-100"
              source={activeUserList}
              columns={particularColumns}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              dropdownMatchSelectWidth={false}
              showSearch
              allowClear={false}
              onChange={e => {
                this.onCellChanged(index, e, 'newPResId');
              }}
              placeholder="请选择资源"
            />
          ),
        },
      ],
    };

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            icon="save"
            size="large"
            onClick={() => {
              this.handleSubmit();
            }}
            disabled={tableLoading}
          >
            保存
          </Button>
        </Card>

        <Card
          className="tw-card-adjust"
          style={{ marginTop: '6px' }}
          title={<Title icon="profile" text="BU批量变更" />}
          bordered={false}
        >
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="date"
              label="当量系数截止日期"
              decorator={{
                initialValue: formData.date || undefined,
                rules: [{ required: true, message: '必填' }],
              }}
            >
              <DatePicker allowClear={false} />
            </Field>
          </FieldList>

          <Divider dashed />

          <FieldList
            legend="明细"
            layout="horizontal"
            getFieldDecorator={getFieldDecorator}
            col={2}
          >
            <EditableDataTable {...tableProps} />
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default BaseBuChangeBatch;
