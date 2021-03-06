import React from 'react';
import { connect } from 'dva';

import Loading from '@/components/production/basic/Loading';
import BusinessForm from '@/components/production/business/BusinessForm';
import TreeSearch from '@/components/production/business/TreeSearch';
import { Form, Row, Col, Button } from 'antd';
import { isEmpty } from 'ramda';
import {WrappedFormUtils} from "antd/lib/form/Form";
import FormItem from "@/components/production/business/FormItem";
import Link from "@/components/production/basic/Link";
import confirm from '@/components/production/layout/Confirm';
import PageWrapper from "@/components/production/layout/PageWrapper";
import Card from "@/components/production/layout/Card";
import BasicSelect, {BaseSelectProps} from "@/components/production/basic/BaseSelect";
import {outputHandle, OutputProps} from "@/utils/production/outputUtil";

// @ts-ignore
import {tenantSelectPaging} from '@/services/production/common/select';
import BaseSelect from "@/components/production/basic/BaseSelect";
import ButtonCard from "@/components/production/layout/ButtonCard";
import message from "@/components/production/layout/Message";
// @ts-ignore
import {customSelectionClearCache,} from '@/services/production/system';


interface Props {
  form: WrappedFormUtils;
  [propName: string]: any,
}

const DOMAIN = "customSelectionIndex";

@connect(({ loading, dispatch, customSelectionIndex }:any) => ({
  treeLoading:loading.effects[`${DOMAIN}/init`],
  dispatch,
  ...customSelectionIndex,
}))
// @ts-ignore
@Form.create({
  mapPropsToFields(props:any) {
    const { formData } = props;
    const fields:any = {};
    Object.keys(formData).forEach(key => {
      fields[key] = Form.createFormField({ value: formData[key] });
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
class CustomSelectionIndex extends React.PureComponent<Props, any> {

  componentDidMount() {
    this.callModelEffects("init");
  }


  // ??????model???state
  updateModelState = (params: any) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  // ??????model???????????????
  callModelEffects = (method:string, params?:any) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  onSelect = (selectedKeys: string[])=>{
    this.callModelEffects('handleSelectChange',{id:selectedKeys[0]});
  };

  onCheck = ()=>{

  };

  fetchTenantData = async ():Promise<Array<BaseSelectProps>> => {
    const output: OutputProps = await outputHandle(tenantSelectPaging, {limit:0});
    return output.data.rows.map((item: any) => ({id:item.id,value: item.id, title: `${item.tenantName}(${item.tenantCode})`}));
  };

  /**
   * ??????????????????
   * @returns {Promise<any>}
   */
  clearCache = async () => {
    const { data } = await outputHandle(customSelectionClearCache);
    message({ type: 'success' });
  };

  render() {
    const { form, treeLoading,formData,formMode,selectionList, currentTenantId, } = this.props;

    let extra:Array<object> = [];
    if (formMode === "EDIT") {
      extra = extra.concat([
        <Link
          key="SAVE"
          onClick={()=>{
            form.validateFieldsAndScroll((error, values) => {
              if (!error) {
                this.callModelEffects("updateForm",values);
                this.callModelEffects("save",{})
              }
            });
          }}
        >
          ??????
        </Link>,
      ]);
    } else {
      extra = extra.concat([
        <Link
          key="EDIT"
          disabled={!formData.id}
          onClick={()=>{
            this.updateModelState({formMode:"EDIT"})
          }}
        >
          ??????
        </Link>,
        ' | ',
        <Link
          key="DELETE"
          disabled={!formData.id}
          onClick={()=>{
            confirm({
              onOk: ()=> {
                this.callModelEffects("delete",{keys:[formData.id].join(",")})
              }
            });
          }}
        >
          ??????
        </Link>,
        ' | ',
        <Link
          key="NEW"
          onClick={() => {
            this.updateModelState({formMode:"EDIT",formData:{}})
          }}
        >
          ??????
        </Link>,
      ]);
    }

    return (
      <PageWrapper>
        <ButtonCard>
          <Button onClick={this.clearCache}>????????????</Button>
        </ButtonCard>
        <Card>
          <Row gutter={5}>
            <Col span={2} style={{textAlign:"right",lineHeight:"32px"}}>??????:</Col>
            <Col span={10}>
              <BaseSelect
                value={currentTenantId}
                onChange={value => {
                  this.updateModelState({currentTenantId:value});
                  this.callModelEffects("init",{currentTenantId:value});
                }}
                allowClear={false}
                fetchData={this.fetchTenantData}
                descList={[{value:"0",title:"????????????"}]}
              />
            </Col>
            <Col span={12} />
          </Row>
        </Card>

        <Row>
          <Col span={6}>
            {!treeLoading ? (
              <TreeSearch
                checkable={false}
                showSearch
                options={selectionList}
                parentId={null}
                onSelect={this.onSelect}
                onCheck={this.onCheck}
              />
            ) : (
              <Loading />
            )}
          </Col>
          <Col span={18}>
            <BusinessForm
              form={form}
              title='?????????'
              formData={formData}
              formMode={formMode}
              extra={extra}
              // defaultColumnStyle={24}
            >
              <FormItem
                fieldType="BaseInput"
                label="??????"
                fieldKey="selectionName"
                required
                form={form}
              />

              <FormItem
                fieldType="BaseInput"
                label="KEY"
                fieldKey="selectionKey"
                required
                form={form}
              />


              <FormItem
                fieldType="BaseInput"
                label="????????????"
                fieldKey="selectionValue"
                required
                form={form}
              />

              <FormItem
                fieldType="BaseInput"
                label="???????????????"
                question="??????????????????,??????????????????????????????????????????"
                fieldKey="selectionNameLocale"
                form={form}
              />

              <FormItem
                fieldType="BaseTreeSelect"
                label="??????"
                fieldKey="parentId"
                required
                form={form}
                showSearch
                options={selectionList}
                parentId={1}
                // parentKey="ROOT"
                multiple={false}
              />

              <FormItem
                fieldType="BaseInputNumber"
                label="??????"
                fieldKey="sortNo"
                form={form}
              />

              <FormItem
                fieldType="TenantSimpleSelect"
                // fieldType="BaseInputHidden"
                // visible={false}
                label="??????"
                fieldKey="tenantId"
                required
                descriptionField='tenantName'
                descList={[{value:formData.tenantId,title:formData.tenantName}]}
              />

              {/* <FormItem
                // fieldType="BaseSwitch"
                fieldType="BaseInputHidden"
                // visible={false}
                label="??????????????????"
                fieldKey="tenantEditableFlag"
                initialValue={false}
              /> */}

              <FormItem
                fieldType="BaseInputTextArea"
                // initialValue={this.state.formData.remark}
                label="??????"
                fieldKey="remark"
                form={form}
              />
               
               <FormItem
                fieldType="BaseInput"
                label="????????????1"
                fieldKey="extVarchar1"
                form={form}
              />

               <FormItem
                fieldType="BaseInput"
                label="????????????2"
                fieldKey="extVarchar2"
                form={form}
              />

              <FormItem
                fieldType="BaseInput"
                label="????????????3"
                fieldKey="extVarchar3"
                form={form}
              />

               <FormItem
                fieldType="BaseInput"
                label="????????????4"
                fieldKey="extVarchar4"
                form={form}
              />

               <FormItem
                fieldType="BaseInput"
                label="????????????5"
                fieldKey="extVarchar5"
                form={form}
              />

               <FormItem
                fieldType="BaseInput"
                label="????????????6"
                fieldKey="extVarchar6"
                form={form}
              />

              <FormItem
                fieldType="BaseInput"
                label="????????????7"
                fieldKey="extVarchar7"
                form={form}
              />

               <FormItem
                fieldType="BaseInput"
                label="????????????8"
                fieldKey="extVarchar8"
                form={form}
              />
              
              <FormItem
                fieldType="BaseInput"
                label="????????????9"
                fieldKey="extVarchar9"
                form={form}
              />
            </BusinessForm>
          </Col>
        </Row>
      </PageWrapper>
    );
  }
}

export default CustomSelectionIndex;
