/* eslint-disable react/no-unused-state */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { formatMessage } from 'umi/locale';
import { Button, Card, DatePicker, Form } from 'antd';
import classnames from 'classnames';
import { isEmpty, isNil, mapObjIndexed } from 'ramda';
import { createConfirm } from '@/components/core/Confirm';
import { fromQs } from '@/utils/stringUtils';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import createMessage from '@/components/core/AlertMessage';
import moment from 'moment';
import JSGanttComponent from 'react-jsgantt';
import Gant from 'react-gant';
import ResourceModal from './modal/ResourceModal';
import History from './modal/History';
import HistoryModal from './modal/HistoryModal';
import ResourceListModal from './modal/ResourceListModal';
import './ResourcePlanning.less';

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
];

// 保存历史版本明细初始化
const historyFormDataModel = {
  id: null,
  versionNo: null, // 版本号
  changeReason: null, // 变更原因
};

const DOMAIN = 'userResourcePlanning';

const STATEMAP = {
  waiting: {
    bgColor: '#C6D57E',
    label: '等待',
  },
  primary: {
    bgColor: '#A2D2FF',
    label: '正常',
  },
  success: {
    bgColor: '#61B15A',
    label: '成功',
  },
  warning: {
    bgColor: '#FFC93C',
    label: '警告',
  },
  error: {
    bgColor: '#FA1E0E',
    label: '异常',
  },
  closed: {
    bgColor: '#DDDDDD',
    label: '关闭',
  },
  subTask: {
    bgColor: '#7868e6',
    label: '子任务',
  },
};

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
    console.log(dataSource);

    const newData = []
    dataSource.map((item, index) => {
      newData.push({
       
      })
    })

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
    };
    const submitBtn =
      loading.effects[`userResourcePlanning/query`] || loading.effects[`userResourcePlanning/save`];

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
      </PageHeaderWrapper>
    );
  }
}

export default ResourcePlanning;
