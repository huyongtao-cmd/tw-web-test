import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Input, Radio, Table, InputNumber, Divider, Checkbox } from 'antd';
import { Selection, DatePicker } from '@/pages/gen/field';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import moment from 'moment';
import { fromQs } from '@/utils/stringUtils';
import CheckboxOrRadioGroup from './components/CheckboxOrRadioGroup';
import DescriptionList from '@/components/layout/DescriptionList';

const { Field, FieldLine } = FieldList;

const { Description } = DescriptionList;
const DOMAIN = 'resPlanConfigEdit';

@connect(({ dispatch, resPlanConfigEdit, user }) => ({
  dispatch,
  resPlanConfigEdit,
  user,
}))
class ResDemandDetail extends PureComponent {
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
  onCellChanged = (index, value, name, changeName) => {
    const {
      resPlanConfigEdit: { oppoSalesWeightList },
      dispatch,
    } = this.props;

    const newDataSource = oppoSalesWeightList;
    newDataSource[index] = {
      ...newDataSource[index],
      [changeName]: {
        ...newDataSource[index][changeName],
        [name]: value,
      },
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { oppoSalesWeightList: newDataSource },
    });
  };

  // 行编辑触发事件
  onCellChanged1 = (index, value, name, changeName) => {
    const {
      resPlanConfigEdit: { oppounitySingleList },
      dispatch,
    } = this.props;

    const newDataSource = oppounitySingleList;
    newDataSource[index] = {
      ...newDataSource[index],
      [changeName]: {
        ...newDataSource[index][changeName],
        [name]: value,
      },
    };
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { oppounitySingleList: newDataSource },
    });
  };

  onSupplyRequirementPeriodChange = parmars => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        supplyRequirementPeriod: {
          nextEightWeek: {
            value01: 'N',
            value02: null,
          },
          nextTwelveWeek: {
            value01: 'N',
            value02: null,
          },
          nextTwentySixWeek: {
            value01: 'N',
            value02: null,
          },
          other: {
            value01: 'N',
            value02: null,
          },
          ...parmars,
        },
      },
    });
  };

  render() {
    const {
      dispatch,
      resPlanConfigEdit: {
        formData,
        oppoSalesWeightList,
        opportunitySalesStageWeight,
        businessOpportunitySingleProbabilityWeight,
        oppounitySingleList,
        supplyRequirementStartTime,
        supplyRequirementPeriod,
        selectList,
        orderDateAdvanceWeek,
        divisionBuList,
      },
      form: { getFieldDecorator },
    } = this.props;
    const { id } = fromQs();

    const { ignone } = opportunitySalesStageWeight;
    const { ignone: ignone1 } = businessOpportunitySingleProbabilityWeight;
    const { currentWeek, specifyTime } = supplyRequirementStartTime;
    const { nextEightWeek, nextTwelveWeek, nextTwentySixWeek, other } = supplyRequirementPeriod;
    const { week } = orderDateAdvanceWeek;

    const columns = [
      {
        title: '#',
        dataIndex: 'sort',
        key: 'sort',
      },
      {
        title: '销售阶段',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '比例',
        dataIndex: 'code',
        key: 'code',
        render: (val, row, index) => (
          <InputNumber
            // disabled={ignone.value01 === 'Y'}
            disabled
            value={row[row.changeName]?.value02}
            min={0}
            max={100}
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
            onChange={e => {
              this.onCellChanged(index, e || 0, 'value02', [row.changeName]);
            }}
          />
        ),
      },
    ];

    const columns1 = [
      {
        title: '#',
        dataIndex: 'sort',
        key: 'sort',
      },
      {
        title: '成单概率',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '比例',
        dataIndex: 'code',
        key: 'code',
        render: (val, row, index) => (
          <InputNumber
            // disabled={ignone1.value01 === 'Y'}
            disabled
            value={row[row.changeName]?.value02}
            min={0}
            max={100}
            formatter={value => `${value}%`}
            parser={value => value.replace('%', '')}
            onChange={e => {
              this.onCellChanged1(index, e || 0, 'value02', [row.changeName]);
            }}
          />
        ),
      },
    ];

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
        term="部门"
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
          {/*    <Input placeholder="" disabled/>*/}
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

          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="资源需求整合参数">
            <Field
              name="dataSource"
              label="数据源"
              decorator={{
                initialValue: formData.dataSource || null,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <CheckboxOrRadioGroup moduleType="checkbox" udcCode="RPP:DATA_SOURCE" disabled />
            </Field>
            <Field
              name="projectType"
              label="项目大类"
              decorator={{
                initialValue: formData.projectType || null,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <CheckboxOrRadioGroup moduleType="checkbox" udcCode="RPP:PROJECT_TYPE" disabled />
            </Field>
          </FieldList>
          <Divider dashed />

          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="">
            <Field
              name="opportunitySalesStageWeight"
              label="商机销售阶段权重"
              decorator={{
                initialValue: formData.opportunitySalesStageWeight || 0,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
              presentational
            >
              <Radio.Group
                disabled
                className="tableBox"
                value={ignone.value01 === 'Y' ? 1 : 2}
                onChange={e => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      opportunitySalesStageWeight: {
                        ...opportunitySalesStageWeight,
                        ignone: {
                          value01: e.target.value === 1 ? 'Y' : 'N',
                        },
                      },
                    },
                  });
                  if (e.target.value === 1) {
                    dispatch({
                      type: `${DOMAIN}/updateState`,
                      payload: {
                        oppoSalesWeightList: oppoSalesWeightList.map(v => ({
                          ...v,
                          [v.changeName]: { ...v[v.changeName], value02: 0 },
                        })),
                      },
                    });
                  }
                }}
              >
                <Radio value={1}>忽略</Radio>
                <br />
                <Radio value={2}>
                  <Table
                    rowKey="code"
                    style={{ marginLeft: '20px', marginTop: '-15px' }}
                    dataSource={oppoSalesWeightList}
                    columns={columns}
                    pagination={false}
                    bordered
                  />
                </Radio>
              </Radio.Group>
            </Field>
            <Field
              name="businessOpportunitySingleProbabilityWeight"
              label="商机成单概率权重"
              decorator={{
                initialValue: formData.businessOpportunitySingleProbabilityWeight || 0,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
              presentational
            >
              <Radio.Group
                disabled
                className="tableBox"
                value={ignone1.value01 === 'Y' ? 1 : 2}
                onChange={e => {
                  dispatch({
                    type: `${DOMAIN}/updateState`,
                    payload: {
                      businessOpportunitySingleProbabilityWeight: {
                        ...businessOpportunitySingleProbabilityWeight,
                        ignone: {
                          value01: e.target.value === 1 ? 'Y' : 'N',
                        },
                      },
                    },
                  });
                  if (e.target.value === 1) {
                    dispatch({
                      type: `${DOMAIN}/updateState`,
                      payload: {
                        oppounitySingleList: oppounitySingleList.map(v => ({
                          ...v,
                          [v.changeName]: { ...v[v.changeName], value02: 0 },
                        })),
                      },
                    });
                  }
                }}
              >
                <Radio value={1}>忽略</Radio>
                <br />
                <Radio value={2}>
                  <Table
                    rowKey="code"
                    style={{ marginLeft: '20px', marginTop: '-15px' }}
                    dataSource={oppounitySingleList}
                    columns={columns1}
                    pagination={false}
                    bordered
                  />
                </Radio>
              </Radio.Group>
            </Field>
          </FieldList>
          <Divider dashed />

          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="">
            <Field
              name="supplyRequirementStartTime"
              label="供需时限开始时间"
              decorator={{
                initialValue: formData.supplyRequirementStartTime || 0,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
              presentational
            >
              <Radio.Group
                disabled
                className="tableBox"
                value={currentWeek.value01 === 'Y' ? 1 : 2}
                onChange={e => {
                  if (e.target.value === 1) {
                    dispatch({
                      type: `${DOMAIN}/updateState`,
                      payload: {
                        supplyRequirementStartTime: {
                          currentWeek: {
                            ...currentWeek,
                            value01: 'Y',
                            value02: moment()
                              .startOf('week')
                              .format('YYYY-MM-DD'),
                          },
                          specifyTime: {
                            value01: 'N',
                            value02: null,
                          },
                        },
                      },
                    });
                  } else {
                    dispatch({
                      type: `${DOMAIN}/updateState`,
                      payload: {
                        supplyRequirementStartTime: {
                          currentWeek: {
                            ...currentWeek,
                            value01: 'N',
                            value02: null,
                          },
                          specifyTime: {
                            value01: 'Y',
                            value02: moment().format('YYYY-MM-DD'),
                          },
                        },
                      },
                    });
                  }
                }}
              >
                <Radio value={1}>当前周</Radio>
                <br />
                <Radio value={2}>
                  <DatePicker
                    value={specifyTime.value02}
                    disabled={currentWeek.value01 === 'Y'}
                    onChange={value => {
                      dispatch({
                        type: `${DOMAIN}/updateState`,
                        payload: {
                          supplyRequirementStartTime: {
                            ...supplyRequirementStartTime,
                            specifyTime: {
                              ...specifyTime,
                              value02: value,
                            },
                          },
                        },
                      });
                    }}
                    allowClear={false}
                  />
                </Radio>
              </Radio.Group>
            </Field>
            <Field
              name="orderDateAdvanceWeek"
              label="基于商机成单日期的提前周数"
              decorator={{
                initialValue: formData.orderDateAdvanceWeek || null,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
              presentational
            >
              <div>
                <div style={{ display: 'inline-block' }}>
                  <InputNumber
                    disabled
                    min={0}
                    value={week.value01}
                    onChange={e => {
                      dispatch({
                        type: `${DOMAIN}/updateState`,
                        payload: {
                          orderDateAdvanceWeek: {
                            ...orderDateAdvanceWeek,
                            week: {
                              ...week,
                              value01: e,
                            },
                          },
                        },
                      });
                    }}
                  />
                </div>
                <div style={{ display: 'inline-block' }}>&nbsp;周</div>
              </div>
            </Field>
          </FieldList>
          <Divider dashed />

          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="">
            <Field
              name="supplyRequirementPeriod"
              label="供需时间段"
              decorator={{
                initialValue: formData.supplyRequirementPeriod || 0,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
              presentational
            >
              <Radio.Group
                disabled
                className="tableBox"
                value={
                  // eslint-disable-next-line
                  nextEightWeek.value01 === 'Y'
                    ? 1
                    : // eslint-disable-next-line
                      nextTwelveWeek.value01 === 'Y'
                      ? 2
                      : // eslint-disable-next-line
                        nextTwentySixWeek.value01 === 'Y'
                        ? 3
                        : // eslint-disable-next-line
                          other.value01 === 'Y'
                          ? 4
                          : 5
                }
                onChange={e => {
                  if (e.target.value === 1) {
                    this.onSupplyRequirementPeriodChange({
                      nextEightWeek: {
                        value01: 'Y',
                        value02: 8,
                      },
                    });
                  } else if (e.target.value === 2) {
                    this.onSupplyRequirementPeriodChange({
                      nextTwelveWeek: {
                        value01: 'Y',
                        value02: 12,
                      },
                    });
                  } else if (e.target.value === 3) {
                    this.onSupplyRequirementPeriodChange({
                      nextTwentySixWeek: {
                        value01: 'Y',
                        value02: 26,
                      },
                    });
                  } else if (e.target.value === 4) {
                    this.onSupplyRequirementPeriodChange({
                      other: {
                        value01: 'Y',
                        value02: null,
                      },
                    });
                  }
                }}
              >
                <Radio value={1}>未来8周</Radio>
                <br />
                <Radio value={2}>未来12周</Radio>
                <br />
                <Radio value={3}>未来26周</Radio>
                <br />
                <Radio value={4}>
                  未来 &nbsp;
                  <InputNumber
                    disabled={other.value01 === 'N'}
                    value={other.value02}
                    onChange={e => {
                      this.onSupplyRequirementPeriodChange({
                        other: {
                          value01: 'Y',
                          value02: e,
                        },
                      });
                    }}
                  />
                  &nbsp; 周
                </Radio>
              </Radio.Group>
            </Field>
            <Field
              name="orderDateRefer"
              label="成单日期在过去日"
              decorator={{
                initialValue: formData.orderDateRefer || null,
              }}
              labelCol={{ span: 10, xxl: 10 }}
              wrapperCol={{ span: 12, xxl: 12 }}
            >
              <CheckboxOrRadioGroup moduleType="radio" udcCode="RPP:ORDER_DATE_REFER" disabled />
            </Field>
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ResDemandDetail;