import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form } from 'antd';
import DataTable from '@/components/common/DataTable';
import ReactiveWrapper from '@/components/layout/ReactiveWrapper';

const DOMAIN = 'orgbu';

@connect(({ loading, orgbu }) => ({
  loading,
  orgbu,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    const key = Object.keys(changedFields)[0];
    const { value } = Object.values(changedFields)[0];
    props.dispatch({
      type: `${DOMAIN}/updateBasic`,
      payload: { key, value },
    });
  },
})
class BuSettlementEQVA extends PureComponent {
  state = {
    buModalVisible: false,
    selectValue: {
      buName: '',
    },
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/queryBuTree`,
    });
  }

  render() {
    const { form, loading, orgbu, dispatch } = this.props;
    const { getFieldDecorator } = form;
    const { mode, formData, buTree } = orgbu;
    const { selectValue, buModalVisible } = this.state;

    const tableData = [
      {
        s1: '1',
        s2: '2',
        s3: '3',
        s4: '4',
        s5: '5',
        s6: '6',
        s7: '7',
      },
      {
        s1: '1',
        s2: '2',
        s3: '3',
        s4: '4',
        s5: '5',
        s6: '6',
        s7: '7',
      },
    ];

    const tableProps = {
      rowKey: 'id',
      sortBy: 'id',
      // limit: stringUtils.queryURL('limit'),
      // offset: stringUtils.queryURL('offset'),
      sortDirection: 'DESC',
      scroll: {
        x: 2850,
      },
      columnsCache: DOMAIN,
      dispatch,
      // loading,
      dataSource: tableData,
      showSearch: false,
      showColumn: false,
      onChange: filters => {
        // console.log('onChange--', filters);
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        // console.log(changedValues, allValues);
      },
      columns: [
        {
          title: '??????????????????*',
          dataIndex: 's1',
          width: 150,
          sorter: true,
        },
        {
          title: '??????????????????*',
          dataIndex: 's2',
          width: 150,
          sorter: true,
        },
        {
          title: '??????????????????',
          dataIndex: 's3',
          width: 150,
          sorter: true,
        },
        {
          title: '???BU??????',
          dataIndex: 's4',
          width: 150,
          sorter: true,
        },
        {
          title: '???BU??????',
          dataIndex: 's5',
          width: 150,
          sorter: true,
        },
        {
          title: '??????*',
          dataIndex: 's6',
          width: 150,
          sorter: true,
        },
        {
          title: 'Markup??????',
          dataIndex: 's7',
          width: 150,
          sorter: true,
        },
        {
          title: 'Markup?????????',
          dataIndex: 's8',
          width: 150,
          sorter: true,
        },
        {
          title: '????????????*',
          dataIndex: 's9',
          width: 150,
          sorter: true,
        },
        {
          title: '????????????*',
          dataIndex: 's10',
          width: 150,
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 's11',
          width: 150,
          sorter: true,
        },
        {
          title: '?????????',
          dataIndex: 's12',
          width: 150,
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 's13',
          width: 150,
          sorter: true,
        },
        {
          title: '?????????',
          dataIndex: 's14',
          width: 150,
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 's15',
          width: 150,
          sorter: true,
        },
        {
          title: '?????????',
          dataIndex: 's16',
          width: 150,
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 's17',
          width: 150,
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 's18',
          width: 150,
          sorter: true,
        },
        {
          title: '???????????????',
          dataIndex: 's19',
          width: 150,
          sorter: true,
        },
      ],
    };

    return (
      <ReactiveWrapper>
        <DataTable {...tableProps} />
      </ReactiveWrapper>
    );
  }
}

export default BuSettlementEQVA;
