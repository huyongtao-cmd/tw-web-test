// 框架类
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import classnames from 'classnames';
import { Button, Form, Card } from 'antd';

// 产品化组件
import { closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { fromQs } from '@/utils/stringUtils';

// 业务组件
import ResDemand from './ResDemand';
import ResProvide from './ResProvide';
import ResPlan from './ResPlan';

const arrToObj = (arr = [], changeName, key) => {
  if (key) {
    return (
      !isEmpty(arr) &&
      Object.fromEntries(arr.map(v => v[v[changeName]]).map(item => [item[key], item]))
    );
  }

  const arr1 = arr.map(v => ({ [v.changeName]: v[v.changeName] }));
  let obj = {};
  arr1.forEach(v => {
    obj = { ...obj, ...v };
  });
  return obj;
};

const tabConf = [
  {
    key: 'resDemandTab',
    tab: '资源需求整合参数',
  },
  {
    key: 'resProvideTab',
    tab: '资源供给整合参数',
  },
  {
    key: 'resPlanTab',
    tab: '资源计划整合参数',
  },
];

const DOMAIN = 'resPlanConfigEdit';

@connect(({ loading, dispatch, resPlanConfigEdit }) => ({
  loading,
  dispatch,
  resPlanConfigEdit,
}))
@Form.create({
  onValuesChange(props, changedValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
class resPlanConfigEditCom extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      operationKey: 'resDemandTab',
    };
  }

  componentDidMount() {
    this.fn();
  }

  fn = async () => {
    const { id } = fromQs();
    const { dispatch } = this.props;
    await dispatch({
      type: `${DOMAIN}/clearForm`,
    });
    // 商机销售阶段
    dispatch({
      type: `${DOMAIN}/getOppoSalesWeight`,
      payload: 'RPP:SALES_STAGE',
    });
    // 商机成单概率
    dispatch({
      type: `${DOMAIN}/getOppoSinglePro`,
      payload: 'RPP:OPPORTUNITY_SINGLE_PROBABILITY',
    });

    // 资源类型一
    dispatch({
      type: `${DOMAIN}/getResourceType01List`,
      payload: 'RES:RES_TYPE1',
    });
    // 资源类型二
    dispatch({
      type: `${DOMAIN}/getResourceType02List`,
      payload: 'RES:RES_TYPE2',
    });
    // 资源类型状态
    dispatch({
      type: `${DOMAIN}/getResStatusList`,
      payload: 'RES:RES_STATUS',
    });
    // 参照历史需求/供给结果
    dispatch({
      type: `${DOMAIN}/getSelectList`,
      payload: { state: 'OK' },
    });

    id &&
      dispatch({
        type: `${DOMAIN}/getDetails`,
        payload: { id },
      });
  };

  handleSave = () => {
    const { copy, id } = fromQs();
    const {
      dispatch,
      form: { validateFieldsAndScroll },
      resPlanConfigEdit: {
        formData,
        // ==============资源需求整合参数==============
        opportunitySalesStageWeight,
        oppoSalesWeightList = [],
        businessOpportunitySingleProbabilityWeight,
        oppounitySingleList = [],
        supplyRequirementPeriod,
        supplyRequirementStartTime,
        orderDateAdvanceWeek,
        // ==============资源供给整合参数==============
        resourceType01List = [],
        resourceType01,
        resourceType02List = [],
        resourceType02,
        resStatusList = [],
        resStatus,
        recruitmentPlan,
        //资源供给整合参数
        entrySupplyWeight,
        // ==============资源计划整合参数==============
        competenceLevelCompatibility,
      },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      const {
        // 资源需求整合参数
        dataSource,
        projectType,
        orderDateRefer,
        // 资源计划整合参数
        computingCategory,
        designatedResource,
        // 剩余参数
        ...restParmars
      } = formData;
      const requirement = {
        // ==============资源需求整合参数==============
        //基于商机成单日期的提前周数
        orderDateAdvanceWeek,
        // 资源需求整合参数
        dataSource,
        // 项目大类
        projectType,
        // 商机销售阶段权重
        opportunitySalesStageWeight: {
          ...opportunitySalesStageWeight,
          ...arrToObj(oppoSalesWeightList),
        },
        // 商机成单概率权重
        businessOpportunitySingleProbabilityWeight: {
          ...businessOpportunitySingleProbabilityWeight,
          ...arrToObj(oppounitySingleList),
        },
        // 供需时限开始时间
        supplyRequirementStartTime,
        // 供需时间段
        supplyRequirementPeriod,
        // 成单日期在过去日
        orderDateRefer,
      };

      const supply = {
        // ==============资源供给整合参数==============
        // 入职预定供给权重
        entrySupplyWeight,
        // 资源类型一
        resourceType01: {
          ...resourceType01,
          ...arrToObj(resourceType01List),
        },
        // 资源类型二
        resourceType02: {
          ...resourceType02,
          ...arrToObj(resourceType02List),
        },
        // 资源状态
        resStatus: {
          ...resStatus,
          ...arrToObj(resStatusList),
        },
        // 招聘计划
        recruitmentPlan,
      };

      const integration = {
        // ==============资源计划整合参数==============
        // 计算类别
        computingCategory,
        // 指定资源
        designatedResource,
        // 能力级别兼容
        competenceLevelCompatibility,
      };
      const newBU = restParmars.bu?.map(item => ({
        value02: item.key + '' || '',
        value01: 'Y',
      }));

      // 部门选择和是否公开
      const bSelect = {
        openSelect: {
          notOpen: {
            value01: restParmars.notOpen === true ? 'Y' : 'N',
            value02: '',
          },
        },
        buSelect: {
          ...newBU,
          all:
            restParmars.allBu === true
              ? {
                  value01: 'Y',
                  value02: '0',
                }
              : {
                  value01: 'N',
                  value02: '',
                },
        },
      };
      const params = {
        ...restParmars,
        requirement,
        supply,
        integration,
        id: copy ? null : id,
        bSelect,
      };
      delete params.allBu;
      delete params.notOpen;
      delete params.bu;
      if (!error) {
        dispatch({
          type: `${DOMAIN}/save`,
          payload: params,
        });
      }
    });
  };

  handleCancel = () => {
    closeThenGoto('/hr/resPlan/resPlanConfig');
  };

  render() {
    const { loading, form } = this.props;

    const { operationKey } = this.state;
    const submitting = loading.effects[`${DOMAIN}/save`];

    const contentList = {
      resDemandTab: <ResDemand form={form} />,
      resProvideTab: <ResProvide form={form} />,
      resPlanTab: <ResPlan form={form} />,
    };

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            disabled={submitting}
            onClick={this.handleSave}
          >
            保存
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={this.handleCancel}
          >
            返回
          </Button>
        </Card>
        <Card
          className="tw-card-multiTab"
          bordered={false}
          activeTabKey={operationKey}
          tabList={tabConf}
          onTabChange={key => {
            this.setState({
              operationKey: key,
            });
          }}
        >
          {contentList[operationKey]}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default resPlanConfigEditCom;
