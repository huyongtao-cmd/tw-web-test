import React, { PureComponent } from 'react';

import router from 'umi/router';

import PageWrapper from '@/components/production/layout/PageWrapper';
import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import Link from '@/components/production/basic/Link';
import { createConfirm } from '@/components/core/Confirm';
import { remindString } from '@/components/production/basic/Remind';
import { fromQs } from '@/utils/production/stringUtil';
import { outputHandle } from '@/utils/production/outputUtil.ts';

import {
  projectTeamPagingRq,
  projectTeamDeleteRq,
} from '@/services/production/projectMgmt/projectTeam';
import { projectRoleSelectRq } from '@/services/workbench/project';

class ProjectTeamList extends PureComponent {
  state = {
    getInternalState: null,
    projectId: null,
    projectRoleOptions: [], // 项目角色列表
  };

  componentDidMount() {
    const { projectId } = fromQs();
    this.setState({ projectId });
    this.getProjectRole();
  }

  fetchData = async params => {
    const { response } = await projectTeamPagingRq({ ...params, projectId: fromQs().projectId });
    const result = response.data;
    return result;
  };

  // 获取项目角色选项

  getProjectRole = () => {
    projectRoleSelectRq().then(res => {
      if (res.status === 200) {
        const projectRoleOptions = res.response.data.map(item => ({
          ...item,
          // id: item.id,
          value: item.id,
          title: item.roleName,
        }));
        this.setState({ projectRoleOptions });
      }
    });
  };

  /**
   * 删除数据方法,传给SearchTable组件使用
   * @param keys 要删除的数据主键
   * @returns {Promise<*>} 删除结果,给SearchTable组件使用
   */

  deleteData = async keys =>
    outputHandle(projectTeamDeleteRq, { keys: keys.join(',') }, undefined, false);

  /**
   * 组装查询条件
   * @returns {*[]} 查询条件集合
   */

  renderSearchForm = () => {
    const { projectRoleOptions } = this.state;
    return [
      <SearchFormItem
        label="项目角色"
        key="projectRole"
        fieldKey="projectRole"
        fieldType="BaseSelect"
        descList={projectRoleOptions}
      />,
      <SearchFormItem label="姓名" key="resId" fieldKey="resId" fieldType="ResSimpleSelect" />,
      <SearchFormItem
        label="开始参与日期"
        key="startDate"
        fieldKey="startDate"
        fieldType="BaseDatePicker"
        placeholder="开始参与日期"
      />,
    ];
  };

  render() {
    const { getInternalState, projectId } = this.state;
    const columns = [
      {
        title: '项目角色',
        dataIndex: 'projectRoleDesc',
        align: 'center',
      },
      {
        title: '员工编号',
        dataIndex: 'resId',
        align: 'center',
        render: (value, row, index) => (
          <Link
            twUri={`/workTable/projectMgmt/projectTeam/teamDisplay?id=${row.id}&mode=DESCRIPTION`}
          >
            {value}
          </Link>
        ),
      },
      {
        title: '姓名',
        dataIndex: 'resName',
        align: 'center',
      },

      {
        title: '联系方式',
        dataIndex: 'contactWay',
        align: 'center',
      },
      {
        title: '开始参与日期',
        dataIndex: 'startDate',
        align: 'center',
      },
      {
        title: '参与资源数',
        dataIndex: 'resourceCount',
        align: 'center',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        align: 'center',
      },
    ];
    const extraButtons = [
      {
        key: 'delete',
        title: '删除',
        type: 'danger',
        size: 'large',
        loading: false,
        cb: internalState => {
          // eslint-disable-next-line no-console
          console.log(internalState);
          const { selectedRows, selectedRowKeys } = internalState;
          // 选中的行去重（全选时selectedRows, selectedRowKeys有重复）
          const rows = Array.from(new Set(selectedRows));
          createConfirm({
            content: remindString({
              remindCode: '',
              defaultMessage: `您是否确定要删除如下项目成员:\n ${rows
                .map(item => item.resName)
                .join(',')}`,
            }),
            onOk: () => {
              this.deleteData(selectedRowKeys).then(res => {
                const { refreshData } = internalState;
                refreshData();
              });
            },
          });
        },
        disabled: internalState => {
          const { selectedRowKeys } = internalState;
          return selectedRowKeys.length < 1;
        },
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
              `/workTable/projectMgmt/projectTeam/teamDisplay?projectId=${projectId}&mode=EDIT`
            )
          } // 新增按钮逻辑,不写不展示
          //deleteData={this.deleteData} // 删除按钮逻辑,不写不显示
          onEditClick={data =>
            router.push(
              `/workTable/projectMgmt/projectTeam/teamDisplay?projectId=${projectId}&id=${
                data.id
              }&mode=EDIT`
            )
          } // 编辑按钮逻辑,不写不显示
          extraButtons={extraButtons}
          autoSearch // 进入页面默认查询数据
        />
      </PageWrapper>
    );
  }
}

export default ProjectTeamList;
