import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Input, Radio, InputNumber, Checkbox } from 'antd';
import { Selection } from '@/pages/gen/field';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import CheckboxOrRadioGroup from './components/CheckboxOrRadioGroup';
import DescriptionList from '@/components/layout/DescriptionList';

const { Field, FieldLine } = FieldList;
const { Description } = DescriptionList;
const DOMAIN = 'resPlanConfigEdit';

@connect(({ dispatch, resPlanConfigEdit }) => ({
  dispatch,
  resPlanConfigEdit,
}))
class ResPlanDetail extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/divisionBuList`,
    });
  }

  render() {
    const {
      dispatch,
      resPlanConfigEdit: { formData, competenceLevelCompatibility, selectList, divisionBuList },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
    } = this.props;

    const { mustMatch, canCompatible } = competenceLevelCompatibility;

    const mainFields = [
      <Description
        term="文件编码"
        key="configNo"
        // sortno={pageFieldJson.contractNo.sortNo}
      >
        {formData.configNo}
      </Description>,
      <Description
        term="文件名称"
        key="configName"
        // sortno={pageFieldJson.contractNo.sortNo}
      >
        {formData.configName}
      </Description>,
      <Description
        term="参照历史需求/供给结果"
        key="referringHistoricalResuitesNo"
        // sortno={pageFieldJson.contractNo.sortNo}
      >
        {formData.referringHistoricalResuitesName}
      </Description>,
    ];

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="基本信息">
            <Field
              name="configNo"
              label="文件编码"
              decorator={{
                initialValue: formData.configNo || '',
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <Input placeholder="系统自动生成" disabled />
            </Field>
            <Field
              name="configName"
              label="文件名称"
              decorator={{
                initialValue: formData.configName || '',
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <Input placeholder="" disabled />
            </Field>

            <FieldLine
              label="部门"
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 14, xxl: 14 }}
            >
              <Field
                name="bu"
                key="bu"
                decorator={{
                  initialValue: formData.bu === [] ? [] : formData.bu, // 不设置[]输入框会出现默认空白标签
                }}
                wrapperCol={{ span: 24, xxl: 24 }}
              >
                <Selection.Columns
                  className="x-fill-100"
                  source={divisionBuList}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  showSearch
                  placeholder={formData.allBu === true && '部门全选'}
                  mode="multiple"
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ width: 300 }}
                  labelInValue
                  disabled
                />
              </Field>
              <Field
                name="allBu"
                label="全部"
                labelCol={{ span: 8, xxl: 8 }}
                wrapperCol={{ span: 12, xxl: 12 }}
              >
                <Checkbox checked={formData.allBu} disabled />
              </Field>
            </FieldLine>
            <Field
              name="notOpen"
              label="不公开"
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <Checkbox checked={formData.notOpen} disabled />
            </Field>
          </FieldList>
          {/*<DescriptionList size="large" col={2} title='基本信息' >*/}
          {/*  {mainFields}*/}
          {/*</DescriptionList>*/}
        </Card>
        <Card className="tw-card-adjust" bordered={false}>
          {/*<FieldList getFieldDecorator={getFieldDecorator} col={2} legend="基本信息">*/}
          {/*  <Field*/}
          {/*    name="configNo"*/}
          {/*    label="文件编码"*/}
          {/*    decorator={{*/}
          {/*      initialValue: formData.configNo || '',*/}
          {/*    }}*/}
          {/*    labelCol={{ span: 10, xxl: 10 }}*/}
          {/*    wrapperCol={{ span: 12, xxl: 12 }}*/}
          {/*  >*/}
          {/*    <Input placeholder="系统自动生成" disabled />*/}
          {/*  </Field>*/}
          {/*  <Field*/}
          {/*    name="configName"*/}
          {/*    label="文件名称"*/}
          {/*    decorator={{*/}
          {/*      initialValue: formData.configName || '',*/}
          {/*    }}*/}
          {/*    labelCol={{ span: 10, xxl: 10 }}*/}
          {/*    wrapperCol={{ span: 12, xxl: 12 }}*/}
          {/*  >*/}
          {/*    <Input placeholder="系统自动生成" disabled/>*/}
          {/*  </Field>*/}
          {/*  <Field*/}
          {/*    name="referringHistoricalResuitesNo"*/}
          {/*    label="参照历史需求/供给结果"*/}
          {/*    decorator={{*/}
          {/*      initialValue: formData.referringHistoricalResuitesNo || '',*/}
          {/*    }}*/}
          {/*    labelCol={{ span: 10, xxl: 10 }}*/}
          {/*    wrapperCol={{ span: 12, xxl: 12 }}*/}
          {/*  >*/}
          {/*    <Selection.Columns*/}
          {/*      disabled*/}
          {/*      source={selectList}*/}
          {/*      columns={[*/}
          {/*        { dataIndex: 'taskNo', title: '任务编号', span: 6 },*/}
          {/*        { dataIndex: 'remark', title: '任务名称', span: 12 },*/}
          {/*        { dataIndex: 'createUserName', title: '执行人', span: 6 },*/}
          {/*      ]}*/}
          {/*      transfer={{ key: 'taskNo', code: 'taskNo', name: 'remark' }}*/}
          {/*      placeholder="请选择任务"*/}
          {/*      showSearch*/}
          {/*      dropdownMatchSelectWidth={false}*/}
          {/*      dropdownStyle={{ width: 400 }}*/}
          {/*      onColumnsChange={val => {*/}
          {/*        const { taskNo, remark } = val;*/}
          {/*        dispatch({*/}
          {/*          type: `${DOMAIN}/updateForm`,*/}
          {/*          payload: {*/}
          {/*            referringHistoricalResuitesNo: taskNo,*/}
          {/*            referringHistoricalResuitesName: remark,*/}
          {/*          },*/}
          {/*        });*/}
          {/*      }}*/}
          {/*    />*/}
          {/*  </Field>*/}
          {/*</FieldList>*/}

          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="资源计划整合参数">
            <Field
              name="computingCategory"
              label="计算类别"
              decorator={{
                initialValue: formData.computingCategory || null,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <CheckboxOrRadioGroup
                moduleType="checkbox"
                udcCode="RPP:COMPUTING_CATEGORY"
                disabled
              />
            </Field>
            <Field
              name="designatedResource"
              label="指定资源"
              decorator={{
                initialValue: formData.designatedResource || null,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <CheckboxOrRadioGroup moduleType="radio" udcCode="RPP:DESIGNATED_RESOURCE" disabled />
            </Field>
          </FieldList>

          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="">
            <Field
              name="competenceLevelCompatibility"
              label="能力级别兼容"
              presentational
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <Radio.Group
                disabled
                className="tableBox"
                value={mustMatch.value01 === 'Y' ? 1 : 2}
                onChange={e => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      competenceLevelCompatibility: {
                        ...competenceLevelCompatibility,
                        mustMatch: {
                          ...mustMatch,
                          value01: e.target.value === 1 ? 'Y' : 'N',
                        },
                        canCompatible: {
                          ...canCompatible,
                          value01: e.target.value === 1 ? 0 : canCompatible.value01,
                          value02: e.target.value === 1 ? 0 : canCompatible.value02,
                        },
                      },
                    },
                  });
                }}
              >
                <Radio value={1}>必须匹配</Radio>
                <br />
                <Radio value={2}>可以兼容</Radio>
              </Radio.Group>
              <br />
              <div>
                <div style={{ display: 'inline-block' }}>需求向上兼容&nbsp;</div>
                <div style={{ display: 'inline-block' }}>
                  <InputNumber
                    // disabled={mustMatch.value01 === 'Y'}
                    disabled
                    value={canCompatible.value01}
                    onChange={e => {
                      dispatch({
                        type: `${DOMAIN}/updateState`,
                        payload: {
                          competenceLevelCompatibility: {
                            ...competenceLevelCompatibility,
                            canCompatible: {
                              ...canCompatible,
                              value01: e,
                            },
                          },
                        },
                      });
                    }}
                  />
                </div>
                <div style={{ display: 'inline-block' }}>&nbsp;级</div>
              </div>
              <div>
                <div style={{ display: 'inline-block' }}>需求向下兼容&nbsp;</div>
                <div style={{ display: 'inline-block' }}>
                  <InputNumber
                    // disabled={mustMatch.value01 === 'Y'}
                    disabled
                    value={canCompatible.value02}
                    onChange={e => {
                      dispatch({
                        type: `${DOMAIN}/updateState`,
                        payload: {
                          competenceLevelCompatibility: {
                            ...competenceLevelCompatibility,
                            canCompatible: {
                              ...canCompatible,
                              value02: e,
                            },
                          },
                        },
                      });
                    }}
                  />
                </div>
                <div style={{ display: 'inline-block' }}>&nbsp;级</div>
              </div>
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ResPlanDetail;
