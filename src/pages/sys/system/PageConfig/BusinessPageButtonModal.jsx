// 最常用的引入,基本每个页面都需要的组件
import React, { PureComponent } from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  Form,
  InputNumber,
  Tooltip,
  Checkbox,
  Modal,
  Switch,
} from 'antd';
import { connect } from 'dva';
import { isEmpty, isNil } from 'ramda';
import Link from 'umi/link';
import router from 'umi/router';
import update from 'immutability-helper';

// 比较常用的本框架的组件
import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/stringUtils';
import FieldList from '@/components/layout/FieldList';
import { Selection, DatePicker } from '@/pages/gen/field';
import EditableDataTable from '@/components/common/EditableDataTable';
import { genFakeId } from '@/utils/mathUtils';

const { Option } = Select;
const { Field, FieldLine } = FieldList;

const DOMAIN = 'businessPageButtonModal';

@connect(({ loading, businessPageButtonModal, dispatch }) => ({
  loading: loading.effects[`${DOMAIN}/save`],
  ...businessPageButtonModal,
  dispatch,
}))
class BusinessPageButtonModal extends PureComponent {
  componentDidMount() {}

  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  // 行编辑触发事件
  onCellChanged = (rowIndex, rowField) => rowFieldValue => {
    const { dataSource, dispatch } = this.props;

    let value = rowFieldValue;

    // input框赋值转换
    value = value && value.target ? value.target.value : value;
    if (rowField === 'visibleFlag' || rowField === 'requiredFlag') {
      value = value === true ? 1 : 0;
    }

    const newDataSource = update(dataSource, {
      [rowIndex]: {
        [rowField]: {
          $set: value,
        },
      },
    });
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { dataSource: newDataSource },
    });
  };

  getTableProps = () => {
    const { dispatch, dataSource, deleteKeys } = this.props;
    return {
      sortBy: 'id',
      rowKey: 'id',
      total: 0,
      dataSource,
      showAdd: true,
      showCopy: true,
      showDelete: true,
      readOnly: false,
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
      onDeleteItems: (_selectedRowKeys, selectedRows) => {
        const newDataSource = dataSource.filter(row => _selectedRowKeys.indexOf(row.id) < 0);
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataSource: newDataSource,
            deleteKeys: [...deleteKeys, ..._selectedRowKeys],
          },
        });
      },
      onCopyItem: copied => {
        const newDataSource = update(dataSource, {
          $push: copied.map(item => ({
            ...item,
            id: genFakeId(-1),
          })),
        });
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataSource: newDataSource,
          },
        });
      },
      columns: [
        {
          title: '按钮名称',
          dataIndex: 'buttonName',
          align: 'center',
          render: (value, row, index) => (
            <Input value={value} size="small" onChange={this.onCellChanged(index, 'buttonName')} />
          ),
        },
        {
          title: '按钮KEY',
          dataIndex: 'buttonKey',
          render: (value, row, index) => (
            <Input value={value} size="small" onChange={this.onCellChanged(index, 'buttonKey')} />
          ),
        },
        {
          title: '图标',
          dataIndex: 'buttonIcon',
          align: 'center',
          render: (value, row, index) => (
            <Input value={value} size="small" onChange={this.onCellChanged(index, 'buttonIcon')} />
          ),
        },
        {
          title: '是否显示',
          dataIndex: 'visibleFlag',
          align: 'center',
          // options: {
          //   rules: [{required: true, message: '请输入字段KEY!',}],
          // },
          render: (value, row, index) => (
            <Switch
              checkedChildren="是"
              unCheckedChildren="否"
              checked={value === 1}
              onChange={this.onCellChanged(index, 'visibleFlag')}
            />
          ),
        },
        {
          title: '按钮组',
          dataIndex: 'buttonGroup',
          align: 'center',
          // options: {
          //   rules: [{required: true, message: '请输入显示名称!',}],
          // },
          render: (value, row, index) => (
            <Input value={value} size="small" onChange={this.onCellChanged(index, 'buttonGroup')} />
          ),
        },
        {
          title: '按钮样式',
          dataIndex: 'buttonStyle',
          align: 'center',
          width: 120,
          // options: {
          //   rules: [{required: true, message: '请输入字段KEY!',}],
          // },
          render: (value, row, index) => (
            <Input value={value} size="small" onChange={this.onCellChanged(index, 'buttonStyle')} />
          ),
        },
        {
          title: '排序号',
          dataIndex: 'sortNo',
          align: 'center',
          width: 50,
          // options: {
          //   rules: [{required: true, message: '请输入字段KEY!',}],
          // },
          render: (value, row, index) => (
            <InputNumber
              value={value}
              size="small"
              onChange={this.onCellChanged(index, 'sortNo')}
            />
          ),
        },
        {
          title: '前置事件',
          dataIndex: 'beforeEvent',
          align: 'center',
          width: 200,
          // options: {
          //   rules: [{required: true, message: '请输入字段KEY!',}],
          // },
          render: (value, row, index) => (
            <Input.TextArea
              value={value}
              size="small"
              onChange={this.onCellChanged(index, 'beforeEvent')}
            />
          ),
        },
        {
          title: '后置事件',
          dataIndex: 'afterEvent',
          align: 'center',
          width: 200,
          // options: {
          //   rules: [{required: true, message: '请输入字段KEY!',}],
          // },
          render: (value, row, index) => (
            <Input.TextArea
              value={value}
              size="small"
              onChange={this.onCellChanged(index, 'afterEvent')}
            />
          ),
        },
      ],
      buttons: [],
    };
  };

  handleSave = () => {
    const { dispatch, pageId, dataSource, deleteKeys, onOk } = this.props;

    dispatch({
      type: `${DOMAIN}/save`,
      payload: {
        pageId,
        dtlEntities: dataSource,
        deleteKeys,
      },
    }).then(() => {
      typeof onOk === 'function' && onOk();
    });
  };

  render() {
    const { visible, onCancel, dispatch } = this.props;

    return (
      <Modal
        title="按钮编辑"
        visible={visible}
        onOk={this.onSelectTmp}
        onCancel={onCancel}
        width="80%"
        footer={[
          <Button
            key="confirm"
            type="primary"
            size="large"
            htmlType="button"
            onClick={() => this.handleSave()}
          >
            保存
          </Button>,
        ]}
      >
        <EditableDataTable {...this.getTableProps()} />
      </Modal>
    );
  }
}

export default BusinessPageButtonModal;
