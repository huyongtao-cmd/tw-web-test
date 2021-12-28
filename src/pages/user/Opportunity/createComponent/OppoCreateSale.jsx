import React, { PureComponent } from 'react';
import { DatePicker, InputNumber, Input, Select, Radio } from 'antd';
import moment from 'moment';
import { formatMessage } from 'umi/locale';
import FieldList from '@/components/layout/FieldList';
import { UdcSelect, Selection } from '@/pages/gen/field';
// import SelectWithCols from '@/components/common/SelectWithCols';
import AsyncSelect from '@/components/common/AsyncSelect';
import { selectCoop } from '@/services/gen/list';

const { Field } = FieldList;
const RadioGroup = Radio.Group;
// const DOMAIN = 'userOppsDetail';

class OppoCreateSale extends PureComponent {
  state = {
    prodSource: [],
    describeFlag: 0,
  };

  componentDidMount() {
    const { dispatch, domain } = this.props;
    dispatch({ type: `${domain}/selectProd` }).then(() => {
      this.fetchData();
    });
  }

  fetchData = () => {
    const {
      userOppsDetail: { prodList },
    } = this.props;
    this.setState({ prodSource: prodList });
  };

  // 销售大类 -> 销售小类
  handleChangeType1 = value => {
    const { dispatch, domain, form } = this.props;
    dispatch({
      type: `${domain}/updateSaleType2`,
      payload: value,
    }).then(() => {
      form.setFieldsValue({
        saleType2: '',
      });
    });
  };

  handleProdChange = value => {
    selectCoop({ prodIds: value.join(',') }).then(({ response }) => {
      const [{ id }] = response;
      const { dispatch, domain } = this.props;
      dispatch({
        type: `${domain}/updateForm`,
        payload: {
          coopId: id,
        },
      });
    });
  };

  renderPage = () => {
    const {
      userOppsDetail: { formData, saleType2Data, pageConfig },
      form: { getFieldDecorator },
    } = this.props;
    const { prodSource, describeFlag } = this.state;
    // console.log(pageConfig);
    if (!pageConfig.pageBlockViews || pageConfig.pageBlockViews.length < 1) {
      return <div />;
    }
    const currentBlockConfig = pageConfig.pageBlockViews[0];
    const { pageFieldViews } = currentBlockConfig;
    const pageFieldJson = {};
    pageFieldViews.forEach(field => {
      pageFieldJson[field.fieldKey] = field;
    });
    // console.log(pageFieldJson, 'pageFieldJson');
    const fields = [
      <Field
        name="saleType1"
        key="saleType1"
        label={pageFieldJson.saleType1.displayName}
        sortNo={pageFieldJson.saleType1.sortNo}
        decorator={{
          initialValue: formData.saleType1,
          rules: [
            {
              required: !!pageFieldJson.saleType1.requiredFlag,
              message: `请选择${pageFieldJson.saleType1.displayName}`,
            },
          ],
        }}
      >
        <UdcSelect
          code="TSK.SALE_TYPE1"
          placeholder={`请选择${pageFieldJson.saleType1.displayName}`}
          onChange={this.handleChangeType1}
        />
      </Field>,
      <Field
        name="saleType2"
        key="saleType2"
        label={pageFieldJson.saleType2.displayName}
        sortNo={pageFieldJson.saleType2.sortNo}
        decorator={{
          initialValue: formData.saleType2Desc,
          rules: [
            {
              required: !!pageFieldJson.saleType2.requiredFlag,
              message: `请选择${pageFieldJson.saleType2.displayName}`,
            },
          ],
        }}
      >
        <AsyncSelect
          source={saleType2Data}
          placeholder={`请选择${pageFieldJson.saleType2.displayName}`}
        />
      </Field>,
      <Field
        name="forecastWinDate"
        key="forecastWinDate"
        label={pageFieldJson.forecastWinDate.displayName}
        sortNo={pageFieldJson.forecastWinDate.sortNo}
        decorator={{
          initialValue: formData.forecastWinDate ? moment(formData.forecastWinDate) : null,
          rules: [
            {
              required: !!pageFieldJson.forecastWinDate.requiredFlag,
              message: `请输入${pageFieldJson.forecastWinDate.displayName}`,
            },
          ],
        }}
        popover={{
          placement: 'topLeft',
          trigger: 'hover',
          content: '该字段会影响资源规划，请谨慎填写！',
        }}
      >
        <DatePicker className="x-fill-100" />
      </Field>,
      <Field
        name="forecastAmount"
        key="forecastAmount"
        label={pageFieldJson.forecastAmount.displayName}
        sortNo={pageFieldJson.forecastAmount.sortNo}
        decorator={{
          initialValue: formData.forecastAmount,
          rules: [
            {
              required: !!pageFieldJson.forecastAmount.requiredFlag,
              message: `请输入${pageFieldJson.forecastAmount.displayName}`,
            },
          ],
        }}
      >
        <InputNumber className="x-fill-100" max={999999999999} />
      </Field>,
      <Field
        name="currCode"
        key="currCode"
        label={pageFieldJson.currCode.displayName}
        sortNo={pageFieldJson.currCode.sortNo}
        decorator={{
          initialValue: formData.currCode,
          rules: [
            {
              required: !!pageFieldJson.currCode.requiredFlag,
              message: `请选择${pageFieldJson.currCode.displayName}`,
            },
          ],
        }}
      >
        <UdcSelect
          code="COM.CURRENCY_KIND"
          placeholder={`请选择${pageFieldJson.currCode.displayName}`}
        />
      </Field>,
      <Field
        name="probability"
        key="probability"
        label={pageFieldJson.probability.displayName}
        sortNo={pageFieldJson.probability.sortNo}
        decorator={{
          initialValue: formData.probability,
          rules: [
            {
              required: !!pageFieldJson.probability.requiredFlag,
              message: `请选择${pageFieldJson.probability.displayName}`,
            },
          ],
        }}
      >
        <UdcSelect code="TSK.WIN_PROBABLITY" />
      </Field>,
      <Field
        name="salePhase"
        key="salePhase"
        label={pageFieldJson.salePhase.displayName}
        sortNo={pageFieldJson.salePhase.sortNo}
        decorator={{
          initialValue: formData.salePhase,
          rules: [
            {
              required: !!pageFieldJson.salePhase.requiredFlag,
              message: `请选择${pageFieldJson.salePhase.displayName}`,
            },
          ],
        }}
      >
        <UdcSelect code="TSK.SALE_PHASE" />
      </Field>,
      <Field
        name="productIds"
        key="productIds"
        label={pageFieldJson.productIds.displayName}
        sortNo={pageFieldJson.productIds.sortNo}
        decorator={{
          initialValue: formData.productIds ? formData.productIds : [],
          rules: [
            {
              required: !!pageFieldJson.productIds.requiredFlag,
              message: `请选择${pageFieldJson.productIds.displayName}`,
            },
          ],
        }}
      >
        <Select
          mode="multiple"
          className="x-fill-100"
          placeholder={`请选择${pageFieldJson.productIds.displayName}`}
          onChange={value => this.handleProdChange(value)}
        >
          {prodSource.map(item => (
            <Select.Option key={item.id}>
              {item.code}
              &nbsp;&nbsp;&nbsp;
              {item.name}
            </Select.Option>
          ))}
        </Select>
      </Field>,
      <Field
        name="deliveryAddress"
        key="deliveryAddress"
        label={pageFieldJson.deliveryAddress.displayName}
        sortNo={pageFieldJson.deliveryAddress.sortNo}
        decorator={{
          initialValue: formData.deliveryAddress,
          rules: [
            {
              required: !!pageFieldJson.deliveryAddress.requiredFlag,
              message: `请输入${pageFieldJson.deliveryAddress.displayName}`,
            },
          ],
        }}
      >
        <Input maxLength={35} placeholder={`请输入${pageFieldJson.deliveryAddress.displayName}`} />
      </Field>,
      <Field
        name="coopId"
        key="coopId"
        label={pageFieldJson.coopId.displayName}
        sortNo={pageFieldJson.coopId.sortNo}
        decorator={{
          initialValue: formData.coopId,
          rules: [
            {
              required: !!pageFieldJson.coopId.requiredFlag,
              message: `请选择${pageFieldJson.coopId.displayName}`,
            },
          ],
        }}
      >
        <Selection
          source={() => selectCoop()}
          placeholder={`请选择${pageFieldJson.coopId.displayName}`}
        />
      </Field>,
      <Field
        name="oppoLevel"
        key="oppoLevel"
        label={pageFieldJson.oppoLevel.displayName}
        decorator={{
          initialValue: formData.oppoLevel,
          rules: [
            {
              required: !!pageFieldJson.oppoLevel.requiredFlag,
              message: `请选择${pageFieldJson.oppoLevel.displayName}`,
            },
          ],
        }}
      >
        <UdcSelect code="TSK.OPPO_LEVEL" />
      </Field>,
      <Field
        name="isNeedPartner"
        key="isNeedPartner"
        label={pageFieldJson.isNeedPartner.displayName}
        decorator={{
          initialValue: formData.isNeedPartner,
          rules: [
            {
              required: !!pageFieldJson.isNeedPartner.requiredFlag,
              message: `请选择${pageFieldJson.isNeedPartner.displayName}`,
            },
          ],
        }}
      >
        <RadioGroup
          onChange={e => {
            formData.isNeedPartner = e.target.value;
            this.setState({
              describeFlag: e.target.value,
            });
          }}
        >
          <Radio value={1}>是</Radio>
          <Radio value={0}>否</Radio>
        </RadioGroup>
      </Field>,
      <Field
        name="partnerDesc"
        key="partnerDesc"
        sortNo={pageFieldJson.partnerDesc.sortNo}
        label={pageFieldJson.partnerDesc.displayName}
        fieldCol={1}
        labelCol={{ span: 4, xxl: 3 }}
        wrapperCol={{ span: 20, xxl: 21 }}
        decorator={{
          initialValue: formData.partnerDesc,
          rules: [
            {
              required: describeFlag === 1,
              message: `请输入${pageFieldJson.partnerDesc.displayName}`,
            },
          ],
        }}
      >
        <Input.TextArea placeholder="请描述对合作伙伴的要求（产品、行业、规模等）" rows={3} />
      </Field>,
    ];
    const filterList = fields
      .filter(field => !field.key || pageFieldJson[field.key].visibleFlag === 1)
      .sort((field1, field2) => field1.props.sortNo - field2.props.sortNo);
    return (
      <FieldList
        layout="horizontal"
        legend="销售信息"
        getFieldDecorator={getFieldDecorator}
        col={2}
      >
        {filterList}
      </FieldList>
    );
  };

  render() {
    const {
      userOppsDetail: { formData, saleType2Data },
      form: { getFieldDecorator },
    } = this.props;
    const { prodSource } = this.state;
    return this.renderPage();
  }
}

export default OppoCreateSale;
