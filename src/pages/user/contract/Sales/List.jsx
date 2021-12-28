import React, { PureComponent } from 'react';
import { connect } from 'dva';
import Link from 'umi/link';
import router from 'umi/router';
import { Input, Radio, Modal } from 'antd';
import { mountToTab } from '@/layouts/routerControl';
import SyntheticField from '@/components/common/SyntheticField';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import createMessage from '@/components/core/AlertMessage';
import ExcelImportExport from '@/components/common/ExcelImportExport';
import { Selection, YearPicker, BuVersion, DatePicker } from '@/pages/gen/field';
import { isEmpty, isNil } from 'ramda';
import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';

import { createConfirm } from '@/components/core/Confirm';

import {
  selectCust,
  checkCreateProjById,
  checkSubmitVirtualContract,
} from '@/services/user/Contract/sales';
import { selectUsersWithBu } from '@/services/gen/list';
import { getBuVersionAndBuParams } from '@/utils/buVersionUtils';

const DOMAIN = 'userContractSaleList';
const applyColumns = [
  { dataIndex: 'code', title: '编号', span: 12 },
  { dataIndex: 'name', title: '名称', span: 12 },
];

const RadioGroup = Radio.Group;

@connect(({ loading, userContractSaleList, dispatch, user }) => ({
  dispatch,
  loading: loading.effects[`${DOMAIN}/query`],
  userContractSaleList,
  user,
}))
@mountToTab()
class SaleList extends PureComponent {
  state = {
    // addProjectBtnDisable: true, // 创建项目按钮显示标识，默认灰掉

    // title: '',
    visible: false,
    importTagVisible: false,
    uploadingTag: false,
    failedListTag: [],
  };

  componentDidMount() {
    // this.fetchData();
    // 加载页面配置
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'SALE_CONTRACT_LIST' },
    });
  }

  fetchData = async params => {
    const { createTime = [], ...restParams } = params;
    if (Array.isArray(createTime) && createTime.length === 2) {
      [restParams.createTimeStart, restParams.createTimeTo] = createTime;
    }
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: {
        ...restParams,
        ...getBuVersionAndBuParams(restParams.regionBuId, 'regionBuId', 'regionBuVersionId'),
        ...getBuVersionAndBuParams(restParams.signBuId, 'signBuId', 'signBuVersionId'),
        ...getBuVersionAndBuParams(restParams.deliBuId, 'deliBuId', 'deliBuVersionId'),
        ...getBuVersionAndBuParams(restParams.preSaleBuId, 'preSaleBuId', 'preSaleBuVersionId'),
      },
    });
  };

  // 创建项目按钮
  addProjectEvent = (selectedRowKeys, selectedRows, queryParams) => {
    checkCreateProjById({ id: selectedRowKeys[0] }).then(data => {
      const { status, response } = data;
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response.ok) {
        // 合同id、主子类型、合同状态
        const { id, mainType, contractStatus, platType } = selectedRows[0];
        // 主子类型为“子合同” 且 合同状态为‘激活状态’时，可创建项目
        if (
          (mainType === 'SUB' && contractStatus === 'ACTIVE') ||
          (mainType === 'SUB' &&
            contractStatus === 'ACTIVE_WAITING' &&
            platType === 'NO_CONTRACT_VIRTUAL_CONTRACT')
        ) {
          router.push(`/user/Project/projectCreate?contractId=${id}`);
        } else {
          createMessage({
            type: 'error',
            description:
              response.reason === null || response.reason.length < 1
                ? '该合同无法创建项目'
                : response.reason,
          });
        }
      } else {
        createMessage({
          type: 'error',
          description:
            response.reason === null || response.reason.length < 1
              ? '该合同无法创建项目'
              : response.reason,
        });
      }
    });
  };

  // 提交虚拟合同
  submitVirtualContract = (selectedRowKeys, selectedRows, queryParams) => {
    checkSubmitVirtualContract({ id: selectedRowKeys[0] }).then(data => {
      const { status, response } = data;
      if (status === 100) {
        // 主动取消请求
        return;
      }
      if (response.ok) {
        // 合同id、主子类型、合同状态
        const { id, mainType, contractStatus, platType } = selectedRows[0];
        router.push(`/sale/contract/submitVirtualSub?id=${id}`);
      } else {
        createMessage({
          type: 'error',
          description:
            response.reason === null || response.reason.length < 1
              ? '该合同已经不是新建状态，无法提交虚拟合同，请刷新页面'
              : response.reason,
        });
      }
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };

  handleOk = () => {
    const {
      userContractSaleList: { searchForm },
    } = this.props;
    const { businessType, selectedRowKeys } = searchForm;

    if (isNil(businessType)) {
      createMessage({
        type: 'warn',
        description: '请选择业务类型！',
      });
      return;
    }

    router.push(
      `/sale/purchaseContract/Edit?mode=edit&purchaseType=CONTRACT&businessType=${businessType}&contractId=${
        selectedRowKeys[0]
      }&from=salesContract`
    );
    this.setState({
      visible: false,
    });
  };

  toggleImportTagVisible = () => {
    const { importTagVisible } = this.state;
    this.setState({ importTagVisible: !importTagVisible });
  };

  /**
   * 客户标签导入
   * @param fileList
   */
  handleUploadTag = fileList => {
    this.setState({
      uploadingTag: true,
    });

    const fileData = new FormData();
    fileList.forEach(file => {
      fileData.append('file', file);
    });

    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/uploadTag`,
      payload: fileData,
    }).then(res => {
      this.setState({
        uploadingTag: false,
      });
      if (res.ok) {
        createMessage({ type: 'success', description: '上传成功' });
        this.toggleImportTagVisible();
        return null;
      }
      if (
        res.datum &&
        Array.isArray(res.datum.failExcelData) &&
        !isEmpty(res.datum.failExcelData)
      ) {
        createMessage({ type: 'error', description: res.datum.msg || '上传失败' });
        this.setState({
          failedListTag: res.datum.failExcelData,
        });
      } else {
        createMessage({ type: 'error', description: res.datum.msg || '上传失败,返回结果为空' });
        this.toggleImportTagVisible();
      }
      return null;
    });
  };

  render() {
    const {
      dispatch,
      loading,
      userContractSaleList: { dataSource, total, searchForm, pageConfig = {} },
    } = this.props;
    const { visible, importTagVisible, failedListTag, uploadingTag } = this.state;

    if (!pageConfig.pageBlockViews || pageConfig.pageBlockViews.length < 1) {
      return <div />;
    }
    const [{ pageFieldViews }, { pageFieldViews: queryView }] = pageConfig.pageBlockViews;
    const pageFieldJson = {};
    const queryJson = {};
    pageFieldViews.forEach(field => {
      pageFieldJson[field.fieldKey] = field;
    });
    queryView.forEach(field => {
      queryJson[field.fieldKey] = field;
    });

    const btnJson = {};
    if (pageConfig && pageConfig.pageButtonViews && pageConfig.pageButtonViews.length > 0) {
      pageConfig.pageButtonViews.forEach(btn => {
        btnJson[btn.buttonKey] = btn;
      });
    }

    const tableProps = {
      columnsCache: DOMAIN,
      dispatch,
      loading,
      expirys: 0,
      total,
      rowKey: 'id',
      sortBy: 'id',
      sortDirection: 'DESC',
      scroll: {
        x: '150%',
      },
      showExport: btnJson.export.visible,
      // filterMultiple: false,
      dataSource,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      onRowChecked: (selectedRowKeys, selectedRows) => {
        if (selectedRows.length <= 0) {
          return;
        }
        // 合同id、主子类型、合同状态
        const { mainType, contractStatus } = selectedRows[0];
        // 主子类型为“子合同” 且 合同状态为‘激活状态’时，可创建项目
        if (mainType === 'SUB' && contractStatus === 'ACTIVE') {
          this.setState({
            // addProjectBtnDisable: false,
          });
        } else {
          this.setState({
            // addProjectBtnDisable: true,
          });
        }
      },
      searchBarForm: [
        {
          key: 'contractNmNo',
          title: '合同名称/编号',
          dataIndex: 'contractNmNo',
          options: {
            initialValue: searchForm.contractNmNo,
          },
          tag: <Input placeholder={`请输入${queryJson.contractNmNo.displayName}`} />,
        },
        {
          title: '参考合同号',
          dataIndex: 'userdefinedNo',
          key: 'userdefinedNo',
          options: {
            initialValue: searchForm.userdefinedNo,
          },
          tag: <Input placeholder={`请输入${queryJson.userdefinedNo.displayName}`} />,
        },
        {
          title: '客户',
          dataIndex: 'custId',
          key: 'custId',
          options: {
            initialValue: searchForm.custId,
          },
          tag: (
            <Selection
              source={() => selectCust()}
              placeholder={`请输入${queryJson.custId.displayName}`}
            />
          ),
        },
        {
          title: '销售区域BU',
          key: 'regionBuId',
          dataIndex: 'regionBuId',
          options: {
            initialValue: searchForm.regionBuId,
          },
          tag: <BuVersion />,
        },
        {
          title: '签单BU',
          key: 'signBuId',
          dataIndex: 'signBuId',
          options: {
            initialValue: searchForm.signBuId,
          },
          tag: <BuVersion />,
        },
        {
          title: '交付BU',
          key: 'deliBuId',
          dataIndex: 'deliBuId',
          options: {
            initialValue: searchForm.deliBuId,
          },
          tag: <BuVersion />,
        },
        {
          title: '售前BU',
          key: 'preSaleBuId',
          dataIndex: 'preSaleBuId',
          options: {
            initialValue: searchForm.deliBuId,
          },
          tag: <BuVersion />,
        },
        {
          title: '签单年度',
          key: 'finPeriodId',
          dataIndex: 'finPeriodYear',
          options: {
            initialValue: searchForm.finPeriodYear,
          },
          tag: <YearPicker className="x-fill-100" mode="year" format="YYYY" />,
        },
        {
          title: '销售负责人',
          key: 'salesmanResId',
          dataIndex: 'salesmanResId',
          options: {
            initialValue: searchForm.salesmanResId,
          },
          tag: (
            <Selection.Columns
              source={() => selectUsersWithBu()}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              columns={applyColumns}
              placeholder={`请输入${queryJson.salesmanResId.displayName}`}
              showSearch
            />
          ),
        },

        {
          title: '交付负责人',
          key: 'deliResId',
          dataIndex: 'deliResId',
          options: {
            initialValue: searchForm.deliResId,
          },
          tag: (
            <Selection.Columns
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              columns={applyColumns}
              source={() => selectUsersWithBu()}
              placeholder={`请输入${queryJson.deliResId.displayName}`}
              showSearch
            />
          ),
        },
        {
          title: '售前负责人',
          key: 'preSaleResId',
          dataIndex: 'preSaleResId',
          options: {
            initialValue: searchForm.preSaleResId,
          },
          tag: (
            <Selection.Columns
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              columns={applyColumns}
              source={() => selectUsersWithBu()}
              placeholder={`请输入${queryJson.preSaleResId.displayName}`}
              showSearch
            />
          ),
        },
        {
          title: '主子合同',
          key: 'mainType',
          dataIndex: 'mainType',
          options: {
            initialValue: searchForm.mainType,
          },
          tag: (
            <Selection.UDC
              code="TSK.MAIN_TYPE"
              placeholder={`请输入${queryJson.mainType.displayName}`}
            />
          ),
        },
        {
          title: '销售大类',
          key: 'saleType1',
          dataIndex: 'saleType1',
          options: {
            initialValue: searchForm.saleType1,
          },
          tag: (
            <Selection.UDC
              code="TSK.SALE_TYPE1"
              placeholder={`请输入${queryJson.saleType1.displayName}`}
            />
          ),
        },

        {
          title: '合同状态',
          key: 'contractStatus',
          dataIndex: 'contractStatus',
          options: {
            initialValue: searchForm.contractStatus,
          },
          tag: (
            <SyntheticField className="tw-field-group">
              <Radio.Group className="tw-field-group-filter" buttonStyle="solid">
                <Radio.Button value="0">=</Radio.Button>
                <Radio.Button value="1">≠</Radio.Button>
              </Radio.Group>
              <Selection.UDC
                className="tw-field-group-field"
                code="TSK.CONTRACT_STATUS"
                placeholder={`请输入${queryJson.contractStatus.displayName}`}
                showSearch
              />
            </SyntheticField>
          ),
        },
        {
          title: '纸质合同状态',
          key: 'paperStatus',
          dataIndex: 'paperStatus',
          options: {
            initialValue: searchForm.paperStatus,
          },
          tag: (
            <Selection.UDC
              code="TSK:CONT_PAPER_STATUS"
              placeholder={`请输入${queryJson.paperStatus.displayName}`}
            />
          ),
        },
        {
          title: '项目是否创建',
          key: 'enabledFlag',
          dataIndex: 'enabledFlag',
          options: {
            initialValue: searchForm.enabledFlag || '',
          },
          tag: (
            <RadioGroup>
              <Radio value="YES">是</Radio>
              <Radio value="NO">否</Radio>
              <Radio value="">全部</Radio>
            </RadioGroup>
          ),
        },
        {
          title: 'PMO',
          key: 'pmoResId',
          dataIndex: 'pmoResId',
          options: {
            initialValue: searchForm.pmoResId,
          },
          tag: (
            <Selection.Columns
              source={() => selectUsersWithBu()}
              transfer={{ key: 'id', code: 'id', name: 'name' }}
              columns={applyColumns}
              placeholder={`请输入${queryJson.pmoResId.displayName}`}
              showSearch
            />
          ),
        },
        {
          title: '收益分配规则',
          key: 'profitAgree',
          dataIndex: 'profitAgree',
          options: {
            initialValue: searchForm.profitAgree || '',
          },
          tag: (
            <RadioGroup>
              <Radio value="YES">有</Radio>
              <Radio value="NO">无</Radio>
              <Radio value="">全部</Radio>
            </RadioGroup>
          ),
        },
        {
          title: '创建日期',
          dataIndex: 'createTime',
          options: {
            initialValue: searchForm.createTime,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
      ]
        .filter(
          field => !field.key || (queryJson[field.key] && queryJson[field.key].visibleFlag === 1)
        )
        .map(
          field =>
            field.key
              ? {
                  ...field,
                  // dataIndex: queryJson[field.key].fieldKey,
                  title: queryJson[field.key].displayName,
                  sortNo: queryJson[field.key].sortNo,
                  tag: {
                    ...field.tag,
                    props: {
                      ...field.tag.props,
                      placeholder: `请输入${queryJson[field.key].displayName}`,
                    },
                  },
                }
              : field
        )
        .sort((f1, f2) => f1.sortNo - f2.sortNo),
      leftButtons: [
        {
          key: 'edit',
          title: btnJson.edit.buttonName || '修改',
          className: 'tw-btn-primary',
          icon: 'form',
          loading: false,
          hidden: !btnJson.edit.visible,
          disabled: selectedRows =>
            selectedRows.length !== 1 || selectedRows[0].contractStatus === 'APPROVING',
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            //无合同入场虚拟合同
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'APPROVING'
            ) {
              createMessage({ type: 'warn', description: '审批中的无合同入场虚拟合同不能修改！' });
              return;
            }
            // TODO: 激活的合同是否能够修改？(暂时设为能)
            // if (selectedRows[0].contractStatus !== 'CREATE') {
            //   createMessage({ type: 'error', description: '该状态的合同不可修改!' });
            //   return;
            // }
            const { id, mainType, mainContractId, contractNo } = selectedRows[0];
            if (mainType === 'MAIN') {
              router.push(`/sale/contract/salesEdit?id=${id}`);
            } else {
              router.push(
                `/sale/contract/editSub?mainId=${mainContractId}&id=${id}&contractNo=${contractNo}`
              );
            }
          },
        },
        {
          key: 'active',
          title: btnJson.active.buttonName || '激活',
          className: 'tw-btn-info',
          icon: 'check-circle',
          loading: false,
          hidden: !btnJson.active.visible,
          disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            //无合同入场虚拟合同
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'APPROVING'
            ) {
              createMessage({ type: 'warn', description: '审批中的无合同入场虚拟合同不能激活！' });
              return;
            }
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'CREATE'
            ) {
              createMessage({
                type: 'warn',
                description: '新建状态的无合同入场虚拟合同不能激活！',
              });
              return;
            }

            // 合同id、主子类型、合同状态、主合同状态
            const {
              id,
              mainType,
              contractStatus,
              mainContractStatus,
              platType,
              mainContractId,
              contractNo,
            } = selectedRows[0];
            // 主子类型为“子合同” ，合同状态为‘新建状态’，并且其主合同状态为‘激活状态’时，可激活合同状态
            if (contractStatus === 'CLOSE') {
              createMessage({ type: 'warn', description: '合同已关闭！' });
              return;
            }
            if (mainType === 'SUB') {
              if (mainContractStatus === 'ACTIVE') {
                if (contractStatus === 'UPDATING') {
                  createMessage({ type: 'warn', description: '修改中的合同不能激活！' });
                  return;
                }
                if (contractStatus === 'PENDING') {
                  dispatch({
                    type: `${DOMAIN}/active`,
                    payload: { id, status: 'ACTIVE', searchForm: queryParams },
                  });
                }
                if (contractStatus === 'CREATE') {
                  router.push(`/sale/contract/subActive?id=${id}`);
                  // dispatch({
                  //   type: `${DOMAIN}/active`,
                  //   payload: { id, status: 'ACTIVE', searchForm: queryParams },

                  // });
                }
                if (contractStatus === 'ACTIVE') {
                  createMessage({ type: 'warn', description: '子合同已激活！' });
                }
                if (contractStatus === 'APPROVING') {
                  createMessage({ type: 'warn', description: '审批中的合同不能激活！' });
                }
                if (
                  contractStatus === 'ACTIVE_WAITING' &&
                  platType === 'NO_CONTRACT_VIRTUAL_CONTRACT'
                ) {
                  router.push(
                    `/sale/contract/editSub?mainId=${mainContractId}&id=${id}&contractNo=${contractNo}`
                  );
                }
              } else {
                createMessage({ type: 'warn', description: '请先激活父合同！' });
              }
            } else {
              // eslint-disable-next-line no-lonely-if
              if (contractStatus === 'ACTIVE') {
                createMessage({ type: 'warn', description: '主合同已激活！' });
              } else {
                dispatch({
                  type: `${DOMAIN}/active`,
                  payload: { id, status: 'ACTIVE', searchForm: queryParams },
                });
              }
            }
          },
        },
        {
          key: 'pend',
          title: btnJson.pend.buttonName || '暂挂',
          className: 'tw-btn-info',
          icon: 'check-circle',
          loading: false,
          hidden: !btnJson.pend.visible,
          disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            //无合同入场虚拟合同
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'APPROVING'
            ) {
              createMessage({ type: 'warn', description: '审批中的无合同入场虚拟合同不能暂挂！' });
              return;
            }
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'CREATE'
            ) {
              createMessage({
                type: 'warn',
                description: '新建状态的无合同入场虚拟合同不能暂挂！',
              });
              return;
            }
            // 合同id、主子类型、合同状态、主合同状态
            const { id, mainType, contractStatus, mainContractStatus, platType } = selectedRows[0];
            if (
              contractStatus === 'ACTIVE' ||
              (contractStatus === 'ACTIVE_WAITING' && platType === 'NO_CONTRACT_VIRTUAL_CONTRACT')
            ) {
              dispatch({
                type: `${DOMAIN}/active`,
                payload: { id, status: 'PENDING', searchForm: queryParams },
              });
            } else {
              createMessage({ type: 'warn', description: '只有激活的合同才可以挂起，请重新选择' });
            }
          },
        },

        {
          key: 'remove',
          title: btnJson.remove.buttonName || '删除',
          className: 'tw-btn-error',
          icon: 'file-excel',
          loading: false,
          hidden: !btnJson.remove.visible,
          disabled: selectedRowKeys => selectedRowKeys.length === 0,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            //无合同入场虚拟合同
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'APPROVING'
            ) {
              createMessage({ type: 'warn', description: '审批中的无合同入场虚拟合同不能删除！' });
              return;
            }
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'ACTIVE_WAITING'
            ) {
              createMessage({ type: 'warn', description: '待激活的无合同入场虚拟合同不能删除！' });
              return;
            }

            let flag = true;
            selectedRows.map(v => {
              if (v.contractStatus !== 'CREATE') {
                flag = false;
              }
              return void 0;
            });
            if (!flag) {
              createMessage({ type: 'error', description: '只有新建状态的合同才可删除!' });
              return;
            }
            createConfirm({
              content: '是否确认删除?',
              onOk: () =>
                dispatch({
                  type: `${DOMAIN}/remove`,
                  payload: {
                    ids: selectedRowKeys.join(','),
                    searchForm: queryParams,
                  },
                }),
            });
          },
        },
        {
          key: 'close',
          title: btnJson.close.buttonName || '关闭',
          className: 'tw-btn-error',
          loading: false,
          hidden: !btnJson.close.visible,
          disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            // 获取当前登录人的信息
            const { user } = this.props;

            if (selectedRows[0].contractStatus === 'CLOSE') {
              createMessage({
                type: 'warn',
                description: '该合同已关闭！',
              });
              return;
            }
            if (
              selectedRows[0].contractStatus !== 'CLOSE' &&
              selectedRows[0].contractStatus === 'ACTIVE' &&
              (user.user.roles.indexOf('SYS_ADMIN') !== -1 ||
                user.user.roles.indexOf('SALE_CONTRACT_BUTTON_CLOSE') !== -1)
            ) {
              const { id } = selectedRows[0];
              createConfirm({
                content: '是否确认关闭?',
                onOk: () =>
                  dispatch({
                    type: `${DOMAIN}/active`,
                    payload: { id, status: 'CLOSE', searchForm: queryParams },
                  }),
              });
            } else {
              createMessage({
                type: 'warn',
                description: '当前登录用户拥有关闭权限且当前合同状态为激活时才允许关闭',
              });
            }
          },
        },
        {
          key: 'delete',
          title: btnJson.delete.buttonName || '作废',
          className: 'tw-btn-error',
          icon: 'file-excel',
          loading: false,
          hidden: !btnJson.delete.visible,
          disabled: selectedRowKeys => selectedRowKeys.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            // 获取当前登录人的信息
            const { user } = this.props;

            if (selectedRows[0].contractStatus === 'DELETE') {
              createMessage({
                type: 'warn',
                description: '该合同已作废！',
              });
              return;
            }
            if (
              selectedRows[0].contractStatus !== 'DELETE' &&
              (user.user.roles.indexOf('SYS_ADMIN') !== -1 ||
                user.user.roles.indexOf('SALE_CONTRACT_BUTTON_DELETE') !== -1)
            ) {
              const { id } = selectedRows[0];
              createConfirm({
                content: '是否确认作废?',
                onOk: () =>
                  dispatch({
                    type: `${DOMAIN}/active`,
                    payload: { id, status: 'DELETE', searchForm: queryParams },
                  }),
              });
            } else {
              createMessage({
                type: 'warn',
                description: '当前登录用户拥有作废权限时才允许作废',
              });
            }
          },
        },
        {
          key: 'addProject',
          title: btnJson.addProject.buttonName || '创建项目',
          className: 'tw-btn-info',
          icon: 'plus-circle',
          loading: false,
          hidden: !btnJson.addProject.visible,
          disabled: selectedRows =>
            selectedRows.length !== 1 ||
            !(
              (selectedRows[0].mainType === 'SUB' && selectedRows[0].contractStatus === 'ACTIVE') ||
              (selectedRows[0].mainType === 'SUB' &&
                selectedRows[0].contractStatus === 'ACTIVE_WAITING' &&
                selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT')
            ),
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            //无合同入场虚拟合同
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'APPROVING'
            ) {
              createMessage({
                type: 'warn',
                description: '审批中的无合同入场虚拟合同不能创建项目！',
              });
              return;
            }
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'CREATE'
            ) {
              createMessage({
                type: 'warn',
                description: '新建状态的无合同入场虚拟合同不能创建项目！',
              });
              return;
            }
            this.addProjectEvent(selectedRowKeys, selectedRows, queryParams);
          },
        },

        {
          key: 'addSaleProj',
          title: btnJson.addSaleProj.buttonName || '新建项目采购',
          className: 'tw-btn-info',
          icon: 'plus-circle',
          loading: false,
          hidden: !btnJson.addSaleProj.visible,
          disabled: selectedRows => selectedRows.length !== 1 || selectedRows[0].mainType !== 'SUB',
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            //无合同入场虚拟合同
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'APPROVING'
            ) {
              createMessage({
                type: 'warn',
                description: '审批中的无合同入场虚拟合同不能新建项目采购！',
              });
              return;
            }
            if (
              selectedRows[0].platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              selectedRows[0].contractStatus === 'CREATE'
            ) {
              createMessage({
                type: 'warn',
                description: '新建状态的无合同入场虚拟合同不能新建项目采购！',
              });
              return;
            }

            if (isNil(selectedRows[0].projNo)) {
              createMessage({ type: 'warn', description: '合同未关联项目，不能新建项目采购！' });
              return;
            }
            // const { id, mainContractId } = selectedRows[0];
            // router.push(`/sale/contract/purchasesCreate?mainId=${mainContractId}&id=${id}`);
            this.setState({
              visible: true,
            });
          },
        },
        {
          key: 'importTagExcel',
          title: btnJson.importTagExcel.buttonName || '导入合同标签',
          className: 'tw-btn-info',
          icon: 'file-excel',
          loading: false,
          hidden: !btnJson.importTagExcel.visible,
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            this.toggleImportTagVisible();
          },
        },
        {
          key: 'submitVirtualContract',
          title: btnJson.submitVirtualContract.buttonName || '提交虚拟合同',
          className: 'tw-btn-info',
          icon: 'plus-circle',
          loading: false,
          hidden: !btnJson.submitVirtualContract.visible,
          disabled: selectedRows =>
            selectedRows.length !== 1 ||
            selectedRows[0].mainType !== 'SUB' ||
            selectedRows[0].platType !== 'NO_CONTRACT_VIRTUAL_CONTRACT',
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            // 合同id、主子类型、合同状态、主合同状态
            const { id, mainType, contractStatus, mainContractStatus, platType } = selectedRows[0];
            if (
              mainType === 'SUB' &&
              platType === 'NO_CONTRACT_VIRTUAL_CONTRACT' &&
              contractStatus === 'CREATE'
            ) {
              this.submitVirtualContract(selectedRowKeys, selectedRows, queryParams);
            } else {
              createMessage({
                type: 'warn',
                description: '只有新建状态的、无合同入场虚拟合同类型的子合同可以提交虚拟合同！',
              });
            }
          },
        },

        {
          key: 'resetProfitResult',
          title: btnJson.resetProfitResult.buttonName || '清空并重新执行利益分配',
          className: 'tw-btn-info',
          icon: 'check-circle',
          loading: false,
          hidden:
            window.location.pathname.indexOf('sale/contract') > 0 ||
            !btnJson.resetProfitResult.visible,
          disabled: selectedRowKeys => selectedRowKeys.length === 0,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            let flag = true;
            selectedRows.map(v => {
              if (v.contractStatus !== 'ACTIVE') {
                flag = false;
              }
              return void 0;
            });
            if (!flag) {
              createMessage({
                type: 'error',
                description: '只有激活状态的合同才可重新执行利益分配!',
              });
              return;
            }
            dispatch({
              type: `${DOMAIN}/resetProfitResult`,
              payload: {
                ids: selectedRowKeys.join(','),
                searchForm: queryParams,
              },
            });
          },
        },
        // {
        //   key: 'sharingEdit',
        //   title: btnJson.sharingEdit.buttonName || '修改利益分配规则',
        //   className: 'tw-btn-info',
        //   loading: false,
        //   hidden: !btnJson.sharingEdit.visible,
        //   disabled: selectedRows =>
        //     selectedRows.length !== 1 ||
        //     selectedRows[0].mainType !== 'SUB' ||
        //     selectedRows[0].contractStatus === 'APPROVING',
        //   minSelections: 0,
        //   cb: (selectedRowKeys, selectedRows, queryParams) => {
        //     const { mainContractId, id } = selectedRows[0];
        //     router.push(`/sale/contract/salesList/sharingEdit?mainId=${mainContractId}&id=${id}`);
        //   },
        // },
        // {
        //   key: 'distributor',
        //   title: btnJson.distributor.buttonName || '泛用结算分配',
        //   className: 'tw-btn-info',
        //   loading: false,
        //   hidden: !btnJson.distributor.visible,
        //   disabled: selectedRows =>
        //     selectedRows.length !== 1 ||
        //     selectedRows[0].mainType !== 'SUB' ||
        //     selectedRows[0].contractStatus === 'APPROVING',
        //   minSelections: 0,
        //   cb: (selectedRowKeys, selectedRows, queryParams) => {
        //     // 过账操作
        //     const { id } = selectedRows[0];
        //     dispatch({
        //       type: `${DOMAIN}/passAccount`,
        //       payload: {
        //         contractId: id,
        //       },
        //     }).then(res => {
        //       if (res.ok) {
        //         router.push(`/sale/contract/salesList/amtSettleDetail?id=${id}`);
        //       }
        //     });
        //   },
        // },
      ]
        .map(btn => ({
          ...btn,
          sortNo: btnJson[btn.key].sortNo,
        }))
        .sort((b1, b2) => b1.sortNo - b2.sortNo),
      columns: [
        {
          title: '合同编号',
          key: 'contractNo',
          dataIndex: pageFieldJson.contractNo.fieldKey,
          sorter: true,
          align: 'center',
          render: (value, rowData) => {
            const { mainContractId, id } = rowData;
            let href = null;
            if (rowData.mainType === 'MAIN') {
              href = `/sale/contract/salesDetail?id=${id}`;
            } else if (rowData.mainType === 'SUB') {
              href = `/sale/contract/salesSubDetail?mainId=${mainContractId}&id=${id}`;
            }
            return (
              <Link className="tw-link" to={href}>
                {value}
              </Link>
            );
          },
        },
        {
          title: '合同名称',
          key: 'contractName',
          dataIndex: pageFieldJson.contractName.fieldKey,
          sorter: true,
        },
        {
          title: '合同状态',
          key: 'contractStatus',
          dataIndex: 'contractStatusDesc',
          align: 'center',
        },
        {
          title: '合同类型',
          key: 'mainType',
          dataIndex: 'mainTypeDesc',
          align: 'center',
        },
        {
          title: '合同金额',
          key: 'amt',
          dataIndex: 'currAmt',
          align: 'right',
        },
        {
          title: '有效合同额',
          key: 'effectiveAmt',
          dataIndex: 'currEffectiveAmt',
          align: 'right',
        },
        {
          title: '开票金额',
          key: 'invAmt',
          dataIndex: 'currEffectiveInvAmt',
          align: 'right',
          sorter: true,
        },
        {
          title: '收款金额',
          key: 'actualRecvAmt',
          dataIndex: 'currEffectiveActualRecvAmt',
          align: 'right',
        },
        {
          title: '客户名称',
          key: 'custId',
          dataIndex: 'custName',
        },
        {
          title: '销售区域BU',
          key: 'regionBuId',
          dataIndex: 'regionBuName',
        },
        {
          title: '签单BU',
          key: 'signBuId',
          dataIndex: 'buName',
        },
        {
          title: '销售负责人',
          key: 'salesmanResId',
          dataIndex: 'salesmanResName',
          align: 'center',
        },
        {
          title: '电子合同',
          key: 'linkUrl',
          dataIndex: 'linkUrl',
          align: 'center',
          sorter: true,
          render: (value, rowData) => {
            const { linkUrl } = rowData;
            //获取token对象
            const token = localStorage.getItem('token_auth');
            // 对生成的token(ticket)进行加密：使用 Base64
            const ticket = Base64.stringify(Utf8.parse(token));
            const linkUrlT = linkUrl + '&ticket=' + ticket;
            return (
              // <Link className="tw-link" to={linkUrlT} target="_blank">
              <div
                onClick={() => window.open(linkUrlT)}
                style={{ color: '#008FDB', cursor: 'pointer' }}
              >
                {linkUrl ? '电子合同' : ''}
              </div>

              // </Link>
            );
          },
        },
        {
          title: '签单日期',
          key: 'signDate',
          dataIndex: pageFieldJson.signDate.fieldKey,
          align: 'center',
          sorter: true,
        },
        {
          title: '交付BU',
          key: 'deliBuId',
          dataIndex: 'deliBuName',
          align: 'center',
        },
        {
          title: '交付负责人',
          key: 'deliResId',
          dataIndex: 'deliResName',
          align: 'center',
        },
        {
          title: '售前BU',
          key: 'preSaleBuId',
          dataIndex: 'preSaleBuName',
          align: 'center',
        },
        {
          title: '售前负责人',
          key: 'preSaleResId',
          dataIndex: 'preSaleResName',
          align: 'center',
        },
        {
          title: 'PMO',
          key: 'pmoResId',
          dataIndex: 'pmoResIdName',
          align: 'center',
        },
        {
          title: '参考合同号',
          key: 'userdefinedNo',
          dataIndex: pageFieldJson.userdefinedNo.fieldKey,
          align: 'center',
        },
        {
          title: '相关项目编号',
          key: 'projNo',
          dataIndex: pageFieldJson.projNo.fieldKey,
          align: 'center',
        },
        {
          title: '项目名称',
          key: 'projId',
          dataIndex: 'projName',
          align: 'center',
        },
        {
          title: '销售大类',
          key: 'saleType1',
          dataIndex: 'saleType1Desc',
          align: 'center',
        },
        {
          title: '纸质合同状态',
          key: 'paperStatus',
          dataIndex: 'paperStatusDesc',
          align: 'center',
        },
        {
          title: '纸质合同状态描述',
          key: 'paperDesc',
          dataIndex: 'paperDesc',
          align: 'center',
        },
        {
          title: '创建日期',
          key: 'createTime',
          dataIndex: pageFieldJson.createTime.fieldKey,
          align: 'center',
          sorter: true,
        },
        {
          title: '利益分配规则',
          key: 'profitAgree',
          dataIndex: pageFieldJson.profitAgree.fieldKey,
          align: 'center',
          sorter: false,
        },
        {
          title: '合同来源',
          dataIndex: 'source',
          align: 'center',
          render: val => (val === 'yeedoc' ? 'YEEDOC' : 'TW'),
        },
      ]
        .filter(
          col => !col.key || (pageFieldJson[col.key] && pageFieldJson[col.key].visibleFlag === 1)
        )
        .map(
          col =>
            col.key
              ? {
                  ...col,
                  title: pageFieldJson[col.key].displayName,
                  sortNo: pageFieldJson[col.key].sortNo,
                }
              : col
        )
        .sort((f1, f2) => f1.sortNo - f2.sortNo),
    };

    // 合同标签相关
    const excelImportTagProps = {
      templateUrl: location.origin + `/template/contractTagTemplate.xlsx`, // eslint-disable-line
      option: {
        fileName: '合同标签导入失败记录',
        datas: [
          {
            sheetName: '合同标签数据导入失败记录', // 表名
            sheetFilter: ['errorMsg', 'contractNo', 'contractName', 'tagId', 'tagName'], // 列过滤
            sheetHeader: ['失败原因', '合同编号', '合同名称', '标签ID', '标签名称'], // 第一行标题
            columnWidths: [12, 4, 6, 6], // 列宽 需与列顺序对应。
          },
        ],
      },
      controlModal: {
        visible: importTagVisible,
        failedList: failedListTag,
        uploading: uploadingTag,
      },
    };
    return (
      <PageHeaderWrapper title="创建销售列表">
        <ExcelImportExport
          {...excelImportTagProps}
          closeModal={this.toggleImportTagVisible}
          handleUpload={this.handleUploadTag}
        />
        <DataTable {...tableProps} />
        <Modal title="业务类型" visible={visible} onOk={this.handleOk} onCancel={this.handleCancel}>
          <Selection.UDC
            value={searchForm.businessType}
            code="TSK:BUSINESS_TYPE"
            filters={[{ sphd1: '2' }]}
            placeholder="请选择业务类型"
            onChange={e => {
              dispatch({
                type: `${DOMAIN}/updateSearchForm`,
                payload: {
                  businessType: e,
                },
              });
            }}
          />
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default SaleList;
