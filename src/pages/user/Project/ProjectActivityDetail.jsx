import React, { PureComponent } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Button, Card, Form, Input, Checkbox, DatePicker, Switch, Tooltip } from 'antd';
import update from 'immutability-helper';
import createMessage from '@/components/core/AlertMessage';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { genFakeId } from '@/utils/mathUtils';
import { fromQs } from '@/utils/stringUtils';
import { formatDT } from '@/utils/tempUtils/DateTime';
import DataTable from '@/components/common/DataTable';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import EditableDataTable from '@/components/common/EditableDataTable';
import style from '../../sale/purchaseContract/style.less';
import DescriptionList from '@/components/layout/DescriptionList';

const DOMAIN = 'userProjectActivityDetail';
const { Description } = DescriptionList;

@Form.create({
  onFieldsChange(props, changedFields) {
    const { name, value } = Object.values(changedFields)[0];
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { [name]: value },
    });
  },
})
@connect(({ loading, userProjectActivityDetail, dispatch }) => ({
  loading,
  userProjectActivityDetail,
  dispatch,
}))
class ProjectActivityDetail extends React.Component {
  state = {
    visible: true, //变更前默认true，显示阶段
    visibleByChange: true,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    const param = fromQs();
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        projId: param.id,
        prcId: param.prcId,
        type: 'BEFORE_CHANGE',
      },
    });
    dispatch({
      type: `${DOMAIN}/querByChange`,
      payload: {
        projId: param.id,
        prcId: param.prcId,
        type: 'AFTER_CHANGE',
      },
    });
    dispatch({
      type: `${DOMAIN}/queryProject`,
      payload: { projId: param.id },
    });
    param.taskId
      ? dispatch({
          type: `${DOMAIN}/fetchConfig`,
          payload: param.taskId,
        })
      : dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            fieldsConfig: {},
          },
        });
  }

  // 行编辑触发事件
  onCellChanged = (rowIndex, row, rowField) => rowFieldValue => {
    const {
      userProjectActivityDetail: { projActivitysByChange },
      dispatch,
    } = this.props;
    const { visibleByChange } = this.state;
    let value = rowFieldValue;
    if (rowField === 'endDate') {
      value = formatDT(value);
      // const { startDate } = dataSource[rowIndex];
      const { startDate } = row;
      if (startDate && moment(startDate).isAfter(value)) {
        createMessage({ type: 'error', description: '日期不应该早于`起日期`' });
        value = null;
      }
      // else {
      //   // 日期组件赋值转换
      //   value = formatDT(value);
      // }
    } else if (rowField === 'startDate') {
      value = formatDT(value);
      // const { endDate } = dataSource[rowIndex];
      const { endDate } = row;
      if (endDate && moment(endDate).isBefore(value)) {
        createMessage({ type: 'error', description: '日期不应该晚于`止日期`' });
        value = null;
      }
      // else {
      //   // 日期组件赋值转换
      //   value = formatDT(value);
      // }
    } else if (rowField === 'workbenchFlag') {
      value = value === true ? 1 : 0;
    } else {
      // input框赋值转换
      value = value && value.target ? value.target.value : value;
    }

    let index = -1;
    for (let i = 0; i < projActivitysByChange.length; i += 1) {
      if (projActivitysByChange[i].id === row.id) {
        index = i;
      }
    }
    const newDataSource = update(projActivitysByChange, {
      [index]: {
        [rowField]: {
          $set: value && value.target ? value.target.value : value,
        },
      },
    });
    let newShowDateSource = newDataSource;
    if (visibleByChange) {
      newShowDateSource = newDataSource.filter(
        v =>
          v.phaseFlag === 1 ||
          (v.startDate !== '' && v.endDate !== '' && v.startDate !== null && v.endDate !== null)
      );
    }
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        projActivitysByChange: newDataSource,
        showProjActivitysByChange: newShowDateSource,
      },
    });
  };

  // checkbox触发事件
  onCellCheckBoxChanged = (rowIndex, row, rowField) => rowFieldValue => {
    const {
      userProjectActivityDetail: { projActivitysByChange },
      dispatch,
    } = this.props;
    const { visibleByChange } = this.state;
    const val = rowFieldValue.target.checked ? 1 : 0;
    let index = -1;
    for (let i = 0; i < projActivitysByChange.length; i += 1) {
      if (projActivitysByChange[i].id === row.id) {
        index = i;
      }
    }
    const newprojActivitysByChange = update(projActivitysByChange, {
      [index]: {
        [rowField]: {
          $set: val,
        },
      },
    });
    let newShowDateSource = newprojActivitysByChange;
    if (visibleByChange) {
      newShowDateSource = newprojActivitysByChange.filter(
        v =>
          v.phaseFlag === 1 ||
          (v.startDate !== '' && v.endDate !== '' && v.startDate !== null && v.endDate !== null)
      );
    }
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        projActivitysByChange: newprojActivitysByChange,
        showProjActivitysByChange: newShowDateSource,
      },
    });
  };

  // 自动计算当量
  autoPlanEqva = () => {
    const {
      dispatch,
      userProjectActivityDetail: { projActivitysByChange },
    } = this.props;

    projActivitysByChange.forEach(data => {
      const { eqvaRate, days } = data;
      if (eqvaRate && days && !Number.isNaN(eqvaRate) && !Number.isNaN(days)) {
        data.planEqva = data.eqvaRate * data.days; // eslint-disable-line
      }
    });
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { projActivitysByChange },
    });
  };

  render() {
    const {
      loading,
      dispatch,
      userProjectActivityDetail: {
        projActivitys,
        projActivitysByChange,
        fieldsConfig,
        flowForm,
        deleteList,
        showProjActivitys,
        showProjActivitysByChange,
        formData,
      },
    } = this.props;
    const { taskKey, buttons } = fieldsConfig;
    const { visible, visibleByChange } = this.state;
    // 获取url上的参数
    const param = fromQs();
    const disabledBtn = loading.effects[`${DOMAIN}/query`] || loading.effects[`${DOMAIN}/save`];
    const isDisable = !(param.mode === 'edit' && taskKey === 'TSK_P11_01_SUBMIT_i');

    const editTableProps = {
      sortBy: 'sortNo',
      rowKey: 'id',
      total: 0,
      scroll: {
        x: 1440,
      },
      dataSource: showProjActivitys,
      pagination: false,
      showCopy: false,
      showAdd: false,
      showDelete: false,
      showSearch: false,
      showExport: false,
      showColumn: false,
      columns: [
        {
          title: '活动编码',
          dataIndex: 'actNo',
          required: true,
          align: 'center',
          width: 100,
        },
        {
          title: '活动名称',
          dataIndex: 'actName',
          required: true,
          width: 300,
        },
        {
          title: '规划天数',
          dataIndex: 'days',
          // required: true,
          align: 'right',
          width: 50,
        },
        {
          title: '当量系数',
          dataIndex: 'eqvaRate',
          // required: true,
          align: 'right',
          width: 50,
        },
        {
          title: '规划当量',
          dataIndex: 'planEqva',
          align: 'right',
          width: 50,
        },
        {
          title: '里程碑',
          dataIndex: 'milestoneFlag',
          required: true,
          align: 'center',
          width: 50,
          render: (value, row, index) => <Checkbox disabled checked={value === 1} />,
        },
        {
          title: '阶段',
          dataIndex: 'phaseFlag',
          required: false,
          align: 'center',
          width: 50,
          render: (value, row, index) => <Checkbox checked={value === 1} disabled />,
        },
        {
          title: '模板活动',
          align: 'center',
          dataIndex: 'fromtmplFlag',
          required: false,
          width: 50,
          render: (value, row, index) => <Checkbox checked={value === 1} disabled />,
        },
        {
          title: '起日期',
          dataIndex: 'startDate',
          width: 130,
          render: value => formatDT(value),
        },
        {
          title: '止日期',
          dataIndex: 'endDate',
          width: 130,
          render: value => formatDT(value),
        },
        {
          title: '工作台显示',
          dataIndex: 'workbenchFlag',
          width: 130,
          render: (value, row, index) => (
            <Switch
              checked={value !== 0}
              onChange={this.onCellChanged(index, row, 'workbenchFlag')}
            />
          ),
        },
        {
          title: '备注',
          dataIndex: 'remark',
          width: 200,
        },
      ],
      leftButtons: [
        {
          key: 'showAll',
          title: '显示全部',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (_selectedRowKeys, selectedRows) => {
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: { showProjActivitys: projActivitys },
            });
            this.setState({ visible: false });
          },
        },
        {
          key: 'shoPhaseFlag',
          title: '显示阶段',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (_selectedRowKeys, selectedRows) => {
            const phaseFlagDateSource = projActivitys.filter(
              v =>
                v.phaseFlag === 1 ||
                (v.startDate !== '' &&
                  v.endDate !== '' &&
                  v.startDate !== null &&
                  v.endDate !== null)
            );
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: { showProjActivitys: phaseFlagDateSource },
            });
            this.setState({ visible: true });
          },
        },
      ],
    };

    const editTablePropsByChange = {
      sortBy: 'id',
      rowKey: 'id',
      total: 0,
      scroll: {
        x: 1440,
      },
      dataSource: showProjActivitysByChange,
      pagination: false,
      showCopy: false,
      showAdd: !isDisable,
      showDelete: !isDisable,
      showSearch: false,
      showExport: false,
      showColumn: false,
      onAdd: newRow => {
        const newDateSource = update(projActivitysByChange, {
          $push: [
            {
              ...newRow,
              id: genFakeId(-1),
              milestoneFlag: 0,
              phaseFlag: 1,
              fromtmplFlag: 0,
              distedEqva: 0,
            },
          ],
        });
        let phaseFlagDateSource = newDateSource;
        if (visibleByChange) {
          phaseFlagDateSource = newDateSource.filter(
            v =>
              v.phaseFlag === 1 ||
              (v.startDate !== '' && v.endDate !== '' && v.startDate !== null && v.endDate !== null)
          );
        }
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            projActivitysByChange: newDateSource,
            showProjActivitysByChange: phaseFlagDateSource,
          },
        });
      },
      onDeleteItems: (_selectedRowKeys, selectedRows) => {
        // 是否阶段, 选择谁的不可以删
        const isPhaseFlag = selectedRows.filter(row => row.id > 0 && row.fromtmplFlag === 1);
        if (isPhaseFlag.length > 0) {
          createMessage({ type: 'warn', description: '活动模板是不能删除' });
        }
        const filterIsPhaseFlagRowKeys = selectedRows
          .filter(row => row.fromtmplFlag === 0)
          .map(row => row.id);
        const newDataSource = projActivitysByChange.filter(
          row => !filterIsPhaseFlagRowKeys.filter(keyValue => keyValue === row.id).length
        );
        let newShowDateSource = newDataSource;
        if (visible) {
          newShowDateSource = newDataSource.filter(
            v =>
              v.phaseFlag === 1 ||
              (v.startDate !== '' && v.endDate !== '' && v.startDate !== null && v.endDate !== null)
          );
        }
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            projActivitysByChange: newDataSource,
            showProjActivitysByChange: newShowDateSource,
            deleteList: [...deleteList, ...filterIsPhaseFlagRowKeys],
          },
        });
      },
      columns: [
        {
          title: '活动编码',
          dataIndex: 'actNo',
          required: true,
          align: 'center',
          width: 100,
          render: (value, row, index) => (
            <Input
              disabled={isDisable}
              defaultValue={value}
              size="small"
              onChange={this.onCellChanged(index, row, 'actNo')}
            />
          ),
        },
        {
          title: '活动名称',
          dataIndex: 'actName',
          required: true,
          width: 300,
          render: (value, row, index) => (
            <Input
              disabled={isDisable}
              defaultValue={value}
              size="small"
              onChange={this.onCellChanged(index, row, 'actName')}
            />
          ),
        },
        {
          title: '规划天数',
          dataIndex: 'days',
          // required: true,
          align: 'right',
          width: 50,
          render: (value, row, index) => (
            <Input
              defaultValue={value}
              size="small"
              onChange={this.onCellChanged(index, row, 'days')}
              disabled={isDisable}
            />
          ),
        },
        {
          title: '当量系数',
          dataIndex: 'eqvaRate',
          // required: true,
          align: 'right',
          width: 50,
          render: (value, row, index) => (
            <Input
              defaultValue={value}
              size="small"
              disabled={isDisable}
              onChange={this.onCellChanged(index, row, 'eqvaRate')}
            />
          ),
        },
        {
          title: '规划当量',
          dataIndex: 'planEqva',
          align: 'right',
          width: 50,
          render: (value, row, index) => (
            <Input
              defaultValue={value}
              value={value}
              disabled={isDisable}
              size="small"
              onChange={this.onCellChanged(index, row, 'planEqva')}
            />
          ),
        },
        {
          title: '里程碑',
          dataIndex: 'milestoneFlag',
          required: true,
          align: 'center',
          width: 50,
          render: (value, row, index) => (
            <Checkbox
              disabled={isDisable}
              checked={value === 1}
              onChange={this.onCellCheckBoxChanged(index, row, 'milestoneFlag')}
            />
          ),
        },
        {
          title: '阶段',
          dataIndex: 'phaseFlag',
          required: false,
          align: 'center',
          width: 50,
          render: (value, row, index) => (
            <Checkbox
              checked={value === 1}
              disabled={row.fromtmplFlag === 1 || isDisable}
              onChange={this.onCellCheckBoxChanged(index, row, 'phaseFlag')}
            />
          ),
        },
        {
          title: '模板活动',
          align: 'center',
          dataIndex: 'fromtmplFlag',
          required: false,
          width: 50,
          render: (value, row, index) => <Checkbox checked={value === 1} disabled />,
        },
        {
          title: '起日期',
          dataIndex: 'startDate',
          width: 130,
          render: (value, row, index) => (
            <DatePicker
              value={value && moment(value)}
              size="small"
              disabled={isDisable}
              onChange={this.onCellChanged(index, row, 'startDate')}
            />
          ),
        },
        {
          title: '止日期',
          dataIndex: 'endDate',
          width: 130,
          render: (value, row, index) => (
            <DatePicker
              value={value && moment(value)}
              size="small"
              disabled={isDisable}
              onChange={this.onCellChanged(index, row, 'endDate')}
            />
          ),
        },
        {
          title: '工作台显示',
          dataIndex: 'workbenchFlag',
          width: 130,
          render: (value, row, index) => (
            <Switch
              disabled={isDisable}
              checked={value !== 0}
              onChange={this.onCellChanged(index, row, 'workbenchFlag')}
            />
          ),
        },
        {
          title: '备注',
          dataIndex: 'remark',
          width: 200,
          render: (value, row, index) => (
            <Input
              value={value}
              size="small"
              onChange={this.onCellChanged(index, row, 'remark')}
              disabled={isDisable}
            />
          ),
        },
      ],
      buttons: [
        {
          key: 'upper',
          title: '上移',
          loading: false,
          hidden: visibleByChange,
          disabled: false,
          minSelections: 1,
          cb: (_selectedRowKeys, selectedRows) => {
            let targetIndex = 0;

            projActivitysByChange.forEach((data, index) => {
              if (data.id === _selectedRowKeys[0]) {
                targetIndex = index;
              }
            });

            if (targetIndex > 0) {
              const obj = projActivitysByChange.splice(targetIndex, 1);
              projActivitysByChange.splice(targetIndex - 1, 0, obj[0]);
              let newShowDateSource = projActivitysByChange;
              if (visible) {
                newShowDateSource = projActivitysByChange.filter(
                  v =>
                    v.phaseFlag === 1 ||
                    (v.startDate !== '' &&
                      v.endDate !== '' &&
                      v.startDate !== null &&
                      v.endDate !== null)
                );
              }
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  projActivitysByChange,
                  showProjActivitysByChange: newShowDateSource,
                },
              });
            }
          },
        },
        {
          key: 'lower',
          title: '下移',
          loading: false,
          hidden: visibleByChange,
          disabled: false,
          minSelections: 1,
          cb: (_selectedRowKeys, selectedRows) => {
            let targetIndex = 0;

            projActivitysByChange.forEach((data, index) => {
              if (data.id === _selectedRowKeys[0]) {
                targetIndex = index;
              }
            });

            if (targetIndex !== projActivitysByChange.length - 1) {
              const obj = projActivitysByChange.splice(targetIndex, 1);
              projActivitysByChange.splice(targetIndex + 1, 0, obj[0]);
              let newShowDateSource = projActivitysByChange;
              if (visible) {
                newShowDateSource = projActivitysByChange.filter(
                  v =>
                    v.phaseFlag === 1 ||
                    (v.startDate !== '' &&
                      v.endDate !== '' &&
                      v.startDate !== null &&
                      v.endDate !== null)
                );
              }
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  projActivitysByChange,
                  showProjActivitysByChange: newShowDateSource,
                },
              });
            }
          },
        },
      ],
      leftButtons: [
        {
          key: 'showAll',
          title: '显示全部',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (_selectedRowKeys, selectedRows) => {
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: { showProjActivitysByChange: projActivitysByChange },
            });
            this.setState({ visibleByChange: false });
          },
        },
        {
          key: 'shoPhaseFlag',
          title: '显示阶段',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (_selectedRowKeys, selectedRows) => {
            const phaseFlagDateSource = projActivitysByChange.filter(
              v =>
                v.phaseFlag === 1 ||
                (v.startDate !== '' &&
                  v.endDate !== '' &&
                  v.startDate !== null &&
                  v.endDate !== null)
            );
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: { showProjActivitysByChange: phaseFlagDateSource },
            });
            this.setState({ visibleByChange: true });
          },
        },
      ],
    };

    const mainFields = [
      <Description term="项目名称" key="projName">
        {formData.projName}
      </Description>,
      <Description term="项目编码" key="projNo">
        {formData.projNo}
      </Description>,
      <Description term="销售负责人" key="salesmanResName">
        {formData.salesmanResName}
      </Description>,
      <Description term="项目经理" key="pmResName">
        {formData.pmResName}
      </Description>,
    ];

    return (
      <PageHeaderWrapper>
        <BpmWrapper
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          // buttonLoading={loading}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            // const { taskKey } = fieldsConfig;
            const { key } = operation;
            const payload = {
              taskId: param.taskId,
              remark: bpmForm.remark,
            };
            if (key === 'FLOW_COMMIT') {
              const actNoError = projActivitysByChange.filter(v => !v.actNo);
              const actNameError = projActivitysByChange.filter(v => !v.actName);
              const milestoneFlagError = projActivitysByChange.filter(
                v => v.milestoneFlag === null || v.milestoneFlag === ''
              );
              const phaseFlagError = projActivitysByChange.filter(
                v => v.phaseFlag === null || v.phaseFlag === ''
              );
              const fromtmplFlagError = projActivitysByChange.filter(
                v => v.fromtmplFlag === null || v.fromtmplFlag === ''
              );
              const phaseFlagDateError = projActivitysByChange.filter(
                v =>
                  v.phaseFlag === 1 &&
                  (v.startDate === '' ||
                    v.endDate === '' ||
                    v.startDate === null ||
                    v.endDate === null)
              );
              // 浮点数校验
              const re = /^[0-9]+.?[0-9]*$/;
              const daysNotNumError = projActivitysByChange.filter(v => !re.test(v.days));
              const eqvaRateNotNumError = projActivitysByChange.filter(v => !re.test(v.eqvaRate));

              if (actNoError.length) {
                createMessage({ type: 'error', description: `请填写活动编号` });
                return 0;
              }
              if (actNameError.length) {
                createMessage({ type: 'error', description: `请填写活动名称` });
                return 0;
              }

              if (phaseFlagDateError.length) {
                createMessage({ type: 'error', description: `请填写活动阶段的起止日期` });
                return 0;
              }
              if (milestoneFlagError.length) {
                createMessage({ type: 'error', description: `请填写是否里程碑` });
                return 0;
              }
              if (phaseFlagError.length) {
                createMessage({ type: 'error', description: `请填写是否阶段` });
                return 0;
              }
              if (fromtmplFlagError.length) {
                createMessage({ type: 'error', description: `请填写模板活动` });
                return 0;
              }
              dispatch({
                type: `${DOMAIN}/save`,
                projId: param.id,
                prcId: param.prcId,
              });
              return Promise.resolve(true);
            }
            return Promise.resolve(true);
          }}
        >
          <Card className="tw-card-adjust" bordered={false}>
            <div className="tw-card-title">项目基本信息</div>
            <DescriptionList size="large" col={2} className={style.fill}>
              {mainFields}
            </DescriptionList>
          </Card>

          <Card className="tw-card-adjust" title={<Title icon="profile" text="变更前的活动管理" />}>
            <EditableDataTable loading={disabledBtn} {...editTableProps} scroll={{ x: 1600 }} />
          </Card>

          <Card className="tw-card-adjust" title={<Title icon="profile" text="变更后的活动管理" />}>
            <EditableDataTable
              loading={disabledBtn}
              {...editTablePropsByChange}
              scroll={{ x: 1600 }}
            />
          </Card>
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default ProjectActivityDetail;
