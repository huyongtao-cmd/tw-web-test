import React, { PureComponent } from 'react';
import { connect } from 'dva';
import update from 'immutability-helper';
import { Card, Button, Tooltip, Row, Form, Input, DatePicker, Cascader } from 'antd';
import Link from 'umi/link';
import { formatMessage } from 'umi/locale';
import classnames from 'classnames';
import { isEmpty, isNil, clone } from 'ramda';
import moment from 'moment';
import api from '@/api';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DescriptionList from '@/components/layout/DescriptionList';
import Title from '@/components/layout/Title';
import { genFakeId, add } from '@/utils/mathUtils';
import { createConfirm } from '@/components/core/Confirm';
import { flatten } from '@/utils/arrayUtils';
import { request } from '@/utils/networkUtils';
import { fromQs, toUrl } from '@/utils/stringUtils';
import { mountToTab, markAsTab, closeThenGoto } from '@/layouts/routerControl';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { FileManagerEnhance, UdcSelect, Selection } from '@/pages/gen/field';
import DataTable from '@/components/common/DataTable';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import BpmConnection from '@/pages/gen/BpmMgmt/BpmConnection';
import createMessage from '@/components/core/AlertMessage';
import { getUrl } from '@/utils/flowToRouter';
import FieldList from '@/components/layout/FieldList';

const DOMAIN = 'invBatchDetail';
const TASK_FLOW_POINT = 'ACC_A05_01_CONTRACT_INV_SUBMIT_i';
const TASK_FLOW_CONFIRM = 'ACC_A05_02_FIN_CONFIRM';
const TASK_FLOW_CONFIRM_B = 'ACC_A05_03_INITOR_CONFIRM_b';
const { doTask } = api.bpm;
const { approveRetTicket } = api.user.contract;
const { Description } = DescriptionList;
const { Field } = FieldList;
const FieldListLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 10 },
};

@connect(({ loading, dispatch, invBatchDetail }) => ({
  loading,
  dispatch,
  invBatchDetail,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (changedFields && Object.values(changedFields)[0]) {
      const { name, value } = Object.values(changedFields)[0];
      let val = null;
      // antD ????????????????????????moment?????? ?????????????????????
      if (typeof value === 'object' && name !== 'invoiceItem') {
        val = formatDT(value);
      } else {
        val = value;
      }
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { [name]: val },
      });
    }
  },
})
@mountToTab()
class InvBatchDetail extends PureComponent {
  componentDidMount() {
    const {
      dispatch,
      invBatchDetail: { formData, recvPlanList },
    } = this.props;
    const { id, taskId } = fromQs();
    taskId &&
      dispatch({
        type: `${DOMAIN}/fetchConfig`,
        payload: taskId,
      });
    dispatch({
      type: `${DOMAIN}/query`,
      payload: { id },
    });
    dispatch({
      type: `${DOMAIN}/getInvoiceItemList`,
    });
    let invAmt = 0;
    recvPlanList.map(v => {
      invAmt = add(invAmt, v.unRecvAmt || 0);
      return void 0;
    });
    formData.invAmt = invAmt;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        formData: {
          ...formData,
          invAmt,
        },
      },
    });
  }

  handleConfirm = () => {
    // TO DO
  };
  handleFinish = () => {
    const {
      dispatch,
      form: { validateFieldsAndScroll, getFieldValue },
      invBatchDetail: {
        dtlList,
        recvPlanList,
        formData: { invAmt },
      },
    } = this.props;
    let total = 0;
    let totalAmt = 0;
    recvPlanList.map(v => {
      // total += v.recvAmt;
      total = add(total, v.recvAmt || 0);
      return void 0;
    });
    dtlList.map(v => {
      // totalAmt += +v.invAmt;
      totalAmt = add(totalAmt, v.invAmt || 0);
      return void 0;
    });

    validateFieldsAndScroll((error, values) => {
      if (!error) {
        if (totalAmt === invAmt) {
          const { taskId, remark, ids } = fromQs();
          const isEdit = isNil(ids);
          //  ????????????????????????????????? ????????????????????????????????? ???????????? ???????????? ???????????????taskId isReEdit ????????????  false  ??????id url??????id true ??????
          const isReEdit = isNil(taskId);
          dispatch({
            type: `${DOMAIN}/save1`,
            payload: {
              invAmt: getFieldValue('invAmt'),
              submitted: false,
              isEdit,
              isReEdit,
            },
          }).then(resp => {
            if (resp.success) {
              dispatch({
                type: `${DOMAIN}/finish`,
              });
            } else if (!resp.success) {
              createMessage({ type: 'error', description: resp.message });
            }
          });
        } else {
          createMessage({ type: 'warn', description: '???????????????????????????????????????????????????' });
        }
      }
    });
  };

  handleCancel = () => {
    const { from } = fromQs();
    from ? closeThenGoto(from) : closeThenGoto('/plat/saleRece/invBatch/list');
  };

  handleChange = (rowIndex, rowField) => rowFieldValue => {
    const {
      dispatch,
      invBatchDetail: { dtlList, formData },
    } = this.props;
    let value = rowFieldValue && rowFieldValue.target ? rowFieldValue.target.value : rowFieldValue;
    if (rowField === 'deliveryDate') {
      value = formatDT(rowFieldValue);
    } else if (rowField === 'invAmt') {
      // ????????????
      dtlList[rowIndex].invAmt = value;
      // ??????
      dtlList[rowIndex].netAmt = (value / (1 + +formData.taxRate / 100)).toFixed(2);
      // ??????
      dtlList[rowIndex].taxAmt = (
        value - (value / (1 + +formData.taxRate / 100)).toFixed(2)
      ).toFixed(2);
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: { dtlList },
      });
      return;
    }
    const newDataList = update(dtlList, {
      [rowIndex]: {
        [rowField]: {
          $set: value,
        },
      },
    });
    dispatch({ type: `${DOMAIN}/updateState`, payload: { dtlList: newDataList } });
  };

  render() {
    const {
      invBatchDetail: {
        formData,
        recvPlanList,
        dtlList,
        delList,
        flowForm,
        fieldsConfig: config,
        invoiceItemChildrenList,
        invoiceItemList,
      },
      dispatch,
      loading,
      form: { getFieldDecorator },
    } = this.props;

    const { id, taskId, from, mode } = fromQs();
    let fieldsConfig = {};
    const { taskKey } = config;
    const enableSelectionFlag =
      taskKey === 'ACC_A34_02_FIN_CONFIRM' && formData.apprStatus === 'APPROVING';
    const A05disabled = taskKey === 'ACC_A05_03_INVOICE_CONFIRM';
    const procNosFlag =
      !isEmpty(formData.procNos) &&
      !isNil(formData.procNos) &&
      formData.procNos.some(item => item.slice(0, 3) === 'A34');

    if (!isEmpty(config)) {
      if (
        taskKey === TASK_FLOW_POINT &&
        (formData.apprStatus === 'NOTSUBMIT' ||
          formData.apprStatus === 'REJECTED' ||
          formData.apprStatus === 'WITHDRAW')
      ) {
        fieldsConfig = config;
      }
      if (
        taskKey === TASK_FLOW_CONFIRM &&
        (formData.apprStatus === 'APPROVING' || formData.apprStatus === 'REJECTED')
      ) {
        fieldsConfig = config;
      }
      if (taskKey === TASK_FLOW_CONFIRM_B && formData.apprStatus === 'APPROVING') {
        fieldsConfig = config;
      }
      // ??????????????????
      if (taskKey === 'ACC_A34_02_FIN_CONFIRM' && formData.apprStatus === 'APPROVING') {
        fieldsConfig = config;
      }

      if (taskKey === 'ACC_A34_01_CONTRACT_INV_SUBMIT_i') {
        fieldsConfig = config;
      }

      if (taskKey === 'ACC_A05_03_INVOICE_CONFIRM' || taskKey === 'ACC_A05_04_INITOR_CONFIRM_b') {
        fieldsConfig = config;
      }
    }
    console.warn(formData);
    const btnHideFlag = isEmpty(fieldsConfig);
    const recvPlanTableProps = {
      columnsCache: `${DOMAIN}-recvPlanTableProps`,
      dispatch,
      rowKey: 'id',
      showSearch: false,
      enableSelection: false,
      pagination: false,
      scroll: { x: '150%' },
      dataSource: recvPlanList,
      columns: [
        {
          title: '?????????',
          dataIndex: 'custName',
          render: (value, row, index) => (
            <Link className="tw-link" to={`/plat/addr/view?no=${row.abNo}&from=${getUrl()}`}>
              {value}
            </Link>
          ),
        },
        {
          title: '???????????????',
          dataIndex: 'mainContractName',
        },
        {
          title: '????????????',
          dataIndex: 'contractNo',
          align: 'center',
        },
        {
          title: '???????????????',
          dataIndex: 'contractName',
          align: 'center',
        },
        {
          title: '???????????????',
          dataIndex: 'userdefinedNo',
          sorter: true,
          align: 'center',
        },
        {
          title: '??????BU',
          dataIndex: 'deliBuName',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'projectManager',
          align: 'center',
        },
        {
          title: '?????????',
          dataIndex: 'recvNo',
          align: 'center',
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 'phaseDesc',
          align: 'center',
        },
        {
          title: '??????????????????',
          dataIndex: 'recvAmt',
          align: 'center',
          sorter: true,
        },
        {
          title: '?????????????????? %',
          dataIndex: 'recvRatio',
          align: 'center',
          sorter: true,
          render: value => `${value * 100}`,
        },
        {
          title: '??????????????????',
          dataIndex: 'expectRecvDate',
          align: 'center',
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 'recvStatusDesc',
          align: 'center',
          sorter: true,
        },
        {
          title: '??????',
          dataIndex: 'taxRate',
          align: 'center',
          sorter: true,
        },
        {
          title: '????????????',
          dataIndex: 'invDate',
          align: 'center',
          sorter: true,
        },
        {
          title: '???????????????',
          dataIndex: 'invAmt',
          align: 'center',
          sorter: true,
        },
        {
          title: '???????????????',
          dataIndex: 'unInvAmt',
          align: 'center',
          sorter: true,
        },
        {
          title: '???????????????',
          dataIndex: 'actualRecvAmt',
          align: 'center',
          sorter: true,
        },
        {
          title: '??????????????????',
          dataIndex: 'actualRecvDate',
          align: 'center',
          sorter: true,
        },
        {
          title: '???????????????',
          dataIndex: 'unRecvAmt',
          align: 'center',
          sorter: true,
        },
        {
          title: '???????????????',
          dataIndex: 'confirmedAmt',
          align: 'center',
        },
      ],
    };
    // const { taskKey } = config;
    const invBatchTableProps = {
      columnsCache: `${DOMAIN}-invBatchTableProps`,
      dispatch,
      rowKey: 'id',
      showSearch: false,
      enableSelection: !enableSelectionFlag,
      dataSource: dtlList,
      pagination: false,
      leftButtons: [
        {
          key: 'add',
          title: '??????',
          className: 'tw-btn-primary',
          icon: 'form',
          loading: false,
          hidden:
            btnHideFlag ||
            taskKey === 'ACC_A05_02_FIN_CONFIRM' ||
            taskKey === 'ACC_A05_01_CONTRACT_INV_SUBMIT_i' ||
            taskKey === 'ACC_A05_04_INITOR_CONFIRM_b',
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                dtlList: update(dtlList, {
                  $push: [
                    {
                      id: genFakeId(-1),
                      invNo: null,
                      deliveryNo: null,
                      deliveryDate: new Date(),
                      invAmt: null,
                      netAmt: null,
                      taxAmt: null,
                    },
                  ],
                }),
              },
            });
          },
        },
        {
          key: 'delete',
          title: '??????',
          className: 'tw-btn-error',
          icon: 'form',
          loading: false,
          hidden:
            btnHideFlag ||
            taskKey === 'ACC_A05_02_FIN_CONFIRM' ||
            taskKey === 'ACC_A05_01_CONTRACT_INV_SUBMIT_i' ||
            taskKey === 'ACC_A05_04_INITOR_CONFIRM_b',
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            createConfirm({
              content: '???????????????????????????????',
              onOk: () => {
                const delArr = [];
                selectedRowKeys.map(v => v > 0 && delArr.push(v));
                const newDataList = dtlList.filter(
                  row => !selectedRowKeys.filter(keyValue => keyValue === row.id).length
                );
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: {
                    dtlList: newDataList,
                    delList: delArr,
                  },
                });
              },
            });
          },
        },
      ],
      columns: [
        {
          title: '??????????????????',
          dataIndex: 'invStatus',
          align: 'center',
          required: true,
          width: '140px',
          render: (value, row, index) => (
            <Selection.UDC
              className="tw-field-group-field"
              code="ACC:INV_STATUS"
              style={{ width: 140 }}
              value={value}
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              onChange={this.handleChange(index, 'invStatus')}
            />
          ),
        },

        {
          title: '?????????',
          dataIndex: 'invNo',
          align: 'center',
          render: (value, row, index) => (
            <Input
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              defaultValue={value}
              onChange={this.handleChange(index, 'invNo')}
            />
          ),
        },
        {
          title: '?????????',
          dataIndex: 'deliveryNo',
          align: 'center',
          render: (value, row, index) => (
            <Input
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              defaultValue={value}
              onChange={this.handleChange(index, 'deliveryNo')}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'deliveryDate',
          align: 'center',
          render: (value, row, index) => (
            <DatePicker
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              defaultValue={value ? moment(value) : null}
              onChange={this.handleChange(index, 'deliveryDate')}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'invAmt',
          align: 'center',
          render: (value, row, index) => (
            <Input
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              defaultValue={value}
              onChange={this.handleChange(index, 'invAmt')}
            />
          ),
        },
        {
          title: '??????',
          dataIndex: 'netAmt',
          align: 'center',
          render: (value, row, index) => (
            <Input
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              defaultValue={value}
              value={value}
              onChange={this.handleChange(index, 'netAmt')}
            />
          ),
        },
        {
          title: '??????',
          dataIndex: 'taxAmt',
          align: 'center',
          render: (value, row, index) => (
            <Input
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              defaultValue={value}
              value={value}
              onChange={this.handleChange(index, 'taxAmt')}
            />
          ),
        },
        {
          title: '????????????',
          dataIndex: 'downloadUrl',
          align: 'center',
          render: (value, row, index) => (
            <Input
              disabled={
                (btnHideFlag || !enableSelectionFlag) && taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'
              }
              defaultValue={value}
              value={value}
              onChange={this.handleChange(index, 'downloadUrl')}
            />
          ),
        },
      ],
    };
    const buttonLoading =
      loading.effects[`${DOMAIN}/save`] ||
      loading.effects[`${DOMAIN}/reSubmit`] ||
      loading.effects[`${DOMAIN}/rollbackItems`] ||
      loading.effects[`${DOMAIN}/query`];
    return (
      <PageHeaderWrapper title="??????????????????">
        <BpmWrapper
          buttonLoading={buttonLoading}
          fieldsConfig={fieldsConfig}
          flowForm={flowForm}
          onBpmChanges={value => {
            dispatch({
              type: `${DOMAIN}/updateFlowForm`,
              payload: value,
            });
          }}
          onBtnClick={({ operation, bpmForm }) => {
            const { key } = operation;
            // const { taskKey } = fieldsConfig;
            const { remark } = bpmForm;
            // console.warn(operation);
            // ??????????????????????????????
            // return;
            if (taskKey === TASK_FLOW_POINT) {
              const currentUrl = getUrl();
              currentUrl.includes('invBatches')
                ? closeThenGoto(
                    `/sale/contract/invBatches/edit?id=${id}&taskId=${taskId}&remark=${remark}&from=/sale/contract/invBatches`
                  )
                : closeThenGoto(
                    `/plat/saleRece/invBatch/edit?id=${id}&taskId=${taskId}&remark=${remark}&from=/plat/saleRece/invBatch/list`
                  );
              return Promise.resolve(false);
            }

            // ??????????????????????????????????????????
            if (taskKey === TASK_FLOW_CONFIRM) {
              const { invoiceItem } = formData;
              if (!invoiceItem || isEmpty(invoiceItem)) {
                createMessage({ type: 'warn', description: '?????????????????????' });
                return Promise.resolve(false);
              }
              dispatch({
                type: `${DOMAIN}/save`,
                payload: {
                  submitted: false,
                  isReEdit: true,
                },
              }).then(resp => {
                if (resp.success) {
                  dispatch({
                    type: `${DOMAIN}/reSubmit`,
                    payload: { taskId, remark, result: key },
                  });
                } else createMessage({ type: 'warn', description: '??????????????????' });
              });
              return Promise.resolve(false);
            }

            // ?????????????????????
            if (operation.key === 'REJECTED') {
              return Promise.resolve(true);
            }
            // ?????????????????????

            if (
              taskKey !== 'ACC_A34_01_CONTRACT_INV_SUBMIT_i' &&
              taskKey !== 'ACC_A34_02_FIN_CONFIRM' &&
              operation.key !== 'REJECTED'
            ) {
              if (taskKey === 'ACC_A05_03_INVOICE_CONFIRM') {
                const {
                  dispatch,
                  form: { validateFieldsAndScroll, getFieldValue },
                  invBatchDetail: {
                    dtlList,
                    recvPlanList,
                    formData: { invAmt },
                  },
                } = this.props;
                let total = 0;
                let totalAmt = 0;
                recvPlanList.map(v => {
                  // total += v.recvAmt;
                  total = add(total, v.recvAmt || 0);
                  return void 0;
                });
                dtlList.map(v => {
                  // totalAmt += +v.invAmt;
                  totalAmt = add(totalAmt, v.invAmt || 0);
                  return void 0;
                });

                validateFieldsAndScroll((error, values) => {
                  if (!error) {
                    if (totalAmt === invAmt) {
                      const { taskId, remark, ids } = fromQs();
                      const isEdit = isNil(ids);
                      //  ????????????????????????????????? ????????????????????????????????? ???????????? ???????????? ???????????????taskId isReEdit ????????????  false  ??????id url??????id true ??????
                      const isReEdit = isNil(taskId);
                      dispatch({
                        type: `${DOMAIN}/save2`,
                        payload: {
                          invAmt: getFieldValue('invAmt'),
                          submitted: false,
                          isEdit,
                          isReEdit,
                        },
                      }).then(resp => {
                        if (resp.success) {
                          dispatch({
                            type: `${DOMAIN}/finish`,
                          }).then(res => {
                            console.warn('finish');

                            if (res && res.ok) {
                              console.warn('res');
                              const { branches } = operation;
                              const $obj = {};

                              if (isEmpty(branches) || isNil(branches)) {
                                $obj.remark = bpmForm.remark;
                                $obj.result = operation.key;
                              } else {
                                $obj.remark = bpmForm.remark;
                                $obj.result = operation.key;
                                $obj.branch = branches[0].code;
                              }
                              console.warn('request');

                              request
                                .post(toUrl(doTask, { id: taskId }), {
                                  body: {
                                    ...$obj,
                                  },
                                })
                                .then(({ status, response }) => {
                                  const { ok } = response;
                                  if (ok) {
                                    // change fileds status
                                    createMessage({
                                      type: 'success',
                                      description: formatMessage({
                                        id: `${operation.title}.sms`,
                                        desc: 'who care',
                                      }),
                                    });

                                    const url = getUrl().replace('edit', 'view');
                                    closeThenGoto(url);
                                  } else if (status === 100) {
                                    // ?????????????????????????????????
                                  } else {
                                    createMessage({ type: 'error', description: '??????????????????' });
                                  }
                                });
                              return Promise.resolve(false);
                            }
                          });
                        } else if (!resp.success) {
                          createMessage({ type: 'error', description: resp.message });
                        }
                      });
                    } else {
                      createMessage({
                        type: 'warn',
                        description: '???????????????????????????????????????????????????',
                      });
                    }
                  }
                });
              } else {
                const { branches } = operation;
                const $obj = {};

                if (isEmpty(branches) || isNil(branches)) {
                  $obj.remark = bpmForm.remark;
                  $obj.result = operation.key;
                } else {
                  $obj.remark = bpmForm.remark;
                  $obj.result = operation.key;
                  $obj.branch = branches[0].code;
                }

                request
                  .post(toUrl(doTask, { id: taskId }), {
                    body: {
                      ...$obj,
                    },
                  })
                  .then(({ status, response }) => {
                    const { ok } = response;
                    if (ok) {
                      // change fileds status
                      createMessage({
                        type: 'success',
                        description: formatMessage({
                          id: `${operation.title}.sms`,
                          desc: 'who care',
                        }),
                      });
                      const currentUrl = getUrl();

                      if (currentUrl.includes('invBatches')) {
                        // isEmpty(branches) ???????????????????????????  true ????????????  false  ????????????
                        if (isEmpty(branches) || isNil(branches)) {
                          closeThenGoto(
                            `/sale/contract/invBatches/edit?status=3&id=${id}&from=/sale/contract/invBatches`
                          );
                        } else {
                          closeThenGoto(
                            `/sale/contract/invBatches/detail?id=${id}&from=/sale/contract/invBatches`
                          );
                        }
                      } else {
                        // eslint-disable-next-line no-lonely-if
                        if (isEmpty(branches) || isNil(branches)) {
                          const url = getUrl().replace('edit', 'view');
                          closeThenGoto(url);
                        } else {
                          closeThenGoto(
                            `/plat/saleRece/invBatch/detail?id=${id}&from=/plat/saleRece/invBatch/list`
                          );
                        }
                      }
                    } else if (status === 100) {
                      // ?????????????????????????????????
                    } else {
                      createMessage({ type: 'error', description: '??????????????????' });
                    }
                  });
                return Promise.resolve(false);
              }
            }
            // ?????????????????????
            if (taskKey === 'ACC_A34_02_FIN_CONFIRM' && operation.key === 'APPROVED') {
              // ????????? ?????????????????????
              const { prcId } = fromQs();
              const newFormData = clone(formData);

              // ????????????????????????
              if (
                Array.isArray(newFormData.invoiceItem) &&
                !isEmpty(newFormData.invoiceItem.filter(v => v))
              ) {
                const tt = flatten(invoiceItemList.map(v => v.children)).filter(
                  v =>
                    v.twGoodsCode === newFormData.invoiceItem[0] && v.id === formData.invoiceItem[1]
                );
                // eslint-disable-next-line prefer-destructuring
                newFormData.invoiceItem = tt[0];
              } else {
                newFormData.invoiceItem = null;
              }

              request
                .post(approveRetTicket, {
                  body: {
                    branch: undefined,
                    remark: bpmForm.remark,
                    result: operation.key,
                    invBatchEntity: { ...newFormData },
                    invdtlSaveEntity: {
                      entities: dtlList,
                      delList,
                    },
                    submitted: true,
                    taskId,
                    prcId,
                  },
                })
                .then(({ status, response }) => {
                  const { ok } = response;
                  if (ok) {
                    createMessage({
                      type: 'success',
                      description: formatMessage({
                        id: `${operation.title}.sms`,
                        desc: 'who care',
                      }),
                    });
                    // const currentUrl = getUrl();
                    closeThenGoto(`/user/flow/process`);
                  } else if (status === 100) {
                    // ?????????????????????????????????
                  } else {
                    createMessage({ type: 'error', description: '??????????????????' });
                  }
                });
              return Promise.resolve(false);
            }

            if (taskKey === 'ACC_A34_01_CONTRACT_INV_SUBMIT_i' && operation.key === 'EDIT') {
              const currentUrl = getUrl();
              currentUrl.includes('invBatches')
                ? closeThenGoto(
                    `/sale/contract/invBatches/edit?id=${id}&taskId=${taskId}&remark=${remark}&from=/sale/contract/invBatches`
                  )
                : closeThenGoto(
                    `/plat/saleRece/invBatch/edit?id=${id}&taskId=${taskId}&remark=${remark}&from=/plat/saleRece/invBatch/list`
                  );
              return Promise.resolve(false);
            }

            return bpmForm;
          }}
        >
          <Card className="tw-card-rightLine">
            {formData.batchStatus + '' === '4' && (
              <Button
                className="tw-btn-primary stand"
                type="primary"
                // icon="complete"
                size="large"
                onClick={() => {
                  dispatch({
                    type: `${DOMAIN}/rollbackItems`,
                    payload: fromQs().id,
                  });
                }}
              >
                ??????
              </Button>
            )}
            {fromQs().id && (
              <a
                href={`/print?scope=printInv&id=${fromQs().id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 'auto', marginRight: 8 }}
              >
                <Tooltip title="????????????">
                  <Button
                    className={classnames('tw-btn-default')}
                    type="dashed"
                    icon="printer"
                    size="large"
                  />
                </Tooltip>
              </a>
            )}
            <Button
              className={classnames(fromQs().id ? '' : 'separate', 'tw-btn-default')}
              icon="undo"
              size="large"
              onClick={this.handleCancel}
            >
              {formatMessage({ id: `misc.rtn`, desc: '??????' })}
            </Button>
          </Card>

          {procNosFlag && (
            <Row style={{ background: '#fff' }}>
              <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} hasSeparator={1}>
                <Field
                  name="disDisc"
                  label="??????????????????"
                  fieldCol={1}
                  labelCol={{ span: 4 }}
                  wrapperCol={{ span: 20 }}
                  decorator={{
                    initialValue: formData && formData.disDisc,
                    rules: [
                      {
                        required: true,
                        message: '?????????????????????',
                      },
                    ],
                  }}
                >
                  <Input disabled placeholder="?????????????????????" rows={3} />
                </Field>
              </FieldList>
            </Row>
          )}

          <Card
            className="tw-card-adjust"
            bordered={false}
            title={
              <Title icon="profile" id="plat.recv.menu.invInfo" defaultMessage="??????????????????" />
            }
          >
            <DescriptionList size="large" col={2} hasSeparator>
              <Description term="???????????????">{formData.batchNo}</Description>
              <Description term="????????????">{formData.batchStatusDesc}</Description>
              <Description term="???????????????/?????????">
                {formData.userdefinedNo}/{formData.contractName}
              </Description>
              <Description term="?????????/?????????">
                {formData.projNo}/{formData.projName}
              </Description>
              <Description term="??????????????????">{formData.invAmt}</Description>
              <Description term="????????????">{formData.payMethodDesc}</Description>
              <Description term="??????????????????">{formData.antiRecvDate}</Description>
            </DescriptionList>
            <FieldList
              layout="horizontal"
              getFieldDecorator={getFieldDecorator}
              col={2}
              hasSeparator={1}
              marginLeft={5}
            >
              <Field
                name="batchDate"
                label="????????????"
                decorator={{
                  initialValue: formData.batchDate ? moment(formData.batchDate) : null,
                  rules: [
                    {
                      required: true,
                      message: '?????????????????????',
                    },
                  ],
                }}
                {...FieldListLayout}
              >
                <DatePicker
                  placeholder="?????????????????????"
                  format="YYYY-MM-DD"
                  className="x-fill-100"
                  required={true}
                  disabled={taskKey !== 'ACC_A05_03_INVOICE_CONFIRM'}
                />
              </Field>
            </FieldList>
          </Card>

          <Card
            className="tw-card-adjust"
            bordered={false}
            title={
              <Title icon="profile" id="plat.recv.menu.invContent" defaultMessage="????????????" />
            }
          >
            <DescriptionList size="large" col={2} hasSeparator>
              <Description term="????????????">{formData.custName}</Description>
              <Description term="????????????">{formData.invInfo}</Description>
              <Description term="????????????">{formData.invTitle}</Description>
              <Description term="??????">{formData.taxNo}</Description>
              <Description term="??????">{formData.addr}</Description>
              <Description term="??????">{formData.invTelAb}</Description>
              <Description term="??????">{formData.accountNo}</Description>
              <Description term="?????????">{formData.bankName}</Description>
              <Description term="????????????/??????">
                {formData.invTypeDesc}/{formData.taxRate + '%'}
              </Description>
              <Description term="??????">{formData.currCode}</Description>
              {mode === 'view' && <Description term="????????????">{formData.invContent}</Description>}
              {/* <Description term="??????????????????????????????">{formData.saveAbFlagDesc}</Description> */}
              {taskKey === TASK_FLOW_CONFIRM ? (
                <Description term={<span className="ant-form-item-required">????????????</span>}>
                  <Cascader
                    style={{ width: '100%' }}
                    options={invoiceItemList}
                    showSearch
                    placeholder="?????????????????????"
                    value={formData?.invoiceItem || []}
                    onChange={(value, selectedOptions) => {
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: { invoiceItem: value },
                      });
                    }}
                  />
                </Description>
              ) : (
                <Description term="????????????">
                  {`${formData?.invoiceItem1?.twGoodsCodeName || ''}/${formData?.invoiceItem1
                    ?.goodsName || ''}`}
                </Description>
              )}
            </DescriptionList>
          </Card>

          <Card
            className="tw-card-adjust"
            bordered={false}
            title={
              <Title icon="profile" id="plat.recv.menu.invOtherInfo" defaultMessage="????????????" />
            }
          >
            <DescriptionList size="large" col={2} hasSeparator>
              <Description term="?????????">{formData.contactPerson}</Description>
              <Description term="???????????????">{formData.invAddr}</Description>
              <Description term="????????????">{formData.deliMethodDesc}</Description>
              <Description term="???????????????">{formData.invEmail}</Description>
              <Description term="?????????????????????">{formData.invTel}</Description>
              <Description term="????????????">{formData.ouName}</Description>
              <Description term="??????">
                <FileManagerEnhance
                  api="/api/worth/v1/invBatchs/sfs/token"
                  dataKey={formData.id}
                  listType="text"
                  disabled
                  preview
                />
              </Description>
              <Description term="????????????">{formData.invDesc}</Description>
              <Description term="?????????">{formData.createUserName}</Description>
              <Description term="????????????">
                {formData.createTime ? formatDT(formData.createTime) : null}
              </Description>
            </DescriptionList>
          </Card>

          <Card
            className="tw-card-adjust"
            bordered={false}
            title={
              <Title
                icon="profile"
                id="user.contract.menu.invContract"
                defaultMessage="??????????????????"
              />
            }
            style={{ marginTop: 6 }}
          >
            <DataTable {...recvPlanTableProps} />
          </Card>

          <Card
            className="tw-card-adjust"
            bordered={false}
            title={
              <Title
                icon="profile"
                id="user.contract.menu.detailInvInfoDetail"
                defaultMessage="??????????????????"
              />
            }
            style={{ marginTop: 6 }}
          >
            <DataTable {...invBatchTableProps} />
          </Card>

          {!taskId && (
            <BpmConnection source={[{ docId: id, procDefKey: 'ACC_A05', title: '??????????????????' }]} />
          )}

          {!taskId &&
            procNosFlag && (
              <BpmConnection
                source={[{ docId: id, procDefKey: 'ACC_A34', title: '??????????????????' }]}
              />
            )}
        </BpmWrapper>
      </PageHeaderWrapper>
    );
  }
}

export default InvBatchDetail;
