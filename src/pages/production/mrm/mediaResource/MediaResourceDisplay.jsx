import React, { Component } from 'react';

import { connect } from 'dva';
import { Form, Carousel } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import EditTable from '@/components/production/business/EditTable';
import DataTable from '@/components/production/business/DataTable';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ButtonCard from '@/components/production/layout/ButtonCard';
import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import Button from '@/components/production/basic/Button';
import message from '@/components/production/layout/Message.tsx';
import { isEmpty } from 'ramda';
import { genFakeId } from '@/utils/production/mathUtils';
import { mul, div } from '@/utils/mathUtils';
import update from 'immutability-helper';
import { mediaResourcePagingRq } from '@/services/production/mrm/mediaResource';
import styles from './styles.less';

const DOMAIN = 'mediaResourceDisplay';
@connect(({ loading, mediaResourceDisplay, dispatch }) => ({
  loading,
  ...mediaResourceDisplay,
  dispatch,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      if (Array.isArray(tempValue) && key.includes('Details')) {
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
  // form值发生变化
  onValuesChange(props, changedValues, allValues) {
    const { formData, dispatch } = props;
    if (isEmpty(changedValues)) return;
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    dispatch({
      type: `${DOMAIN}/updateFormForEditTable`,
      payload: changedValues,
    });
  },
})
class MediaResourceDisplay extends Component {
  componentDidMount() {
    const { dispatch, formMode } = this.props;
    dispatch({
      type: `${DOMAIN}/getParamsFromRoute`,
    });
    this.callModelEffects('init');
  }

  componentWillUnmount() {
    // 页面卸载时清理model层state,防止再次进入时错误显示
    this.callModelEffects('cleanState');
  }

  /**
   * 切换编辑模式
   */
  switchEdit = () => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/updateState`, payload: { formMode: 'EDIT' } });
    this.callModelEffects('init');
  };

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  /**
   * 保存
   */
  handleSave = (param, cb) => {
    // change_9
    const { form, formData, attributeDeleteKeys, priceDeleteKeys } = this.props;
    const { attributeDetails, priceDetails } = formData;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        this.callModelEffects('save', {
          formData: {
            ...formData,
            ...values,
            attributeDetails,
            priceDetails,
            attributeDeleteKeys,
            priceDeleteKeys,

            ...param,
          },
          cb,
        });
      }
    });
  };

  // 基本信息表单
  renderPage = () => {
    const { formData, formMode, form, fileList } = this.props;
    const fields = [
      <FormItem
        label="资源编号"
        key="resourceNo"
        fieldKey="resourceNo"
        fieldType="BaseInput"
        required
      />,
      <FormItem
        label="资源名称"
        key="resourceName"
        fieldKey="resourceName"
        fieldType="BaseInput"
        required
      />,
      <FormItem
        label="广告形式"
        key="advertisementMode"
        fieldKey="advertisementMode"
        fieldType="BaseSelect"
        parentKey="FUNCTION:AD_FORMAT"
      />,
      <FormItem
        label="资源大类"
        key="resourceType1"
        fieldKey="resourceType1"
        fieldType="BaseSelect"
        parentKey="COM:AB:SUPPLIER_TYPE3"
      />,
      <FormItem
        label="资源小类"
        key="resourceType2"
        fieldKey="resourceType2"
        fieldType="BaseSelect"
        parentKey="COM:AB:SUPPLIER_TYPE4"
      />,

      <FormItem
        label="城市"
        key="city"
        fieldKey="city"
        fieldType="BaseSelect"
        parentKey="FUNCTION:REGION:NAME"
      />,
      <FormItem
        label="资源位置1"
        key="location1"
        fieldKey="location1"
        fieldType="BaseSelect"
        parentKey="FUNCTION:RESOURCE:LOCATION1"
      />,
      <FormItem
        label="资源位置2"
        key="location2"
        fieldKey="location2"
        fieldType="BaseSelect"
        parentKey="FUNCTION:RESOURCE:LOCATION2"
      />,
      <FormItem label="地图链接" key="mapLink" fieldKey="mapLink" fieldType="BaseInput" />,
      <FormItem
        label="图片"
        key="attachmentIds"
        fieldKey="attachmentIds"
        fieldType="FileUpload"
        fileList={fileList}
        maxFileSize={2}
        accept="image/*"
        multiple
        required
      />,

      <FormItem label="备注" fieldKey="remark" key="remark" fieldType="BaseInputTextArea" />,
    ];

    return (
      <BusinessForm
        title="基本信息"
        formData={formData}
        form={form}
        formMode={formMode}
        defaultColumnStyle={12}
      >
        {fields}
      </BusinessForm>
    );
  };

  // （可编辑）资源属性
  renderEditColumns = () => {
    const { form } = this.props;

    const fields = [
      {
        title: '属性名称',
        dataIndex: 'attributeName',
        align: 'center',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`attributeDetails[${index}].attributeName`}
          />
        ),
      },
      {
        title: '属性值',
        align: 'center',
        dataIndex: 'attributeValue',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`attributeDetails[${index}].attributeValue`}
          />
        ),
      },
      {
        title: '备注',
        align: 'center',
        dataIndex: 'remark',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputTextArea"
            fieldKey={`attributeDetails[${index}].remark`}
          />
        ),
      },
    ];

    return fields;
  };

  // 资源属性
  renderColumns = () => {
    const fields = [
      {
        title: '属性名称',
        dataIndex: 'attributeName',
        align: 'center',
      },
      {
        title: '属性值',
        align: 'center',
        dataIndex: 'attributeValue',
      },
      {
        title: '备注',
        align: 'center',
        dataIndex: 'remark',
      },
    ];

    return fields;
  };

  // （可编辑）资源价格
  renderEditColumns1 = () => {
    const { form, supplierOptions } = this.props;
    const fields = [
      {
        title: '供应商',
        dataIndex: 'supplierNo',
        align: 'center',
        width: 240,
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseSelect"
            fieldKey={`priceDetails[${index}].supplierNo`}
            options={supplierOptions}
          />
        ),
      },
      {
        title: '代理方式',
        align: 'center',
        dataIndex: 'agentMethod',
        width: 120,
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseSelect"
            parentKey="MRM:MEDIA_RESOURCE:AGENT_METHOD"
            fieldKey={`priceDetails[${index}].agentMethod`}
          />
        ),
      },
      {
        title: '售卖方式',
        align: 'center',
        dataIndex: 'saleMethod',
        width: 120,
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseSelect"
            parentKey="MRM:MEDIA_RESOURCE:SALE_METHOD"
            fieldKey={`priceDetails[${index}].saleMethod`}
          />
        ),
      },
      {
        title: '售卖单位',
        align: 'center',
        dataIndex: 'saleUnit',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseSelect"
            parentKey="MRM:MEDIA_RESOURCE:SALE_UNIT"
            fieldKey={`priceDetails[${index}].saleUnit`}
          />
        ),
      },
      {
        title: '刊例价',
        align: 'center',
        dataIndex: 'publishedPrice',
        render: (text, row, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`priceDetails[${index}].publishedPrice`}
            onChange={value => {
              const finalPrice = mul(value || 0, row.discount || 1).toFixed(2);
              const arr = [];
              arr[index] = {
                finalPrice,
              };
              this.callModelEffects('updateFormForEditTable', { priceDetails: arr });
            }}
          />
        ),
      },
      {
        title: '折扣',
        align: 'center',
        dataIndex: 'discount',
        render: (text, row, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`priceDetails[${index}].discount`}
            addonAfter="折"
            onChange={value => {
              const finalPrice = mul(value || 1, row.publishedPrice || 0).toFixed(2);
              const arr = [];
              arr[index] = {
                finalPrice,
              };
              this.callModelEffects('updateFormForEditTable', { priceDetails: arr });
            }}
          />
        ),
      },
      {
        title: '折扣价',
        align: 'center',
        dataIndex: 'finalPrice',
        render: (text, row, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputAmt"
            fieldKey={`priceDetails[${index}].finalPrice`}
            disabled
          />
        ),
      },
      {
        title: '生效时段',
        align: 'center',
        dataIndex: 'effectivePeriod',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`priceDetails[${index}].effectivePeriod`}
          />
        ),
      },
      {
        title: '状态',
        align: 'center',
        dataIndex: 'priceStatus',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseSelect"
            parentKey="COMMON:YES-OR-NO"
            fieldKey={`priceDetails[${index}].priceStatus`}
          />
        ),
      },

      {
        title: '备注',
        align: 'center',
        dataIndex: 'remark',
        render: (text, record, index) => (
          <FormItem
            form={form}
            fieldType="BaseInputTextArea"
            fieldKey={`priceDetails[${index}].remark`}
          />
        ),
      },
    ];

    return fields;
  };

  // 资源价格
  renderColumns1 = () => {
    const fields = [
      { title: '供应商', dataIndex: 'supplierNoDesc', align: 'center' },
      { title: '代理方式', align: 'center', dataIndex: 'agentMethodDesc' },
      { title: '售卖方式', align: 'center', dataIndex: 'saleMethodDesc' },
      { title: '售卖单位', align: 'center', dataIndex: 'saleUnitDesc' },
      { title: '刊例价', align: 'center', dataIndex: 'publishedPrice' },
      { title: '折扣', align: 'center', dataIndex: 'discount' },
      { title: '折扣价', align: 'center', dataIndex: 'finalPrice' },
      { title: '生效时段', align: 'center', dataIndex: 'effectivePeriod' },
      { title: '状态', align: 'center', dataIndex: 'priceStatusDesc' },
      { title: '备注', align: 'center', dataIndex: 'remark' },
    ];

    return fields;
  };

  // 获取历史价格
  fetchHistoryPrice = async params => {
    const { createTime, ...restparams } = params;

    if (Array.isArray(createTime) && (createTime[0] || createTime[1])) {
      [restparams.startDate, restparams.endDate] = createTime;
    } else {
      restparams.createTime = createTime;
    }
    const { response } = await mediaResourcePagingRq(restparams);
    const result = response.data;
    return result;
  };

  //  历史价格
  renderPriceHistory = () => {
    const columns = [
      { title: '合同编号', dataIndex: 'contractNo', align: 'center' },
      { title: '合同名称', dataIndex: 'contractName', align: 'center' },
      { title: '供应商', dataIndex: 'supplierNoDesc', align: 'center' },
      { title: '刊例价', align: 'center', dataIndex: 'publishedPrice' },
      { title: '折扣', align: 'center', dataIndex: 'discount' },
      { title: '成交价格', align: 'center', dataIndex: 'finalPrice' },
      { title: '成交折扣', align: 'center', dataIndex: 'discount' },
      { title: '合同负责人', align: 'center', dataIndex: 'effectivePeriod' },
      // TODO 修改参数名
      { title: '排期开始时间', align: 'center', dataIndex: 'priceStatusDesc' },
      { title: '排期结束时间', align: 'center', dataIndex: 'remark' },
    ];
    const searchForm = [
      <SearchFormItem
        key="resourceNo"
        fieldType="BaseInput"
        label="资源编号"
        fieldKey="resourceNo"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="resourceName"
        fieldType="BaseInput"
        label="资源名称"
        fieldKey="resourceName"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="resourceType1"
        label="资源大类"
        fieldKey="resourceType1"
        fieldType="BaseSelect"
        parentKey="COM:AB:SUPPLIER_TYPE3"
      />,
    ];
    return (
      <SearchTable
        title="历史价格"
        SearchTable
        searchForm={searchForm} // 查询条件
        defaultSearchForm={{}} // 查询条件默认值,重置时查询条件默认这里面的值
        defaultSortBy="id"
        defaultSortDirection="DESC"
        fetchData={this.fetchHistoryPrice} // 获取数据的方法,请注意获取数据的格式
        columns={columns} // 要展示的列
        defaultAdvancedSearch={false} // 查询条件默认为高级查询
        autoSearch // 进入页面默认查询数据
        tableExtraProps={{ scroll: { x: 1800 } }}
      />
    );
  };

  render() {
    const {
      dispatch,
      loading,
      form,
      formData,
      formMode,
      attributeDeleteKeys,
      priceDeleteKeys,
      previewList,
    } = this.props;
    const { attributeDetails = [], priceDetails = [] } = formData;

    const disabledBtn = loading.effects[`${DOMAIN}/init`] || loading.effects[`${DOMAIN}/save`];

    return (
      <PageWrapper>
        <ButtonCard>
          {formMode === 'EDIT' && (
            <Button
              icon="save"
              size="large"
              type="primary"
              onClick={() => {
                this.handleSave({}, output => {
                  message({ type: 'success' });
                  this.callModelEffects('updateForm', { id: output.data.id });
                  this.callModelEffects('updateState', {
                    formMode: 'DESCRIPTION',
                  });
                  this.callModelEffects('init', { id: output.data.id });
                });
              }}
              loading={disabledBtn} // change_5
            >
              保存
            </Button>
          )}
          {formMode === 'DESCRIPTION' && (
            <Button
              key="edit"
              size="large"
              type="primary"
              onClick={this.switchEdit}
              loading={disabledBtn}
            >
              编辑
            </Button>
          )}
        </ButtonCard>
        <div className={styles.topWrappper}>
          {this.renderPage()}
          {previewList.length > 0 && (
            <div className={styles.picWrapper}>
              <Carousel dots={styles.dots} autoplay>
                {previewList.map((item, index) => (
                  <div key={`pic_${item}`} style={{ height: '100%', width: '100%' }}>
                    <img width="100%" style={{ maxHeight: '380px' }} src={item} alt="" />
                  </div>
                ))}
              </Carousel>
            </div>
          )}
        </div>

        {formMode === 'EDIT' && (
          <EditTable
            title="资源属性"
            form={form}
            columns={this.renderEditColumns()}
            dataSource={attributeDetails}
            onAddClick={() => {
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  attributeDetails: update(attributeDetails, {
                    $push: [
                      {
                        id: genFakeId(-1),
                      },
                    ],
                  }),
                },
              });
            }}
            onDeleteConfirm={keys => {
              const newDataSource = attributeDetails.filter(row => keys.indexOf(row.id) < 0);
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  attributeDetails: newDataSource,
                },
              });
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  attributeDeleteKeys: [...attributeDeleteKeys, ...keys],
                },
              });
            }}
          />
        )}
        {formMode === 'DESCRIPTION' && (
          <DataTable
            title="资源属性"
            columns={this.renderColumns()}
            dataSource={attributeDetails}
            prodSelection={false}
          />
        )}
        {formMode === 'EDIT' && (
          <EditTable
            title="资源价格"
            form={form}
            columns={this.renderEditColumns1()}
            dataSource={priceDetails}
            onAddClick={() => {
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  priceDetails: update(priceDetails, {
                    $push: [
                      {
                        id: genFakeId(-1),
                      },
                    ],
                  }),
                },
              });
            }}
            onDeleteConfirm={keys => {
              const newDataSource = priceDetails.filter(row => keys.indexOf(row.id) < 0);
              dispatch({
                type: `${DOMAIN}/updateForm`,
                payload: {
                  priceDetails: newDataSource,
                },
              });
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  priceDeleteKeys: [...priceDeleteKeys, ...keys],
                },
              });
            }}
            scroll={{ x: 1800 }}
          />
        )}
        {formMode === 'DESCRIPTION' && (
          <DataTable
            title="资源价格"
            columns={this.renderColumns1()}
            dataSource={priceDetails}
            prodSelection={false}
            scroll={{ x: 1800 }}
          />
        )}
        {/*
        {formMode === 'DESCRIPTION' &&
         this.renderPriceHistory()
        } */}
      </PageWrapper>
    );
  }
}

export default MediaResourceDisplay;
