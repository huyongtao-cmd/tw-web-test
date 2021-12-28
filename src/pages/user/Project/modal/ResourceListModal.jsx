/* eslint-disable eqeqeq */
/* eslint-disable no-param-reassign */
/* eslint-disable array-callback-return */
/* eslint-disable prefer-const */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-unneeded-ternary */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-else-return */
import { connect } from 'dva';
import React from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Divider,
  DatePicker,
  Icon,
  Popover,
  InputNumber,
  Checkbox,
} from 'antd';
import FieldList from '@/components/layout/FieldList';
import moment from 'moment';
import { mapObjIndexed, isNil, isEmpty } from 'ramda';
import update from 'immutability-helper';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { createConfirm } from '@/components/core/Confirm';
import createMessage from '@/components/core/AlertMessage';
import EditableDataTable from '@/components/common/EditableDataTable';
import EditTable from '@/components/common/EditTable';
import { genFakeId, mul, add } from '@/utils/mathUtils';
import { fromQs } from '@/utils/stringUtils';
import { Selection } from '@/pages/gen/field';
import { selectCapasetLevel, selectUsersWithBu } from '@/services/gen/list';
import { mountToTab } from '@/layouts/routerControl';
import { isNumber } from 'min-dash';
import stylesModel from './ResourceListModal.less';

const { Field } = FieldList;

const DOMAIN = 'userResourcePlanning';

const applyColumns = [
  { dataIndex: 'code', title: '编号', span: 12 },
  { dataIndex: 'name', title: '名称', span: 12 },
];

// 动态列属性初始化
const columnTempl = {
  title: 'W',
  dataIndex: 'yearWeek_',
  align: 'center',
  width: '50px',
  render: '',
};
// 动态列数组初始化
let extraCols = [];
let etColumns = [];

/***
 * 资源规划-编辑明细
 */
@connect(({ loading, userResourcePlanning, dispatch }) => ({
  loading,
  userResourcePlanning,
  dispatch,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    const key = Object.keys(changedFields)[0];
    const value = Object.values(changedFields)[0];
    if (value) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { key, value: value.value },
      });
    }
  },
})
class ResourceListModal extends React.Component {
  state = {
    selectedRowKeys: [],
    rows: [],
    columnNum: 0, // 记录动态列的数量
    loadingStatus: false,
    editDataTable: false,
    idx: undefined,
    recordId: undefined,
    display: false,
    rowKeys: undefined,
    _rowKeys: undefined,
    planTotalEqva: 0,
    planTotalDays: 0,
  };

  componentDidMount() {
    // eslint-disable-next-line react/destructuring-assignment
    this.props.onRef(this);
    this.queryData();
  }

  queryData = (value = false) => {
    const {
      dispatch,
      didMountFlag = false,
      userResourcePlanning: { formData, objId, planType },
    } = this.props;
    const { selectedRowKeys, editDataTable, idx } = this.state;
    const param = fromQs();
    if (param?.objId && param?.planType && !didMountFlag) {
      this.queryDataDetail(param, value);
    }
    if (!(param?.objId && param?.planType)) {
      if (objId && planType) {
        param.objId = objId;
        param.planType = planType;
        if (!didMountFlag) {
          this.queryDataDetail(param, value);
        }
      } else {
        dispatch({
          type: `${DOMAIN}/getSysAltResPlanningById`,
          payload: {
            id: param.id,
          },
        }).then(response => {
          param.objId = response.data.refId;
          param.planType = response.data.refType;
          if (!didMountFlag) {
            this.queryDataDetail(param, value);
          }
        });
      }
    }
  };

  queryDataDetail = (param, value) => {
    const {
      dispatch,
      didMountFlag,
      // userResourcePlanning: { formData, objId, planType, dataSource },
    } = this.props;
    const { selectedRowKeys, editDataTable, idx } = this.state;

    const {
      userResourcePlanning: { formData, dataSource },
    } = this.props;
    const temp = [];
    const durationWeek = value ? value : formData.durationWeek;
    if (durationWeek) {
      for (let index = 0; index < parseInt(durationWeek, 10); index += 1) {
        const dataIndex = columnTempl.dataIndex + index;
        const styles = {
          cursor: 'pointer',
        };
        if (
          moment(new Date())
            .subtract(2, 'weeks')
            .startOf('week')
            .format('YYYY-MM-DD') <=
          moment(formData.startDate)
            .add(index, 'weeks')
            .startOf('week')
            .format('YYYY-MM-DD')
        ) {
          if (
            moment(formData.startDate)
              .add(index, 'weeks')
              .startOf('week')
              .format('YYYY-MM-DD') ===
            moment(new Date())
              .startOf('week')
              .format('YYYY-MM-DD')
          ) {
            styles.color = '#f5222d'; // 红色
          } else {
            styles.color = '#008FDB'; // 蓝色
          }
          temp.push({
            ...columnTempl,
            title: (
              <Popover
                content={`${moment(formData.startDate)
                  .add(index, 'weeks')
                  .format('YYYY-MM-DD')}~${moment(formData.startDate)
                  .add(index, 'weeks')
                  .add(6, 'days')
                  .format('YYYY-MM-DD')}`}
                trigger="hover"
                startDate={`${moment(formData.startDate)
                  .add(index, 'weeks')
                  .format('YYYY-MM-DD')}`}
              >
                <div style={styles}>
                  <div> {columnTempl.title + (index + 1)}</div>
                  <div>
                    {moment(formData.startDate)
                      .add(index, 'weeks')
                      .startOf('week')
                      .format('MM/DD')}
                  </div>
                </div>
              </Popover>
            ),
            dataIndex: columnTempl.dataIndex + index,
            width: 67,
          });
        }
        etColumns.push({
          ...columnTempl,
          title: (
            <Popover
              content={`${moment(formData.startDate)
                .add(index, 'weeks')
                .format('YYYY-MM-DD')}~${moment(formData.startDate)
                .add(index, 'weeks')
                .add(6, 'days')
                .format('YYYY-MM-DD')}`}
              trigger="hover"
              startDate={`${moment(formData.startDate)
                .add(index, 'weeks')
                .format('YYYY-MM-DD')}`}
            >
              <div style={styles}>
                <div> {columnTempl.title + (index + 1)}</div>
                <div>
                  {moment(formData.startDate)
                    .add(index, 'weeks')
                    .startOf('week')
                    .format('MM/DD')}
                </div>
              </div>
            </Popover>
          ),
          dataIndex: columnTempl.dataIndex + index,
          width: 67,
        });
      }
    }
    extraCols = temp;
    // dispatch({
    //   type: `${DOMAIN}/updateForm`,
    //   payload: { key: 'durationWeek', value: durationWeek },
    // });
    const tt1 = !isEmpty(dataSource)
      ? dataSource.map(v => v.totalEqva).reduce((x, y) => add(x, y))
      : 0;
    const tt2 = !isEmpty(dataSource)
      ? dataSource.map(v => v.totalDays).reduce((x, y) => add(x, y))
      : 0;
    this.setState({
      columnNum: parseInt(durationWeek, 10),
      planTotalEqva: tt1,
      planTotalDays: tt2,
    });
  };

  // 行编辑触发事件
  onCellChanged = (rowIndex, rowField) => rowFieldValue => {
    const {
      userResourcePlanning: { dataSource, formData },
      dispatch,
    } = this.props;

    let totalEqva = 0;
    let totalDays = 0;
    let sum = 0;
    if (rowField.includes('yearWeek')) {
      rowFieldValue = String(rowFieldValue);
    }
    const newDataSource = dataSource;
    newDataSource[rowIndex] = {
      ...newDataSource[rowIndex],
      [rowField]:
        rowFieldValue && rowFieldValue.target ? rowFieldValue.target.value : rowFieldValue,
    };

    if (rowField === 'resId' && rowFieldValue !== null) {
      dispatch({
        type: `${DOMAIN}/getRatioByResId`,
        payload: { resId: rowFieldValue },
      }).then(result => {
        newDataSource[rowIndex].distributeRate = result.datum;
      });
      dispatch({
        type: `${DOMAIN}/getRescapByResId`,
        payload: { resId: rowFieldValue },
      }).then(res => {
        if (res.ok && res.datum.length > 0) {
          newDataSource[rowIndex].capasetLevelId = res.datum[0];
        }
      });
    }

    if (
      rowField === 'capasetLevelId' &&
      rowFieldValue !== null &&
      newDataSource[rowIndex].resId === null
    ) {
      dispatch({
        type: `${DOMAIN}/getRatioByLevelId`,
        payload: { resId: rowFieldValue },
      }).then(result => {
        newDataSource[rowIndex].distributeRate = result.datum;
      });
    }

    // 如果修改的是w之类的
    if (rowField.includes('yearWeek_')) {
      const { distributeRate } = newDataSource[rowIndex];
      if (!isNil(formData.durationWeek)) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < Number(formData.durationWeek); i++) {
          if (
            isNil(newDataSource[rowIndex]['yearWeek_' + i]) ||
            !isNumber(newDataSource[rowIndex]['yearWeek_' + i])
          ) {
            sum += 0;
          } else {
            sum += Number(newDataSource[rowIndex]['yearWeek_' + i]);
          }
        }
        totalDays = sum;
        newDataSource[rowIndex].totalDays = totalDays;
      }
      if (!isNil(distributeRate) && isNumber(distributeRate)) {
        totalEqva = mul(distributeRate, sum).toFixed(1); // 总当量=系数*人天
      }
    } else if (
      rowField.includes('distributeRate') &&
      !isNil(rowFieldValue) &&
      isNumber(rowFieldValue)
    ) {
      // 如果改变的是系数   就要考虑总当量的问题
      totalEqva = mul(rowFieldValue, newDataSource[rowIndex].totalDays).toFixed(1);
    }
    newDataSource[rowIndex].totalEqva = totalEqva;
    const tt1 = newDataSource.map(v => v.totalEqva).reduce((x, y) => add(x, y));
    const tt2 = newDataSource.map(v => v.totalDays).reduce((x, y) => add(x, y));
    this.setState({
      planTotalEqva: tt1,
      planTotalDays: tt2,
    });
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: { dataSource: newDataSource },
    });
  };

  // 编辑明细弹窗保存按钮
  handleSave = isAll => {
    const {
      dispatch,
      userResourcePlanning: { objId, planType },
    } = this.props;
    // 获取url上的参数
    const param = fromQs();
    if (param?.objId && param?.planType) {
      this.queryDetail(param, isAll);
    }
    if (!(param?.objId && param?.planType)) {
      if (objId && planType) {
        param.objId = objId;
        param.planType = planType;
        this.queryDetail(param, isAll);
      } else {
        dispatch({
          type: `${DOMAIN}/getSysAltResPlanningById`,
          payload: {
            id: param.id,
          },
        }).then(response => {
          param.objId = response.data.refId;
          param.planType = response.data.refType;

          this.queryDetail(param, isAll);
        });
      }
    }
  };

  queryDetail = (param, isAll) => {
    // isAll为false的时候走保存，否则走详情
    const {
      dispatch,
      form: { validateFieldsAndScroll },
      userResourcePlanning: { formData, dataSource, objId, planType },
    } = this.props;
    const { idx } = this.state;
    // 校验明细项
    const roleError = dataSource.filter(v => isNil(v.role) || isEmpty(v.role));
    const capasetLevelIdError = dataSource.filter(
      v => isNil(v.capasetLevelId) || isEmpty(v.capasetLevelId)
    );
    // 浮点数校验
    const re = /^[0-9]+.?[0-9]*$/;
    const distributeRateNotNumError = dataSource.filter(
      v => v.distributeRate && !re.test(v.distributeRate)
    );
    if (roleError.length) {
      createMessage({ type: 'error', description: `请填写角色` });
      return;
    }
    if (capasetLevelIdError.length) {
      createMessage({ type: 'error', description: `请填写复合能力（系数）` });
      return;
    }
    if (distributeRateNotNumError.length) {
      createMessage({ type: 'error', description: `派发系数为浮点数` });
      return;
    }

    if (isAll) {
      validateFieldsAndScroll((error, values) => {
        if (!error) {
          dispatch({
            type: `${DOMAIN}/resPlandetail`,
            payload: { planType: dataSource[idx], formData },
          });
        }
      });
    } else {
      validateFieldsAndScroll((error, values) => {
        if (!error) {
          dispatch({
            type: `${DOMAIN}/detailSave`,
            payload: { objid: param.objId, planType: param.planType },
          }).then(() => {
            this.queryData();
            this.setState({
              editDataTable: false,
            });
            this.setState({
              selectedRowKeys: [],
            });
          });
        }
      });
    }
  };

  tan(_selectedRowKeys, selectedRowKeys) {
    this.setState({
      display: true,
      _rowKeys: _selectedRowKeys,
      rowKeys: selectedRowKeys,
    });
  }

  hide(number, selectedRowKeys, _selectedRowKeys) {
    if (number) {
      const {
        dispatch,
        userResourcePlanning: { dataSource },
      } = this.props;
      // 这里过滤数据
      let $selectedRowKeys = null;
      if (isEmpty(_selectedRowKeys)) {
        $selectedRowKeys = selectedRowKeys;
      } else {
        $selectedRowKeys = _selectedRowKeys;
      }

      const checkDatas = dataSource.filter(i => $selectedRowKeys.includes(i.id));
      const timeList = etColumns.filter(
        item =>
          item.title.props.startDate >=
            moment(Date.now())
              .startOf('week')
              .format('YYYY-MM-DD') &&
          item.title.props.startDate <= moment(checkDatas[0].endDate).format('YYYY-MM-DD')
      );
      const dataList = timeList.map(item => item.dataIndex);
      const modifiedSelectedRows = checkDatas
        .map(row =>
          mapObjIndexed((value, key) => {
            if (dataList.indexOf(key) !== -1) {
              return number ? number : value;
            }
            return value;
          }, row)
        )
        .map(row => ({ [row.id]: row }))
        .reduce((prev, curr) => ({ ...prev, ...curr }), {});

      const newDataSource = dataSource.map((item, index) => {
        if ($selectedRowKeys.filter(key => `${key}` === `${item.id}`).length > 0)
          return modifiedSelectedRows[item.id];
        return item;
      });
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          dataSource: newDataSource,
        },
      });
    }
    this.setState({ display: false });
  }

  dialog(sty) {
    const { _rowKeys, rowKeys } = this.state;
    return sty ? (
      <div className={stylesModel.mask}>
        <div className={stylesModel.content}>
          <div className={stylesModel.weekContent}>
            一周
            <input
              style={{ width: '70px', margin: '0 5px 0 5px' }}
              ref={input => {
                this.myInput = input;
              }}
            />
            天
          </div>
          <Button
            style={{ marginLeft: '10px', width: '80px' }}
            type="primary"
            onClick={() => this.hide(this.myInput.value, _rowKeys, rowKeys)}
          >
            {' '}
            保存{' '}
          </Button>
          <Button
            style={{ marginLeft: '20px', width: '80px' }}
            type="primary"
            onClick={() => this.hide()}
          >
            {' '}
            取消{' '}
          </Button>
        </div>
      </div>
    ) : (
      ''
    );
  }

  render() {
    const {
      dispatch,
      loading,
      visible,
      resourceListModal,
      userResourcePlanning: {
        dataSource,
        formData = {},
        abilityList,
        selectSorceList,
        importStatus,
        isHiddenFlag,
        objId,
        planType,
      },
      form: { getFieldDecorator },
    } = this.props;
    const param = fromQs();
    if (!(param?.objId && param?.planType)) {
      param.objId = objId;
      param.planType = planType;
    }
    const {
      selectedRowKeys,
      rows,
      columnNum,
      loadingStatus,
      editDataTable,
      idx,
      recordId,
      display,
      planTotalEqva,
      planTotalDays,
    } = this.state;
    const disabledBtn = loading.effects[`${DOMAIN}/detailSave`];

    extraCols.forEach((item, index) => {
      const dataIndex = item.dataIndex;
      const startDate = item.title.props.startDate;
      if (
        startDate >=
        moment(new Date())
          .startOf('week')
          .format('YYYY-MM-DD')
      ) {
        /* eslint-disable no-shadow */
        item.render = (v, row, i) =>
          editDataTable && recordId === row.id ? (
            <InputNumber
              style={{ width: '50px' }}
              value={row[dataIndex] ? row[dataIndex] : 0}
              size="small"
              min={0}
              onChange={this.onCellChanged(i, dataIndex)}
              onFocus={() => {
                const { id } = row;
                if (selectedRowKeys.indexOf(id) > -1) {
                  // return false;
                } else {
                  this.setState({
                    selectedRowKeys: [id],
                  });
                }
              }}
            />
          ) : (
            row[dataIndex]
          );
      }
    });
    const editTableProps = {
      sortBy: 'id',
      rowKey: 'id',
      total: 0,
      dataSource,
      showCopy: false,
      showDelete: false,
      loading: loading.effects[`${DOMAIN}/query`],
      scroll: { x: 905 + Number(extraCols.length) * 67, y: 420 },
      rowClassName: (record, index) => {
        let className;
        if (Number(record.hiddenFlag) === 1) className = stylesModel.tableColorDust;
        return className;
      },
      rowSelection: {
        selectedRowKeys,
        rows,
        onChange: (_selectedRowKeys, _selectedRows) => {
          this.setState({
            selectedRowKeys: _selectedRowKeys,
            rows: _selectedRows,
          });
        },
      },
      onAdd: newRow => {
        const row = mapObjIndexed((value, key) => {
          if (key.includes('yearWeek')) {
            return '0';
          }
          return value;
        }, newRow);
        const newId1 = genFakeId(-1);
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            dataSource: update(dataSource, {
              $push: [
                {
                  ...row,
                  id: newId1,
                  startDate: formData.startDate,
                  endDate:
                    moment(formData.startDate)
                      .add(Number(formData.durationWeek || 0), 'weeks')
                      .format('YYYY-MM-DD') || '',
                },
              ],
            }),
          },
        });
        this.setState({
          editDataTable: true,
          idx: dataSource.length,
          recordId: newId1,
        });
      },
      columns: [
        {
          title: '角色',
          dataIndex: 'role',
          required: true,
          width: 130,
          fixed: true,
          align: 'center',
          render: (value, row, index) =>
            editDataTable && idx === index ? (
              <Input
                value={value}
                onChange={this.onCellChanged(index, 'role')}
                onFocus={() => {
                  const { id } = row;
                  if (selectedRowKeys.indexOf(id) > -1) {
                    // return false;
                  } else {
                    this.setState({
                      selectedRowKeys: [id],
                    });
                  }
                }}
              />
            ) : (
              value
            ),
        },
        {
          title: '资源',
          dataIndex: 'resId',
          width: 210,
          fixed: true,
          align: 'center',
          render: (value, row, index) => {
            const resName = selectSorceList.filter(v => v.id === value).map(v => v.name);
            return editDataTable && idx === index ? (
              <Selection.Columns
                className={stylesModel.stylesWidth}
                value={isNil(value) || isEmpty(value) ? undefined : +value}
                transfer={{ key: 'id', code: 'id', name: 'name' }}
                columns={applyColumns}
                source={selectSorceList}
                placeholder="请选择资源"
                onChange={this.onCellChanged(index, 'resId')}
                dropdownMatchSelectWidth={false}
                showSearch
                onFocus={() => {
                  const { id } = row;
                  if (selectedRowKeys.indexOf(id) > -1) {
                    // return false;
                  } else {
                    this.setState({
                      selectedRowKeys: [id],
                    });
                  }
                }}
              />
            ) : (
              <span>{resName[0] ? resName[0] : row.resName}</span>
            );
          },
        },
        {
          title: '复合能力（系数）',
          dataIndex: 'capasetLevelId',
          required: true,
          width: 200,
          fixed: true,
          align: 'center',
          render: (value, row, index) => {
            const resName = abilityList.filter(v => v.valCode == value).map(v => v.name);
            return editDataTable && idx === index ? (
              <Selection
                className={stylesModel.stylesModelWidth}
                value={value}
                source={abilityList}
                dropdownMatchSelectWidth={false}
                placeholder="请选择复合能力（系数）"
                onChange={this.onCellChanged(index, 'capasetLevelId')}
              />
            ) : (
              <span>{resName[0] ? resName[0] : row.capasetLevelDesc}</span>
            );
          },
        },
        {
          title: '系数',
          dataIndex: 'distributeRate',
          align: 'center',
          width: 100,
          fixed: true,
          render: (value, row, index) =>
            editDataTable && idx === index ? (
              <InputNumber
                value={value || 0}
                style={{ width: '50px' }}
                min={0}
                precision={1}
                onChange={this.onCellChanged(index, 'distributeRate')}
                onFocus={() => {
                  const { id } = row;
                  if (selectedRowKeys.indexOf(id) > -1) {
                    // return false;
                  } else {
                    this.setState({
                      selectedRowKeys: [id],
                    });
                  }
                }}
              />
            ) : (
              value
            ),
        },
        {
          title: '开始日期',
          dataIndex: 'startDate',
          width: 100,
          align: 'center',
          render: (value, row, index) =>
            editDataTable && idx === index ? (
              <DatePicker
                value={value && moment(value)}
                size="small"
                format="MM-DD"
                onChange={this.onCellChanged(index, 'startDate')}
                onOpenChange={status => {
                  const { id } = row;
                  if (status) {
                    if (selectedRowKeys.indexOf(id) > -1) {
                      // return false;
                    } else {
                      this.setState({
                        selectedRowKeys: [id],
                      });
                    }
                  }
                }}
              />
            ) : (
              value && moment(value).format('MM-DD')
            ),
        },
        {
          title: '结束日期',
          dataIndex: 'endDate',
          width: 100,
          align: 'center',
          render: (value, row, index) =>
            editDataTable && idx === index ? (
              <DatePicker
                value={value && moment(value)}
                size="small"
                format="MM-DD"
                onChange={this.onCellChanged(index, 'endDate')}
                onOpenChange={status => {
                  const { id } = row;
                  if (status) {
                    if (selectedRowKeys.indexOf(id) > -1) {
                      // return false;
                    } else {
                      this.setState({
                        selectedRowKeys: [id],
                      });
                    }
                  }
                }}
              />
            ) : (
              value && moment(value).format('MM-DD')
            ),
        },
        {
          title: '总人天',
          dataIndex: 'totalDays',
          align: 'center',
          width: 100,
          render: (value, row, index) =>
            !isNil(value) && !isEmpty(value) ? (+value).toFixed(2) : (0).toFixed(2),
        },
        {
          title: '总当量',
          width: 100,
          dataIndex: 'totalEqva',
          align: 'center',
          render: (value, row, index) =>
            !isNil(value) && !isEmpty(value) ? (+value).toFixed(2) : (0).toFixed(2),
        },
        ...extraCols,
        {
          title: '',
          dataIndex: 'a',
          align: 'center',
          // width:100,
          render: (value, row, index) => '',
        },
      ],
      buttons: [
        {
          key: 'copy',
          title: '复制',
          loading: false,
          hidden: false,
          className: 'tw-btn-primary',
          // disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          disabled: false,
          minSelections: 1,
          cb: (_selectedRowKeys, selectedRows) => {
            const newId2 = genFakeId(-1);
            const dataList = extraCols.map(item => item.dataIndex);
            dataList.splice(0, 2);
            const modifiedSelectedRows = selectedRows.map(row =>
              mapObjIndexed((value, key) => {
                if (key.includes('yearWeek')) {
                  if (dataList.indexOf(key) !== -1) {
                    return value;
                  } else {
                    return '0';
                  }
                }
                return value;
              }, row)
            );
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                dataSource: update(dataSource, {
                  $push: [
                    {
                      ...modifiedSelectedRows[0],
                      id: newId2,
                      resId: null,
                      resName: null,
                    },
                  ],
                }),
              },
            });
            this.setState({
              editDataTable: true,
              idx: dataSource.length,
              recordId: newId2,
            });
          },
        },
        {
          key: 'import',
          title: '导入项目成员',
          loading: loadingStatus,
          hidden: param.planType === '1',
          className: 'tw-btn-primary',
          disabled: false,
          minSelections: 0,
          cb: (_selectedRowKeys, selectedRows) => {
            createConfirm({
              content: '确定要导入项目成员吗?',
              onOk: () => {
                // 请求项目成员接口
                const { objId } = fromQs();
                this.setState(
                  {
                    loadingStatus: true,
                  },
                  () => {
                    dispatch({
                      type: `${DOMAIN}/projectShList`,
                      payload: { sortBy: 'id', sortDirection: 'DESC', projId: objId, limit: 0 },
                    }).then(({ ok }) => {
                      if (ok) {
                        this.setState({
                          loadingStatus: false,
                        });
                      }
                    });
                  }
                );
              },
            });
          },
        },
        // {
        //   key: 'changeHistory',
        //   title: '从商机导入',
        //   loading: loadingStatus,
        //   hidden: param.planType === '1',
        //   className: 'tw-btn-primary',
        //   disabled: false,
        //   minSelections: 0,
        //   cb: (_selectedRowKeys, selectedRows) => {
        //     createConfirm({
        //       content: '此操作会将原有数据清除，确定导入吗?',
        //       onOk: () => {
        //         dispatch({
        //           type: `${DOMAIN}/getBusinessData`,
        //           payload: {
        //             id: param.id,
        //           },
        //         }).then(response => {
        //           if (response.ok) {
        //             const planningTitle = response.datum.planningTitle || [];
        //             const details = response.datum.details || [];
        //             const newFormData = { ...formData, durationWeek: planningTitle.durationWeek };
        //             const newDataSource = [...details];
        //             dispatch({
        //               type: `${DOMAIN}/updateState`,
        //               payload: { formData: newFormData, dataSource: newDataSource },
        //             });
        //             const { weekSwitch } = this.state;
        //             weekSwitch(false, null, planningTitle.durationWeek);
        //           } else {
        //             createMessage({
        //               type: 'error',
        //               description: response.reason || '项目对应的商机不存在',
        //             });
        //           }
        //           this.setState({ btnDisabled: false });
        //         });
        //       },
        //     });
        //   },
        // },
        {
          key: 'week',
          title: '一周N天',
          loading: false,
          hidden: false,
          className: 'tw-btn-primary',
          // disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          disabled: false,
          minSelections: 1,
          cb: (_selectedRowKeys, selectedRows) => {
            this.tan(_selectedRowKeys, selectedRowKeys);
          },
        },
        {
          key: 'clearWeek',
          title: '清空',
          loading: false,
          hidden: false,
          className: 'tw-btn-primary',
          // disabled: () => selectedRowKeys.length < 1,
          disabled: false,
          minSelections: 1,
          cb: (_selectedRowKeys, selectedRows) => {
            let $selectedRowKeys = null;
            if (isEmpty(_selectedRowKeys)) {
              $selectedRowKeys = selectedRowKeys;
            } else {
              $selectedRowKeys = _selectedRowKeys;
            }
            const checkDatas = dataSource.filter(i => $selectedRowKeys.includes(i.id));
            const dataList = extraCols.map(item => item.dataIndex);
            dataList.splice(0, 2);
            const modifiedSelectedRows = checkDatas
              .map(row =>
                mapObjIndexed((value, key) => {
                  if (dataList.indexOf(key) !== -1) {
                    return '0';
                  }
                  return value;
                }, row)
              )
              .map(row => ({ [row.id]: row }))
              .reduce((prev, curr) => ({ ...prev, ...curr }), {});

            const newDataSource = dataSource.map((item, index) => {
              if ($selectedRowKeys.filter(key => `${key}` === `${item.id}`).length > 0)
                return modifiedSelectedRows[item.id];
              return item;
            });

            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                dataSource: newDataSource,
              },
            });
          },
        },
        {
          key: 'deletes',
          title: '删除',
          loading: false,
          hidden: false,
          disabled: false,
          className: 'tw-btn-error',
          minSelections: 1,
          cb: (_selectedRowKeys, selectedRows) => {
            let $selectedRowKeys = null;
            if (isEmpty(_selectedRowKeys)) {
              $selectedRowKeys = selectedRowKeys;
            } else {
              $selectedRowKeys = _selectedRowKeys;
            }
            const checkDatas = dataSource.filter(i => $selectedRowKeys.includes(i.id));
            const timeList = etColumns.filter(
              item => moment(new Date()).format('YYYY-MM-DD') > item.title.props.startDate
            );
            const dataList = timeList.map(item => item.dataIndex);
            let tt = [];
            dataList.forEach(v => {
              checkDatas.map(i => tt.push(i[v]));
            });
            if (checkDatas[0].id < 0 || tt.every(v => Number(v) === 0)) {
              const newDataSource = dataSource.filter(
                row => !$selectedRowKeys.filter(keyValue => keyValue === row.id).length
              );
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  dataSource: newDataSource.map((item, index) => ({ ...item })),
                  deleteList: $selectedRowKeys,
                },
              });
              this.setState({
                selectedRowKeys: [],
              });
            } else {
              // 使用方法1
              createMessage({
                type: 'warn',
                description: '过去存在资源规划',
              });
            }
          },
        },
        {
          key: 'conceal',
          title: '隐藏',
          loading: false,
          hidden: rows.some(item => Number(item.hiddenFlag) === 1) || selectedRowKeys.length < 1,
          className: 'tw-btn-primary',
          disabled: false,
          minSelections: 0,
          cb: (_selectedRowKeys, selectedRows) => {
            let $selectedRowKeys = null;
            if (isEmpty(_selectedRowKeys)) {
              $selectedRowKeys = selectedRowKeys;
            } else {
              $selectedRowKeys = _selectedRowKeys;
            }
            dispatch({
              type: `${DOMAIN}/resHiddenrole`,
              payload: {
                roleIds: $selectedRowKeys,
                hiddenFlag: 1,
              },
            }).then(() => {
              dispatch({
                type: `${DOMAIN}/query`,
                payload: {
                  objid: param.objId,
                  planType: param.planType,
                  hiddenFlag: isHiddenFlag,
                },
              });
            });
            this.setState({
              selectedRowKeys: [],
            });
          },
        },
        {
          key: 'noConceal',
          title: '取消隐藏',
          loading: false,
          hidden: rows.some(item => Number(item.hiddenFlag) === 0) || selectedRowKeys.length < 1,
          className: 'tw-btn-primary',
          disabled: false,
          minSelections: 0,
          cb: (_selectedRowKeys, selectedRows) => {
            let $selectedRowKeys = null;
            if (isEmpty(_selectedRowKeys)) {
              $selectedRowKeys = selectedRowKeys;
            } else {
              $selectedRowKeys = _selectedRowKeys;
            }
            dispatch({
              type: `${DOMAIN}/resHiddenrole`,
              payload: {
                roleIds: $selectedRowKeys,
                hiddenFlag: 0,
              },
            }).then(() => {
              dispatch({
                type: `${DOMAIN}/query`,
                payload: {
                  objid: param.objId,
                  planType: param.planType,
                  hiddenFlag: isHiddenFlag,
                },
              });
            });
            this.setState({
              selectedRowKeys: [],
            });
          },
        },
      ],
      dataTable: (bool, record, editIndex) => {
        this.setState({
          editDataTable: bool,
          idx: editIndex,
          recordId: record.id,
        });
      },
    };
    return (
      <Modal
        title="编辑"
        visible={visible}
        bodyStyle={{ height: '100%' }}
        width="90%"
        onCancel={resourceListModal}
        footer={null}
        style={{ height: '800px' }}
      >
        <Card className="tw-card-adjust" bordered={false}>
          <Button
            style={{ marginRight: '10px' }}
            type="primary"
            disabled={disabledBtn}
            onClick={() => {
              this.handleSave(false);
            }}
          >
            保存
          </Button>
          <Button type="primary" onClick={resourceListModal}>
            关闭
          </Button>
          <span style={{ marginLeft: '15px' }}>
            显示隐藏
            <Checkbox
              style={{ marginLeft: '5px' }}
              checked={isHiddenFlag === 1}
              onChange={e => {
                const {
                  target: { checked },
                } = e;
                if (checked) {
                  dispatch({
                    type: `${DOMAIN}/query`,
                    payload: {
                      objid: param.objId,
                      planType: param.planType,
                      hiddenFlag: 1,
                    },
                  });
                } else {
                  dispatch({
                    type: `${DOMAIN}/query`,
                    payload: {
                      objid: param.objId,
                      planType: param.planType,
                      hiddenFlag: 0,
                    },
                  });
                }
              }}
            />
          </span>
          <span style={{ marginLeft: '30px' }}>预算人天: {formData.totalDays || 0}</span>
          <span style={{ marginLeft: '10px' }}>规划人天: {planTotalDays || 0}</span>
          <span style={{ marginLeft: '30px' }}>预算当量: {formData.totalEqva || 0}</span>
          <span style={{ marginLeft: '10px' }}>规划当量: {planTotalEqva || 0}</span>
          <EditTable {...editTableProps} />
          <div>{this.dialog(display)}</div>
        </Card>
      </Modal>
    );
  }
}

export default ResourceListModal;
