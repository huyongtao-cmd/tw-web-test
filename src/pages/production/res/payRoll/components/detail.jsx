import React from 'react';
import { connect } from 'dva';
import { Form, Table } from 'antd';
import { isEmpty } from 'ramda';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';

const DOMAIN = 'resPayRoll';

@connect(({ loading, dispatch, resPayRoll }) => ({
  loading,
  dispatch,
  resPayRoll,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      fields[key] = Form.createFormField({ value: tempValue });
    });
    return fields;
  },
  onValuesChange(props, changedValues, allValues) {
    if (isEmpty(changedValues)) return;
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    const newFieldData = { [name]: value };

    switch (name) {
      default:
        break;
    }
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: newFieldData,
    });
  },
})
class PayRollDetail extends React.Component {
  renderPage = () => {
    const {
      resPayRoll: { formMode },
      form,
      formData,
    } = this.props;
    const fields = [
      <BusinessFormTitle title="工资明细" />,
      <FormItem
        label="月薪"
        key="monthlySalary"
        fieldKey="monthlySalary"
        fieldType="BaseInput"
        initialValue={formData.monthlySalary}
        disabled
      />,
      <FormItem
        label="加项"
        key="addition"
        fieldKey="addition"
        fieldType="BaseInput"
        initialValue={formData.addition}
        disabled
      />,
      <FormItem
        label="扣项"
        key="deduction"
        fieldKey="deduction"
        fieldType="BaseInput"
        initialValue={formData.deduction}
        disabled
      />,
      <FormItem
        label="应发工资"
        key="grossPay"
        fieldKey="grossPay"
        fieldType="BaseInput"
        initialValue={formData.grossPay}
        disabled
      />,
      <FormItem
        label="养老保险"
        key="endowmentInsurance"
        fieldKey="endowmentInsurance"
        fieldType="BaseInput"
        initialValue={formData.endowmentInsurance}
        disabled
      />,
      <FormItem
        label="医疗保险"
        key="medicare"
        fieldKey="medicare"
        fieldType="BaseInput"
        initialValue={formData.medicare}
        disabled
      />,
      <FormItem
        label="失业保险"
        key="unemploymentInsurance"
        fieldKey="unemploymentInsurance"
        fieldType="BaseInput"
        initialValue={formData.unemploymentInsurance}
        disabled
      />,
      <FormItem
        label="公积金"
        key="perAccFund"
        fieldKey="perAccFund"
        fieldType="BaseInput"
        initialValue={formData.perAccFund}
        disabled
      />,
      <FormItem
        label="补充公积金"
        key="addPerAccFund"
        fieldKey="addPerAccFund"
        fieldType="BaseInput"
        initialValue={formData.addPerAccFund}
        disabled
      />,
      <FormItem
        label="应纳税所得额"
        key="taxableIncome"
        fieldKey="taxableIncome"
        fieldType="BaseInput"
        initialValue={formData.taxableIncome}
        disabled
      />,
      <FormItem
        label="专项扣除"
        key="specialDeduction"
        fieldKey="specialDeduction"
        fieldType="BaseInput"
        initialValue={formData.specialDeduction}
        disabled
      />,
      <FormItem
        label="月个人所得税"
        key="personalIncomeTax"
        fieldKey="personalIncomeTax"
        fieldType="BaseInput"
        initialValue={formData.personalIncomeTax}
        disabled
      />,
      <FormItem
        label="实发合计"
        key="netPaySum"
        fieldKey="netPaySum"
        fieldType="BaseInput"
        initialValue={formData.netPaySum}
        disabled
      />,
    ];

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={24}>
        {fields}
      </BusinessForm>
    );
  };

  render() {
    return <PageWrapper>{this.renderPage()}</PageWrapper>;
  }
}

export default PayRollDetail;
