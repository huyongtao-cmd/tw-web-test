import React from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { isEmpty, isNil, omit } from 'ramda';
import SearchFormItem from '@/components/production/business/SearchFormItem.tsx';
import Link from '@/components/production/basic/Link.tsx';
import PageWrapper from '@/components/production/layout/PageWrapper.tsx';
import SearchTable from '@/components/production/business/SearchTable.tsx';
import message from '@/components/production/layout/Message';
// @ts-ignore
import { informationListPaging, logicDel } from '@/services/production/user';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { remindString } from '@/components/production/basic/Remind.tsx';
import { handleEmptyProps } from '@/utils/production/objectUtils.ts';
import createMessage from '@/components/core/AlertMessage';
import ExcelImportExport from '@/components/common/ExcelImportExport';
import FormItem from '@/components/production/business/FormItem.tsx';

const DOMAIN = 'information';

@connect(({ loading, dispatch, information }) => ({
  // treeLoading: loading.effects[`${DOMAIN}/init`],
  loading,
  dispatch,
  ...information,
}))
class Information extends React.PureComponent {
  state = {
    visible: false,
    failedList: [],
  };

  componentDidMount() {
    this.callModelEffects('queryCompanyList', { innerType: 'INTERNAL' });
  }

  fetchData = async params => {
    let wrappedParam = { ...params };
    //paymentAmtRange  expectedPaymentDateRange  actualPaymentDateRange
    if (params.enrollDateDateRange) {
      [wrappedParam.enrollDateDateFrom, wrappedParam.enrollDateDateTo] = params.enrollDateDateRange;
      delete wrappedParam.enrollDateDateRange;
    }
    if (params.birthdayDateRange) {
      [wrappedParam.birthdayDateFrom, wrappedParam.birthdayDateTo] = params.birthdayDateRange;
      delete wrappedParam.birthdayDateRange;
    }
    wrappedParam = handleEmptyProps(wrappedParam);
    const { data } = await outputHandle(informationListPaging, wrappedParam);
    return data;
  };

  toggleImportVisible = () => {
    const { visible } = this.state;
    this.setState({ visible: !visible }, () => {
      this.setState({
        failedList: [],
      });
    });
  };

  handleUpload = fileList => {
    const fileData = new FormData();
    fileList.forEach(file => {
      fileData.append('excel', file);
    });
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/upload`,
      payload: fileData,
    }).then(res => {
      if (res.ok) {
        createMessage({ type: 'success', description: '????????????' });
        this.toggleImportVisible();

        const { getInternalState } = this.state;
        const { refreshData } = getInternalState();
        refreshData();
        return;
      }

      if (res.data && Array.isArray(res.data) && !isEmpty(res.data)) {
        createMessage({
          type: 'warn',
          description: res.msg || '????????????????????????????????????????????????????????????',
        });
        this.setState({
          failedList: res.data,
        });
      } else {
        createMessage({
          type: 'error',
          description: res.errors ? res.errors[0]?.msg : '????????????????????????,??????????????????',
        });
        this.toggleImportVisible();
      }
    });
  };

  // ??????model???state
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  /**
   * ??????????????????,??????SearchTable????????????
   * @param keys ????????????????????????
   * @returns {Promise<*>} ????????????,???SearchTable????????????
   */
  deleteData = async keys => outputHandle(logicDel, { ids: keys.join(',') }, undefined, false);

  // ??????model???????????????
  callModelEffects = async (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  renderSearchForm = () => {
    const { form, formData, loading, companyList } = this.props;

    return [
      //?????????????????????????????????????????????????????????BU???Base????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      <SearchFormItem
        key="login"
        fieldType="BaseInput"
        label="?????????"
        fieldKey="login"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="name"
        fieldType="BaseInput"
        label="??????"
        fieldKey="name"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="resNo"
        fieldType="BaseInput"
        label="????????????"
        fieldKey="resNo"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="ouName"
        fieldType="BaseSelect"
        label="????????????"
        fieldKey="ouId"
        descList={companyList}
        // parentKey="FUNCTION:COMPANY:NAME"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="baseBuId"
        fieldType="BuSimpleSelect"
        label="??????BU"
        fieldKey="baseBuId"
        defaultShow
        advanced
      />,

      /*<SearchFormItem
        key="baseCity"
        fieldType="BaseCustomSelect"
        label="Base???"
        fieldKey="baseCity"
        defaultShow
        advanced
        parentKey="CUS:CITY"
      />,*/
      /*
      <SearchFormItem
        key="jobGrade"
        fieldType="BaseSelect"
        label="??????"
        fieldKey="jobGrade"
        parentKey="FUNCTION:GRADE"
        defaultShow
        advanced
      />,
    */
      <SearchFormItem
        key="position"
        fieldType="BaseInput"
        label="??????"
        fieldKey="position"
        defaultShow
        advanced
      />,

      <SearchFormItem
        key="parentResId"
        fieldType="ResSimpleSelect"
        label="????????????"
        fieldKey="parentResId"
        defaultShow
        advanced
      />,

      <SearchFormItem
        key="enrollDateDateRange"
        fieldType="BaseDateRangePicker"
        label="????????????"
        fieldKey="enrollDateDateRange"
        defaultShow
      />,

      <SearchFormItem
        key="phone"
        fieldType="BaseInput"
        label="?????????"
        fieldKey="phone"
        defaultShow
        advanced
      />,

      <SearchFormItem
        key="birthdayDateRange"
        fieldType="BaseDateRangePicker"
        label="??????"
        fieldKey="birthdayDateRange"
        defaultShow
      />,

      <SearchFormItem
        key="gender"
        fieldType="BaseSelect"
        label="??????"
        fieldKey="gender"
        defaultShow
        advanced
        parentKey="COMMON:GENDER"
      />,
    ];
  };

  render() {
    const { form, formData, loading, ...rest } = this.props;
    const { getInternalState, visible, failedList } = this.state;

    const columns = [
      {
        title: '?????????',
        dataIndex: 'login',
        ellipsis: true,
        render: (value, row) => (
          <Link
            twUri=""
            onClick={() =>
              router.push(`/plat/baseData/employeeDisplayPage?id=${row.id}&mode=DESCRIPTION`)
            }
          >
            {value}
          </Link>
        ),
      },
      {
        title: '??????',
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: '????????????',
        dataIndex: 'resNo',
        ellipsis: true,
        sorter: true,
      },
      {
        title: '????????????',
        dataIndex: 'idenNo',
        ellipsis: true,
        sorter: true,
      },
      {
        title: '????????????',
        dataIndex: 'ouName',
        ellipsis: true,
      },
      {
        title: '??????BU',
        dataIndex: 'buName',
        ellipsis: true,
      },
      // {
      //   title: 'Base???',
      //   dataIndex: 'baseCityDesc',
      //   ellipsis: true,
      // },
      // {
      //   title: '??????',
      //   dataIndex: 'jobGradeDesc',
      // },
      {
        title: '??????',
        dataIndex: 'position',
        ellipsis: true,
      },
      {
        title: '????????????',
        dataIndex: 'presName',
        ellipsis: true,
      },
      {
        title: '????????????',
        dataIndex: 'enrollDate',
        ellipsis: true,
      },
      {
        title: '?????????',
        dataIndex: 'phone',
        ellipsis: true,
      },
      {
        title: '??????',
        dataIndex: 'email',
        ellipsis: true,
      },
      {
        title: '??????',
        dataIndex: 'birthday',
        ellipsis: true,
      },
      // {
      //   title: '???????????????',
      //   dataIndex: 'resType1Desc',
      //   ellipsis: true,
      // },
      {
        title: '????????????',
        dataIndex: 'resStatusDesc',
        ellipsis: true,
      },
      {
        title: '??????',
        dataIndex: 'genderDesc',
        ellipsis: true,
      },
      // {
      //   title: '????????????????????????',
      //   dataIndex: 'hasSystemAccount',
      //   ellipsis: true,
      // },
      // {
      //   title: '??????',
      //   dataIndex: 'bankName',
      //   ellipsis: true,
      // },
      // {
      //   title: '??????',
      //   dataIndex: 'holderName',
      //   ellipsis: true,
      // },
      // {
      //   title: '??????',
      //   dataIndex: 'accountNo',
      //   ellipsis: true,
      // },
    ];

    const excelImportProps = {
      // eslint-disable-next-line no-restricted-globals
      templateUrl: location.origin + `/template/userInformationTemplate.xlsx`,
      option: {
        fileName: '??????????????????',
        datas: [
          {
            sheetName: '??????????????????', // ??????
            sheetFilter: [
              'login',
              'name',
              'resNo',
              'ouName',
              'buName',
              'baseCityDesc',
              'jobGrade',
              'position',
              'pResName',
              'enrollDate',
              'phone',
              'email',
              'birthday',
              'resType1Desc',
              'genderDesc',
              'hasSystemAccountDesc',
              // 'bankName',
              // 'holderName',
              // 'accountNo',
              'errorMessage',
            ], // ?????????
            sheetHeader: [
              '?????????',
              '??????',
              '????????????',
              '????????????',
              '??????BU',
              'Base???',
              '??????',
              '??????',
              '????????????',
              '????????????',
              '?????????',
              '??????',
              '??????',
              '???????????????',
              '??????',
              '????????????????????????',
              // '??????',
              // '??????',
              // '??????',
              '????????????',
            ], // ???????????????
            // columnWidths: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], // ?????? ?????????????????????
          },
        ],
      },
      controlModal: {
        visible,
        failedList,
        uploading: loading.effects[`${DOMAIN}/upload`],
      },
    };

    return (
      <PageWrapper>
        <ExcelImportExport
          {...excelImportProps}
          closeModal={this.toggleImportVisible}
          handleUpload={this.handleUpload}
        />
        <SearchTable
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          searchTitle={undefined}
          defaultAdvancedSearch={false}
          showSearchCardTitle={false}
          defaultSortBy="id"
          defaultSortDirection="DESC"
          searchForm={this.renderSearchForm()}
          defaultSearchForm={{}}
          fetchData={this.fetchData}
          columns={columns}
          tableExtraProps={{ scroll: { x: 2400 } }}
          onAddClick={() => router.push('/plat/baseData/employeeDisplayPage?mode=EDIT')}
          onEditClick={data => {
            router.push(`/plat/baseData/employeeDisplayPage?id=${data.id}&mode=EDIT`);
          }}
          deleteData={this.deleteData}
          extraButtons={[
            {
              key: 'importExcel',
              title: '??????Excel',
              type: 'primary',
              size: 'large',
              loading: false,
              cb: internalState => {
                this.setState({
                  visible: true,
                });
              },
            },
          ]}
        />
      </PageWrapper>
    );
  }
}

export default Information;
