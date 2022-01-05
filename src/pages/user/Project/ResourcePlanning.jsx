/* eslint-disable react/no-unused-state */
// 框架类
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button, Card, DatePicker, Form } from 'antd';
import classnames from 'classnames';
import { isEmpty, isNil, mapObjIndexed, none } from 'ramda';
import { formatMessage } from 'umi/locale';
import moment from 'moment';
import JSGanttComponent from 'react-jsgantt';
import Highcharts from 'highcharts';
import xrange from 'highcharts/modules/xrange';

// 产品化组件
import { fromQs } from '@/utils/stringUtils';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import ResourceModal from './modal/ResourceModal';
import History from './modal/History';
import HistoryModal from './modal/HistoryModal';
import ResourceListModal from './modal/ResourceListModal';

// css样式
import './ResourcePlanning.less';

xrange(Highcharts);
// 编辑页tab
const editOperationTabList = [
  {
    key: 'resPlanning',
    tab: formatMessage({ id: `user.project.menuMap.resplanning`, desc: '资源规划' }),
  },
  {
    key: 'changeHistory',
    tab: formatMessage({ id: `user.project.menuMap.changehistory`, desc: '变更历史' }),
  },
  {
    key: 'gantt',
    tab: formatMessage({ id: `user.project.menuMap.gantt`, desc: '甘特图' }),
  },
  {
    key: 'ganttTest',
    tab: formatMessage({ id: `user.project.menuMap.ganttTest`, desc: '甘特图测试' }),
  },
];

// 保存历史版本明细初始化
const historyFormDataModel = {
  id: null,
  versionNo: null, // 版本号
  changeReason: null, // 变更原因
};

const DOMAIN = 'userResourcePlanning';

const chinese = {
  january: '一月',
  february: '二月',
  march: '三月',
  april: '四月',
  maylong: '五月',
  june: '六月',
  july: '七月',
  august: '八月',
  september: '九月',
  october: '十月',
  november: '十一月',
  december: '十二月',
  jan: '一月',
  feb: '二月',
  mar: '三月',
  apr: '四月',
  may: '五月',
  jun: '六月',
  jul: '七月',
  aug: '八月',
  sep: '九月',
  oct: '十月',
  nov: '十一月',
  dec: '十二月',
  sunday: '星期日',
  monday: '星期一',
  tuesday: '星期二',
  wednesday: '星期三',
  thursday: '星期四',
  friday: '星期五',
  saturday: '星期六',
  sun: '星期日',
  mon: '星期一',
  tue: '星期二',
  wed: '星期三',
  thu: '星期四',
  fri: '星期五',
  sat: '星期六',
  resource: '资源',
  duration: '时程',
  comp: '达成率',
  completion: '达成',
  startdate: '起始日期',
  planstartdate: '计划起始日期',
  enddate: '截止日期',
  planenddate: '计划截止日期',
  cost: '成本',
  moreinfo: '更多资讯',
  notes: '备注',
  format: '格式',
  hour: '时',
  day: '日',
  week: '星期',
  month: '月',
  quarter: '季',
  hours: '小时',
  days: '天',
  weeks: '周',
  months: '月',
  quarters: '季',
  hr: '小时',
  dy: '天',
  wk: '周',
  mth: '月',
  qtr: '季',
  hrs: '小时',
  dys: '天',
  wks: '周',
  mths: '月',
  qtrs: '季',
};

// 甘特图数据处理
let today = new Date();
const day = 1000 * 60 * 60 * 24;
// const dateFormat = Highcharts.dateFormat;
// const series;
// const cars;

today.setUTCHours(0); // 从8点开始设置与现在对应的小时数
today.setUTCMinutes(0);
today.setUTCSeconds(0);
today.setUTCMilliseconds(0);
today = today.getTime();

const left = [
  {
    model: 'Nissan Leaf',
    current: 0,
    deals: [
      {
        rentedTo: 'Lisa Star',
        from: today - 1 * day,
        to: today + 2 * day,
      },
    ],
  },
];

const series = left.map((item, index) => {
  const data = item.deals.map(deal => ({
    id: 'deal-' + index,
    rentedTo: deal.rentedTo,
    start: deal.from,
    end: deal.to,
    y: index,
  }));
  return {
    name: item.model,
    data,
    current: item.deals[item.current],
  };
});

@connect(({ loading, userResourcePlanning }) => ({
  loading,
  userResourcePlanning,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (isEmpty(changedFields)) return;
    const key = Object.keys(changedFields)[0];
    const value = Object.values(changedFields)[0];
    let tt;
    if (key === 'startDate') {
      tt = moment(value.value).format('YYYY-MM-DD');
    } else {
      tt = value.value;
    }
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { key, value: tt },
    });
  },
})
@mountToTab()
class ResourcePlanning extends PureComponent {
  state = {
    operationkey: 'resPlanning',
    historyVisible: false, // 保存历史版本管理弹框显示
    templateVisible: false, // 从模板导入弹框显示
    btnLoadingStatus: false,
    // btnHistoryLoadingStatus: false,
    editVisible: false,
    historyFormData: {
      ...historyFormDataModel,
    },
    btnDisabled: false, // 保存、保存历史版本按钮默认使用
    didMountFlag: false,
    isPastDate: true,
  };

  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    this.setState({
      operationkey: 'resPlanning',
    });
    // this.renderGentt()
  }

  componentDidUpdate() {
    this.ref !== null && this.ref.editor && this.ref.editor.addLang('chinese', chinese);
  }

  onOperationTabChange = key => {
    this.setState({
      operationkey: key,
      didMountFlag: key,
    });

    if (key === 'changeHistory') {
      // 切换到变更历史时，保存等按钮禁用
      this.setState({ btnDisabled: true });
    } else if (key === 'gantt') {
      // this.ref.editor.addLang('chinese',chinese)
      this.setState({ btnDisabled: true });
    } else if (key === 'ganttTest') {
      this.renderGentt();
    } else {
      this.setState({ btnDisabled: false });
    }
  };

  // 保存
  handleSave = () => {
    const {
      dispatch,
      form: { validateFieldsAndScroll },
      userResourcePlanning: { formData, dataSource, initialDate, weekDate },
    } = this.props;
    // 获取url上的参数
    const param = fromQs();
    const { startDate, ...data } = formData;
    const date = moment(startDate)
      .startOf('week')
      .format('YYYY-MM-DD');
    // 保存历史版本
    // if (param.planType === '2' && (!data.isPmoRes || !data.isAdmin)) {
    //   if (initialDate && weekDate && (initialDate !== date || weekDate !== data.durationWeek)) {
    //     this.historyToggleModal();
    //     return;
    //   }
    // }
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/save`,
          payload: { objid: param.objId, formData: { startDate: date, ...data } },
        }).then(res => {
          this.ResourceModal.queryData();
          this.ResourceListModal.queryData();
        });
      }
    });
  };

  // 年月日格式转换
  getYearMonth = date => {
    // 将日期以空格隔开，即['2020-06-13', '17:10:09']
    const dateTemp = (date + '').split(/[ ]+/);
    const result = [];
    const reg = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    // 用截取出来的年月日进行正则表达式匹配
    reg.exec(dateTemp[0]);
    // result.year = RegExp.$1
    // result.month = RegExp.$2
    // result.day = RegExp.$3
    result.push(RegExp.$1); //获取匹配到的第一个子匹配，即‘2020’
    result.push(RegExp.$2);
    result.push(RegExp.$3);
    return result;
  };

  // 计算两个日期之间的天数
  timeDifference = (startDate, endDate) => {
    // const start = new Date(); // 开始时间
    // const end = new Date(); // 结束时间
    const startDateTemp = new Date(startDate).getTime();
    const endDateTemp = new Date(endDate).getTime();
    const dateCha = endDateTemp - startDateTemp;
    //计算出相差天数
    const days = Math.floor(dateCha / (24 * 3600 * 1000));
    return days;
    // //计算出小时数
    // const leave1 = dateCha % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
    // const hours = Math.floor(leave1 / (3600 * 1000));
    // //计算相差分钟数
    // const leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
    // const minutes = Math.floor(leave2 / (60 * 1000)); // 分
    // //计算相差秒数
    // const leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
    // const seconds = Math.round(leave3 / 1000); // 秒
    // console.log(days + "天 " + hours + "小时 ");
  };

  renderGentt = () => {
    const {
      userResourcePlanning: { dataSource },
    } = this.props;
    const resNames = [];
    const totalDays = [];
    const ganttData = dataSource.map((item, index) => {
      resNames.push(item.resName);
      totalDays.push(this.timeDifference(item.startDate, item.endDate));
      const startDate = this.getYearMonth(item.startDate);
      const endDate = this.getYearMonth(item.endDate);
      return {
        x: Date.UTC(startDate[0], startDate[1], startDate[2]),
        x2: Date.UTC(endDate[0], endDate[1], endDate[2]),
        y: index,
        partialFill: 0.25,
      };
    });

    const GenttData = {
      credits: {
        //去掉版权logo
        enabled: false,
      },
      tooltip: {
        // 提示框设置
        dateTimeLabelFormats: {
          // 格式化
          day: '%Y/%m/%d',
        },
        useHTML: true,
        formatter() {
          //格式化提示框的内容样式
          console.log(this);
          const diffDay = Math.floor((this.x2 - this.x) / (1000 * 60 * 60 * 24));
          return `<span>总天数：${diffDay}</span><br/>
          <span>资源：${this.yCategory}</span>`;
        },
        // pointFormat: `<span>总天数：${console.log(series)}</span><br/><span>资源：${resNames}</span>`,
      },
      chart: {
        type: 'xrange', // 指定图表的类型，默认是折线图（line）
      },
      title: {
        text: '资源规划甘特图', // 标题
      },
      xAxis: {
        // 横坐标轴数据
        type: 'datetime',
        dateTimeLabelFormats: {
          // 日期格式化
          week: '%Y/%m/%d',
        },
      },
      yAxis: {
        // y轴配置项
        title: {
          text: '', // y 轴标题
        },
        categories: resNames, // y轴分类
        reversed: false, // 控制分类是否反转
      },
      series: [
        {
          // 属性和数据
          name: '资源', // 显示数据列的名称
          // pointPadding: 0,
          // groupPadding: 0,
          borderColor: 'gray',
          pointWidth: 20,
          data: ganttData,
          // data: [
          //   {
          //     // 显示在图表中的数据列，可以为数组或者JSON格式的数组。
          //     // 返回指定日期与 1970 年 1 月 1 日午夜之间的毫秒数
          //     x: Date.UTC(2014, 10, 21), // 每个阶段的起始日期
          //     x2: Date.UTC(2014, 11, 5), // 每个阶段的结束日期
          //     y: 1, // 控制纵向位置
          //     // partialFill: 0.25, // 项目进度
          //   },
          //   {
          //     x: Date.UTC(2014, 11, 2),
          //     x2: Date.UTC(2014, 11, 5),
          //     y: 1,
          //   },
          //   {
          //     x: Date.UTC(2014, 11, 8),
          //     x2: Date.UTC(2014, 11, 9),
          //     y: 2,
          //   },
          //   {
          //     x: Date.UTC(2014, 11, 9),
          //     x2: Date.UTC(2014, 11, 19),
          //     y: 1,
          //   },
          //   {
          //     x: Date.UTC(2014, 11, 10),
          //     x2: Date.UTC(2014, 11, 23),
          //     y: 2,
          //   },
          // ],
          dataLabels: {
            enabled: true,
          },
        },
        // {
        //   // 属性和数据
        //   name: '项目', // 显示数据列的名称
        //   // pointPadding: 0,
        //   // groupPadding: 0,
        //   borderColor: 'gray',
        //   pointWidth: 20,
        //   data: [
        //     {
        //       // 显示在图表中的数据列，可以为数组或者JSON格式的数组。
        //       x: Date.UTC(2014, 10, 21), // 返回指定日期与 1970 年 1 月 1 日午夜之间的毫秒数：
        //       x2: Date.UTC(2014, 11, 2),
        //       y: 0,
        //       partialFill: 0.25,
        //     },
        //     {
        //       x: Date.UTC(2014, 11, 2),
        //       x2: Date.UTC(2014, 11, 5),
        //       y: 1,
        //     },
        //     {
        //       x: Date.UTC(2014, 11, 8),
        //       x2: Date.UTC(2014, 11, 9),
        //       y: 2,
        //     },
        //     {
        //       x: Date.UTC(2014, 11, 9),
        //       x2: Date.UTC(2014, 11, 19),
        //       y: 1,
        //     },
        //     {
        //       x: Date.UTC(2014, 11, 10),
        //       x2: Date.UTC(2014, 11, 23),
        //       y: 2,
        //     },
        //   ],
        //   dataLabels: {
        //     enabled: true,
        //   },
        // },
      ],
    };
    Highcharts.chart('ganttTest', GenttData); // 图表初始化函数
  };

  // 保存历史版本新增弹出窗。
  historyToggleModal = () => {
    const { historyVisible } = this.state;
    this.setState({
      historyVisible: !historyVisible,
      historyFormData: {
        ...historyFormDataModel,
      },
    });
  };

  // 编辑弹框
  editModeal = () => {
    const { editVisible } = this.state;
    if (!editVisible) {
      this.handleSave();
    }
    this.setState({
      editVisible: !editVisible,
    });
  };

  // 显示隐藏过去日期
  pastTheDate = e => {
    const { isPastDate } = this.state;
    this.setState({
      isPastDate: !isPastDate,
    });
    this.ResourceModal.queryData(isPastDate);
  };

  onRef = ref => {
    this.ResourceModal = ref;
  };

  onRefList = ref => {
    this.ResourceListModal = ref;
  };

  // 保存历史版本保存按钮事件
  historySubmitModal = () => {
    const {
      dispatch,
      userResourcePlanning: { formData },
    } = this.props;
    const { historyVisible, historyFormData } = this.state;
    const param = fromQs();
    const { startDate, ...data } = formData;
    const date = moment(startDate)
      .startOf('week')
      .format('YYYY-MM-DD');

    dispatch({
      type: `${DOMAIN}/saveHistory`,
      payload: {
        id: formData.id,
        versionNo: historyFormData.versionNo,
        changeReason: historyFormData.changeReason,
      },
    }).then(reason => {
      if (!reason) {
        return;
      }
      dispatch({
        type: `${DOMAIN}/save`,
        payload: { objid: param.objId, formData: { startDate: date, ...data } },
      }).then(res => {
        this.ResourceModal.queryData();
      });
      this.setState({
        historyVisible: !historyVisible,
        historyFormData,
      });
    });
  };

  render() {
    const {
      loading,
      form,
      userResourcePlanning: {
        dataSource,
        formData: { planType },
      },
    } = this.props;
    const data = dataSource.map(item => ({
      pID: item.id,
      pName: item.role,
      pRes: item.resName,
      pStart: item.startDate,
      pEnd: item.endDate,
      pClass: 'ggroupblack',
      pMile: 0,
      pComp: 0,
      pGroup: 1,
      pOpen: 1,
      pDepend: 'bbb',
      pCaption: 'ccc',
      pNotes: '',
    }));
    const editorOptions = {
      vCaptionType: 'Complete', // Set to Show Caption : None,Caption,Resource,Duration,Complete,
      vQuarterColWidth: 36,
      // vDateTaskDisplayFormat: 'day dd month yyyy', // Shown in tool tip box
      vDayMajorDateDisplayFormat: 'mon yyyy - Week ww', // Set format to display dates in the "Major" header of the "Day" view
      vLang: 'chinese',
      vShowComp: false,
      // vAddLang:
      // vWeekMinorDateDisplayFormat: 'dd mon'
      vFormatArr: ['Week'],
    };
    const {
      operationkey,
      historyFormData,
      historyVisible,
      templateVisible,
      btnDisabled,
      didMountFlag,
      editVisible,
      isPastDate,
    } = this.state;

    // 获取url上的参数
    const param = fromQs();
    const contentList = {
      resPlanning: (
        <ResourceModal
          didMountFlag={didMountFlag}
          form={form}
          switchWeek={event => this.setState({ weekSwitch: event })}
          onRef={this.onRef}
          editModeal={this.editModeal}
          pastTheDate={this.pastTheDate}
          ResourceListModal={this.ResourceListModal}
          pastDate={isPastDate}
        />
      ),
      changeHistory: <History form={form} />,
      gantt: (
        <JSGanttComponent
          ref={ref => {
            this.ref = ref;
          }}
          data={data}
          options={editorOptions}
          key={this.ref}
        />
      ),
      ganttTest: <div id="ganttTest" />,
    };
    const submitBtn =
      loading.effects[`userResourcePlanning/query`] || loading.effects[`userResourcePlanning/save`];

    const style = { display: 'none' };
    const show = { display: 'block' };
    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            icon="save"
            size="large"
            onClick={this.handleSave}
            disabled={btnDisabled || submitBtn}
          >
            {formatMessage({ id: `misc.save`, desc: '保存' })}
          </Button>

          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            onClick={() => {
              if (param.planType === '2') {
                closeThenGoto(`/user/project/projectDetail?id=${param.objId}`);
              } else if (param.planType === '1') {
                closeThenGoto(`/sale/management/opps`);
              }
            }}
          >
            {formatMessage({ id: `misc.rtn`, desc: '返回' })}
          </Button>
        </Card>

        <Card
          className="tw-card-multiTab"
          bordered={false}
          activeTabKey={operationkey}
          tabList={editOperationTabList}
          onTabChange={this.onOperationTabChange}
        >
          {contentList[operationkey]}
        </Card>
        <HistoryModal
          formData={historyFormData}
          visible={historyVisible}
          handleCancel={this.historyToggleModal}
          handleOk={this.historySubmitModal}
        />
        <ResourceListModal
          visible={editVisible}
          resourceListModal={this.editModeal}
          onRef={this.onRefList}
        />
        <div id="ganttTest" style={operationkey !== 'ganttTest' ? style : show} />
      </PageHeaderWrapper>
    );
  }
}

export default ResourcePlanning;
