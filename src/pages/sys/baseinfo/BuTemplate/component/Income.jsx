import React, { PureComponent } from 'react';
import { Input, InputNumber } from 'antd';
import { formatMessage } from 'umi/locale';
import { connect } from 'dva';
import update from 'immutability-helper';
import { genFakeId } from '@/utils/mathUtils';
import EditableDataTable from '@/components/common/EditableDataTable';
import { UdcSelect } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';

const DOMAIN = 'sysButempincome';

@connect(({ loading, sysButempincome, dispatch }) => ({
  loading,
  sysButempincome,
  dispatch,
}))
class BuTemplateDetail extends PureComponent {
  state = {
    _selectedRowKeys: [],
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const param = fromQs();
    dispatch({ type: `${DOMAIN}/queryIncomeList`, payload: { tmplId: param.id } });
  }

  onCellChanged = (rowIndex, rowField) => rowFieldValue => {
    const {
      dispatch,
      sysButempincome: { incomeList },
    } = this.props;
    let value = rowFieldValue;
    if (typeof value !== 'string') {
      value = value && value.target ? value.target.value : value;
    }

    const newDataSource = update(incomeList, {
      [rowIndex]: {
        [rowField]: {
          $set: value,
        },
      },
    });
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { incomeList: newDataSource },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      sysButempDetail: { formData },
      sysButempincome: { incomeList },
    } = this.props;
    const { _selectedRowKeys } = this.state;

    const tableProps = {
      rowKey: 'id',
      loading: loading.effects[`${DOMAIN}/queryIncomeList`],
      total: incomeList.length,
      dataSource: incomeList,
      showCopy: false,
      onAdd: newRow => {
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            incomeList: update(incomeList, {
              $push: [
                {
                  ...newRow,
                  id: genFakeId(-1),
                  tmplId: formData.id,
                },
              ],
            }),
          },
        });
      },
      onDeleteItems: (selectedRowKeys, selectedRows) => {
        const newDataSource = incomeList.filter(
          row => !selectedRowKeys.filter(keyValue => keyValue === row.id).length
        );
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: { incomeList: newDataSource },
        });
      },
      columns: [
        {
          title: '??????',
          dataIndex: 'jobType',
          required: true,
          width: '20%',
          render: (value, row, index) => (
            <UdcSelect
              code="COM.JOB_TYPE1"
              value={value}
              onChange={this.onCellChanged(index, 'jobType')}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'coopType',
          width: '20%',
          render: (value, row, index) => (
            <UdcSelect
              code="COM.COOPERATION_MODE"
              value={value}
              onChange={this.onCellChanged(index, 'coopType')}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'cityLevel',
          width: '20%',
          render: (value, row, index) => (
            <UdcSelect
              code="COM.CITY_LEVEL"
              value={value}
              onChange={this.onCellChanged(index, 'cityLevel')}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'preeqvaAmt',
          width: '20%',
          render: (value, row, index) => (
            <InputNumber
              defaultValue={value}
              className="x-fill-100"
              max={999999999999}
              onBlur={this.onCellChanged(index, 'preeqvaAmt')}
            />
          ),
        },
        {
          title: '??????',
          dataIndex: 'remark',
          render: (value, row, index) => (
            <Input
              defaultValue={value}
              maxLength={400}
              onBlur={this.onCellChanged(index, 'remark')}
            />
          ),
        },
      ],
      buttons: [],
    };

    return (
      <div>
        <div className="tw-card-title">
          {formatMessage({ id: `app.settings.menuMap.income`, desc: '??????????????????' })}
        </div>
        <div style={{ margin: 12 }}>
          <EditableDataTable {...tableProps} />
        </div>
      </div>
    );
  }
}

export default BuTemplateDetail;
