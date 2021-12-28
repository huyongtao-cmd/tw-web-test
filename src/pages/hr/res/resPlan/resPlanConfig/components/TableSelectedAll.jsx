import React, { PureComponent, Fragment } from 'react';
import { Checkbox, Radio, Table } from 'antd';
import { queryUdc } from '@/services/gen/app';
import { type, isEmpty, equals, isNil } from 'ramda';
import { strToHump } from '@/utils/stringUtils';

const listAddValue = list => list.map(v => ({ ...v, changeName: strToHump(v.code) }));

class TableSelectedAll extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      valueMap: {},
    };
  }

  componentDidMount() {
    const { udcCode: code } = this.props;
    queryUdc(code).then(res => {
      if (res.status === 200 && Array.isArray(res.response)) {
        const { response } = res;
        this.setState({
          list: Array.isArray(response)
            ? response
                .map((v, i) => ({ ...v, changeName: strToHump(v.code) }))
                .map(v => ({ ...v, salesStage: { value01: v.changeName, value02: 0 } }))
            : [],
        });
      }
    });
  }

  // componentDidUpdate(prevProps, prevState, snapshot) {
  //   if (snapshot !== null) {
  //     setTimeout(() => {
  //       this.setState({ valueMap: snapshot });
  //     }, 0);
  //   }
  // }

  // getSnapshotBeforeUpdate(prevProps, prevState) {
  //   const { value = {} } = this.props;
  //   if (!equals(prevState.valueMap, value)) {
  //     return value;
  //   }
  //   return null;
  // }

  // handleChange = (value, name) => {
  //   const { valueMap } = this.state;
  //   const { onChange } = this.props;
  //   type(onChange) === 'Function' &&
  //     onChange({ ...valueMap, [name]: { ...valueMap[name], value01: value } });
  // };

  render() {
    const { list, valueMap } = this.state;
    const { moduleType } = this.props;

    const columns = [
      {
        title: '资源类型一',
        dataIndex: 'code',
        key: 'code',
        // render: (val, row, index) => (
        //   <InputNumber
        //     disabled={ignone.value01 === 'Y'}
        //     value={row?.salesStage?.value02}
        //     min={0}
        //     max={100}
        //     formatter={value => `${value}%`}
        //     parser={value => value.replace('%', '')}
        //     onChange={e => {
        //       this.onCellChanged(index, e || 0, 'value02', 'salesStage');
        //     }}
        //   />
        // ),
      },
    ];

    return (
      <Table
        rowKey="code"
        style={{ marginLeft: '20px', marginTop: '-15px' }}
        dataSource={list}
        columns={columns}
        pagination={false}
        bordered
      />
    );
  }
}

export default TableSelectedAll;
