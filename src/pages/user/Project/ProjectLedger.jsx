import React, { PureComponent } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Form, Input, Divider, Card } from 'antd';
import Link from 'umi/link';
import router from 'umi/router';
import { formatMessage } from 'umi/locale';
import { createConfirm } from '@/components/core/Confirm';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';
import FieldList from '@/components/layout/FieldList';
import createMessage from '@/components/core/AlertMessage';
import { MonthRangePicker } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';
import LedgerTable from './LedgerTable';

const { Field, FieldLine } = FieldList;

const DOMAIN = 'userProjectLedger';

@connect(({ loading, userProjectLedger }) => ({
  userProjectLedger,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    const key = Object.keys(changedFields)[0];
    const value = Object.values(changedFields)[0];
    if (value) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { key, value: value.value },
      });
    }
  },
})
class ProjectLedger extends PureComponent {
  componentDidMount() {
    this.fetchData({ sortBy: 'finYear', sortDirection: 'DESC' });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    const param = fromQs();
    if (!param.projId) {
      createMessage({ type: 'error', description: `项目不存在` });
      return;
    }
    const { date, ...restParmars } = params;
    if (Array.isArray(date) && date[0] && date[1]) {
      restParmars.dateFrom = moment(date[0]).format('YYYY-MM');
      restParmars.dateTo = moment(date[1]).format('YYYY-MM');
      [restParmars.dateFromYear, restParmars.dateFromMon] = moment(date[0])
        .format('YYYY-MM')
        .split('-');
      [restParmars.dateToYear, restParmars.dateToMon] = moment(date[1])
        .format('YYYY-MM')
        .split('-');
    }
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...restParmars,
      },
    });
  };

  render() {
    const {
      dispatch,
      loading,
      userProjectLedger: { searchForm, formData, dataSource, total },
      form: { getFieldDecorator },
    } = this.props;

    const tableProps = {
      rowKey: 'id',
      domain: DOMAIN,
      loading: false,
      enableSelection: false,
      total,
      dataSource,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        let searchData = { ...allValues };
        if (allValues && allValues.date && allValues.date.length > 0) {
          searchData = {
            ...searchData,
            date: null,
            dateFrom: allValues.date[0].format('YYYYMM'),
            dateTo: allValues.date[1].format('YYYYMM'),
          };
        } else {
          searchData = { ...searchData, date: null, dateFrom: null, dateTo: null };
        }
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: searchData,
        });
      },
      searchBarForm: [
        {
          title: '期间', // TODO: 国际化
          dataIndex: 'date',
          options: {
            initialValue: searchForm.date,
          },
          tag: <MonthRangePicker className="x-fill-100" />,
        },
      ],
      columns: [
        {
          title: '年度', // TODO: 国际化
          dataIndex: 'finYear',
          sorter: true,
          align: 'right',
          defaultSortOrder: 'descend',
          render: (value, record, index) => (value === -1 ? '合计' : value),
        },
        {
          title: '期间', // TODO: 国际化
          dataIndex: 'finPeriod',
          render: (value, record, index) => (value === -1 ? undefined : value),
        },
        {
          title: '当月累计收入当量', // TODO: 国际化
          dataIndex: 'iqtySum',
          align: 'right',
          render: (value, record, index) => (value === -1 ? undefined : value),
        },
        {
          title: '当月累计收入金额', // TODO: 国际化
          dataIndex: 'iamtSum',
          align: 'right',
          render: (value, record, index) => (value === -1 ? undefined : value),
        },
        {
          title: '当月累计支出当量', // TODO: 国际化
          dataIndex: 'oqtySum',
          align: 'right',
          render: (value, record, index) => (value === -1 ? undefined : value),
        },
        {
          title: '当月累计支出金额', // TODO: 国际化
          dataIndex: 'oamtSum',
          align: 'right',
          render: (value, record, index) => (value === -1 ? undefined : value),
        },
      ],
    };

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-adjust" title="账户信息" bordered={false}>
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="ledgerNo"
              label="账号"
              decorator={{
                initialValue: formData && formData.ledgerNo,
              }}
            >
              <Input disabled />
            </Field>
            <Field
              name="projName"
              label="账户名称"
              decorator={{
                initialValue: formData && formData.projName,
              }}
            >
              <Input disabled />
            </Field>
          </FieldList>
        </Card>
        <Card className="tw-card-adjust" title="账户余额" bordered={false}>
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="totalQty"
              label="账户当量余额"
              decorator={{
                initialValue: formData && formData.totalQty,
              }}
            >
              <Input disabled />
            </Field>
            <Field
              name="totalAmt"
              label="账户现金余额"
              decorator={{
                initialValue: formData && formData.totalAmt,
              }}
            >
              <Input disabled />
            </Field>
            <Field
              name="avalAmt"
              label="账户可用余额"
              decorator={{
                initialValue: formData && formData.avalAmt,
              }}
            >
              <Input disabled />
            </Field>
            <Field
              name="frozenAmt"
              label="账户冻结余额"
              decorator={{
                initialValue: formData && formData.frozenAmt,
              }}
            >
              <Input disabled />
            </Field>
          </FieldList>
        </Card>
        <Card className="tw-card-adjust" title="账户经营状况" bordered={false}>
          <LedgerTable {...tableProps} />
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ProjectLedger;
