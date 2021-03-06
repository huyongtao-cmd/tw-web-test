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
    // ?????????????????????model???state,?????????????????????????????????
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
   * ??????model???state
   * ??????????????????????????????????????????,????????????model???state???????????????????????????dispatch
   * @param params state??????
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
          createMessage({ type: 'warn', description: '??????????????????????????????' });
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
          createMessage({ type: 'warn', description: '??????????????????????????????' });
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

  // ????????????????????????
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
      <BusinessFormTitle title="????????????" />,

      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="contractNo"
        fieldKey="contractNo"
        initialValue={formData.contractNo}
        disabled
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="contractName"
        fieldKey="contractName"
        required
        initialValue={formData.contractName}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="????????????"
        required
        disabled
        key="contractStatus"
        fieldKey="contractStatus"
        parentKey="FUNCTION:CONTRACT:STATUS"
        initialValue={formData.contractStatus}
      />,
      <FormItem fieldType="Group" label="????????????" key="contractClass" form={null} required>
        <FormItem
          fieldKey="contractClass1"
          fieldType="BaseSystemCascaderMultiSelect"
          parentKey="FUNCTION:CONTRACT:CLASS1"
          cascaderValues={[]}
          form={null}
          value={formData.contractClass1}
          onChange={value => {
            // ??????
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
            // ??????
            this.callModelEffects('updateForm', {
              contractClass2: value,
            });
            return true;
          }}
        />
      </FormItem>,
      <FormItem
        fieldType="BaseSelect"
        label="????????????"
        key="contractCompany"
        fieldKey="contractCompany"
        descList={companyList}
        // parentKey="FUNCTION:COMPANY:NAME"
        initialValue={formData.contractCompany}
      />,
      <FormItem
        fieldType="BaseDatePicker"
        label="????????????"
        key="contractSignDate"
        fieldKey="contractSignDate"
        initialValue={formData.contractSignDate}
      />,
      <FormItem
        fieldType="ProjectSimpleSelect"
        // fieldType="BaseSelect"
        label="????????????"
        key="projectIds"
        fieldKey="projectIds"
        initialValue={formData.projectIds}
      />,

      <FormItem
        fieldType="ContractSimpleSelect"
        queryParam={{ filterId: formData.id }}
        // fieldType="BaseSelect"
        label="????????????/????????????"
        key="relatedContract"
        fieldKey="relatedContract"
        initialValue={formData.relatedContract}
      />,
      <FormItem
        fieldType="BaseInput"
        label="???????????????"
        key="contractEntityNo"
        fieldKey="contractEntityNo"
        initialValue={formData.contractEntityNo}
      />,
      <FormItem
        fieldType="ResSimpleSelect"
        label="???????????????"
        key="dutyResId"
        fieldKey="dutyResId"
        initialValue={formData.dutyResId}
      />,
      <FormItem
        fieldType="BaseDateRangePicker"
        label="????????????"
        key="effectiveStartDate"
        fieldKey="effectiveStartDate"
        initialValue={formData.effectiveStartDate}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="contractAmountClass"
        fieldKey="contractAmountClass"
        parentKey="COMMON_CURRENCY"
        initialValue={formData.contractAmountClass}
      />,
      <FormItem
        fieldType="BaseInputAmt"
        label="??????"
        key="contractAmount"
        fieldKey="contractAmount"
        initialValue={formData.contractAmount}
        required
        precision={2}
        maxLength={15}
      />,
      <FormItem
        fieldType="UserSimpleSelect"
        label="?????????"
        key="createUserId"
        fieldKey="createUserId"
        initialValue={userId}
        disabled
      />,
      // <FormItem
      //   fieldType="BaseDatePicker"
      //   label="????????????"
      //   key="createTime"
      //   fieldKey="createTime"
      //   initialValue={formData.createTime}
      // />,
      <FormItem
        fieldType="BaseFileManagerEnhance"
        label="??????"
        key="attach"
        fieldKey="attach"
        required
        dataKey={formData.id}
        api="/county/adm/contract/sfs/token"
      />,
      <FormItem fieldType="BaseInputTextArea" label="??????" key="remark" fieldKey="remark" />,
    ];
    const fields2 = [
      <BusinessFormTitle title="???????????????" />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="partyA1"
        fieldKey="partyA1"
        descriptionField="partyA1"
        descList={addrList}
        initialValue={formData.partyA1}
        required
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="partyA2"
        fieldKey="partyA2"
        descriptionField="partyA2"
        descList={addrList}
        initialValue={formData.partA2}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="partyA3"
        fieldKey="partyA3"
        descriptionField="partyA3"
        descList={addrList}
        initialValue={formData.partA3}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="partyB1"
        fieldKey="partyB1"
        descriptionField="partyB1"
        descList={addrList}
        required
        initialValue={formData.partB1}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="partyB2"
        fieldKey="partyB2"
        descriptionField="partyB2"
        descList={addrList}
        initialValue={formData.partyB2}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="partyB3"
        fieldKey="partyB3"
        descriptionField="partyB3"
        descList={addrList}
        initialValue={formData.partyB3}
      />,
    ];
    const fields3 = [
      <BusinessFormTitle title="????????????" />,
      <FormItem
        fieldType="BaseSelect"
        label="????????????"
        key="businessClass1"
        fieldKey="businessClass1"
        parentKey="FUNCTION:CONTRACT:BUSINESS_CLASS1"
        initialValue={formData.businessClass1}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="????????????"
        key="businessClass2"
        fieldKey="businessClass2"
        parentKey="FUNCTION:CONTRACT:BUSINESS_CLASS2"
        initialValue={formData.businessClass2}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="city"
        fieldKey="city"
        parentKey="FUNCTION:REGION:NAME"
        initialValue={formData.city}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="????????????"
        key="mediaClass"
        fieldKey="mediaClass"
        parentKey="FUNCTION:CONTRACT:MEDIA_CLASS"
        initialValue={formData.mediaClass}
      />,
    ];
    const fields4 = [
      <BusinessFormTitle title="????????????" />,
      <FormItem
        fieldType="BaseRadioSelect"
        label="????????????????????????????????????"
        fieldKey="addFlag"
        options={[{ label: '???', value: '1' }, { label: '???', value: '0' }]}
        required
      />,
      <FormItem
        fieldType="BaseRadioSelect"
        label="????????????????????????????????????"
        fieldKey="addFlag"
        options={[{ label: '???', value: '1' }, { label: '???', value: '0' }]}
        required
      />,
      <FormItem
        fieldType="BaseInput"
        label="??????????????????"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="partyA"
        fieldKey="partyA"
        initialValue={formData.partyA}
      />,
      <Row span={24} gutter={20}>
        <Col span={12}>
          <div>?????????????????????</div>
          <EditTable
            form={form}
            formMode={formMode}
            dataSource={[]} // ?????????????????????,??????????????????????????????
            columns={[]}
          />
        </Col>
        <Col span={12}>
          <div>?????????????????????</div>
          <EditTable
            form={form}
            formMode={formMode}
            dataSource={[]} // ?????????????????????,??????????????????????????????
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
              ??????
            </Button>
            <Button icon="save" size="large" type="primary" onClick={this.handleSubmit} disabled>
              ??????
            </Button>
          </ButtonCard>
        )}
        {this.renderPage()}

        {/* <Row>
          <Col span={12}>
            <div>?????????????????????</div>
            <EditTable
              form={form}
              formMode={formMode}
              dataSource={collectionPlanList} // ?????????????????????,??????????????????????????????
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
            <div>?????????????????????</div>
            <EditTable
              form={form}
              formMode={formMode}
              dataSource={collectionPlanList} // ?????????????????????,??????????????????????????????
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
          title="??????????????????"
          dataSource={expenseList} // ?????????????????????,??????????????????????????????
          columns={[
            {
              title: '????????????',
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
              title: '??????',
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
              title: '??????????????????',
              width: 150,
              dataIndex: 'isRebate',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldKey={`expenseList[${i}].isRebate`}
                  fieldType="BaseRadioSelect"
                  options={[{ label: '???', value: true }, { label: '???', value: false }]}
                  disabled={formMode === 'DESCRIPTION'}
                  required
                />
              ),
            },
            {
              title: '??????',
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
          title="????????????"
          dataSource={collectionPlanList} // ?????????????????????,??????????????????????????????
          columns={[
            {
              title: '??????',
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
              title: '????????????',
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
              title: '??????????????????',
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
              title: '????????????',
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
              title: '??????',
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
          title="????????????"
          dataSource={paymentPlanList} // ?????????????????????,??????????????????????????????
          columns={[
            {
              title: '??????',
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
              title: '????????????',
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
              title: '??????????????????',
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
              title: '????????????',
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
              title: '??????',
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
