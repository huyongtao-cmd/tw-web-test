import React from 'react';
import { connect } from 'dva';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import SearchTable, { DataOutput } from '@/components/production/business/SearchTable';
import { myPayRollPagingRq } from '@/services/production/res';

@connect(({ loading, dispatch, resPayRoll }) => ({
  loading,
  dispatch,
  resPayRoll,
}))
class MyPayRoll extends React.Component {
  state = {
    getInternalState: {},
  };

  fetchData = async params => {
    const { response } = await myPayRollPagingRq({
      ...params,
    });
    return response.data;
  };

  renderColumns = () => {
    const { pageConfig } = this.props;

    const fields = [
      {
        title: '年份',
        key: 'year',
        dataIndex: 'year',
        align: 'right',
      },
      {
        title: '月份',
        key: 'month',
        dataIndex: 'month',
        align: 'right',
      },
      {
        title: '部门名称',
        key: 'buName',
        dataIndex: 'buName',
        align: 'right',
      },
      {
        title: '用户名',
        key: 'userName',
        dataIndex: 'userName',
        align: 'right',
      },
      {
        title: '姓名',
        key: 'name',
        dataIndex: 'name',
        align: 'right',
      },
      {
        title: '月薪',
        key: 'monthlySalary',
        dataIndex: 'monthlySalary',
        align: 'right',
      },
      {
        title: '加项',
        key: 'addition',
        dataIndex: 'addition',
        align: 'right',
      },
      {
        title: '扣项',
        key: 'deduction',
        dataIndex: 'deduction',
        align: 'right',
      },
      {
        title: '应发工资',
        key: 'grossPay',
        dataIndex: 'grossPay',
        align: 'right',
      },
      {
        title: '养老保险',
        key: 'endowmentInsurance',
        dataIndex: 'endowmentInsurance',
        align: 'right',
      },
      {
        title: '医疗保险',
        key: 'medicare',
        dataIndex: 'medicare',
        align: 'right',
      },
      {
        title: '失业保险',
        key: 'unemploymentInsurance',
        dataIndex: 'unemploymentInsurance',
        align: 'right',
      },
      {
        title: '公积金',
        key: 'perAccFund',
        dataIndex: 'perAccFund',
        align: 'right',
      },
      {
        title: '补充公积金',
        key: 'addPerAccFund',
        dataIndex: 'addPerAccFund',
        align: 'right',
      },
      {
        title: '应纳税所得额',
        key: 'taxableIncome',
        dataIndex: 'taxableIncome',
        align: 'right',
      },
      {
        title: '专项扣除',
        key: 'specialDeduction',
        dataIndex: 'specialDeduction',
        align: 'right',
      },
      {
        title: '月个人所得税',
        key: 'personalIncomeTax',
        dataIndex: 'personalIncomeTax',
        align: 'right',
      },
      {
        title: '实发合计',
        key: 'netPaySum',
        dataIndex: 'netPaySum',
        align: 'right',
      },
    ];

    return fields;
  };

  renderSearchForm = () => {
    const fields = [
      <SearchFormItem
        key="year"
        fieldKey="year"
        label="年份"
        placeholder="请输入年份"
        fieldType="BaseInput"
        defaultShow
      />,
      <SearchFormItem
        label="月份"
        fieldKey="month"
        key="month"
        placeholder="请输入月份"
        fieldType="BaseInput"
        defaultShow
      />,
    ];

    return fields;
  };

  render() {
    const { getInternalState } = this.state;
    return (
      <SearchTable
        wrapperInternalState={internalState => {
          this.setState({ getInternalState: internalState });
        }}
        selectType={null}
        defaultSortBy="id"
        defaultSortDirection="DESC"
        showSearchCardTitle={false}
        searchForm={this.renderSearchForm()}
        defaultSearchForm={{}}
        fetchData={this.fetchData}
        columns={this.renderColumns()}
        tableExtraProps={{ scroll: { x: true } }}
      />
    );
  }
}

export default MyPayRoll;
