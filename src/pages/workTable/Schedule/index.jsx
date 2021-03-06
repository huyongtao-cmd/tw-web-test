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
    ReVisible: false, //??????????????????
    comVisible: false, // ??????????????????????????????
    scheduleId: undefined, //??????????????????id
    statusVisible: false, //????????????????????????
    exportVisible: false, //????????????????????????
    scheduleIdList: [], //?????????????????????idList
    commType: '', //????????????
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
   * ??????model???state
   * ??????????????????????????????????????????,????????????model???state???????????????????????????dispatch
   * @param params state??????
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
    //????????????????????????
    const { id } = fromQs();
    if (id) {
      const { response } = await schedulePagingRq({ ...params, projectId: id });
      return response.data;
    }
    return [];
  };

  deleteData = async (
    keys //????????????????????????
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
    //??????????????????????????????
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
    //??????????????????????????????????????????????????????
    if (flag) {
      this.toggleVisible();
      // const { getInternalState } = this.state;
      // getInternalState().refreshData();
    }
  };

  Assign = (idList, type) => {
    //??????
    this.setState({
      comVisible: true,
      scheduleIdList: idList,
      commType: type,
    });
  };

  scheduleDetail = i => {
    //???????????????????????????id??????????????????????????????
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
        title: '????????????',
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
        title: '?????????',
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
        title: '????????????',
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
        title: '????????????',
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
        title: '????????????',
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
        title: '????????????',
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
        title: '????????????',
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
              list[i].grossProfit = //??????
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
        title: '????????????',
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
        title: '????????????',
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
        title: '????????????',
        children: [
          {
            title: '?????????',
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
                  list[i].cusNetPrice = //??????????????????
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.cusPublishedPrice * row.cusDiscount;
                  list[i].cusTotalNetPrice = //?????????????????????
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.putNumber &&
                    row.cusPublishedPrice * row.cusDiscount * row.putNumber;
                  list[i].priceDiffer = //??????
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.purPublishedPrice &&
                    row.purDiscount &&
                    row.cusPublishedPrice * row.cusDiscount -
                      row.purPublishedPrice * row.purDiscount;
                  list[i].grossProfit = //??????
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
            title: '??????',
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
                  list[i].priceDiffer = //??????
                    row.cusPublishedPrice &&
                    row.cusDiscount &&
                    row.purPublishedPrice &&
                    row.purDiscount &&
                    row.cusPublishedPrice * row.cusDiscount -
                      row.purPublishedPrice * row.purDiscount;
                  list[i].grossProfit = //??????
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
            title: '??????',
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
            title: '?????????',
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
            title: '??????',
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
          title: '????????????',
          children: [
            {
              title: '?????????',
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
              title: '??????',
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
              title: '??????',
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
              title: '?????????',
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
              title: '??????',
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
          title: '????????????',
          children: [
            {
              title: '?????????',
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
                    list[i].priceDiffer = //??????
                      row.cusPublishedPrice &&
                      row.cusDiscount &&
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.cusPublishedPrice * row.cusDiscount -
                        row.purPublishedPrice * row.purDiscount;
                    list[i].grossProfit = //??????
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
              title: '??????',
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
                    list[i].priceDiffer = //??????
                      row.cusPublishedPrice &&
                      row.cusDiscount &&
                      row.purPublishedPrice &&
                      row.purDiscount &&
                      row.cusPublishedPrice * row.cusDiscount -
                        row.purPublishedPrice * row.purDiscount;
                    list[i].grossProfit = //??????
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
              title: '??????',
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
              title: '?????????',
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
              title: '??????',
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
        title: '??????',
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
        title: '??????',
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
          title: '????????????',
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
        title: '????????????',
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
        title: '??????',
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
        title: '??????',
        width: 300,
        render: (value, row, i) => (
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {(mode === 'ADD' || permissionCode.indexOf('CUS_COMM') !== -1) && (
              <a
                onClick={() => {
                  this.Assign([row.id], 'SALE');
                }}
              >
                ????????????
              </a>
            )}
            {permissionCode.indexOf('PUR_COMM') !== -1 && (
              <a
                onClick={() => {
                  this.Assign([row.id], 'PUR');
                }}
              >
                ????????????
              </a>
            )}
          </div>
        ),
      },
    ].filter(Boolean);
    const extraButtons = [
      // {
      //   key: 'edit',
      //   title: '??????/??????',
      //   type: 'info',
      //   loading: false,
      //   cb: internalState => {
      //     // eslint-disable-next-line no-console
      //     // ?????????????????????????????????????????????
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
        title: '??????????????????',
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
        title: '??????????????????',
        type: 'info',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          // ?????????????????????????????????????????????
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
        title: '??????????????????',
        type: 'info',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          // ?????????????????????????????????????????????
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
        title: '??????????????????',
        type: 'info',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          // ?????????????????????????????????????????????
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
        fileName: '??????????????????',
        datas: [
          {
            sheetName: '????????????????????????', // ??????
            sheetFilter: ['errorMessage'], // ?????????
            sheetHeader: ['????????????'], // ???????????????
            columnWidths: [4, 6, 6, 6, 8, 8, 8, 8, 8, 12], // ?????? ?????????????????????
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
        <ExcelImportExport //??????modal
          {...excelImportProps}
          closeModal={this.exportToggleVisible}
          handleUpload={this.handleUpload}
        />
        <CommunicationModel //??????modal
          visible={comVisible}
          onOk={this.handleOK}
          onCancel={this.toggleVisible}
          // scheduleId={scheduleId} //?????????????????????id
          scheduleIdList={scheduleIdList}
          commType={commType}
        />
        <UpdateScheduleStatus //??????????????????modal
          visible={statusVisible}
          onOk={this.handleOK}
          onCancel={this.toggleVisible}
          scheduleIdList={scheduleIdList} //???????????????????????????idlist
          mode={mode}
          permissionCode={permissionCode}
        />
        <ResourceModel //????????????modal
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
          title="????????????"
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
