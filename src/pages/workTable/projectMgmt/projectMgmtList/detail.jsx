import React, { Component } from 'react';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import { Form } from 'antd';
import router from 'umi/router';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import { ProductFormItemBlockConfig } from '@/utils/pageConfigUtils';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import { fromQs } from '@/utils/production/stringUtil';
import { remindString } from '@/components/production/basic/Remind';
import { createConfirm } from '@/components/core/Confirm';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import createMessage from '@/components/core/AlertMessage';

const DOMAIN = 'projectMgmtListDetail';

@connect(({ loading, projectMgmtListDetail, dispatch }) => ({
  loading,
  ...projectMgmtListDetail,
  dispatch,
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
class index extends Component {
  state = {};

  componentDidMount() {
    const { dispatch } = this.props;

    const { id } = fromQs();
    this.setState({
      id,
    });
    if (id) {
      dispatch({
        type: `${DOMAIN}/queryDetails`,
        payload: { id },
      });
    }

    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'PROJECT_EDIT:DETAILS' },
    });
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

  // ????????????????????????
  renderPage = () => {
    const { formData, formMode, pageConfig, form, projectTemplateList } = this.props;

    const fields = [
      <BusinessFormTitle title="????????????" />,
      <FormItem
        label="????????????"
        key="projectNo"
        fieldKey="projectNo"
        fieldType="BaseInput"
        initialValue={formData.projectNo}
        placeholder="??????????????????"
      />,
      <FormItem
        label="????????????"
        key="projectName"
        fieldKey="projectName"
        fieldType="BaseInput"
        initialValue={formData.projectName}
      />,
      <FormItem
        label="????????????"
        key="relatedProductId"
        fieldKey="relatedProductId"
        fieldType="ProductSimpleSelect"
        initialValue={formData.relatedProductId}
      />,
      <FormItem
        label="????????????"
        key="projectTemplateId"
        fieldKey="projectTemplateId"
        fieldType="BaseSelect"
        value={formData.projectTemplateId}
        descList={projectTemplateList}
        form={null}
        onChange={value => {
          createConfirm({
            content: remindString({
              remindCode: 'PRO:W:PROJECT_SUBTABLE_CLEAR_WARN',
              defaultMessage: '????????????????????????????????????????????????????????????????????????????????????????????????',
            }),
            width: '700px',
            onOk: () => {
              // ??????
              this.callModelEffects('updateForm', {
                projectTemplateId: value,
              });
            },
          });
        }}
      />,
      <FormItem
        label="????????????"
        key="inchargeCompany"
        fieldKey="inchargeCompany"
        fieldType="BaseCustomSelect"
        parentKey="CUS:INTERNAL_COMPANY"
        initialValue={formData.inchargeCompany}
      />,
      <FormItem
        label="??????????????????"
        key="inchargeBuId"
        fieldKey="inchargeBuId"
        fieldType="BuSimpleSelect"
        initialValue={formData.inchargeBuId}
      />,
      <FormItem
        label="???????????????"
        key="pmResId"
        fieldKey="pmResId"
        fieldType="ResSimpleSelect"
        initialValue={formData.pmResId}
      />,
      <FormItem
        label="??????????????????1"
        key="relatedRes1Id"
        fieldKey="relatedRes1Id"
        fieldType="ResSimpleSelect"
        initialValue={formData.relatedRes1Id}
      />,
      <FormItem
        label="??????????????????2"
        key="relatedRes2Id"
        fieldKey="relatedRes2Id"
        fieldType="ResSimpleSelect"
        initialValue={formData.relatedRes2Id}
      />,
      <FormItem
        label="??????????????????3"
        key="relatedRes3Id"
        fieldKey="relatedRes3Id"
        fieldType="ResSimpleSelect"
        initialValue={formData.relatedRes3Id}
      />,
      <FormItem
        label="??????????????????"
        key="projectStartDate"
        fieldKey="projectStartDate"
        fieldType="BaseDatePicker"
        initialValue={formData.projectStartDate}
      />,
      <FormItem
        label="??????????????????"
        key="projectEndDate"
        fieldKey="projectEndDate"
        fieldType="BaseDatePicker"
        initialValue={formData.projectEndDate}
      />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="projectStatus"
        fieldKey="projectStatus"
        parentKey="PRO:PROJECT_STATUS"
        initialValue={formData.projectStatus}
      />,

      <FormItem fieldType="Group" label="????????????" key="projectClass">
        <FormItem
          fieldType="BaseCustomSelect"
          key="projectClass1"
          fieldKey="projectClass1"
          parentKey="CUS:PROJECT_CLASS1"
          initialValue={formData.projectClass1}
        />
        <FormItem
          fieldType="BaseCustomSelect"
          key="projectClass2"
          fieldKey="projectClass2"
          parentKey="CUS:PROJECT_CLASS2"
          initialValue={formData.projectClass2}
        />
      </FormItem>,
      <FormItem
        fieldType="BaseFileManagerEnhance"
        label="??????"
        key="enclosure"
        fieldKey="enclosure"
        dataKey={formData.id}
        initialValue={formData.id}
        api="/api/production/pro/projectManagement/sfs/token"
        listType="text"
        attach
      />,
      <FormItem
        label="?????????"
        key="createUserId"
        fieldKey="createUserId"
        fieldType="UserSimpleSelect"
        initialValue={formData.createUserId}
      />,
      <FormItem
        label="????????????"
        key="createTime"
        fieldKey="createTime"
        fieldType="BaseDatePicker"
        initialValue={formData.createTime}
      />,
      <FormItem
        label="??????"
        key="remark"
        fieldKey="remark"
        fieldType="BaseInputTextArea"
        initialValue={formData.remark}
      />,

      <BusinessFormTitle title="????????????" />,
      // <FormItem
      //   label="???????????????1"
      //   key="configurableField1"
      //   fieldKey="configurableField1"
      //   fieldType="BaseInput"
      //   initialValue={formData.configurableField1}
      // />
    ];

    for (let i = 1; i <= 10; i += 1) {
      fields.push(
        <FormItem
          label={`???????????????${i}`}
          key={`configurableField${i}`}
          fieldKey={`configurableField${i}`}
          fieldType="BaseInput"
          initialValue={formData[`configurableField${i}`]}
        />
      );
    }

    const fieldsConfig = ProductFormItemBlockConfig(
      pageConfig,
      'blockKey',
      'PROJECT_EDIT_FORM',
      fields
    );

    return (
      <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={12}>
        {fieldsConfig}
      </BusinessForm>
    );
  };

  render() {
    const { id } = this.state;

    const allBpm = [{ docId: id, procDefKey: 'PRO_P13', title: '??????????????????' }];

    return (
      <PageWrapper>
        <ButtonCard>
          <Button
            size="large"
            type="primary"
            onClick={() => {
              // createMessage({
              //   type: 'warn',
              //   description: '???????????????......',
              // });
              router.push(`/workTable/projectMgmt/projectMgmtList/projectMember?projectId=${id}`);
            }}
            // disabled={disabledBtn}
          >
            ????????????
          </Button>
          {/* <Button
            size="large"
            type="primary"
            onClick={() => {
              createMessage({
                type: 'warn',
                description: '???????????????......',
              });
            }}
            // disabled={disabledBtn}
          >
            ????????????
          </Button>
          <Button
            size="large"
            type="primary"
            onClick={() => {
              createMessage({
                type: 'warn',
                description: '???????????????......',
              });
            }}
            // disabled={disabledBtn}
          >
            ????????????
          </Button> */}
        </ButtonCard>
        {this.renderPage()}
        <BpmConnection source={allBpm} />
      </PageWrapper>
    );
  }
}

export default index;
