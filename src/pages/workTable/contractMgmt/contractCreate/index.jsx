import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import { Form, Table, Row, Col } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';
import EditTable from '@/components/production/business/EditTable';
import { createConfirm } from '@/components/core/Confirm';
import { ProductFormItemBlockConfig } from '@/utils/pageConfigUtils';
import { genFakeId } from '@/utils/production/mathUtils.ts';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import update from 'immutability-helper';
import { fromQs } from '@/utils/production/stringUtil';
import createMessage from '@/components/core/AlertMessage';

import styles from './style.less';

const DOMAIN = 'contractFlowCreate';

@connect(({ user: { user }, loading, contractFlowCreate, dispatch }) => ({
  loading,
  ...contractFlowCreate,
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
class index extends Component {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id, mode } = fromQs();
    const formMode =
      mode === 'edit' || mode === 'ADD' || mode === 'EDIT' || !mode ? 'EDIT' : 'DESCRIPTION';
    this.updateModelState({ formMode, id });
    this.callModelEffects('quertAddrList', { limit: 10 });
    this.callModelEffects('queryCompanyList', { innerType: 'INTERNAL' });
    id && this.callModelEffects('queryDetails', { id });
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

  /**
   * 修改model层state
   * 这个方法是仅是封装一个小方法,后续修改model的state时不需要每次都解构dispatch
   * @param params state参数
   */
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  handleSubmit = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      formData,
    } = this.props;
    const { contractClass1, contractClass2, collectionPlanList, paymentPlanList } = formData;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const planList = collectionPlanList.concat(paymentPlanList);
        const { partyA1, partyA2, partyA3, partyB1, partyB2, partyB3, date } = values;
        const partyFirstList = [partyA1, partyA2, partyA3].filter(Boolean);
        const partySecondList = [partyB1, partyB2, partyB3].filter(Boolean);
        if (!contractClass1 || !contractClass2) {
          createMessage({ type: 'warn', description: '请填写合同分类信息！' });
          return;
        }
        dispatch({
          type: `${DOMAIN}/pcontractSubmit`,
          payload: {
            ...formData,
            ...values,
            planList,
            partyFirstList,
            partySecondList,
            contractClass1,
            contractClass2,
            submit: true,
          },
        });
      }
    });
  };

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      formData,
    } = this.props;
    const { contractClass1, contractClass2, collectionPlanList, paymentPlanList } = formData;

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const planList = collectionPlanList.concat(paymentPlanList);
        const { partyA1, partyA2, partyA3, partyB1, partyB2, partyB3, date } = values;
        const partyFirstList = [partyA1, partyA2, partyA3].filter(Boolean);
        const partySecondList = [partyB1, partyB2, partyB3].filter(Boolean);
        if (!contractClass1 || !contractClass2) {
          createMessage({ type: 'warn', description: '请填写合同分类信息！' });
          return;
        }
        dispatch({
          type: `${DOMAIN}/contractSave`,
          payload: {
            ...formData,
            ...values,
            planList,
            partyFirstList,
            partySecondList,
            contractClass1,
            contractClass2,
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
      addrList,
      companyList,
      pageConfig,
      form,
      user: {
        extInfo: { userId },
      },
    } = this.props;
    const { setFieldsValue } = form;
    const fields = [
      <BusinessFormTitle title="基本信息" />,

      <FormItem
        fieldType="BaseInput"
        label="合同编号"
        key="contractNo"
        fieldKey="contractNo"
        initialValue={formData.contractNo}
        disabled
      />,
      <FormItem
        fieldType="BaseInput"
        label="合同名称"
        key="contractName"
        fieldKey="contractName"
        required
        initialValue={formData.contractName}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="合同状态"
        required
        disabled
        key="contractStatus"
        fieldKey="contractStatus"
        parentKey="FUNCTION:CONTRACT:STATUS"
        initialValue={formData.contractStatus}
      />,
      <FormItem fieldType="Group" label="合同分类" key="contractClass" form={null} required>
        <FormItem
          fieldKey="contractClass1"
          fieldType="BaseSystemCascaderMultiSelect"
          parentKey="FUNCTION:CONTRACT:CLASS1"
          cascaderValues={[]}
          form={null}
          value={formData.contractClass1}
          onChange={value => {
            // 赋值
            this.callModelEffects('updateForm', {
              contractClass1: value,
              contractClass2: undefined,
            });
          }}
        />
        <FormItem
          fieldKey="contractClass2"
          fieldType="BaseSystemCascaderMultiSelect"
          parentKey="FUNCTION:CONTRACT:CLASS1"
          cascaderValues={[`${formData.contractClass1}`]}
          value={formData.contractClass2 || undefined}
          onChange={value => {
            const { contractRulesList: contractRulesList1 } = this.props;
            // 赋值
            this.callModelEffects('updateForm', {
              contractClass2: value,
            });
            return true;
          }}
        />
      </FormItem>,
      <FormItem
        fieldType="BaseSelect"
        label="签约公司"
        key="contractCompany"
        fieldKey="contractCompany"
        descList={companyList}
        // parentKey="FUNCTION:COMPANY:NAME"
        initialValue={formData.contractCompany}
      />,
      <FormItem
        fieldType="BaseDatePicker"
        label="签订日期"
        key="contractSignDate"
        fieldKey="contractSignDate"
        initialValue={formData.contractSignDate}
      />,
      <FormItem
        fieldType="ProjectSimpleSelect"
        // fieldType="BaseSelect"
        label="相关项目"
        key="projectIds"
        fieldKey="projectIds"
        initialValue={formData.projectIds}
      />,

      <FormItem
        fieldType="ContractSimpleSelect"
        queryParam={{ filterId: formData.id }}
        // fieldType="BaseSelect"
        label="关联合同/框架协议"
        key="relatedContract"
        fieldKey="relatedContract"
        initialValue={formData.relatedContract}
      />,
      <FormItem
        fieldType="BaseInput"
        label="参考合同号"
        key="contractEntityNo"
        fieldKey="contractEntityNo"
        initialValue={formData.contractEntityNo}
      />,
      <FormItem
        fieldType="ResSimpleSelect"
        label="合同负责人"
        key="dutyResId"
        fieldKey="dutyResId"
        initialValue={formData.dutyResId}
      />,
      <FormItem
        fieldType="BaseDateRangePicker"
        label="生效日期"
        key="effectiveStartDate"
        fieldKey="effectiveStartDate"
        initialValue={formData.effectiveStartDate}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="币种"
        key="contractAmountClass"
        fieldKey="contractAmountClass"
        parentKey="COMMON_CURRENCY"
        initialValue={formData.contractAmountClass}
      />,
      <FormItem
        fieldType="BaseInputAmt"
        label="金额"
        key="contractAmount"
        fieldKey="contractAmount"
        initialValue={formData.contractAmount}
        required
        precision={2}
        maxLength={15}
      />,
      <FormItem
        fieldType="UserSimpleSelect"
        label="创建人"
        key="createUserId"
        fieldKey="createUserId"
        initialValue={userId}
        disabled
      />,
      // <FormItem
      //   fieldType="BaseDatePicker"
      //   label="创建时间"
      //   key="createTime"
      //   fieldKey="createTime"
      //   initialValue={formData.createTime}
      // />,
      <FormItem
        fieldType="BaseFileManagerEnhance"
        label="附件"
        key="attach"
        fieldKey="attach"
        required
        dataKey={formData.id}
        api="/county/adm/contract/sfs/token"
      />,
      <FormItem fieldType="BaseInputTextArea" label="备注" key="remark" fieldKey="remark" />,
    ];
    const fields2 = [
      <BusinessFormTitle title="签约方信息" />,
      <FormItem
        fieldType="BaseSelect"
        label="甲方"
        key="partyA1"
        fieldKey="partyA1"
        descriptionField="partyA1"
        descList={addrList}
        initialValue={formData.partyA1}
        required
      />,
      <FormItem
        fieldType="BaseSelect"
        label="甲方"
        key="partyA2"
        fieldKey="partyA2"
        descriptionField="partyA2"
        descList={addrList}
        initialValue={formData.partA2}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="甲方"
        key="partyA3"
        fieldKey="partyA3"
        descriptionField="partyA3"
        descList={addrList}
        initialValue={formData.partA3}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="乙方"
        key="partyB1"
        fieldKey="partyB1"
        descriptionField="partyB1"
        descList={addrList}
        required
        initialValue={formData.partB1}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="乙方"
        key="partyB2"
        fieldKey="partyB2"
        descriptionField="partyB2"
        descList={addrList}
        initialValue={formData.partyB2}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="乙方"
        key="partyB3"
        fieldKey="partyB3"
        descriptionField="partyB3"
        descList={addrList}
        initialValue={formData.partyB3}
      />,
    ];
    const fields3 = [
      <BusinessFormTitle title="业务信息" />,
      <FormItem
        fieldType="BaseSelect"
        label="业务类别"
        key="businessClass1"
        fieldKey="businessClass1"
        parentKey="FUNCTION:CONTRACT:BUSINESS_CLASS1"
        initialValue={formData.businessClass1}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="业务类型"
        key="businessClass2"
        fieldKey="businessClass2"
        parentKey="FUNCTION:CONTRACT:BUSINESS_CLASS2"
        initialValue={formData.businessClass2}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="城市"
        key="city"
        fieldKey="city"
        parentKey="FUNCTION:REGION:NAME"
        initialValue={formData.city}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="媒体类型"
        key="mediaClass"
        fieldKey="mediaClass"
        parentKey="FUNCTION:CONTRACT:MEDIA_CLASS"
        initialValue={formData.mediaClass}
      />,
    ];
    const fields4 = [
      <BusinessFormTitle title="返点信息" />,
      <FormItem
        fieldType="BaseRadioSelect"
        label="是否从属框架协议返点标准"
        fieldKey="addFlag"
        options={[{ label: '是', value: '1' }, { label: '否', value: '0' }]}
        required
      />,
      <FormItem
        fieldType="BaseRadioSelect"
        label="是否参与年度累计返点计算"
        fieldKey="addFlag"
        options={[{ label: '是', value: '1' }, { label: '否', value: '0' }]}
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="参与返点金额"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="返点周期"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="返点模式"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="返点比率"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="预计返点"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <Row span={24} gutter={20}>
        <Col span={12}>
          <div>年度返点阶梯：</div>
          <EditTable
            form={form}
            formMode={formMode}
            dataSource={[]} // 获取数据的方法,请注意获取数据的格式
            columns={[]}
          />
        </Col>
        <Col span={12}>
          <div>季度返点阶梯：</div>
          <EditTable
            form={form}
            formMode={formMode}
            dataSource={[]} // 获取数据的方法,请注意获取数据的格式
            columns={[]}
          />
        </Col>
      </Row>,
    ];

    return (
      <div>
        <BusinessForm
          formData={formData}
          form={form}
          formMode={formMode}
          defaultColumnStyle={8}
          renderTitleFlag={false}
        >
          {fields}
        </BusinessForm>
        <BusinessForm
          formData={formData}
          form={form}
          formMode={formMode}
          defaultColumnStyle={8}
          renderTitleFlag={false}
        >
          {fields2}
        </BusinessForm>
        <BusinessForm
          formData={formData}
          form={form}
          formMode={formMode}
          defaultColumnStyle={12}
          renderTitleFlag={false}
        >
          {fields3}
        </BusinessForm>
        <BusinessForm
          formData={formData}
          form={form}
          formMode={formMode}
          defaultColumnStyle={12}
          renderTitleFlag={false}
        >
          {fields4}
        </BusinessForm>
      </div>
    );
  };

  render() {
    const { dispatch, loading, form, formData, formMode, delIds } = this.props;
    const { expenseList, collectionPlanList, paymentPlanList } = formData;
    const disabledBtn =
      loading.effects[`${DOMAIN}/contractSave`] || loading.effects[`${DOMAIN}/contractSubmit`];

    const queryDetails = loading.effects[`${DOMAIN}/queryDetails`];

    return (
      <PageWrapper loading={queryDetails}>
        {formMode === 'EDIT' && (
          <ButtonCard>
            <Button
              icon="save"
              size="large"
              type="primary"
              onClick={this.handleSave}
              disabled={disabledBtn}
            >
              保存
            </Button>
            <Button icon="save" size="large" type="primary" onClick={this.handleSubmit} disabled>
              提交
            </Button>
          </ButtonCard>
        )}
        {this.renderPage()}

        {/* <Row>
          <Col span={12}>
            <div>年度返点阶梯：</div>
            <EditTable
              form={form}
              formMode={formMode}
              dataSource={collectionPlanList} // 获取数据的方法,请注意获取数据的格式
              columns={[]}
              onAddClick={
                formMode === 'DESCRIPTION'
                  ? undefined
                  : () => {
                      const currentSerNo =
                        (collectionPlanList.length ? collectionPlanList.length : 0) + 1;
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: {
                          collectionPlanList: update(collectionPlanList, {
                            $push: [
                              {
                                id: currentSerNo,
                                planClass: 'COLLECTION',
                              },
                            ],
                          }),
                        },
                      });
                    }
              }
              onDeleteConfirm={
                formMode === 'DESCRIPTION'
                  ? undefined
                  : keys => {
                      const newDataSource = collectionPlanList.filter(
                        row => keys.indexOf(row.id) < 0
                      );
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: { collectionPlanList: newDataSource },
                      });
                    }
              }
            />
          </Col>
          <Col span={12}>
            <div>季度返点阶梯：</div>
            <EditTable
              form={form}
              formMode={formMode}
              dataSource={collectionPlanList} // 获取数据的方法,请注意获取数据的格式
              columns={[]}
              onAddClick={
                formMode === 'DESCRIPTION'
                  ? undefined
                  : () => {
                      const currentSerNo =
                        (collectionPlanList.length ? collectionPlanList.length : 0) + 1;
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: {
                          collectionPlanList: update(collectionPlanList, {
                            $push: [
                              {
                                id: currentSerNo,
                                planClass: 'COLLECTION',
                              },
                            ],
                          }),
                        },
                      });
                    }
              }
              onDeleteConfirm={
                formMode === 'DESCRIPTION'
                  ? undefined
                  : keys => {
                      const newDataSource = collectionPlanList.filter(
                        row => keys.indexOf(row.id) < 0
                      );
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: { collectionPlanList: newDataSource },
                      });
                    }
              }
            />
          </Col>
        </Row> */}

        <EditTable
          form={form}
          formMode={formMode}
          title="其他费用明细"
          dataSource={expenseList} // 获取数据的方法,请注意获取数据的格式
          columns={[
            {
              title: '费用名称',
              width: 200,
              dataIndex: 'name',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`expenseList[${i}].name`}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '金额',
              width: 150,
              dataIndex: 'amount',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`expenseList[${i}].amount`}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '是否参与返点',
              width: 150,
              dataIndex: 'isRebate',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldKey={`expenseList[${i}].isRebate`}
                  fieldType="BaseRadioSelect"
                  options={[{ label: '是', value: true }, { label: '否', value: false }]}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '备注',
              dataIndex: 'remark',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`expenseList[${i}].remark`}
                  disabled={formMode === 'DESCRIPTION'}
                />
              ),
            },
          ]}
          onAddClick={
            formMode === 'DESCRIPTION'
              ? undefined
              : () => {
                  const currentSerNo = (expenseList.length ? expenseList.length : 0) + 1;
                  dispatch({
                    type: `${DOMAIN}/updateForm`,
                    payload: {
                      expenseList: update(expenseList, {
                        $push: [
                          {
                            id: currentSerNo,
                          },
                        ],
                      }),
                    },
                  });
                }
          }
          onDeleteConfirm={
            formMode === 'DESCRIPTION'
              ? undefined
              : keys => {
                  const newDataSource = expenseList.filter(row => keys.indexOf(row.id) < 0);
                  dispatch({
                    type: `${DOMAIN}/updateForm`,
                    payload: { expenseList: newDataSource },
                  });
                }
          }
        />
        <EditTable
          form={form}
          formMode={formMode}
          title="收款计划"
          dataSource={collectionPlanList} // 获取数据的方法,请注意获取数据的格式
          columns={[
            {
              title: '类型',
              required: true,
              width: 200,
              dataIndex: 'planClass1',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseSelect"
                  fieldKey={`collectionPlanList[${i}].planClass`}
                  parentKey="FUNCTION:CONTRACT:PLAN:CLASS"
                  required
                  disabled
                />
              ),
            },
            {
              title: '收款阶段',
              width: 150,
              required: true,
              dataIndex: 'phase',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`collectionPlanList[${i}].phase`}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '预计收款日期',
              width: 150,
              required: true,
              dataIndex: 'expectDate',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseDatePicker"
                  fieldKey={`collectionPlanList[${i}].expectDate`}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '收款金额',
              width: 150,
              required: true,
              dataIndex: 'amount',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`collectionPlanList[${i}].amount`}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '备注',
              required: true,
              dataIndex: 'remark',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`collectionPlanList[${i}].remark`}
                  disabled={formMode === 'DESCRIPTION'}
                />
              ),
            },
          ]}
          onAddClick={
            formMode === 'DESCRIPTION'
              ? undefined
              : () => {
                  const currentSerNo =
                    (collectionPlanList.length ? collectionPlanList.length : 0) + 1;
                  dispatch({
                    type: `${DOMAIN}/updateForm`,
                    payload: {
                      collectionPlanList: update(collectionPlanList, {
                        $push: [
                          {
                            id: currentSerNo,
                            planClass: 'COLLECTION',
                          },
                        ],
                      }),
                    },
                  });
                }
          }
          onDeleteConfirm={
            formMode === 'DESCRIPTION'
              ? undefined
              : keys => {
                  const newDataSource = collectionPlanList.filter(row => keys.indexOf(row.id) < 0);
                  dispatch({
                    type: `${DOMAIN}/updateForm`,
                    payload: { collectionPlanList: newDataSource },
                  });
                }
          }
        />
        <EditTable
          form={form}
          formMode={formMode}
          title="付款计划"
          dataSource={paymentPlanList} // 获取数据的方法,请注意获取数据的格式
          columns={[
            {
              title: '类型',
              required: true,
              width: 200,
              dataIndex: 'planClass2',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseSelect"
                  parentKey="FUNCTION:CONTRACT:PLAN:CLASS"
                  fieldKey={`paymentPlanList[${i}].planClass`}
                  disabled
                  required
                />
              ),
            },
            {
              title: '付款阶段',
              width: 150,
              required: true,
              dataIndex: 'phase',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`paymentPlanList[${i}].phase`}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '预计付款日期',
              width: 150,
              required: true,
              dataIndex: 'expectDate',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldKey={`paymentPlanList[${i}].expectDate`}
                  fieldType="BaseDatePicker"
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '付款金额',
              width: 150,
              required: true,
              dataIndex: 'amount',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldKey={`paymentPlanList[${i}].amount`}
                  fieldType="BaseInput"
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '备注',
              required: true,
              dataIndex: 'remark',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`paymentPlanList[${i}].remark`}
                  disabled={formMode === 'DESCRIPTION'}
                />
              ),
            },
          ]}
          onAddClick={
            formMode === 'DESCRIPTION'
              ? undefined
              : () => {
                  const currentSerNo = (paymentPlanList.length ? paymentPlanList.length : 0) + 1;
                  dispatch({
                    type: `${DOMAIN}/updateForm`,
                    payload: {
                      paymentPlanList: update(paymentPlanList, {
                        $push: [
                          {
                            id: currentSerNo,
                            planClass: 'PAYMENT',
                          },
                        ],
                      }),
                    },
                  });
                }
          }
          onDeleteConfirm={
            formMode === 'DESCRIPTION'
              ? undefined
              : keys => {
                  const newDataSource = paymentPlanList.filter(row => keys.indexOf(row.id) < 0);
                  dispatch({
                    type: `${DOMAIN}/updateForm`,
                    payload: { paymentPlanList: newDataSource },
                  });
                }
          }
        />
      </PageWrapper>
    );
  }
}

export default index;
