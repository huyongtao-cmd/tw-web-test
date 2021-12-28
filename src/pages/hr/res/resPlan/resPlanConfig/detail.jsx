import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { isEmpty } from 'ramda';
import classnames from 'classnames';
import { Button, Form, Card } from 'antd';
import { closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { fromQs } from '@/utils/stringUtils';
import ResDemandDetail from './ResDemandDetail';
import ResProvideDetail from './ResProvideDetail';
import ResPlanDetail from './ResPlanDetail';

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
    const { id } = fromQs();
    const { dispatch } = this.props;
    // dispatch({
    //   type: `${DOMAIN}/clearForm`,
    // });

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
  }

  handleSave = () => {
    const { copy } = fromQs();

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
        id,
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

      const params = {
        ...restParmars,
        requirement,
        supply,
        integration,
        id: copy ? null : id,
      };

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
      resDemandTab: <ResDemandDetail form={form} />, // 资源需求整合参数
      resProvideTab: <ResProvideDetail form={form} />, // 资源供给整合参数
      resPlanTab: <ResPlanDetail form={form} />, // 资源计划整合参数
    };

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-default"
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
