import React from 'react';
import { connect } from 'dva';
import { Form, Modal } from 'antd';
import router from 'umi/router';
import { isEmpty } from 'ramda';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import Link from '@/components/production/basic/Link';
import PageWrapper from '@/components/production/layout/PageWrapper';
import { createConfirm } from '@/components/core/Confirm';
import SearchTable, { DataOutput } from '@/components/production/business/SearchTable';
import createMessage from '@/components/core/AlertMessage';
import { outputHandle } from '@/utils/production/outputUtil';
import { remindString } from '@/components/production/basic/Remind';

// @ts-ignore
import {
  projectPagingRq,
  projectDeleteRq,
  projectManagementPartialRq,
} from '@/services/workbench/project';

const DOMAIN = 'projectMgmtList';

@connect(({ loading, dispatch, projectMgmtList }) => ({
  loading,
  dispatch,
  ...projectMgmtList,
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
      type: `${DOMAIN}/updateFormForEditTable`,
      payload: newFieldData,
    });
  },
})
class index extends React.PureComponent {
  state = {};

  componentDidMount() {
    // this.callModelEffects("init")
    // const { dispatch } = this.props;
    // dispatch({
    //   type: `${DOMAIN}/getPageConfig`,
    //   payload: { pageNo: 'PROJECT_TABLE' },
    // });
  }

  fetchData = async params => {
    const { createTime, ...restparams } = params;
    if (Array.isArray(createTime) && (createTime[0] || createTime[1])) {
      [restparams.createTimeStart, restparams.createTimeEnd] = createTime;
    }

    const { response } = await projectPagingRq(restparams);
    return response.data;
  };

  deleteData = async keys =>
    outputHandle(projectDeleteRq, { ids: keys.join(',') }, undefined, false);

  changeStatus = async parmars => {
    const { response } = await projectManagementPartialRq(parmars);
    return response.data;
  };

  projectFlowPush = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/flow`,
      payload: {
        ...params,
        submit: true,
      },
    });
  };

  renderSearchForm = () => {
    const { pageConfig } = this.props;

    const fields = [
      <SearchFormItem
        key="projectName"
        fieldKey="projectName"
        label="????????????"
        fieldType="BaseInput"
        defaultShow
      />,
      <SearchFormItem
        key="projectNo"
        fieldKey="projectNo"
        label="????????????"
        fieldType="BaseInput"
        defaultShow
      />,
      // <SearchFormItem
      //   key="ouId"
      //   label="????????????"
      //   fieldType="BaseCustomSelect"
      //   fieldKey="ouId"
      //   parentKey="CUS:INTERNAL_COMPANY"
      //   defaultShow
      // />,
      <SearchFormItem
        label="???????????????"
        key="projectDutyResId"
        fieldKey="projectDutyResId"
        fieldType="ResSimpleSelect"
        defaultShow
      />,
      <SearchFormItem
        label="????????????"
        fieldKey="projectStatus"
        key="projectStatus"
        fieldType="BaseSelect"
        parentKey="PRO:PROJECT_STATUS"
        defaultShow
      />,
      <SearchFormItem
        key="createUserId"
        label="?????????"
        fieldType="UserSimpleSelect"
        fieldKey="createUserId"
        defaultShow
      />,
      <SearchFormItem
        key="createTime"
        label="????????????"
        fieldType="BaseDateRangePicker"
        fieldKey="createTime"
        defaultShow
      />,
    ];

    return fields;
  };

  renderColumns = () => {
    const { pageConfig } = this.props;

    const fields = [
      {
        title: '????????????',
        key: 'projectNo',
        dataIndex: 'projectNo',
        align: 'center',
        sorter: true,
        render: (value, row) => (
          <Link
            onClick={() =>
              router.push(
                `/workTable/projectMgmt/projectMgmtList/projectApplyDisplay?id=${
                  row.id
                }&mode=DESCRIPTION`
              )
            }
          >
            {value}
          </Link>
        ),
      },
      {
        title: '????????????',
        key: 'projectName',
        dataIndex: 'projectName',
        align: 'center',
      },
      {
        title: '????????????',
        key: 'businessClass1',
        dataIndex: 'businessClass1Desc',
        align: 'center',
      },
      {
        title: '????????????',
        key: 'businessClass2',
        dataIndex: 'businessClass2Desc',
        align: 'center',
      },
      {
        title: '????????????',
        key: 'projectStatus',
        dataIndex: 'projectStatusDesc',
        align: 'center',
      },
      {
        title: '????????????',
        key: 'inchargeCompany',
        dataIndex: 'ouIdDesc',
        align: 'center',
      },
      {
        title: '??????????????????',
        key: 'inchargeBuId',
        dataIndex: 'salesDutyBuIdDesc',
        align: 'center',
      },
      {
        title: '???????????????',
        key: 'salesDutyResId',
        dataIndex: 'salesDutyResIdDesc',
        align: 'center',
      },
      {
        title: '??????',
        key: 'city',
        dataIndex: 'cityDesc',
        align: 'center',
      },
      {
        title: '?????????',
        key: 'createUserId',
        dataIndex: 'createUserIdDesc',
        align: 'center',
      },
      {
        title: '????????????',
        key: 'createTimeDesc',
        dataIndex: 'createTimeDesc',
        align: 'center',
        // render: value => value.replace('T', ' '),
      },
    ];

    return fields;
  };

  render() {
    const { loading } = this.props;
    const { getInternalState } = this.state;
    const loadingBtn = loading.effects[`${DOMAIN}/flow`];
    return (
      <PageWrapper>
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
          onAddClick={() =>
            router.push('/workTable/projectMgmt/projectMgmtList/projectApplyDisplay?mode=ADD')
          }
          onEditClick={data => {
            const { selectedRows } = getInternalState();
            const tt = selectedRows.filter(v => v.projectStatus !== 'CREATE');
            if (!isEmpty(tt)) {
              createMessage({
                type: 'warn',
                description: remindString({
                  remindCode: 'COM:E:ALLOW_MODIFY_CHECK',
                  defaultMessage: `????????????????????????????????????`,
                }),
              });
              return;
            }
            router.push(
              `/workTable/projectMgmt/projectMgmtList/projectApplyDisplay?id=${data.id}&mode=EDIT`
            );
          }}
          deleteData={data => {
            const { selectedRows } = getInternalState();
            const tt = selectedRows.filter(v => v.projectStatus !== 'CREATE');
            if (!isEmpty(tt)) {
              createMessage({
                type: 'warn',
                description: remindString({
                  remindCode: 'COM:ALLOW_DELETE_CHECK',
                  defaultMessage: `?????????????????????????????????????????????`,
                }),
              });
              return Promise.resolve({ ok: false });
            }
            return this.deleteData(data);
          }}
          extraButtons={[
            {
              key: 'adjust',
              title: '????????????',
              type: 'primary',
              size: 'large',
              loading: loadingBtn,
              cb: internalState => {
                // eslint-disable-next-line no-console
                const { selectedRowKeys, selectedRows } = internalState;
                const tt = selectedRows.filter(v => v.projectStatus === 'READY');
                if (isEmpty(tt)) {
                  createMessage({
                    type: 'warn',
                    description: `??????????????????????????????????????????????????????`,
                  });
                  return;
                }
                this.projectFlowPush(selectedRows[0]);
              },
              disabled: internalState => {
                const { selectedRowKeys } = internalState;
                return selectedRowKeys.length !== 1;
              },
            },
          ]}
          // tableExtraProps={{
          //   scroll: {
          //     x: 1500,
          //   },
          // }}
        />
      </PageWrapper>
    );
  }
}

export default index;
