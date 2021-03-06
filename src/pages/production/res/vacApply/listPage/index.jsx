import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import Link from 'umi/link';
import { Tooltip } from 'antd';
import { isEmpty } from 'ramda';
import { mountToTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import SearchTable, { DataOutput } from '@/components/production/business/SearchTable';
import { fromQs } from '@/utils/stringUtils';
import { sub } from '@/utils/mathUtils';
import ExcelImportExport from '@/components/common/ExcelImportExport';
import createMessage from '@/components/core/AlertMessage';
// import ParamConfig from './paramConfigModal';
// import BatchEditModal from './batchEditModal';
import { outputHandle } from '@/utils/production/outputUtil';
import { vacationList, vacationDeleteRq } from '@/services/production/res/vacation';

const DOMAIN = 'vacationMgmtNew';

@connect(({ loading, vacationMgmtNew, user }) => ({
  // loading,
  user,
  vacationMgmtNew,
  loading: loading.effects[`${DOMAIN}/query`],
}))
@mountToTab()
class VacationMgmt extends PureComponent {
  state = {
    visible: false,
    failedList: [],
    uploading: false,
    paramConfigVisible: false,
    batchEditVisible: false,
  };

  componentDidMount() {
    const {
      dispatch,
      user: { user },
    } = this.props;

    const { _refresh } = fromQs();
    // !(_refresh === '0') && dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    if (_refresh === '0') {
      const { getInternalState } = this.state;
      const { refreshData } = getInternalState();
      refreshData();
    }
    dispatch({ type: `${DOMAIN}/baseBU` });
    dispatch({
      type: `${DOMAIN}/queryTemporaryTime`,
    });
  }

  fetchData = async payload => {
    const { vacationDate, ...params } = payload;
    if (Array.isArray(vacationDate) && vacationDate[0] && vacationDate[1]) {
      [params.expirationDateStart, params.expirationDateEnd] = vacationDate;
    }
    delete params.baseBu;
    const { response } = await vacationList(params);
    return response.data;
  };

  deleteData = async keys =>
    outputHandle(vacationDeleteRq, { ids: keys.join(',') }, undefined, false);

  toggleVisible = () => {
    const { visible } = this.state;
    this.setState({ visible: !visible });
  };

  handleUpload = fileList => {
    this.setState({
      uploading: true,
    });

    const fileData = new FormData();
    fileList.forEach(file => {
      fileData.append('excel', file);
    });

    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/upload`,
      payload: fileData,
    }).then(res => {
      this.setState({
        uploading: false,
      });
      if (res.ok && isEmpty(res.data)) {
        this.toggleVisible();
        const { getInternalState } = this.state;
        const { refreshData } = getInternalState();
        refreshData();
        return null;
      }
      if (res.data && Array.isArray(res.data.data) && !isEmpty(res.data.data)) {
        createMessage({
          type: 'error',
          description: res.reason || '????????????????????????????????????????????????????????????',
        });
        this.setState({
          failedList: res.data.data,
        });
      } else {
        createMessage({ type: 'error', description: res.reason || '????????????,??????????????????' });
        this.toggleVisible();
      }
      return null;
    });
  };

  renderColumns = () => {
    const { pageConfig } = this.props;
    // const { getInternalState } = this.state;

    const fields = [
      {
        title: '??????',
        dataIndex: 'resNo',
        align: 'center',
      },
      {
        title: '??????',
        dataIndex: 'resName',
        align: 'center',
      },
      {
        title: '??????',
        dataIndex: 'companyDesc',
        align: 'center',
      },
      {
        title: '??????',
        dataIndex: 'buName',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'vacationTypeName',
        align: 'center',
      },
      {
        title: '??????',
        dataIndex: 'vacationYear',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'startDate',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'endDate',
        align: 'center',
      },
      {
        title: '??????????????????',
        dataIndex: 'expirationDate',
        align: 'center',
      },
      {
        title: '?????????',
        dataIndex: 'totalDays',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'usedDays',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'availableDays',
        align: 'center',
      },
      {
        title: '???????????????',
        dataIndex: 'frozenDay',
        align: 'center',
      },
      {
        title: '??????',
        dataIndex: 'remark',
        render: (value, row, key) =>
          value && value.length > 15 ? (
            <Tooltip placement="left" title={<pre>{value}</pre>}>
              <span>{`${value.substr(0, 15)}...`}</span>
            </Tooltip>
          ) : (
            <span>{value}</span>
          ),
      },
    ];

    return fields;
  };

  renderSearchForm = () => {
    const { pageConfig } = this.props;
    const fields = [
      <SearchFormItem key="resId" fieldType="ResSimpleSelect" label="??????" fieldKey="resId" />,
      <SearchFormItem
        key="company"
        label="????????????"
        fieldType="BaseCustomSelect"
        fieldKey="company"
        parentKey="CUS:INTERNAL_COMPANY"
        defaultShow
      />,
      <SearchFormItem
        key="inchargeBuId"
        label="??????"
        fieldType="BuSimpleSelect"
        fieldKey="baseBuId"
        defaultShow
      />,
      <SearchFormItem
        key="vacationType"
        label="????????????"
        fieldType="BaseCustomSelect"
        fieldKey="vacationType"
        parentKey="RES:VAC_TYPE"
        defaultShow
      />,
      <SearchFormItem
        key="year"
        fieldType="BaseInputNumber"
        label="??????"
        fieldKey="vacationYear"
        defaultShow
      />,
      <SearchFormItem
        key="vacationYear"
        fieldType="BaseDateRangePicker"
        label="??????????????????"
        fieldKey="vacationDate"
        defaultShow
      />,
    ];

    return fields;
  };

  render() {
    const { visible, failedList, uploading, paramConfigVisible, batchEditVisible } = this.state;

    const excelImportProps = {
      templateUrl: location.origin + `/template/newVacationImport.xlsx`, // eslint-disable-line
      option: {
        fileName: '??????????????????',
        datas: [
          {
            sheetName: '????????????_??????????????????????????????', // ??????
            sheetFilter: [
              'resNo',
              'resName',
              'company',
              'buName',
              'vacationType',
              'vacationYear',
              'startDate',
              'endDate',
              'expirationDate',
              'totalDays',
              'usedDays',
              'remark',
              'errorMessage',
            ], // ?????????
            sheetHeader: [
              '??????',
              '??????',
              '??????',
              '??????',
              '????????????',
              '??????',
              '?????????',
              '?????????',
              '??????????????????',
              '?????????',
              '????????????',
              '??????',
              '????????????',
            ], // ???????????????
            columnWidths: [4, 6, 6, 6, 8, 8, 8, 8, 8, 12], // ?????? ?????????????????????
          },
        ],
      },
      controlModal: {
        visible,
        failedList,
        uploading,
      },
    };

    return (
      <PageHeaderWrapper title="????????????">
        <ExcelImportExport
          {...excelImportProps}
          closeModal={this.toggleVisible}
          handleUpload={this.handleUpload}
        />
        <SearchTable
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          defaultSortBy="id"
          defaultSortDirection="DESC"
          showSearchCardTitle={false}
          searchForm={this.renderSearchForm()}
          defaultSearchForm={{}}
          fetchData={this.fetchData}
          columns={this.renderColumns()}
          onAddClick={() => router.push('/workTable/vacApply/vacApplyListPage/edit')}
          onEditClick={data =>
            router.push(`/workTable/vacApply/vacApplyListPage/edit?id=${data.id}&mode=EDIT`)
          }
          deleteData={data => this.deleteData(data)}
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
      </PageHeaderWrapper>
    );
  }
}

export default VacationMgmt;
