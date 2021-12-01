import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty, isNil, type } from 'ramda';
import update from 'immutability-helper';
import { Form, Card } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import EditTable from '@/components/production/business/EditTable';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';
import {
  ProductFormItemBlockConfig,
  ProductTableColumnsBlockConfig,
} from '@/utils/pageConfigUtils';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import { fromQs } from '@/utils/production/stringUtil';
import { genFakeId } from '@/utils/production/mathUtils';
import { mul } from '@/utils/mathUtils';

const DOMAIN = 'saleOrderAdjust';
@connect(({ loading, saleOrderAdjust, dispatch, user }) => ({
  loading,
  ...saleOrderAdjust,
  dispatch,
  user,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      if (Array.isArray(tempValue)) {
        tempValue.forEach((temp, index) => {
          Object.keys(temp).forEach(detailKey => {
            fields[`${key}[${index}].${detailKey}`] = Form.createFormField({
              value: temp[detailKey],
            });
          });
        });
      } else {
        fields[key] = Form.createFormField({ value: tempValue });
      }
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
      type: `${DOMAIN}/updateFormForEditTable`,
      payload: newFieldData,
    });
  },
})
class indexCom extends Component {
  state = {};

  componentDidMount() {
    const { dispatch } = this.props;

    const { id } = fromQs();

    // 可配置化信息
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'SALE_ORDER_ADJUST' },
    });

    // 客户列表
    dispatch({
      type: `${DOMAIN}/getCustomerList`,
    });

    if (id) {
      dispatch({
        type: `${DOMAIN}/saleOrderDetail`,
        payload: { id },
      });
    }
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    this.callModelEffects('cleanState');
  }

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  handleSave = isSubmit => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      formData: { detailViews, planViews, ...newFormData },
    } = this.props;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/saleOrderAdjust`,
          payload: {
            ...newFormData,
            ...values,
            detailEntities: detailViews,
            planEntities: planViews,
            submit: isSubmit,
          },
        });
      }
    });
  };

  // 配置所需要的内容
  renderPage = () => {
    const {
      dispatch,
      formData,
      formMode,
      pageConfig,
      form,
      user: {
        user: { extInfo = {} },
      },
      customerList = [],
    } = this.props;
    const { userId } = extInfo;

    const fields = [
      <BusinessFormTitle title="基本信息1" />,
      <FormItem
        label="销售单名称1"
        key="soName"
        fieldKey="soName"
        fieldType="BaseInput"
        required
        initialValue={formData.soName}
      />,
      <FormItem
        label="销售单编号"
        key="soNo"
        fieldKey="soNo"
        fieldType="BaseInput"
        initialValue={formData.soNo}
        disabled
        plcaeholder="系统自动生成"
      />,
      <FormItem
        label="客户名称"
        key="custId"
        fieldKey="custId"
        fieldType="BaseSelect"
        initialValue={formData.custId}
        descList={customerList}
      />,
      <FormItem
        label="相关合同"
        key="relatedContractId"
        fieldKey="relatedContractId"
        fieldType="ContractSimpleSelect"
        initialValue={formData.relatedContractId}
      />,
      <FormItem
        label="相关产品"
        key="relatedProductId"
        fieldKey="relatedProductId"
        fieldType="ProductSimpleSelect"
        initialValue={formData.relatedProductId}
      />,
      <FormItem
        label="相关项目"
        key="collectionProjectId"
        fieldKey="collectionProjectId"
        fieldType="ProjectSimpleSelect"
        initialValue={formData.collectionProjectId}
      />,
      <FormItem
        label="签单公司"
        key="collectionCompany"
        fieldKey="collectionCompany"
        fieldType="BaseCustomSelect"
        parentKey="CUS:INTERNAL_COMPANY"
        required
        initialValue={formData.collectionCompany}
      />,
      <FormItem
        label="签单部门"
        key="collectionBuId"
        fieldKey="collectionBuId"
        fieldType="BuSimpleSelect"
        required
        initialValue={formData.collectionBuId}
      />,
      <FormItem
        label="销售负责人"
        key="inchargeSaleId"
        fieldKey="inchargeSaleId"
        fieldType="ResSimpleSelect"
        required
        initialValue={formData.inchargeSaleId}
      />,
      <FormItem
        label="外币业务"
        key="foreignCurrencyFlag"
        fieldKey="foreignCurrencyFlag"
        fieldType="BaseRadioSelect"
        options={[{ label: '是', value: true }, { label: '否', value: false }]}
        initialValue={formData.foreignCurrencyFlag}
        required
      />,
      <FormItem fieldType="Group" label="原币/汇率" key="originalCurrency" required>
        <FormItem
          key="originalCurrency"
          fieldKey="originalCurrency"
          fieldType="BaseSelect"
          parentKey="COMMON_CURRENCY"
          initialValue={formData.originalCurrency}
        />
        <FormItem
          key="exchangeRate"
          fieldKey="exchangeRate"
          fieldType="BaseInputNumber"
          initialValue={formData.exchangeRate || undefined}
          onChange={e => {
            if (type(e) === 'Number') {
              const { originalCurrencyAmt } = formData;
              const tt =
                !isNil(originalCurrencyAmt) && !isNil(e) ? mul(originalCurrencyAmt, e) : '';
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  baseCurrencyAmt: tt,
                },
              });
            }
          }}
        />
      </FormItem>,
      <FormItem
        label="原币金额"
        key="originalCurrencyAmt"
        fieldKey="originalCurrencyAmt"
        fieldType="BaseInputAmt"
        initialValue={formData.originalCurrencyAmt}
        disabled
        plcaeholder="系统自动计算"
      />,
      <FormItem
        label="本币金额"
        key="baseCurrencyAmt"
        fieldKey="baseCurrencyAmt"
        fieldType="BaseInputAmt"
        initialValue={formData.baseCurrencyAmt}
        disabled
        plcaeholder="系统自动计算"
      />,
      <FormItem
        label="附件"
        key="productsaleorder"
        fieldKey="productsaleorder"
        fieldType="BaseFileManagerEnhance"
        dataKey={formData.id}
        api="/api/production/sale/saleOrder/sfs/token"
        listType="text"
        attach
      />,
      <FormItem
        label="状态"
        fieldKey="soStatus"
        key="soStatus"
        fieldType="BaseSelect"
        parentKey="COM:DOC_STATUS"
        initialValue={formData.soStatus}
        disabled
      />,
      <FormItem
        label="创建人"
        fieldKey="createUserId"
        key="createUserId"
        fieldType="UserSimpleSelect"
        initialValue={userId}
        disabled
      />,
      <FormItem
        label="创建时间"
        fieldKey="createTime"
        key="createTime"
        fieldType="BaseInput"
        // initialValue={formData.createTime}
        disabled
      />,
      <FormItem
        label="备注1"
        fieldKey="remark"
        key="remark"
        fieldType="BaseInputTextArea"
        initialValue={formData.remark}
      />,
      <FormItem label="备注2" fieldKey="remark1" key="remark1" fieldType="BaseInputTextArea" />,
      <FormItem
        fieldType="BaseInputTextArea"
        label="调整说明"
        fieldKey="soAdjustDesc"
        key="soAdjustDesc"
        initialValue={formData.soAdjustDesc}
      />,
    ];

    const fieldsConfig = ProductFormItemBlockConfig(pageConfig, 'blockKey', 'FORM', fields);

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={8}>
        <BusinessFormTitle title="基本信息" />
        <FormItem
          label="销售单名称"
          key="soName"
          fieldKey="soName"
          fieldType="BaseInput"
          required
          initialValue={formData.soName}
        />
        <FormItem
          label="销售单编号"
          key="soNo"
          fieldKey="soNo"
          fieldType="BaseInput"
          initialValue={formData.soNo}
          disabled
          plcaeholder="系统自动生成"
        />
        <FormItem
          label="客户名称"
          key="custId"
          fieldKey="custId"
          fieldType="BaseSelect"
          initialValue={formData.custId}
          descList={customerList}
        />
        <FormItem
          label="相关合同"
          key="relatedContractId"
          fieldKey="relatedContractId"
          fieldType="ContractSimpleSelect"
          initialValue={formData.relatedContractId}
        />
        <FormItem
          label="相关产品"
          key="relatedProductId"
          fieldKey="relatedProductId"
          fieldType="ProductSimpleSelect"
          initialValue={formData.relatedProductId}
        />
        <FormItem
          label="相关项目"
          key="collectionProjectId"
          fieldKey="collectionProjectId"
          fieldType="ProjectSimpleSelect"
          initialValue={formData.collectionProjectId}
        />
        <FormItem
          label="签单公司"
          key="collectionCompany"
          fieldKey="collectionCompany"
          fieldType="BaseCustomSelect"
          parentKey="CUS:INTERNAL_COMPANY"
          required
          initialValue={formData.collectionCompany}
        />
        <FormItem
          label="签单部门"
          key="collectionBuId"
          fieldKey="collectionBuId"
          fieldType="BuSimpleSelect"
          required
          initialValue={formData.collectionBuId}
        />
        <FormItem
          label="销售负责人"
          key="inchargeSaleId"
          fieldKey="inchargeSaleId"
          fieldType="ResSimpleSelect"
          required
          initialValue={formData.inchargeSaleId}
        />
        <FormItem
          label="外币业务"
          key="foreignCurrencyFlag"
          fieldKey="foreignCurrencyFlag"
          fieldType="BaseRadioSelect"
          options={[{ label: '是', value: true }, { label: '否', value: false }]}
          initialValue={formData.foreignCurrencyFlag}
          required
        />
        <FormItem fieldType="Group" label="原币/汇率" key="originalCurrency" required>
          <FormItem
            key="originalCurrency"
            fieldKey="originalCurrency"
            fieldType="BaseSelect"
            parentKey="COMMON_CURRENCY"
            initialValue={formData.originalCurrency}
          />
          <FormItem
            key="exchangeRate"
            fieldKey="exchangeRate"
            fieldType="BaseInputNumber"
            initialValue={formData.exchangeRate || undefined}
            onChange={e => {
              if (type(e) === 'Number') {
                const { originalCurrencyAmt } = formData;
                const tt =
                  !isNil(originalCurrencyAmt) && !isNil(e) ? mul(originalCurrencyAmt, e) : '';
                dispatch({
                  type: `${DOMAIN}/updateForm`,
                  payload: {
                    baseCurrencyAmt: tt,
                  },
                });
              }
            }}
          />
        </FormItem>
        <FormItem
          label="原币金额"
          key="originalCurrencyAmt"
          fieldKey="originalCurrencyAmt"
          fieldType="BaseInputAmt"
          initialValue={formData.originalCurrencyAmt}
          disabled
          plcaeholder="系统自动计算"
        />
        <FormItem
          label="本币金额"
          key="baseCurrencyAmt"
          fieldKey="baseCurrencyAmt"
          fieldType="BaseInputAmt"
          initialValue={formData.baseCurrencyAmt}
          disabled
          plcaeholder="系统自动计算"
        />
        <FormItem
          label="附件"
          key="productsaleorder"
          fieldKey="productsaleorder"
          fieldType="BaseFileManagerEnhance"
          dataKey={formData.id}
          api="/api/production/sale/saleOrder/sfs/token"
          listType="text"
          attach
        />
        <FormItem
          label="状态"
          fieldKey="soStatus"
          key="soStatus"
          fieldType="BaseSelect"
          parentKey="COM:DOC_STATUS"
          initialValue={formData.soStatus}
          disabled
        />
        <FormItem
          label="创建人"
          fieldKey="createUserId"
          key="createUserId"
          fieldType="UserSimpleSelect"
          initialValue={userId}
          disabled
        />
        <FormItem
          label="创建时间"
          fieldKey="createTime"
          key="createTime"
          fieldType="BaseInput"
          // initialValue={formData.createTime}
          disabled
        />
        <FormItem
          label="备注"
          fieldKey="remark"
          key="remark"
          fieldType="BaseInputTextArea"
          initialValue={formData.remark}
        />
        <FormItem
          fieldType="BaseInputTextArea"
          label="调整说明"
          fieldKey="soAdjustDesc"
          key="soAdjustDesc"
          required
        />
      </BusinessForm>
    );
  };

  renderColumns = () => {
    const { dispatch, form, pageConfig } = this.props;

    const fields = [
      {
        title: '商品名称',
        dataIndex: 'itemName',
        align: 'center',
        render: (text, record, index) => (
          <FormItem form={form} fieldType="BaseInput" fieldKey={`detailViews[${index}].itemName`} />
        ),
      },
      {
        title: '数量',
        align: 'center',
        dataIndex: 'qty',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`detailViews[${index}].qty`}
          />
        ),
      },
      {
        title: '单价',
        align: 'center',
        dataIndex: 'unitPrice',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`detailViews[${index}].unitPrice`}
          />
        ),
      },
      {
        title: '金额',
        align: 'center',
        dataIndex: 'amt',
        render: (val, row, index) =>
          row.qty && row.unitPrice ? mul(row.qty || 0, row.unitPrice || 0).toFixed(2) : '0.00',
      },
      {
        title: '税率',
        align: 'center',
        dataIndex: 'taxRate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`detailViews[${index}].taxRate`}
            max={100}
            min={0}
            formatter={value => (value ? `${value}%` : '0%')}
            parser={value => value.replace('%', '')}
          />
        ),
      },
      {
        title: '交付日期',
        align: 'center',
        dataIndex: 'deliveryDate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`detailViews[${index}].deliveryDate`}
          />
        ),
      },
    ];
    // const fieldsConfig = ProductTableColumnsBlockConfig(
    //   pageConfig,
    //   'blockKey',
    //   'EXPENSE_QUOTA_D_TABLT',
    //   fields
    // );

    return fields;
  };

  renderColumns1 = () => {
    const { dispatch, form, pageConfig } = this.props;

    const fields = [
      {
        title: '收款阶段',
        dataIndex: 'collectionStage',
        align: 'center',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`planViews[${index}].collectionStage`}
          />
        ),
      },
      {
        title: '当期收款金额',
        align: 'center',
        dataIndex: 'collectionAmt',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`planViews[${index}].collectionAmt`}
          />
        ),
      },
      {
        title: '当期收款比例%',
        align: 'center',
        dataIndex: 'collectionRate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`planViews[${index}].collectionRate`}
            max={100}
            min={0}
            formatter={value => (value ? `${value}%` : '0%')}
            parser={value => value.replace('%', '')}
          />
        ),
      },
      {
        title: '预计收款日期',
        align: 'center',
        dataIndex: 'expectedCollectionDate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`planViews[${index}].expectedCollectionDate`}
          />
        ),
      },
      {
        title: '税率',
        align: 'center',
        dataIndex: 'taxRate',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`planViews[${index}].taxRate`}
            max={100}
            min={0}
            formatter={value => (value ? `${value}%` : '0%')}
            parser={value => value.replace('%', '')}
          />
        ),
      },
    ];
    // const fieldsConfig = ProductTableColumnsBlockConfig(
    //   pageConfig,
    //   'blockKey',
    //   'EXPENSE_QUOTA_D_TABLT',
    //   fields
    // );

    return fields;
  };

  render() {
    const {
      dispatch,
      loading,
      form,
      formData,
      formMode,
      detailDelViews,
      planDelViews,
    } = this.props;
    const { detailViews = [], planViews = [] } = formData;
    const { scene } = fromQs();

    const disabledBtn =
      loading.effects[`${DOMAIN}/saleOrderDetail`] || loading.effects[`${DOMAIN}/saleOrderEdit`];

    return (
      <PageWrapper>
        <ButtonCard>
          {/*<Button*/}
          {/*  icon="save"*/}
          {/*  size="large"*/}
          {/*  type="primary"*/}
          {/*  onClick={() => {*/}
          {/*    this.handleSave();*/}
          {/*  }}*/}
          {/*  disabled={disabledBtn}*/}
          {/*>*/}
          {/*  调整*/}
          {/*</Button>*/}
          {scene === 'adjust' ? (
            <Button
              icon="upload"
              size="large"
              type="primary"
              onClick={() => {
                this.handleSave(true);
              }}
              disabled={disabledBtn}
            >
              调整
            </Button>
          ) : (
            ''
          )}
        </ButtonCard>
        {this.renderPage()}
        <EditTable
          title="销售单明细"
          form={form}
          columns={this.renderColumns()}
          dataSource={detailViews}
          // onAddClick={() => {
          //   dispatch({
          //     type: `${DOMAIN}/updateForm`,
          //     payload: {
          //       detailViews: update(detailViews, {
          //         $push: [
          //           {
          //             id: genFakeId(-1),
          //           },
          //         ],
          //       }),
          //     },
          //   });
          // }}
          onDeleteConfirm={keys => {
            const newDataSource = detailViews.filter(row => keys.indexOf(row.id) < 0);
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                detailViews: newDataSource,
              },
            });
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                detailDelViews: [...detailDelViews, ...keys],
              },
            });
          }}
        />
        <EditTable
          title="收款计划"
          form={form}
          columns={this.renderColumns1()}
          dataSource={planViews}
          // onAddClick={() => {
          //   dispatch({
          //     type: `${DOMAIN}/updateForm`,
          //     payload: {
          //       planViews: update(planViews, {
          //         $push: [
          //           {
          //             id: genFakeId(-1),
          //           },
          //         ],
          //       }),
          //     },
          //   });
          // }}
          onDeleteConfirm={keys => {
            const newDataSource = planViews.filter(row => keys.indexOf(row.id) < 0);
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                planViews: newDataSource,
              },
            });
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                planDelViews: [...planDelViews, ...keys],
              },
            });
          }}
        />
      </PageWrapper>
    );
  }
}

export default indexCom;