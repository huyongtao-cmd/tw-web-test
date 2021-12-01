import React from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { isEmpty } from 'ramda';
import { Modal, Form, Icon, Table, Card } from 'antd';
import update from 'immutability-helper';
import { createConfirm } from '@/components/core/Confirm';
import SearchTable, { DataOutput } from '@/components/production/business/SearchTable';
import EditTable from '@/components/production/business/EditTable';
import FormItem from '@/components/production/business/FormItem';
import Link from '@/components/production/basic/Link';
import ExcelImportExport from '@/components/common/ExcelImportExport';
import BaseSelect from '@/components/production/basic/BaseSelect';
import createMessage from '@/components/core/AlertMessage';
import { fromQs } from '@/utils/production/stringUtil';
import { outputHandle } from '@/utils/production/outputUtil';
import CommunicationModel from '@/pages/workTable/Schedule/components/communicationModel';
import UpdateScheduleStatus from '@/pages/workTable/Schedule/components/updateStatusModel';
import ResourceModel from '@/pages/workTable/Schedule/components/resourceModel';
import { genFakeId } from '@/utils/production/mathUtils.ts';
import {
  schedulePagingRq,
  scheduleDeleteRq,
  schedulePartialRq,
  scheduleStatusOverallRq,
  roleSelectRq,
  projectPermissionRq,
} from '@/services/workbench/project';

const DOMAIN = 'projectMgmtListEdit';

@connect(({ projectMgmtListEdit }) => ({
  ...projectMgmtListEdit,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      if (Array.isArray(tempValue)) {
        tempValue.forEach((temp, index) => {
          Object.keys(temp).forEach(detailKey => {
            fields[`${key}[${index}].${detailKey}`] = Form.createFormField({
              value: temp[detailKey],
            });
          });
        });
      } else {
        fields[key] = Form.createFormField({ value: tempValue });
      }
    });
    return fields;
  },
  onValuesChange(props, changedValues, allValues) {
    if (isEmpty(changedValues)) return;
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    const newFieldData = { [name]: value };

    switch (name) {
      default:
        break;
    }
    props.dispatch({
      type: `projectMgmtListEdit/updateFormForEditTable`,
      payload: newFieldData,
    });
  },
})
class index extends React.Component {
  state = {
    ReVisible: false, //控制资源弹窗
    comVisible: false, // 控制指派沟通记录弹窗
    scheduleId: undefined, //操作排期行的id
    statusVisible: false, //控制修改状态弹窗
    exportVisible: false, //控制导入排期弹窗
    scheduleIdList: [], //批量修改状态的idList
    commType: '', //沟通类型
    failedList: [],
    uploading: false,
  };

  componentDidMount() {
    const { id } = this.props;
    id && this.getprojectPermission();
    this.callModelEffects('getSupplierOptions');
    // const formMode =
    // mode === 'edit' || mode === 'ADD' || mode === 'EDIT' || !mode ? 'EDIT' : 'DESCRIPTION';
    // this.updateModelState({ formMode, id });
  }

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  /**
   * 修改model层state
   * 这个方法是仅是封装一个小方法,后续修改model的state时不需要每次都解构dispatch
   * @param params state参数
   */
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  clearState = () => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/cleanState`,
    });
  };

  fetchData = async params => {
    //查询排期列表信息
    const { id } = fromQs();
    if (id) {
      const { response } = await schedulePagingRq({ ...params, projectId: id });
      return response.data;
    }
    return [];
  };

  deleteData = async (
    keys //删除排期列表信息
  ) => outputHandle(scheduleDeleteRq, { ids: keys.join(',') }, undefined, false);

  schedulePartial = async params => {
    const { response } = await scheduleStatusOverallRq(params);
    if (response.ok) {
      const { getInternalState } = this.state;
      getInternalState().refreshData();
    }
  };

  handleUpload = fileList => {
    this.setState({
      uploading: true,
    });
    const fileData = new FormData();
    fileList.forEach(file => {
      fileData.append('scheduleExcel', file);
    });
    const {
      dispatch,
      formData: { scheduleList },
      id,
    } = this.props;
    dispatch({
      type: `${DOMAIN}/upload`,
      payload: fileData,
    }).then(res => {
      if (res.ok && res.data.length > 0) {
        const arr = res.data.map(item => ({
          ...item,
          id: genFakeId(-1),
          projectId: id,
        }));
        dispatch({
          type: `projectMgmtListEdit/updateForm`,
          payload: {
            scheduleList: update(scheduleList, {
              $push: [...arr],
            }),
          },
        });
      }
      this.exportToggleVisible();
    });
  };

  exportToggleVisible = () => {
    const { exportVisible } = this.state;
    this.setState({ exportVisible: !exportVisible });
  };

  toggleVisible = () => {
    this.setState({
      comVisible: false,
      statusVisible: false,
      ReVisible: false,
    });
  };

  getprojectPermission = async params => {
    //查询角色项目权限信息
    const { id } = this.props;
    const {
      response: {
        data: { permissionCode },
        ok,
      },
    } = await projectPermissionRq({ ...params, projectId: id });
    if (ok) {
      this.updateModelState({ permissionCode });
    }
  };

  handleOK = flag => {
    //所有弹窗点击确定关闭弹窗刷新排期列表
    if (flag) {
      this.toggleVisible();
      // const { getInternalState } = this.state;
      // getInternalState().refreshData();
    }
  };

  Assign = (idList, type) => {
    //指派
    this.setState({
      comVisible: true,
      scheduleIdList: idList,
      commType: type,
    });
  };

  scheduleDetail = i => {
    //根据点击的排期行的id调用排期组件查询详情
    const { id } = fromQs();
    const mode = id ? 'EDIT' : 'ADD';
    router.push(`/workTable/projectMgmt/schedule?scheduleId=${i}&projectId=${id}&mode=${mode}`);
    // router.push(`/workTable/projectMgmt/schedule?id=${scheduleId}&projectId=${id}`);
    // this.setState({visible:true})
    // this.child.queryDetail(id)
  };

  render() {
    const {
      comVisible,
      scheduleId,
      statusVisible,
      scheduleIdList,
      ReVisible,
      projectPermission,
      commType,
      exportVisible,
      failedList,
      uploading,
    } = this.state;
    const {
      formData: { scheduleList, deleteKeys },
      form,
      formMode,
      dispatch,
      supplierOptions,
      permissionCode,
      mode,
      taskId,
      currentNode,
    } = this.props;
    const { getInternalState } = this.state;
    const cusStatusFlag = permissionCode.indexOf('CUS_STATUS_BATCH') !== -1 ? [] : ['IS_CONFIRM'];
    const innStatusFlag = permissionCode.indexOf('INN_STATUS_BATCH') !== -1 ? [] : ['IS_CONFIRM'];
    const purStatusFlag = permissionCode.indexOf('PUR_STATUS_BATCH') !== -1 ? [] : ['IS_CONFIRM'];
    const baseColumns = [
      {
        title: '排期编号',
        width: 50,
        dataIndex: 'scheduleNo',
        align: 'center',
        render: (value, row, i) => (
          // if (taskId) {
          //   return value;
          // }
          <Link onClick={() => this.scheduleDetail(row.id)}>{value}</Link>
        ),

        // !taskId ?(<Link onClick={() => this.scheduleDetail(row.id)}>{value}</Link>):({value})
      },
      {
        title: '供应商',
        width: 300,
        dataIndex: 'supAbNoDesc',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseSelect"
            fieldKey={`scheduleList[${i}].supAbNoDesc`}
            options={supplierOptions}
          />
        ),
      },
      {
        title: '资源编号',
        width: 150,
        dataIndex: 'resourceNo',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`scheduleList[${i}].resourceNo`}
            disabled
            addonAfter={
              <a
                className="tw-link-primary"
                onClick={() => {
                  this.setState(
                    {
                      scheduleId: row.id,
                    },
                    () => {
                      this.setState({
                        ReVisible: true,
                      });
                    }
                  );
                }}
              >
                <Icon type="search" />
              </a>
            }
          />
        ),
      },
      {
        title: '资源名称',
        width: 200,
        dataIndex: 'resourceName',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`scheduleList[${i}].resourceName`}
            disabled
          />
        ),
      },
      {
        title: '资源位置',
        width: 200,
        dataIndex: 'location',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`scheduleList[${i}].location`}
            disabled
          />
        ),
      },
      {
        title: '投放单位',
        width: 100,
        dataIndex: 'putUnit',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseSelect"
            parentKey="PRO:PUT_UNIT"
            fieldKey={`scheduleList[${i}].putUnit`}
          />
        ),
      },
      {
        title: '投放数量',
        width: 100,
        dataIndex: 'putNumber',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseInputNumber"
            fieldKey={`scheduleList[${i}].putNumber`}
            onBlur={() => {
              const list = scheduleList;
              list[i].cusTotalNetPrice =
                row.cusPublishedPrice &&
                row.cusDiscount &&
                row.putNumber &&
                row.cusPublishedPrice * row.cusDiscount * row.putNumber;
              list[i].purTotalNetPrice =
                row.purPublishedPrice &&
                row.purDiscount &&
                row.putNumber &&
                row.purPublishedPrice * row.purDiscount * row.putNumber;
              list[i].innTotalNetPrice =
                row.innPublishedPrice &&
                row.innDiscount &&
                row.putNumber &&
                row.innPublishedPrice * row.innDiscount * row.putNumber;
              list[i].grossProfit = //毛利
                row.cusPublishedPrice &&
                row.cusDiscount &&
                row.purPublishedPrice &&
                row.purDiscount &&
                row.putNumber &&
                (row.cusPublishedPrice * row.cusDiscount -
                  row.purPublishedPrice * row.purDiscount) *
                  row.putNumber;
              this.callModelEffects('updateForm', { scheduleList: list });
            }}
          />
        ),
      },
      {
        title: '开始日期',
        width: 150,
        dataIndex: 'startDate',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`scheduleList[${i}].startDate`}
          />
        ),
      },
      {
        title: '截止日期',
        width: 150,
        dataIndex: 'endDate',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseDatePicker"
            fieldKey={`scheduleList[${i}].endDate`}
          />
        ),
      },
      (mode === 'ADD' || permissionCode.indexOf('CUS_QUOTE') !== -1) && {
        title: '客户报价',
        children: [
          {
            title: '刊例价',
            width: 100,
            dataIndex: 'cusPublishedPrice',
            render: (val, row, i) => (
              <FormItem
                form={form}
                fieldType="BaseInputAmt"
                fieldKey={`scheduleList[${i}].cusPublishedPrice`}
                disabled={row.cusStatus === 'IS_CONFIRM'}
                onBlur={() => {
                  const list = scheduleList;
                  list[i].cusNetPrice = //客户报价净价
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.cusPublishedPrice * row.cusDiscount;
                  list[i].cusTotalNetPrice = //客户报价总净价
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.putNumber &&
                    row.cusPublishedPrice * row.cusDiscount * row.putNumber;
                  list[i].priceDiffer = //价差
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.purPublishedPrice &&
                    row.purDiscount &&
                    row.cusPublishedPrice * row.cusDiscount -
                      row.purPublishedPrice * row.purDiscount;
                  list[i].grossProfit = //毛利
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.purPublishedPrice &&
                    row.purDiscount &&
                    row.putNumber &&
                    (row.cusPublishedPrice * row.cusDiscount -
                      row.purPublishedPrice * row.purDiscount) *
                      row.putNumber;
                  this.callModelEffects('updateForm', { scheduleList: list });
                }}
              />
            ),
          },
          {
            title: '折扣',
            width: 100,
            dataIndex: 'cusDiscount',
            render: (val, row, i) => (
              <FormItem
                form={form}
                fieldType="BaseInputNumber"
                fieldKey={`scheduleList[${i}].cusDiscount`}
                disabled={row.cusStatus === 'IS_CONFIRM'}
                onBlur={() => {
                  const list = scheduleList;
                  list[i].cusNetPrice =
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.cusPublishedPrice * row.cusDiscount;
                  list[i].cusTotalNetPrice =
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.putNumber &&
                    row.cusPublishedPrice * row.cusDiscount * row.putNumber;
                  list[i].priceDiffer = //价差
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.purPublishedPrice &&
                    row.purDiscount &&
                    row.cusPublishedPrice * row.cusDiscount -
                      row.purPublishedPrice * row.purDiscount;
                  list[i].grossProfit = //毛利
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.purPublishedPrice &&
                    row.purDiscount &&
                    row.putNumber &&
                    (row.cusPublishedPrice * row.cusDiscount -
                      row.purPublishedPrice * row.purDiscount) *
                      row.putNumber;
                  this.callModelEffects('updateForm', { scheduleList: list });
                }}
              />
            ),
          },
          {
            title: '净价',
            width: 100,
            dataIndex: 'cusNetPrice',
            render: (val, row, i) => (
              <FormItem
                form={form}
                fieldType="BaseInputAmt"
                fieldKey={`scheduleList[${i}].cusNetPrice`}
                disabled
              />
            ),
          },
          {
            title: '总净价',
            width: 100,
            dataIndex: 'cusTotalNetPrice',
            render: (val, row, i) => (
              <FormItem
                form={form}
                fieldType="BaseInputAmt"
                fieldKey={`scheduleList[${i}].cusTotalNetPrice`}
                disabled
              />
            ),
          },
          {
            title: '状态',
            width: 100,
            dataIndex: 'cusStatus',
            render: (val, row, i) => (
              <FormItem
                form={form}
                fieldType="BaseSelect"
                parentKey="PRO:SCHEDULE_STATUS"
                fieldKey={`scheduleList[${i}].cusStatus`}
                disabledOptions={cusStatusFlag}
                disabled={
                  row.cusStatus === 'IS_CONFIRM' &&
                  permissionCode.indexOf('CUS_STATUS_BATCH') === -1
                }
              />
            ),
          },
        ],
      },
      mode !== 'ADD' &&
        permissionCode.indexOf('INN_QUOTE') !== -1 && {
          title: '内部报价',
          children: [
            {
              title: '刊例价',
              width: 100,
              dataIndex: 'innPublishedPrice',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputAmt"
                  fieldKey={`scheduleList[${i}].innPublishedPrice`}
                  disabled={row.innStatus === 'IS_CONFIRM'}
                  onBlur={() => {
                    const list = scheduleList;
                    list[i].innNetPrice =
                      row.innPublishedPrice &&
                      row.innDiscount &&
                      row.innPublishedPrice * row.innDiscount;
                    list[i].innTotalNetPrice =
                      row.innPublishedPrice &&
                      row.innDiscount &&
                      row.putNumber &&
                      row.innPublishedPrice * row.innDiscount * row.putNumber;
                    this.callModelEffects('updateForm', { scheduleList: list });
                  }}
                />
              ),
            },
            {
              title: '折扣',
              width: 100,
              dataIndex: 'innDiscount',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputNumber"
                  fieldKey={`scheduleList[${i}].innDiscount`}
                  disabled={row.innStatus === 'IS_CONFIRM'}
                  onBlur={() => {
                    const list = scheduleList;
                    list[i].innNetPrice =
                      row.innPublishedPrice &&
                      row.innDiscount &&
                      row.innPublishedPrice * row.innDiscount;
                    list[i].innTotalNetPrice =
                      row.innPublishedPrice &&
                      row.innDiscount &&
                      row.putNumber &&
                      row.innPublishedPrice * row.innDiscount * row.putNumber;
                    this.callModelEffects('updateForm', { scheduleList: list });
                  }}
                />
              ),
            },
            {
              title: '净价',
              width: 100,
              dataIndex: 'innNetPrice',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputAmt"
                  fieldKey={`scheduleList[${i}].innNetPrice`}
                  disabled
                />
              ),
            },
            {
              title: '总净价',
              width: 100,
              dataIndex: 'innTotalNetPrice',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputAmt"
                  fieldKey={`scheduleList[${i}].innTotalNetPrice`}
                  disabled
                />
              ),
            },
            {
              title: '状态',
              width: 100,
              dataIndex: 'innStatus',
              render: (value, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseSelect"
                  parentKey="PRO:SCHEDULE_STATUS"
                  fieldKey={`scheduleList[${i}].innStatus`}
                  disabledOptions={innStatusFlag}
                  disabled={
                    row.innStatus === 'IS_CONFIRM' &&
                    permissionCode.indexOf('INN_STATUS_BATCH') === -1
                  }
                />
              ),
            },
          ],
        },
      mode !== 'ADD' &&
        permissionCode.indexOf('PUR_QUOTE') !== -1 && {
          title: '采购报价',
          children: [
            {
              title: '刊例价',
              width: 100,
              dataIndex: 'purPublishedPrice',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputAmt"
                  fieldKey={`scheduleList[${i}].purPublishedPrice`}
                  disabled={row.purStatus === 'IS_CONFIRM'}
                  onBlur={() => {
                    const list = scheduleList;
                    list[i].purNetPrice =
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.purPublishedPrice * row.purDiscount;
                    list[i].purTotalNetPrice =
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.putNumber &&
                      row.purPublishedPrice * row.purDiscount * row.putNumber;
                    list[i].priceDiffer = //价差
                      row.cusPublishedPrice &&
                      row.cusDiscount &&
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.cusPublishedPrice * row.cusDiscount -
                        row.purPublishedPrice * row.purDiscount;
                    list[i].grossProfit = //毛利
                      row.cusPublishedPrice &&
                      row.cusDiscount &&
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.putNumber &&
                      (row.cusPublishedPrice * row.cusDiscount -
                        row.purPublishedPrice * row.purDiscount) *
                        row.putNumber;
                    this.callModelEffects('updateForm', { scheduleList: list });
                  }}
                />
              ),
            },
            {
              title: '折扣',
              width: 100,
              dataIndex: 'purDiscount',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputNumber"
                  fieldKey={`scheduleList[${i}].purDiscount`}
                  disabled={row.purStatus === 'IS_CONFIRM'}
                  onBlur={() => {
                    const list = scheduleList;
                    list[i].purNetPrice =
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.purPublishedPrice * row.purDiscount;
                    list[i].purTotalNetPrice =
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.putNumber &&
                      row.purPublishedPrice * row.purDiscount * row.putNumber;
                    list[i].priceDiffer = //价差
                      row.cusPublishedPrice &&
                      row.cusDiscount &&
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.cusPublishedPrice * row.cusDiscount -
                        row.purPublishedPrice * row.purDiscount;
                    list[i].grossProfit = //毛利
                      row.cusPublishedPrice &&
                      row.cusDiscount &&
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.putNumber &&
                      (row.cusPublishedPrice * row.cusDiscount -
                        row.purPublishedPrice * row.purDiscount) *
                        row.putNumber;
                    this.callModelEffects('updateForm', { scheduleList: list });
                  }}
                />
              ),
            },
            {
              title: '净价',
              width: 100,
              dataIndex: 'purNetPrice',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputAmt"
                  fieldKey={`scheduleList[${i}].purNetPrice`}
                  disabled
                />
              ),
            },
            {
              title: '总净价',
              width: 100,
              dataIndex: 'purTotalNetPrice',
              render: (val, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseInputAmt"
                  fieldKey={`scheduleList[${i}].purTotalNetPrice`}
                  disabled
                />
              ),
            },
            {
              title: '状态',
              width: 100,
              dataIndex: 'purStatus',
              render: (value, row, i) => (
                <FormItem
                  form={form}
                  fieldType="BaseSelect"
                  parentKey="PRO:SCHEDULE_STATUS"
                  fieldKey={`scheduleList[${i}].purStatus`}
                  disabledOptions={purStatusFlag}
                  disabled={
                    row.purStatus === 'IS_CONFIRM' &&
                    permissionCode.indexOf('PUR_STATUS_BATCH') === -1
                  }
                />
              ),
            },
          ],
        },
      permissionCode.indexOf('TOP_PRICE') !== -1 && {
        title: '价差',
        width: 100,
        dataIndex: 'priceDiffer',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`scheduleList[${i}].priceDiffer`}
            disabled
          />
        ),
      },
      permissionCode.indexOf('TOP_PRICE') !== -1 && {
        title: '毛利',
        width: 100,
        dataIndex: 'grossProfit',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseInput"
            fieldKey={`scheduleList[${i}].grossProfit`}
            disabled
          />
        ),
      },
      mode !== 'ADD' &&
        permissionCode.indexOf('PUR_COMM') !== -1 && {
          title: '采购指派',
          width: 100,
          dataIndex: 'purchasePointResId',
          render: (val, row, i) => (
            <FormItem
              form={form}
              fieldType="ResSimpleSelect"
              fieldKey={`scheduleList[${i}].purchasePointResId`}
              disabled
            />
          ),
        },
      (mode === 'ADD' || permissionCode.indexOf('CUS_COMM') !== -1) && {
        title: '销售指派',
        width: 100,
        dataIndex: 'salesPointResId',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="ResSimpleSelect"
            fieldKey={`scheduleList[${i}].salesPointResId`}
            disabled
          />
        ),
      },
      {
        title: '备注',
        width: 300,
        dataIndex: 'remark',
        render: (val, row, i) => (
          <FormItem
            form={form}
            fieldType="BaseInputTextArea"
            fieldKey={`scheduleList[${i}].remark`}
            initialValue={null}
          />
        ),
      },
      currentNode !== 'check' && {
        title: '操作',
        width: 300,
        render: (value, row, i) => (
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {(mode === 'ADD' || permissionCode.indexOf('CUS_COMM') !== -1) && (
              <a
                onClick={() => {
                  this.Assign([row.id], 'SALE');
                }}
              >
                销售沟通
              </a>
            )}
            {permissionCode.indexOf('PUR_COMM') !== -1 && (
              <a
                onClick={() => {
                  this.Assign([row.id], 'PUR');
                }}
              >
                采购沟通
              </a>
            )}
          </div>
        ),
      },
    ].filter(Boolean);
    const extraButtons = [
      // {
      //   key: 'edit',
      //   title: '编辑/详情',
      //   type: 'info',
      //   loading: false,
      //   cb: internalState => {
      //     // eslint-disable-next-line no-console
      //     // 获得刷新数据方法，并且刷新数据
      //     const { selectedRows } = internalState;
      //     const tt = selectedRows.map(item => item.id);
      //     this.scheduleDetail(...tt);
      //   },
      //   disabled: internalState => {
      //     const { selectedRows } = internalState;
      //     if (selectedRows.length === 1) {
      //       return false;
      //     }
      //     return true;
      //   },
      // },
      {
        key: 'import',
        title: '导入订单排期',
        type: 'info',
        loading: false,
        cb: internalState => {
          this.setState({ exportVisible: true });
        },
      },
      (permissionCode.indexOf('PUR_STATUS_BATCH') !== -1 ||
        permissionCode.indexOf('CUS_STATUS_BATCH') !== -1 ||
        permissionCode.indexOf('INN_STATUS_BATCH') !== -1 ||
        mode === 'ADD') && {
        key: 'updateStatus',
        title: '批量更新状态',
        type: 'info',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          // 获得刷新数据方法，并且刷新数据
          const { selectedRows } = internalState;
          const tt = selectedRows.map(item => item.id);
          this.setState({
            scheduleIdList: tt,
            statusVisible: true,
          });
        },
        disabled: internalState => {
          const { selectedRows } = internalState;
          if (selectedRows.length > 1) {
            return false;
          }
          return true;
        },
      },
      (permissionCode.indexOf('CUS_COMM_BATCH') !== -1 || mode === 'ADD') && {
        key: 'salescomm',
        title: '批量销售指派',
        type: 'info',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          // 获得刷新数据方法，并且刷新数据
          const { selectedRows } = internalState;
          const tt = selectedRows.map(item => item.id);
          this.Assign(tt, 'SALE');
        },
        disabled: internalState => {
          const { selectedRows } = internalState;
          if (selectedRows.length > 1) {
            return false;
          }
          return true;
        },
      },
      permissionCode.indexOf('PUR_COMM_BATCH') !== -1 && {
        key: 'purcomm',
        title: '批量采购指派',
        type: 'info',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          // 获得刷新数据方法，并且刷新数据
          const { selectedRows } = internalState;
          const tt = selectedRows.map(item => item.id);
          this.Assign(tt, 'PUR');
        },
        disabled: internalState => {
          const { selectedRows } = internalState;
          if (selectedRows.length > 1) {
            return false;
          }
          return true;
        },
      },
    ].filter(Boolean);
    const excelImportProps = {
      templateUrl: location.origin + `/template/projectScheduleImport.xlsx`, // eslint-disable-line
      option: {
        fileName: '导入失败记录',
        datas: [
          {
            sheetName: '排期导入失败记录', // 表名
            sheetFilter: ['errorMessage'], // 列过滤
            sheetHeader: ['失败原因'], // 第一行标题
            columnWidths: [4, 6, 6, 6, 8, 8, 8, 8, 8, 12], // 列宽 需与列顺序对应
          },
        ],
      },
      controlModal: {
        visible: exportVisible,
        failedList,
        uploading,
      },
    };
    return (
      <>
        <ExcelImportExport //导入modal
          {...excelImportProps}
          closeModal={this.exportToggleVisible}
          handleUpload={this.handleUpload}
        />
        <CommunicationModel //沟通modal
          visible={comVisible}
          onOk={this.handleOK}
          onCancel={this.toggleVisible}
          // scheduleId={scheduleId} //指派关联的排期id
          scheduleIdList={scheduleIdList}
          commType={commType}
        />
        <UpdateScheduleStatus //批量修改状态modal
          visible={statusVisible}
          onOk={this.handleOK}
          onCancel={this.toggleVisible}
          scheduleIdList={scheduleIdList} //批量修改状态的排期idlist
          mode={mode}
          permissionCode={permissionCode}
        />
        <ResourceModel //选择资源modal
          visible={ReVisible}
          onCancel={this.toggleVisible}
          onOk={this.handleOK}
          scheduleId={scheduleId}
          supplierOptions={supplierOptions}
        />
        <EditTable
          form={form}
          formMode={formMode}
          readOnly={taskId && currentNode === 'check'}
          title="排期信息"
          dataSource={scheduleList}
          columns={baseColumns}
          buttons={extraButtons}
          scroll={{ x: mode === 'ADD' ? 2500 : 3300 }}
          onAddClick={() => {
            dispatch({
              type: `projectMgmtListEdit/updateForm`,
              payload: {
                scheduleList: update(scheduleList, {
                  $push: [
                    {
                      id: genFakeId(-1),
                      cusStatus: 'NOT_START',
                    },
                  ],
                }),
              },
            });
          }}
          // onCopyClick={
          //   (copied) => {
          //     const newDataSource = update(scheduleList, {
          //       $push: copied.map(item => ({
          //         ...item,
          //         id: genFakeId(-1),
          //       })),
          //     });
          //     dispatch({
          //       type: `projectMgmtListEdit/updateForm`,
          //       payload: {
          //         scheduleList: newDataSource,
          //       },
          //     });
          //   }
          // }
          onDeleteConfirm={keys => {
            let newDeleteKeys = [];
            if (deleteKeys && deleteKeys.length > 0) {
              newDeleteKeys = deleteKeys.concat(keys);
            } else {
              newDeleteKeys = keys;
            }
            const newDataSource = scheduleList.filter(row => keys.indexOf(row.id) < 0);
            dispatch({
              type: `projectMgmtListEdit/updateForm`,
              payload: { scheduleList: newDataSource, deleteKeys: newDeleteKeys },
            });
          }}
        />
      </>
    );
  }
}

export default index;
