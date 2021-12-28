import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Tooltip, DatePicker, Modal, Button, Card } from 'antd';
import AsyncSelect from '@/components/common/AsyncSelect';
import Link from 'umi/link';
import router from 'umi/router';
import { formatMessage } from 'umi/locale';
import { mountToTab } from '@/layouts/routerControl';
import { createConfirm } from '@/components/core/Confirm';
import DataTable from '@/components/common/DataTable';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import createMessage from '@/components/core/AlertMessage';
import { selectBus } from '@/services/org/bu/bu';
import { Selection, UdcSelect } from '@/pages/gen/field';
import { getUrl } from '@/utils/flowToRouter';
import { stringify } from 'qs';
import FieldList from '@/components/layout/FieldList';
import ZipImportExport from '@/components/common/ZipImportExport';
import { isEmpty } from 'ramda';

import ResLeaveModal from './modal/ResLeaveModal';

const { Field } = FieldList;

const DOMAIN = 'platResProfile';
// 资源状态
const resStatus = {
  RES_STATUS_1: '1', // 创建中
  RES_STATUS_2: '2', // 认证中
  RES_STATUS_3: '3', // 已认证
  RES_STATUS_4: '4', // 离职中
  RES_STATUS_5: '5', // 调岗中
  RES_STATUS_6: '6', // 已离职
};
// 拥有 批量上传电子照片 按钮权限的角色
const roleAuth = [
  'SYS_ADMIN',
  'PLAT_HR_ADMIN',
  'PLAT_ALL_PIC',
  'PLAT_IT_ADMIN',
  'PLAT_HR_PIC',
  'PLAT_RES_PIC',
  'PLAT_SALARY_PIC',
];

@connect(({ loading, platResProfile, user }) => ({
  user,
  platResProfile,
  loading: loading.effects[`${DOMAIN}/query`] || loading.effects[`${DOMAIN}/getPageConfig`],
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
@mountToTab()
class ResProfile extends PureComponent {
  tableRef = React.createRef();

  state = {
    resLeaveVisible: false,
    // eslint-disable-next-line react/no-unused-state
    isBatchEdit: false,
    // eslint-disable-next-line react/no-unused-state
    selectedKeys: undefined,
    modalData: {},
    importVisible: false,
    uploading: false,
    failedList: [],
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    this.fetchData({ sortBy: 'resNo', sortDirection: 'DESC' });
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'RES_ARCHIVES_MANAGEMENT_LIST' },
    });
  }

  // componentWillUnmount() {
  //   const { dispatch } = this.props;
  //   dispatch({
  //     type: `${DOMAIN}/updateState`,
  //     payload: {
  //       pageConfig: {},
  //     },
  //   });
  // }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/query`,
      payload: params,
    });
  };

  // 删除按钮，创建中（即‘1’）状态的才能删除
  deleteByStatus = (selectedRowKeys, selectedRows, queryParams) => {
    const { dispatch } = this.props;
    let flag = true; // 默认符合删除条件

    selectedRows.map(row => {
      if (row.resStatus !== resStatus.RES_STATUS_1) {
        flag = false;
      }
      return flag;
    });

    if (flag) {
      createConfirm({
        content: '确认删除所选记录？',
        onOk: () =>
          dispatch({
            type: `${DOMAIN}/delete`,
            payload: { id: selectedRowKeys, queryParams },
          }),
      });
    } else {
      createMessage({ type: 'error', description: '只有人才库状态的记录才能删除' });
    }
  };

  // 删除按钮，创建中（即‘1’）状态的才能删除
  addBlackList = (selectedRowKeys, selectedRows, queryParams) => {
    const { dispatch } = this.props;
    createConfirm({
      content: '确认要加入黑名单？',
      onOk: () =>
        dispatch({
          type: `${DOMAIN}/addResBlackList`,
          payload: { id: selectedRowKeys, queryParams },
        }),
    });
  };

  handleOk = (resId, leaveDate) => {
    const { resLeaveVisible } = this.state;
    const { dispatch, platResProfile } = this.props;
    const { queryParams } = platResProfile;
    dispatch({
      type: `${DOMAIN}/resLeaveUpdate`,
      payload: { resId, leaveDate },
    }).then(r => {
      this.setState({
        resLeaveVisible: !resLeaveVisible,
        modalData: {},
      });
      this.fetchData(queryParams);
    });
  };

  handleCancel = () => {
    const { resLeaveVisible } = this.state;
    this.setState({
      resLeaveVisible: !resLeaveVisible,
      modalData: {},
    });
  };

  // 批量修改是否弹框判断
  batchEditModal = item => {
    this.setState({
      isBatchEdit: true,
      selectedKeys: item,
    });
  };

  // 确认批量修改
  confirmModification = () => {
    const { selectedKeys } = this.state;
    const {
      dispatch,
      form: { validateFieldsAndScroll, setFieldsValue },
    } = this.props;
    // 保存请求
    validateFieldsAndScroll((error, values) => {
      // if (values) {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/batchEditLevelRq`,
          payload: { ids: selectedKeys, value: values },
        }).then(ok => {
          this.setState({
            isBatchEdit: false,
          });
          this.fetchData({ sortBy: 'resNo', sortDirection: 'DESC' });
          setFieldsValue({
            jobGrade: undefined,
            managementGrade: undefined,
            positionSequence: undefined,
            professionalSequence: undefined,
          });
        });
      }
      // }
    });
  };

  // 取消弹框
  cancel = () => {
    const {
      dispatch,
      form: { validateFieldsAndScroll, setFieldsValue },
    } = this.props;
    this.setState({
      isBatchEdit: false,
    });
    setFieldsValue({
      jobGrade: undefined,
      managementGrade: undefined,
      positionSequence: undefined,
      professionalSequence: undefined,
    });
  };

  // 电子照片批量导入
  batchUploadOwerPhoto = fileList => {
    this.setState({
      uploading: true,
    });

    const fileData = new FormData();
    fileList.forEach(file => {
      fileData.append('file', file);
    });
    fileData.append('cover', this.modal?.state?.checked);

    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/uploadOwerPhoto`,
      payload: fileData,
    }).then(res => {
      this.setState({
        uploading: false,
      });
      if (res.ok) {
        createMessage({ type: 'success', description: '上传成功' });
        this.toggleImportVisible();
        return null;
      }
      if (
        res.datum &&
        Array.isArray(res.datum.failExcelData) &&
        !isEmpty(res.datum.failExcelData)
      ) {
        createMessage({ type: 'error', description: res.datum.msg || '上传失败' });
        this.setState({
          failedList: res.datum.failExcelData,
        });
      } else {
        createMessage({ type: 'error', description: res.datum.msg || '上传失败,返回结果为空' });
        this.toggleImportVisible();
      }
      return null;
    });
  };

  toggleImportVisible = () => {
    const { importVisible } = this.state;
    this.setState({ importVisible: !importVisible });
  };

  onRef = ref => {
    this.modal = ref;
  };

  render() {
    // console.log(this.modal,'this.modal');
    const {
      dispatch,
      loading,
      platResProfile: { dataSource, total, searchForm, type2Data, pageConfig },
      form,
      user: { user },
    } = this.props;
    const { importVisible, failedList, uploading } = this.state;
    const { roles = [] } = user;
    // 判断权限  批量上传电子照片 按钮权限的角色
    const checkRole = () => {
      let flag = false;
      roles.forEach(v => {
        if (roleAuth.includes(v)) {
          flag = true;
        }
      });
      return !flag;
    };
    // 批量上传电子照片
    const excelImportProps = {
      templateUrl: location.origin + `/template/batchPhoneDemo.zip`, // eslint-disable-line
      option: {
        fileName: '电子照片批量导入失败记录',
        datas: [
          {
            sheetName: '电子照片批量导入失败记录', // 表名
            sheetFilter: ['errorMsg', 'fileName'], // 列过滤
            sheetHeader: ['失败原因', '文件名称'], // 第一行标题
            columnWidths: [12, 6], // 列宽 需与列顺序对应。
          },
        ],
      },
      controlModal: {
        visible: importVisible,
        failedList,
        uploading,
      },
    };

    const { getFieldDecorator } = form;

    const { resLeaveVisible, modalData, isBatchEdit, selectedKeys } = this.state;
    const { pageBlockViews } = pageConfig;
    if (!pageBlockViews || pageBlockViews.length < 1) {
      return <div />;
    }
    const currentQueryConfig = [];
    const currentListConfig = [];
    pageBlockViews.forEach(view => {
      // 资源档案管理查询
      if (
        view.blockKey === 'RES_ARCHIVES_MANAGEMENT_QUERY1' ||
        view.blockKey === 'RES_ARCHIVES_MANAGEMENT_QUERY2' ||
        view.blockKey === 'RES_ARCHIVES_MANAGEMENT_QUERY3' ||
        view.blockKey === 'RES_ARCHIVES_MANAGEMENT_QUERY4'
      ) {
        currentQueryConfig.push(view);
      } else if (
        view.blockKey === 'RES_ARCHIVES_MANAGEMENT_MAIN1' ||
        view.blockKey === 'RES_ARCHIVES_MANAGEMENT_MAIN2'
      ) {
        currentListConfig.push(view);
      }
    });

    const pageFieldJsonQuery = {};
    const pageFieldJsonList = {};
    currentQueryConfig.forEach(view => {
      view.pageFieldViews.forEach(field => {
        pageFieldJsonQuery[field.fieldKey] = field;
      });
    });

    currentListConfig.forEach(view => {
      view.pageFieldViews.forEach(field => {
        pageFieldJsonList[field.fieldKey] = field;
      });
    });

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      loading,
      total,
      dataSource,
      searchForm,
      ref: this.tableRef,
      onChange: filters => {
        this.fetchData(filters);
      },

      onSearchBarChange: (changedValues, allValues) => {
        const obj = { ...allValues };
        if (Object.keys(changedValues)[0] === 'resType1') {
          this.tableRef.current.searchBarRef.current.props.form.setFieldsValue({
            resType2: undefined,
          });
          obj.resType2 = undefined;
          // 分类一 -> 分类二
          if (changedValues.resType1) {
            dispatch({
              type: `${DOMAIN}/updateListType2`,
              payload: changedValues.resType1,
            });
          } else {
            dispatch({
              type: `${DOMAIN}/updateState`,
              payload: {
                type2Data: [],
              },
            });
          }
        }
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchBarForm: [
        pageFieldJsonQuery.resNo.visibleFlag && {
          title: `${pageFieldJsonQuery.resNo.displayName}/${
            pageFieldJsonList.personId.displayName
          }`, // TODO: 国际化
          dataIndex: 'searchKey',
          sortNo: `${pageFieldJsonQuery.resNo.sortNo}`,
          options: {
            initialValue: searchForm.searchKey,
          },
        },
        pageFieldJsonQuery.empNo.visibleFlag && {
          title: `${pageFieldJsonQuery.empNo.displayName}`, // TODO: 国际化
          dataIndex: 'empNo',
          sortNo: `${pageFieldJsonQuery.empNo.sortNo}`,
          options: {
            initialValue: searchForm.empNo,
          },
        },
        pageFieldJsonQuery.resType1.visibleFlag && {
          title: `${pageFieldJsonQuery.resType1.displayName}`, // TODO: 国际化
          dataIndex: 'resType1',
          sortNo: `${pageFieldJsonQuery.resType1.sortNo}`,
          options: {
            initialValue: searchForm.resType1,
          },
          tag: (
            <Selection.UDC
              code="RES.RES_TYPE1"
              placeholder={`请选择${pageFieldJsonQuery.resType1.displayName}`}
            />
          ),
        },
        pageFieldJsonQuery.resType2.visibleFlag && {
          title: `${pageFieldJsonQuery.resType2.displayName}`, // TODO: 国际化
          dataIndex: 'resType2',
          sortNo: `${pageFieldJsonQuery.resType2.sortNo}`,
          options: {
            initialValue: searchForm.resType2,
          },
          tag: (
            <AsyncSelect
              source={type2Data}
              placeholder={`请选择${pageFieldJsonQuery.resType2.displayName}`}
            />
          ),
        },
        pageFieldJsonQuery.resStatus.visibleFlag && {
          title: `${pageFieldJsonQuery.resStatus.displayName}`, // TODO: 国际化
          dataIndex: 'resStatus',
          sortNo: `${pageFieldJsonQuery.resStatus.sortNo}`,
          options: {
            initialValue: searchForm.resStatus,
          },
          tag: (
            <Selection.UDC
              code="RES.RES_STATUS"
              placeholder={`请选择${pageFieldJsonQuery.resStatus.displayName}`}
            />
          ),
        },
        pageFieldJsonQuery.baseBuId.visibleFlag && {
          title: `${pageFieldJsonQuery.baseBuId.displayName}`, // TODO: 国际化
          dataIndex: 'baseBuId',
          sortNo: `${pageFieldJsonQuery.baseBuId.sortNo}`,
          options: {
            initialValue: searchForm.baseBuId,
          },
          tag: (
            <Selection
              source={() => selectBus()}
              placeholder={`${pageFieldJsonQuery.baseBuId.displayName}下拉`}
            />
          ),
        },
        pageFieldJsonQuery.baseCity.visibleFlag && {
          title: `${pageFieldJsonQuery.baseCity.displayName}`, // TODO: 国际化
          dataIndex: 'baseCity',
          sortNo: `${pageFieldJsonQuery.baseCity.sortNo}`,
          options: {
            initialValue: searchForm.baseCity,
          },
          tag: (
            <Selection.UDC
              code="COM.CITY"
              placeholder={`请选择${pageFieldJsonQuery.baseCity.displayName}`}
            />
          ),
        },
        pageFieldJsonQuery.enrollDate.visibleFlag && {
          title: `${pageFieldJsonQuery.enrollDate.displayName}`, // TODO: 国际化
          dataIndex: 'enrollDate',
          sortNo: `${pageFieldJsonQuery.enrollDate.sortNo}`,
          options: {
            initialValue: searchForm.enrollDate,
          },
          tag: (
            <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} className="x-fill-100" />
          ),
        },
        pageFieldJsonQuery.contractExpireDate.visibleFlag && {
          title: `${pageFieldJsonQuery.contractExpireDate.displayName}`, // TODO: 国际化
          dataIndex: 'contractExpireDate',
          sortNo: `${pageFieldJsonQuery.contractExpireDate.sortNo}`,
          options: {
            initialValue: searchForm.contractExpireDate,
          },
          tag: (
            <DatePicker.RangePicker placeholder={['开始日期', '结束日期']} className="x-fill-100" />
          ),
        },
        pageFieldJsonQuery.companyName.visibleFlag && {
          title: `${pageFieldJsonQuery.companyName.displayName}`, // TODO: 国际化
          dataIndex: 'corpName',
          sortNo: `${pageFieldJsonQuery.companyName.sortNo}`,
          options: {
            initialValue: searchForm.corpName,
          },
        },
        pageFieldJsonQuery.jobtitle.visibleFlag && {
          title: `${pageFieldJsonQuery.jobtitle.displayName}`, // TODO: 国际化
          dataIndex: 'jobtitle',
          sortNo: `${pageFieldJsonQuery.jobtitle.sortNo}`,
          options: {
            initialValue: searchForm.jobtitle,
          },
        },
        pageFieldJsonQuery.qualification.visibleFlag && {
          title: `${pageFieldJsonQuery.qualification.displayName}`, // TODO: 国际化
          dataIndex: 'qualification',
          sortNo: `${pageFieldJsonQuery.qualification.sortNo}`,
          options: {
            initialValue: searchForm.qualification,
          },
          tag: <UdcSelect code="COM.EDUCATION" />,
        },
        pageFieldJsonQuery.edusysType.visibleFlag && {
          title: `${pageFieldJsonQuery.edusysType.displayName}`, // TODO: 国际化
          dataIndex: 'edusysType',
          sortNo: `${pageFieldJsonQuery.edusysType.sortNo}`,
          options: {
            initialValue: searchForm.edusysType,
          },
          tag: <UdcSelect code="COM.EDU_SYS" />,
        },
        pageFieldJsonQuery.label1.visibleFlag && {
          title: `${pageFieldJsonQuery.label1.displayName}`, // TODO: 国际化
          dataIndex: 'label1',
          sortNo: `${pageFieldJsonQuery.label1.sortNo}`,
          options: {
            initialValue: searchForm.label1,
          },
          tag: <Selection source={() => selectBus()} />,
        },
        pageFieldJsonQuery.jobGrade.visibleFlag && {
          title: `${pageFieldJsonQuery.jobGrade.displayName}`, // TODO: 国际化
          dataIndex: 'jobGrade',
          sortNo: `${pageFieldJsonQuery.jobGrade.sortNo}`,
          options: {
            initialValue: searchForm.jobGrade,
          },
          tag: (
            <Selection.UDC
              code="RES:JOB_GRADE"
              placeholder={`请选择${pageFieldJsonQuery.jobGrade.displayName}`}
            />
          ),
        },
        pageFieldJsonQuery.managementGrade.visibleFlag && {
          title: `${pageFieldJsonQuery.managementGrade.displayName}`, // TODO: 国际化
          dataIndex: 'managementGrade',
          sortNo: `${pageFieldJsonQuery.managementGrade.sortNo}`,
          options: {
            initialValue: searchForm.managementGrade,
          },
          tag: (
            <Selection.UDC
              code="RES:MANAGEMENT_GRADE"
              placeholder={`请选择${pageFieldJsonQuery.managementGrade.displayName}`}
            />
          ),
        },
        pageFieldJsonQuery.positionSequence.visibleFlag && {
          title: `${pageFieldJsonQuery.positionSequence.displayName}`, // TODO: 国际化
          dataIndex: 'positionSequence',
          sortNo: `${pageFieldJsonQuery.positionSequence.sortNo}`,
          options: {
            initialValue: searchForm.positionSequence,
          },
          tag: (
            <Selection.UDC
              code="RES:POSITION_SEQUENCE"
              placeholder={`请选择${pageFieldJsonQuery.positionSequence.displayName}`}
            />
          ),
        },
        pageFieldJsonQuery.professionalSequence.visibleFlag && {
          title: `${pageFieldJsonQuery.professionalSequence.displayName}`, // TODO: 国际化
          dataIndex: 'professionalSequence',
          sortNo: `${pageFieldJsonQuery.professionalSequence.sortNo}`,
          options: {
            initialValue: searchForm.professionalSequence,
          },
          tag: (
            <Selection.UDC
              code="RES:PROFESSIONAL_SEQUENCE"
              placeholder={`请选择${pageFieldJsonQuery.professionalSequence.displayName}`}
            />
          ),
        },
      ]
        .filter(Boolean)
        .sort((field1, field2) => field1.sortNo - field2.sortNo),
      columns: [
        pageFieldJsonList.resNo.visibleFlag && {
          title: `${pageFieldJsonList.resNo.displayName}`, // TODO: 国际化
          dataIndex: 'resNo',
          sorter: true,
          align: 'center',
          defaultSortOrder: 'descend',
          sortNo: `${pageFieldJsonList.resNo.sortNo}`,
          render: (value, row, key) => (
            <Link className="tw-link" to={`/hr/res/profile/list/resQuery?id=${row.id}`}>
              {value}
            </Link>
          ),
        },
        pageFieldJsonList.personId.visibleFlag && {
          title: `${pageFieldJsonList.personId.displayName}`, // TODO: 国际化
          dataIndex: 'resName',
          sorter: true,
          sortNo: `${pageFieldJsonList.personId.sortNo}`,
          render: (value, row, key) => (
            <Link className="tw-link" to={`/hr/res/profile/list/resQuery?id=${row.id}`}>
              {value}
            </Link>
          ),
        },
        pageFieldJsonList.empNo.visibleFlag && {
          title: `${pageFieldJsonList.empNo.displayName}`, // TODO: 国际化
          dataIndex: 'empNo',
          align: 'center',
          sorter: true,
          sortNo: `${pageFieldJsonList.empNo.sortNo}`,
        },
        pageFieldJsonList.resType1.visibleFlag && {
          title: `${pageFieldJsonList.resType1.displayName}`, // TODO: 国际化
          dataIndex: 'resType1Name',
          align: 'center',
          sortNo: `${pageFieldJsonList.resType1.sortNo}`,
        },
        pageFieldJsonList.resType2.visibleFlag && {
          title: `${pageFieldJsonList.resType2.displayName}`, // TODO: 国际化
          dataIndex: 'resType2Name',
          align: 'center',
          sortNo: `${pageFieldJsonList.resType2.sortNo}`,
        },
        pageFieldJsonList.resStatus.visibleFlag && {
          title: `${pageFieldJsonList.resStatus.displayName}`, // TODO: 国际化
          dataIndex: 'resStatusName',
          align: 'center',
          sortNo: `${pageFieldJsonList.resStatus.sortNo}`,
        },
        pageFieldJsonList.apprStatus.visibleFlag && {
          title: `${pageFieldJsonList.apprStatus.displayName}`, // TODO: 国际化
          dataIndex: 'apprStatusName',
          align: 'center',
          sortNo: `${pageFieldJsonList.apprStatus.sortNo}`,
        },
        pageFieldJsonList.baseBuId.visibleFlag && {
          title: `${pageFieldJsonList.baseBuId.displayName}`, // TODO: 国际化
          dataIndex: 'baseBuName',
          sortNo: `${pageFieldJsonList.baseBuId.sortNo}`,
        },
        pageFieldJsonList.baseCity.visibleFlag && {
          title: `${pageFieldJsonList.baseCity.displayName}`, // TODO: 国际化
          dataIndex: 'baseCityName',
          align: 'center',
          sortNo: `${pageFieldJsonList.baseCity.sortNo}`,
        },
        pageFieldJsonList.enrollDate.visibleFlag && {
          title: `${pageFieldJsonList.enrollDate.displayName}`, // TODO: 国际化
          dataIndex: 'enrollDate',
          align: 'center',
          sortNo: `${pageFieldJsonList.enrollDate.sortNo}`,
        },
        pageFieldJsonList.contractExpireDate.visibleFlag && {
          title: `${pageFieldJsonList.contractExpireDate.displayName}`, // TODO: 国际化
          dataIndex: 'contractExpireDate',
          align: 'center',
          sortNo: `${pageFieldJsonList.contractExpireDate.sortNo}`,
        },
        pageFieldJsonList.label1.visibleFlag && {
          title: `${pageFieldJsonList.label1.displayName}`, // TODO: 国际化
          dataIndex: 'buName',
          align: 'center',
          sortNo: `${pageFieldJsonList.label1.sortNo}`,
        },
        pageFieldJsonList.jobGrade.visibleFlag && {
          title: `${pageFieldJsonList.jobGrade.displayName}`, // TODO: 国际化
          dataIndex: 'jobGrade',
          align: 'center',
          sorter: true,
          sortNo: `${pageFieldJsonList.jobGrade.sortNo}`,
        },
        pageFieldJsonList.managementGrade.visibleFlag && {
          title: `${pageFieldJsonList.managementGrade.displayName}`, // TODO: 国际化
          dataIndex: 'managementGrade',
          align: 'center',
          sorter: true,
          sortNo: `${pageFieldJsonList.managementGrade.sortNo}`,
        },
        pageFieldJsonList.positionSequence.visibleFlag && {
          title: `${pageFieldJsonList.positionSequence.displayName}`, // TODO: 国际化
          dataIndex: 'positionSequenceName',
          align: 'center',
          sorter: true,
          sortNo: `${pageFieldJsonList.positionSequence.sortNo}`,
        },
        pageFieldJsonList.professionalSequence.visibleFlag && {
          title: `${pageFieldJsonList.professionalSequence.displayName}`, // TODO: 国际化
          dataIndex: 'professionalSequenceName',
          align: 'center',
          sorter: true,
          sortNo: `${pageFieldJsonList.professionalSequence.sortNo}`,
        },
        pageFieldJsonList.remark.visibleFlag && {
          title: `${pageFieldJsonList.remark.displayName}`, // TODO: 国际化
          dataIndex: 'remark1',
          render: (value, row, key) =>
            value && value.length > 30 ? (
              <Tooltip placement="left" title={value}>
                <pre>{`${value.substr(0, 30)}...`}</pre>
              </Tooltip>
            ) : (
              <pre>{value}</pre>
            ),
        },
      ]
        .filter(Boolean)
        .sort((field1, field2) => field1.sortNo - field2.sortNo),
      leftButtons: [
        {
          key: 'add',
          className: 'tw-btn-primary',
          icon: 'plus-circle',
          title: formatMessage({ id: `misc.insert`, desc: '新增' }),
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) =>
            router.push(`/hr/res/profile/list/resDetail?mode=create`),
        },
        {
          key: 'edit',
          className: 'tw-btn-primary',
          icon: 'form',
          title: formatMessage({ id: `misc.update`, desc: '修改' }),
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            selectedRows.length !== 1 ||
            (selectedRows[0] &&
              selectedRows[0].apprStatus !== 'NOTSUBMIT' &&
              (selectedRows[0] && selectedRows[0].apprStatus !== 'APPROVED') &&
              (selectedRows[0] && selectedRows[0].apprStatus !== 'REJECTED') &&
              (selectedRows[0] && selectedRows[0].apprStatus !== 'WITHDRAW')),
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            // 资源状态为‘1’表示创建中；‘3’表示已认证
            const status = selectedRows[0].resStatus;
            if (status !== resStatus.RES_STATUS_1 && status !== resStatus.RES_STATUS_3) {
              createMessage({
                type: 'warn',
                description: '只有人才库或者在职状态的记录才能编辑',
              });
            } else if (status === resStatus.RES_STATUS_1) {
              router.push(`/hr/res/profile/list/resDetail?id=${selectedRowKeys}&mode=update`);
            } else if (status === resStatus.RES_STATUS_3) {
              router.push(
                `/hr/res/profile/list/resDetailEdit?id=${selectedRowKeys}&mode=update&tab=basic`
              );
            }
          },
        },
        {
          key: 'batchEdit',
          className: 'tw-btn-primary',
          icon: 'form',
          title: '批量修改',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRows => !(selectedRows.length > 0),
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            this.batchEditModal(selectedRowKeys);
          },
        },
        {
          key: 'remove',
          className: 'tw-btn-error',
          icon: 'file-excel',
          title: formatMessage({ id: `misc.delete`, desc: '删除' }),
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            // 仅未提交的资源可删除(可多条删除)
            !(
              selectedRows.length > 0 &&
              selectedRows.filter(v => v.apprStatus !== 'NOTSUBMIT').length <= 0
            ),
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            this.deleteByStatus(selectedRowKeys, selectedRows, queryParams);
          },
        },
        {
          key: 'editCat',
          className: 'tw-btn-primary',
          icon: 'form',
          title: '资源能力管理',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const urls = getUrl();
            const from = stringify({ from: urls });
            router.push(
              `/hr/res/profile/list/resCapacity?id=${selectedRowKeys}&resNo=${
                selectedRows[0].resNo
              }&resName=${selectedRows[0].resName}&${from}`
            );
          },
        },
        {
          key: 'sync',
          className: 'tw-btn-primary',
          icon: 'form',
          title: '同步资源到ELP',
          loading: false,
          hidden: false,
          disabled: selectedRows => selectedRows.length !== 1,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const { id } = selectedRows[0];
            dispatch({
              type: `${DOMAIN}/snyc`,
              payload: id,
            });
          },
        },
        {
          key: 'enroll',
          className: 'tw-btn-primary',
          icon: 'solution',
          title: 'Offer发放及入职申请',
          loading: false,
          hidden: false,
          disabled: selectedRows =>
            // !(
            //   selectedRows.length === 1 &&
            //   ((selectedRows[0] && selectedRows[0].resType1 === null) ||
            //     (selectedRows[0] && selectedRows[0].resType1 === 'INTERNAL_RES')) &&
            //   (selectedRows[0] && selectedRows[0].resStatus === '1')
            // ),
            !(
              (selectedRows.length === 1 &&
                ((selectedRows[0] && selectedRows[0].resStatus === null) ||
                  (selectedRows[0] && selectedRows[0].resStatus === '1') ||
                  (selectedRows[0] && selectedRows[0].resStatus === '6'))) ||
              (selectedRows[0] &&
                selectedRows[0].resStatus === '3' &&
                selectedRows[0].resType1 === 'EXTERNAL_RES')
            ),
          // 修改为人才库/已离职资源可用  外部资源和在职可用
          // !(
          //   (selectedRows[0] && selectedRows[0].apprStatus === 'NOTSUBMIT') ||
          //   (selectedRows[0] &&
          //     selectedRows[0].apprStatus === 'APPROVED' &&
          //     selectedRows[0].resStatus === '6') ||
          //   (selectedRows[0] && selectedRows[0].apprStatus === 'CLOSED') ||
          //   ((selectedRows[0] &&
          //     selectedRows[0].resType1 === 'INTERNAL_RES' &&
          //     selectedRows[0].resType2 === 'TRAINEE') ||
          //     ((selectedRows[0] && selectedRows[0].apprStatus === 'NOTSUBMIT') ||
          //       (selectedRows[0] && selectedRows[0].apprStatus === 'APPROVED') ||
          //       (selectedRows[0] && selectedRows[0].apprStatus === 'CLOSED')))
          // ),
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const { id } = selectedRows[0];
            router.push(`/hr/res/profile/list/OfferAndResCreate?id=${id}`);
          },
        },
        {
          key: 'extrApply',
          className: 'tw-btn-primary',
          icon: 'solution',
          title: '外部资源引入',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRows =>
            // !(
            //   selectedRows.length === 1 &&
            //   ((selectedRows[0] && selectedRows[0].resType1 === null) ||
            //     (selectedRows[0] && selectedRows[0].resType1 === 'EXTERNAL_RES')) &&
            //   (selectedRows[0] && selectedRows[0].resStatus === '1')
            // ),
            // 按钮逻辑修改为人才库/已离职资源可用
            !(
              selectedRows.length === 1 &&
              ((selectedRows[0] && selectedRows[0].resStatus === null) ||
                (selectedRows[0] && selectedRows[0].resStatus === '1') ||
                (selectedRows[0] && selectedRows[0].resStatus === '6'))
            ),
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            const { id } = selectedRows[0];
            router.push(`/hr/res/profile/list/extrApplyCreate?id=${id}`);
          },
        },

        {
          key: 'blackList',
          className: 'tw-btn-primary',
          icon: 'solution',
          title: '加入黑名单',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRows => !(selectedRows.length > 0),
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            this.addBlackList(selectedRowKeys, selectedRows, queryParams);
          },
        },
        {
          key: 'leave',
          className: 'tw-btn-primary',
          icon: 'solution',
          title: '离职处理',
          loading: false,
          hidden: false,
          minSelections: 0,
          disabled: selectedRows => {
            if (selectedRows && selectedRows.length > 0) {
              const selectedRowsLengthStatus = selectedRows.length === 1;
              const selectedRowsResStatus =
                selectedRows[0].resStatus === '3' ||
                selectedRows[0].resStatus === '4' ||
                selectedRows[0].resStatus === '5';
              const disabledFlag = !(selectedRowsLengthStatus && selectedRowsResStatus);
              return disabledFlag;
            }
            return true;
          },
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            createConfirm({
              content: (
                <span>
                  <span>确定对资源</span>
                  <h1>{selectedRows[0].resName}</h1>
                  <span>进行离职操作？操作后账号将不可恢复！！！</span>
                </span>
              ),
              onOk: () =>
                this.setState({
                  resLeaveVisible: !resLeaveVisible,
                  modalData: selectedRows[0],
                }),
            });
          },
        },
        {
          key: 'importTag',
          icon: 'file-zip',
          className: 'tw-btn-primary',
          title: '批量上传电子照片',
          loading: false,
          hidden: checkRole(),
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            this.toggleImportVisible();
          },
        },
      ],
    };

    return (
      <PageHeaderWrapper>
        <ZipImportExport
          {...excelImportProps}
          closeModal={this.toggleImportVisible}
          handleUpload={this.batchUploadOwerPhoto}
          onRef={this.onRef}
        />
        <DataTable {...tableProps} />
        <ResLeaveModal
          visible={resLeaveVisible}
          dispatch={dispatch}
          domain={DOMAIN}
          modalData={modalData}
          handleOk={this.handleOk}
          handleCancel={this.handleCancel}
          form={form}
        />
        <Modal
          title="批量修改"
          visible={isBatchEdit}
          onOk={() => this.confirmModification()}
          onCancel={() => this.cancel()}
          width="700px"
        >
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2} noReactive>
            <Field
              name="jobGrade"
              label="专业级别"
              decorator={{
                // initialValue: isBatchEdit ? dataSource.jobGrade : undefined,
                rules: [
                  {
                    required: false,
                    message: '请选择专业级别',
                  },
                ],
              }}
            >
              <Selection.UDC code="RES:JOB_GRADE" placeholder="请选择专业级别" />
            </Field>
            <Field
              name="managementGrade"
              label="管理级别"
              decorator={{
                // initialValue: dataSource.managementGrade,
                rules: [
                  {
                    required: false,
                    message: '请选择管理级别',
                  },
                ],
              }}
            >
              <Selection.UDC code="RES:MANAGEMENT_GRADE" placeholder="请选择管理级别" />
            </Field>
            <Field
              name="positionSequence"
              label="职位序列"
              decorator={{
                // initialValue: dataSource.positionSequence,
                rules: [
                  {
                    required: false,
                    message: '请选择职位序列',
                  },
                ],
              }}
            >
              <Selection.UDC code="RES:POSITION_SEQUENCE" placeholder="请选择职位序列" />
            </Field>
            <Field
              name="professionalSequence"
              label="专业序列"
              decorator={{
                // initialValue: dataSource.professionalSequence,
                rules: [
                  {
                    required: false,
                    message: '请选择专业序列',
                  },
                ],
              }}
            >
              <Selection.UDC code="RES:PROFESSIONAL_SEQUENCE" placeholder="请选择专业序列" />
            </Field>
          </FieldList>
        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default ResProfile;
