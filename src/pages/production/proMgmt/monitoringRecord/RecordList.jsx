import React, { PureComponent } from 'react';

import router from 'umi/router';

import PageWrapper from '@/components/production/layout/PageWrapper';

import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { fromQs } from '@/utils/production/stringUtil';
import {
  monitoringRecordPagingRq,
  monitoringRecordDeleteRq,
} from '@/services/production/projectMgmt/monitoringRecord';

class RecordList extends PureComponent {
  state = {
    getInternalState: null,
    projectId: null,
  };

  componentDidMount() {
    const { projectId } = fromQs();
    this.setState({ projectId });
  }

  fetchData = async params => {
    const { createTime, ...restparams } = params;
    const { projectId } = this.state;
    if (Array.isArray(createTime) && (createTime[0] || createTime[1])) {
      [restparams.startDate, restparams.endDate] = createTime;
    } else {
      restparams.createTime = createTime;
    }

    const { response } = await monitoringRecordPagingRq({
      ...restparams,
      releteProjectId: fromQs().projectId,
    });
    const result = response.data;
    return result;
  };

  /**
   * 删除数据方法,传给SearchTable组件使用
   * @param keys 要删除的数据主键
   * @returns {Promise<*>} 删除结果,给SearchTable组件使用
   */
  deleteData = async keys =>
    outputHandle(monitoringRecordDeleteRq, { keys: keys.join(',') }, undefined, false);

  /**
   * 组装查询条件
   * @returns {*[]} 查询条件集合
   */
  renderSearchForm = () => [
    <SearchFormItem
      label="项目编号/名称"
      key="projectIdOrName"
      fieldKey="projectIdOrName"
      fieldType="BaseInput"
    />,
    <SearchFormItem
      label="监播公司"
      key="monitorCompany"
      fieldKey="monitorCompany"
      fieldType="BaseInput"
    />,
    <SearchFormItem
      label="类型"
      key="monitorType"
      fieldKey="monitorType"
      fieldType="BaseSelect"
      parentKey="FUNCTION:MONITOR:TYPE"
    />,
    <SearchFormItem
      label="联系人"
      key="contractName"
      fieldKey="contractName"
      fieldType="BaseInput"
    />,
    <SearchFormItem
      label="接收人"
      key="receivedResId"
      fieldKey="receivedResId"
      fieldType="ResSimpleSelect"
    />,
    <SearchFormItem
      label="是否已发送给客户"
      key="sendFlag"
      fieldKey="sendFlag"
      fieldType="BaseSelect"
      options={[
        { title: '是', value: '1' },
        {
          title: '否',
          value: '0',
        },
      ]}
    />,
    <SearchFormItem
      label="客户接收人"
      key="custReceiveName"
      fieldKey="custReceiveName"
      fieldType="BaseInput"
    />,
    <SearchFormItem
      label="创建人"
      key="createUserId"
      fieldKey="createUserId"
      fieldType="ResSimpleSelect"
    />,
    <SearchFormItem
      label="创建日期"
      key="createTime"
      fieldKey="createTime"
      fieldType="BaseDatePicker"
    />,
  ];

  render() {
    const { getInternalState, projectId } = this.state;

    const columns = [
      {
        title: '项目编号',
        dataIndex: 'projectNo',
        align: 'center',
      },
      {
        title: '项目名称',
        dataIndex: 'projectName',
        align: 'center',
      },
      {
        title: '监播类型',
        dataIndex: 'monitorTypeDesc',
        align: 'center',
      },
      {
        title: '监播公司',
        dataIndex: 'monitorCompany',
        align: 'center',
      },
      {
        title: '联系人',
        dataIndex: 'contractName',
        align: 'center',
      },
      {
        title: '接收人',
        dataIndex: 'receivedResName',
        align: 'center',
      },
      {
        title: '接收日期',
        dataIndex: 'recevedDate',
        align: 'center',
      },

      {
        title: '接收文件存储位置',
        dataIndex: 'fileLocation',
        align: 'center',
      },
      {
        title: '是否已发送给客户',
        dataIndex: 'sendFlagDesc',
        align: 'center',
      },
      {
        title: '是否技术处理',
        dataIndex: 'handleFlagDesc',
        align: 'center',
      },
      {
        title: '处理内容',
        dataIndex: 'handleContent',
        align: 'center',
      },
      {
        title: '客户监播文件路径',
        dataIndex: 'custFileLocation',
        align: 'center',
      },
      {
        title: '发送日期',
        dataIndex: 'sendDate',
        align: 'center',
      },
      {
        title: '客户接收人',
        dataIndex: 'custReceiveName',
        align: 'center',
      },
      {
        title: '创建人',
        dataIndex: 'createUserName',
        align: 'center',
      },
      {
        title: '创建日期',
        dataIndex: 'createTime',
        align: 'center',
        width: 180,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        align: 'center',
      },
    ];
    return (
      <PageWrapper>
        <SearchTable
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          searchForm={this.renderSearchForm()} // 查询条件
          defaultSortBy="id"
          defaultSortDirection="DESC"
          fetchData={this.fetchData} // 获取数据的方法,请注意获取数据的格式
          columns={columns} // 要展示的列
          onAddClick={() =>
            router.push(
              `/workTable/projectMgmt/monitoringRecord/recordDisplay?projectId=${projectId}&mode=EDIT`
            )
          } // 新增按钮逻辑,不写不展示
          onEditClick={data =>
            router.push(
              `/workTable/projectMgmt/monitoringRecord/recordDisplay?projectId=${projectId}&id=${
                data.id
              }&mode=EDIT`
            )
          } // 编辑按钮逻辑,不写不显示
          deleteData={this.deleteData} // 删除按钮逻辑,不写不显示
          autoSearch // 进入页面默认查询数据
          tableExtraProps={{ scroll: { x: 2000 } }}
        />
      </PageWrapper>
    );
  }
}

export default RecordList;
