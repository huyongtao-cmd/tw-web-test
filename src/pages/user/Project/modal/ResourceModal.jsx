/* eslint-disable lines-between-class-members */
/* eslint-disable react/destructuring-assignment */
import React, { PureComponent, Component } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { mapObjIndexed, isNil, isEmpty } from 'ramda';
import { Divider, Input, DatePicker, Icon, Popover, Tooltip, Card, Button } from 'antd';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { createConfirm } from '@/components/core/Confirm';
import FieldList from '@/components/layout/FieldList';
import DataTable from '@/components/common/DataTable';
import { fromQs } from '@/utils/stringUtils';
import { Selection } from '@/pages/gen/field';
import { mountToTab } from '@/layouts/routerControl';
import stylesModel from './ResourceListModal.less';

const { Field, FieldLine } = FieldList;

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
  width: 50,
  render: '',
};
// 动态列数组初始化
let extraCols = [];

/***
 * 资源规划
 */
@connect(({ loading, userResourcePlanning, user, dispatch }) => ({
  loading,
  userResourcePlanning,
  dispatch,
  user,
}))
@mountToTab()
class ResourceModal extends Component {
  constructor(props) {
    super(props);
    const {
      switchWeek,
      userResourcePlanning: { formData, objId, planType },
    } = props;
    const param = fromQs();
    // eslint-disable-next-line prefer-const

    let isDisabledState = true;
    if (!(param?.objId && param?.planType)) {
      param.objId = objId;
      param.planType = planType;
    }
    switchWeek(this.changeDurationWeek);
    if (param.planType === '2') {
      if (
        !formData.startDate ||
        !formData.durationWeek ||
        !formData.isFillTime ||
        (formData.isPmoRes || formData.isAdmin)
      ) {
        isDisabledState = false;
      }
    } else {
      isDisabledState = false;
    }
    this.state = {
      selectedRowKeys: [],
      columnNum: 0, // 记录动态列的数量
      loadingStatus: false,
      isDisabled: isDisabledState,
    };
  }

  componentDidMount() {
    this.props.onRef(this);
    this.queryData();
  }

  queryData = (isPastDate = false) => {
    const {
      dispatch,
      didMountFlag,
      userResourcePlanning: { formData, objId, planType },
    } = this.props;
    const { selectedRowKeys } = this.state;
    const param = fromQs();
    if (!(param?.objId && param?.planType)) {
      if (objId && planType) {
        param.objId = objId;
        param.planType = planType;
        /* eslint-disable no-useless-return */
        if (!didMountFlag) {
          this.queryDataDetail(isPastDate, param);
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
            this.queryDataDetail(isPastDate, param);
          }
        });
      }
    } else if (!didMountFlag) {
      this.queryDataDetail(isPastDate, param);
    }
  };
  queryDataDetail = (isPastDate, param) => {
    const {
      dispatch,
      didMountFlag,
      userResourcePlanning: { isHiddenFlag },
    } = this.props;
    if (isPastDate) {
      dispatch({
        type: `${DOMAIN}/query`,
        payload: { objid: param.objId, planType: param.planType, hiddenFlag: isHiddenFlag },
      }).then(result => {
        // 初始化动态列
        const {
          userResourcePlanning: { formData },
        } = this.props;
        const temp = [];
        if (formData.durationWeek) {
          for (let index = 0; index < parseInt(formData.durationWeek, 10); index += 1) {
            const dataIndex = columnTempl.dataIndex + index;
            const styles = {
              cursor: 'pointer',
            };
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
              width: 50,
            });
          }
        }
        extraCols = temp;
        // dispatch({
        //   type: `${DOMAIN}/updateForm`,
        //   payload: { key: 'durationWeek', value: formData.durationWeek },
        // });
        this.setState({
          columnNum: parseInt(formData.durationWeek, 10),
        });
      });
    } else {
      dispatch({
        type: `${DOMAIN}/query`,
        payload: { objid: param.objId, planType: param.planType, hiddenFlag: isHiddenFlag },
      }).then(result => {
        const {
          userResourcePlanning: { formData },
        } = this.props;
        // 初始化动态列
        const temp = [];
        if (formData.durationWeek) {
          for (let index = 0; index < parseInt(formData.durationWeek, 10); index += 1) {
            const dataIndex = columnTempl.dataIndex + index;
            const styles = {
              cursor: 'pointer',
            };
            if (
              moment(formData.startDate)
                .add(index, 'weeks')
                .startOf('week')
                .format('YYYY-MM-DD') >=
              moment(new Date())
                .startOf('week')
                .format('YYYY-MM-DD')
            ) {
              styles.color = '#008FDB'; // 蓝色
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
                width: 50,
              });
            }
          }
        }
        extraCols = temp;
        // dispatch({
        //   type: `${DOMAIN}/updateForm`,
        //   payload: { key: 'durationWeek', value: formData.durationWeek },
        // });
        this.setState({
          columnNum: parseInt(formData.durationWeek, 10),
        });
        if (param.planType === '2') {
          if (
            !result.startDate ||
            !result.durationWeek ||
            !result.isFillTime ||
            (result.isPmoRes || result.isAdmin)
          ) {
            this.setState({
              isDisabled: false,
            });
          } else {
            this.setState({
              isDisabled: true,
            });
          }
        } else {
          this.setState({
            isDisabled: false,
          });
        }
      });
    }
  };
  // 只能选周一
  disabledDate = current =>
    moment(current).format('YYYY-MM-DD') !==
    moment(current)
      .startOf('week')
      .format('YYYY-MM-DD');

  // 持续周数change事件
  changeDurationWeek = (bool, newDate, weeks) => {
    const {
      dispatch,
      userResourcePlanning: { formData },
    } = this.props;
    const { selectedRowKeys } = this.state;
    const value = weeks || formData.durationWeek;
    const temp = [];
    // 判断value值是否符合要求
    if (!/^([1-9][0-9]{0,1}|100)$/.test(value)) {
      return;
    }
    const startDate = newDate || formData.startDate;
    const render = date => {
      // 表格添加列
      formData.durationWeek = value;
      this.props.ResourceListModal.queryData(formData.durationWeek);
      for (let index = 0; index < parseInt(value, 10); index += 1) {
        const dataIndex = columnTempl.dataIndex + index;
        const styles = {
          cursor: 'pointer',
        };
        if (
          moment(startDate)
            .add(index, 'weeks')
            .startOf('week')
            .format('YYYY-MM-DD') ===
          moment(new Date())
            .startOf('week')
            .format('YYYY-MM-DD')
        ) {
          styles.color = '#f5222d';
        } else {
          styles.color = '#008FDB';
        }
        temp.push({
          ...columnTempl,
          title: (
            <Popover
              content={`${moment(startDate)
                .add(index, 'weeks')
                .format('YYYY-MM-DD')}~${moment(startDate)
                .add(index, 'weeks')
                .add(6, 'days')
                .format('YYYY-MM-DD')}`}
              trigger="hover"
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
          width: 50,
        });
      }
      extraCols = temp;
      // dispatch({
      //   type: `${DOMAIN}/updateForm`,
      //   payload: { key: 'durationWeek', value },
      // });
      this.setState({
        columnNum: parseInt(value, 10),
      });
    };
    bool
      ? createConfirm({
          content: '确定要把周数修改为' + value + '周吗?',
          onOk: () => {
            render();
          },
        })
      : render(startDate);
  };

  render() {
    const {
      loading,
      dispatch,
      form,
      userResourcePlanning: { dataSource, formData, isHiddenFlag, objId, planType },
      form: { getFieldDecorator, setFieldsValue },
      pastDate,
      user,
    } = this.props;
    const {
      user: { extInfo },
    } = user;
    const { selectedRowKeys, columnNum, loadingStatus, isDisabled } = this.state;
    // 获取url上的参数
    const param = fromQs();
    if (!(param?.objId && param?.planType)) {
      param.objId = objId;
      param.planType = planType;
    }
    // 行编辑表格
    const editTableProps = {
      sortBy: 'id',
      rowKey: 'id',
      total: 0,
      dataSource,
      showCopy: false,
      showDelete: false,
      prodSelection: false,
      showExport: false,
      rowClassName: (record, index) => {
        let className;
        if (Number(record.hiddenFlag) === 1) className = stylesModel.tableColorDust;
        return className;
      },
      loading: loading.effects[`${DOMAIN}/query`],
      scroll: { x: 700 + Number(extraCols.length) * 61 },
      enableSelection: false,

      columns: [
        {
          title: '角色',
          dataIndex: 'role',
          width: 130,
          fixed: true,
          align: 'center',
        },
        {
          title: '资源',
          dataIndex: 'resName',
          width: 100,
          fixed: true,
          align: 'center',
        },
        {
          title: '复合能力（系数）',
          dataIndex: 'capasetLevelDesc',
          width: 200,
          fixed: true,
          align: 'center',
        },
        {
          title: '系数',
          dataIndex: 'distributeRate',
          width: 80,
          fixed: true,
          // eslint-disable-next-line no-dupe-keys
          align: 'center',
        },
        {
          title: '总人天',
          dataIndex: 'totalDays',
          align: 'center',
          width: 100,
          fixed: true,
          render: (value, row, index) =>
            !isNil(value) && !isEmpty(value) ? (+value).toFixed(1) : (0).toFixed(1),
        },
        {
          title: '总当量',
          dataIndex: 'totalEqva',
          align: 'center',
          width: 100,
          render: (value, row, index) =>
            !isNil(value) && !isEmpty(value) ? (+value).toFixed(1) : (0).toFixed(1),
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

      leftButtons: [
        {
          key: 'edit',
          className: 'tw-btn-primary',
          title: '编辑明细',
          loading: false,
          hidden: false,
          minSelections: 0,
          cb: (selectedRows, queryParams) => {
            this.props.editModeal();
          },
        },
        {
          key: 'hide',
          className: 'tw-btn-primary',
          title: (pastDate ? '显示' : '隐藏') + '过去日期',
          loading: false,
          hidden: false,
          minSelections: 0,
          cb: (selectedRows, queryParams) => {
            this.props.pastTheDate();
          },
        },
        {
          key: 'show',
          className: 'tw-btn-primary',
          title: isHiddenFlag === 1 ? '取消显示隐藏' : '显示隐藏',
          loading: false,
          hidden: false,
          minSelections: 0,
          cb: (selectedRows, queryParams) => {
            if (isHiddenFlag === 1) {
              dispatch({
                type: `${DOMAIN}/query`,
                payload: { objid: param.objId, planType: param.planType, hiddenFlag: 0 },
              });
            } else {
              dispatch({
                type: `${DOMAIN}/query`,
                payload: { objid: param.objId, planType: param.planType, hiddenFlag: 1 },
              });
            }
          },
        },
      ],
    };
    return (
      <PageHeaderWrapper>
        <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
          <Field
            name="modifyUserIdName"
            label="创建人"
            decorator={{
              initialValue: formData.modifyUserIdName || '',
            }}
          >
            <Input disabled />
          </Field>
          <Field
            name="modifyTime"
            label="资源规划更新日"
            decorator={{
              initialValue: formData.modifyTime || '',
            }}
          >
            <Input disabled />
          </Field>

          <Field
            name="planTypeDesc"
            label="计划类型"
            decorator={{
              initialValue: formData.planTypeDesc || '', // 2表示计划类型为“项目”
            }}
          >
            <Input disabled />
          </Field>

          <Field
            name="objName"
            label="计划对象"
            decorator={{
              initialValue: formData.objName || '',
            }}
          >
            <Input disabled />
          </Field>

          <FieldLine label="开始周（W）" required>
            <Field
              name="startDate"
              decorator={{
                initialValue: (formData.startDate && moment(formData.startDate)) || '',
                rules: [
                  {
                    required: true,
                    message: '请输入开始周（W）',
                  },
                ],
              }}
              wrapperCol={{ span: 23, xxl: 23 }}
            >
              <DatePicker
                disabled={isDisabled}
                disabledDate={this.disabledDate}
                onChange={value => {
                  this.changeDurationWeek(false, value);
                }}
              />
            </Field>
            <Field
              name="startWeek"
              decorator={{
                initialValue:
                  (formData.startDate && moment(formData.startDate).format('YYYYWW')) || '',
              }}
              wrapperCol={{ span: 23, xxl: 23 }}
            >
              <Input placeholder="周数" disabled />
            </Field>
          </FieldLine>
          <FieldLine label="持续周数">
            <Field
              name="durationWeek"
              label=""
              wrapperCol={{ span: 23, xxl: 23 }}
              decorator={{
                initialValue: formData.durationWeek || '',
                rules: [
                  {
                    required: true,
                    message: '请输入持续周数',
                  },
                  {
                    pattern: /^([1-9][0-9]{0,1}|100)$/,
                    message: '持续周数可输入值1-100',
                  },
                ],
              }}
            >
              <Input
                disabled={
                  isDisabled ||
                  (Number(param?.deliResId) !== Number(extInfo?.resId) && extInfo?.resId !== 719)
                }
                addonAfter={
                  <a className="tw-link" onClick={() => this.changeDurationWeek(true)}>
                    <Icon type="plus-circle" style={{ color: 'red' }} />
                  </a>
                }
              />
            </Field>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <span style={{ color: 'red' }}>修改数据后请点击右边'+'</span>
          </FieldLine>

          <FieldLine label="结束周（W）" required>
            <Field
              name="endDate"
              decorator={{
                initialValue:
                  moment(formData.startDate).add(Number(formData.durationWeek || 0), 'weeks') || '',
                rules: [
                  {
                    required: true,
                    message: '请输入结束周（W）',
                  },
                ],
              }}
              wrapperCol={{ span: 23, xxl: 23 }}
            >
              <DatePicker disabled />
            </Field>
            <Field
              name="endWeek"
              decorator={{
                initialValue:
                  moment(formData.startDate)
                    .add(Number(formData.durationWeek || 0), 'weeks')
                    .format('YYYYWW') || '',
              }}
              wrapperCol={{ span: 23, xxl: 23 }}
            >
              <Input placeholder="周数" disabled />
            </Field>
          </FieldLine>

          {param.planType !== '2' && [
            <Field
              name="salePhase"
              label="销售阶段"
              decorator={{
                initialValue: formData.salePhaseDesc || '',
              }}
            >
              <Input disabled />
            </Field>,
            <Field
              name="probability"
              label="成单概率(交付角度)"
              decorator={{
                initialValue: formData.probability || '',
                rules: [
                  {
                    required: false,
                    message: '请选择成单概率',
                  },
                ],
              }}
            >
              <Selection.UDC code="TSK.WIN_PROBABLITY" placeholder="请选择成单概率" />
            </Field>,
          ]}
          <Field
            name="planningStatus"
            label="资源规划状态"
            decorator={{
              initialValue: formData.planningStatus || '',
            }}
          >
            <Selection.UDC disabled code="TSK.PLANNING_STATUS" placeholder="请选择资源规划状态" />
          </Field>
          <Field
            name="remark"
            label="备注"
            decorator={{
              initialValue: formData.remark || '',
              rules: [{ required: false }],
            }}
            fieldCol={1}
            labelCol={{ span: 4, xxl: 3 }}
            wrapperCol={{ span: 19, xxl: 20 }}
          >
            <Input.TextArea placeholder="" rows={2} maxLength={400} />
          </Field>
        </FieldList>
        {param.planType === '1' && (
          <div
            style={{
              marginLeft: '100px',
              width: '78%',
            }}
          >
            <span style={{ color: 'red' }}>
              提示：请交付负责人/签单负责人认真填写资源规划 ，并更新商机当前状态；
            </span>
            <br />
            1、系统会在临近商机预计成单日期的四周之内，触发此流程；
            <br />
            2、如已经创建了资源规划，则会在临近预计入场日期两周之内，再触发此流程；
            <br />
            3、商机销售阶段在提交报价之后，将会要求做资源规划，并且商机资源规划的资源需求，将会按照不同销售阶段和成单概率设定相应的权重，影响公司整体的资源需求计算；
          </div>
        )}
        <Divider dashed />
        <DataTable showSearch={false} {...editTableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default ResourceModal;
