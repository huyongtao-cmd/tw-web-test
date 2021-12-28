import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Input, Radio, Table, InputNumber, Divider, Checkbox, Row, Col } from 'antd';
import { Selection } from '@/pages/gen/field';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import { isEmpty } from 'ramda';
import { fromQs } from '@/utils/stringUtils';
import DescriptionList from '@/components/layout/DescriptionList';

const { Field, FieldLine } = FieldList;
const { Description } = DescriptionList;
const DOMAIN = 'resPlanConfigEdit';

@connect(({ dispatch, resPlanConfigEdit }) => ({
  dispatch,
  resPlanConfigEdit,
}))
class ResProvideDetail extends PureComponent {
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

  // 行编辑触发事件
  onCellChanged = (index, value, name, changeName, dataSourcekey, dataSource) => {
    const { dispatch } = this.props;

    const newDataSource = dataSource;
    newDataSource[index] = {
      ...newDataSource[index],
      [changeName]: {
        ...newDataSource[index][changeName],
        [name]: value,
      },
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { [dataSourcekey]: newDataSource },
    });
  };

  modalNode = (
    name,
    label,
    dispatch,
    statekey,
    state,
    stateDatakey,
    stateData,
    dataSourcekey,
    dataSource
  ) => {
    const columns = [
      {
        dataIndex: 'checked',
        key: 'checked',
        render: (val, row, index) => (
          <Checkbox
            disabled
            checked={row[(row?.changeName)].value01 === 'Y'}
            onChange={e => {
              this.onCellChanged(
                index,
                e.target.checked ? 'Y' : 'N',
                'value01',
                row?.changeName,
                dataSourcekey,
                dataSource
              );
              if (!e.target.checked) {
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: {
                    [statekey]: {
                      ...state,
                      [stateDatakey]: {
                        value01: 'N',
                      },
                    },
                  },
                });
              } else {
                const tt = dataSource.filter(v => v[v.changeName].value01 === 'N');
                if (isEmpty(tt)) {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      [statekey]: {
                        ...state,
                        [stateDatakey]: {
                          value01: 'Y',
                        },
                      },
                    },
                  });
                }
              }
            }}
          />
        ),
      },
      {
        title: label,
        dataIndex: 'name',
        key: 'name',
      },
    ];

    return (
      <Field
        name={name}
        label={label}
        presentational
        labelCol={{ span: 10, xxl: 10 }}
        wrapperCol={{ span: 12, xxl: 12 }}
      >
        <Radio.Group
          className="tableBox"
          value={stateData.value01 === 'Y' ? 1 : 2}
          onChange={e => {
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                [statekey]: {
                  ...state,
                  [stateDatakey]: {
                    value01: e.target.value === 1 ? 'Y' : 'N',
                  },
                },
              },
            });

            if (e.target.value === 1) {
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  [dataSourcekey]: dataSource.map(v => ({
                    ...v,
                    [v.changeName]: { ...v[v.changeName], value01: 'Y' },
                  })),
                },
              });
            }
          }}
        >
          <Radio value={1}>全部</Radio>
          <br />
          <Table
            rowKey="code"
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered
          />
        </Radio.Group>
      </Field>
    );
  };

  render() {
    const {
      dispatch,
      resPlanConfigEdit: {
        formData,
        resourceType01List,
        resourceType01,
        resourceType02,
        resourceType02List,
        resStatus,
        resStatusList,
        recruitmentPlan,
        selectList,
        entrySupplyWeight,
        divisionBuList,
      },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
    } = this.props;
    const { id } = fromQs();

    const { all } = resourceType01;
    const { all: all2 } = resourceType02;
    const { all: all3 } = resStatus;
    const { referenceRecruitmentPlan, recruitmentPlanSupplyWeight } = recruitmentPlan;
    const { week } = entrySupplyWeight;

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

          {/*<DescriptionList size="large" col={2} title='基本信息'>*/}
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
          {/*      source={selectList}*/}
          {/*      columns={[*/}
          {/*        { dataIndex: 'taskNo', title: '任务编号', span: 6 },*/}
          {/*        { dataIndex: 'remark', title: '任务名称', span: 12 },*/}
          {/*        { dataIndex: 'createUserName', title: '执行人', span: 6 },*/}
          {/*      ]}*/}
          {/*      transfer={{ key: 'taskNo', code: 'taskNo', name: 'remark' }}*/}
          {/*      placeholder="请选择任务"*/}
          {/*      showSearch*/}
          {/*      disabled*/}
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

          <FieldList getFieldDecorator={getFieldDecorator} col={3} legend="资源供给整合参数">
            {this.modalNode(
              'resourceType01',
              '资源类型一',
              dispatch,
              'resourceType01',
              resourceType01,
              'all',
              all,
              'resourceType01List',
              resourceType01List
            )}
            {this.modalNode(
              'resourceType02',
              '资源类型二',
              dispatch,
              'resourceType02',
              resourceType02,
              'all',
              all2,
              'resourceType02List',
              resourceType02List
            )}
            {this.modalNode(
              'resStatus',
              '资源状态',
              dispatch,
              'resStatus',
              resStatus,
              'all',
              all3,
              'resStatusList',
              resStatusList
            )}
          </FieldList>
          <Divider dashed />

          <FieldList getFieldDecorator={getFieldDecorator} col={3} legend="">
            <Field
              name="entrySupplyWeight"
              label="入职预定供给权重"
              decorator={{
                initialValue: formData.entrySupplyWeight || 0,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
              presentational
            >
              <InputNumber
                disabled
                min={0}
                max={100}
                value={week.value01}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
                onChange={e => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      entrySupplyWeight: {
                        ...entrySupplyWeight,
                        week: {
                          ...week,
                          value01: e,
                        },
                      },
                    },
                  });
                }}
              />
            </Field>
            <Field
              name="recruitmentPlan"
              label="招聘计划"
              presentational
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <Checkbox
                disabled
                checked={referenceRecruitmentPlan.value01 === 'Y'}
                onChange={e => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      recruitmentPlan: {
                        ...recruitmentPlan,
                        referenceRecruitmentPlan: {
                          ...referenceRecruitmentPlan,
                          value01: e.target.checked ? 'Y' : 'N',
                        },
                        recruitmentPlanSupplyWeight: {
                          ...recruitmentPlanSupplyWeight,
                          value01: !e.target.checked ? 0 : recruitmentPlanSupplyWeight.value01,
                        },
                      },
                    },
                  });
                }}
              >
                参考招聘计划
              </Checkbox>
              <br />
              <Row gutter={8}>
                <Col span={18}>招聘计划供给权重</Col>
                <Col span={6}>
                  <InputNumber
                    // disabled={referenceRecruitmentPlan.value01 === 'N'}
                    disabled
                    value={recruitmentPlanSupplyWeight.value01}
                    min={0}
                    max={100}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    onChange={e => {
                      dispatch({
                        type: `${DOMAIN}/updateState`,
                        payload: {
                          recruitmentPlan: {
                            ...recruitmentPlan,
                            recruitmentPlanSupplyWeight: {
                              ...recruitmentPlanSupplyWeight,
                              value01: e,
                            },
                          },
                        },
                      });
                    }}
                  />
                </Col>
              </Row>
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ResProvideDetail;
