import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Input, Radio, InputNumber, Checkbox } from 'antd';
import { Selection } from '@/pages/gen/field';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import CheckboxOrRadioGroup from './components/CheckboxOrRadioGroup';

const { Field, FieldLine } = FieldList;
const DOMAIN = 'resPlanConfigEdit';

/***
 * 资源规划配置维护-资源计划整合参数
 */
@connect(({ dispatch, resPlanConfigEdit }) => ({
  dispatch,
  resPlanConfigEdit,
}))
class ResPlan extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      checkbox: false,
    };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/divisionBuList`,
    });
  }

  // 部门Checkbox勾选回调，勾选全部的时候清空选择框
  buOnchange = e => {
    const { dispatch } = this.props;
    if (e.target.checked) {
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: {
          bu: [],
        },
      });
    }
    const { checkbox } = this.state;
    this.setState({
      checkbox: e.target.checked,
    });
  };

  render() {
    const {
      dispatch,
      resPlanConfigEdit: { formData, competenceLevelCompatibility, selectList, divisionBuList },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
    } = this.props;
    const { checkbox } = this.state;
    const { mustMatch, canCompatible } = competenceLevelCompatibility;

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
              <Input placeholder="系统自动生成" />
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
                  // columns={particularColumns}
                  transfer={{ key: 'id', code: 'id', name: 'name' }}
                  showSearch
                  placeholder={
                    formData.allBu === true || checkbox === true ? '部门全选' : '请选择部门'
                  }
                  mode="multiple"
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ width: 300 }}
                  labelInValue
                  disabled={formData.allBu === true || checkbox === true}
                />
              </Field>
              <Field
                name="allBu"
                label="全部"
                labelCol={{ span: 8, xxl: 8 }}
                wrapperCol={{ span: 12, xxl: 12 }}
              >
                <Checkbox
                  checked={formData.allBu}
                  onChange={async e => {
                    await this.buOnchange(e);
                  }}
                />
              </Field>
            </FieldLine>
            <Field
              name="notOpen"
              label="不公开"
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <Checkbox checked={formData.notOpen} />
            </Field>
            {/*<Field*/}
            {/*  name="referringHistoricalResuitesNo"*/}
            {/*  label="参照历史需求/供给结果"*/}
            {/*  decorator={{*/}
            {/*    initialValue: formData.referringHistoricalResuitesNo || '',*/}
            {/*  }}*/}
            {/*  labelCol={{ span: 10, xxl: 10 }}*/}
            {/*  wrapperCol={{ span: 12, xxl: 12 }}*/}
            {/*>*/}
            {/*  <Selection.Columns*/}
            {/*    source={selectList}*/}
            {/*    columns={[*/}
            {/*      { dataIndex: 'taskNo', title: '任务编号', span: 6 },*/}
            {/*      { dataIndex: 'remark', title: '任务名称', span: 12 },*/}
            {/*      { dataIndex: 'createUserName', title: '执行人', span: 6 },*/}
            {/*    ]}*/}
            {/*    transfer={{ key: 'taskNo', code: 'taskNo', name: 'remark' }}*/}
            {/*    placeholder="请选择任务"*/}
            {/*    showSearch*/}
            {/*    dropdownMatchSelectWidth={false}*/}
            {/*    dropdownStyle={{ width: 400 }}*/}
            {/*    onColumnsChange={val => {*/}
            {/*      if (!val) {*/}
            {/*        return;*/}
            {/*      }*/}
            {/*      const { taskNo, remark } = val;*/}
            {/*      dispatch({*/}
            {/*        type: `${DOMAIN}/updateForm`,*/}
            {/*        payload: {*/}
            {/*          referringHistoricalResuitesNo: taskNo,*/}
            {/*          referringHistoricalResuitesName: remark,*/}
            {/*        },*/}
            {/*      });*/}
            {/*    }}*/}
            {/*  />*/}
            {/*</Field>*/}
          </FieldList>

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
              <CheckboxOrRadioGroup moduleType="checkbox" udcCode="RPP:COMPUTING_CATEGORY" />
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
              <CheckboxOrRadioGroup moduleType="radio" udcCode="RPP:DESIGNATED_RESOURCE" />
            </Field>
          </FieldList>

          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="">
            <Field
              name="competenceLevelCompatibility"
              label="能理级别兼容"
              presentational
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <Radio.Group
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
                    disabled={mustMatch.value01 === 'Y'}
                    value={canCompatible.value01}
                    min={0}
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
                    disabled={mustMatch.value01 === 'Y'}
                    value={canCompatible.value02}
                    min={0}
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

export default ResPlan;
