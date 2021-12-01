import React, { PureComponent } from 'react';
import router from 'umi/router';
import { Switch } from 'antd';
import { isEmpty } from 'ramda';
import PageWrapper from '@/components/production/layout/PageWrapper';
import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import Link from '@/components/production/basic/Link';
import ExcelImportExport from '@/components/common/ExcelImportExport';
import { createConfirm } from '@/components/core/Confirm';
import { remindString } from '@/components/production/basic/Remind';
import createMessage from '@/components/core/AlertMessage';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import {
  mediaResourcePagingRq,
  mediaResourcePatchRq,
  mediaResourcePartialRq,
} from '@/services/production/mrm/mediaResource';
import { informationImport } from '@/services/production/user';

class MediaResourceList extends PureComponent {
  state = {
    getInternalState: null,
    visible: false, // Excel导入是否可见
    failedList: [],
    uploading: null,
  };

  componentDidMount() {}

  fetchData = async params => {
    const { createTime, ...restparams } = params;

    if (Array.isArray(createTime) && (createTime[0] || createTime[1])) {
      [restparams.startDate, restparams.endDate] = createTime;
    } else {
      restparams.createTime = createTime;
    }
    const { response } = await mediaResourcePagingRq(restparams);
    let result = response.data;
    if (result.rows.length > 0) {
      const { rows, ...other } = result;
      const list = rows.map(item => {
        const { enabledStatus, ...rest } = item;
        rest.enabledStatusName = enabledStatus === 'true' ? '已启用' : '未启用';

        return { enabledStatus, ...rest };
      });
      result = {
        rows: list,
        ...other,
      };
    }

    return result;
  };

  // 导入插件的展示

  toggleImportVisible = () => {
    const { visible } = this.state;
    this.setState({ visible: !visible }, () => {
      this.setState({
        failedList: [],
      });
    });
  };

  // Excel导入上传
  handleUpload = fileList => {
    this.setState({ uploading: true });
    const fileData = new FormData();
    fileList.forEach(file => {
      fileData.append('excel', file);
    });
    // TODO 上传的请求地址
    informationImport(fileData).then(res => {
      this.setState({ uploading: false });
      const { response, status } = res;
      if (status === 200) {
        if (response.ok) {
          createMessage({ type: 'success', description: '上传成功' });
          this.toggleImportVisible();

          const { getInternalState } = this.state;
          const { refreshData } = getInternalState();
          refreshData();
          return;
        }
        if (response.data && Array.isArray(response.data) && !isEmpty(response.data)) {
          createMessage({
            type: 'warn',
            description: response.msg || '部分数据上传失败，请下载错误数据进行更正',
          });
          this.setState({
            failedList: response.data,
          });
        } else {
          createMessage({
            type: 'error',
            description: response.errors
              ? response.errors[0]?.msg
              : '部分数据上传失败,返回结果为空',
          });
          this.toggleImportVisible();
        }
      }
    });
  };

  /**
   * 删除数据方法,传给SearchTable组件使用
   * @param keys 要删除的数据主键
   * @returns {Promise<*>} 删除结果,给SearchTable组件使用
   */

  deleteData = async keys =>
    outputHandle(mediaResourcePatchRq, { keys: keys.join(',') }, undefined, false);

  // 修改资源的状态
  changeStatus = async parmars => {
    const { response } = await mediaResourcePartialRq(parmars);
    return response.data;
  };

  /**
   * 组装查询条件
   * @returns {*[]} 查询条件集合
   */
  renderSearchForm = () => [
    <SearchFormItem
      key="resourceNo"
      fieldType="BaseInput"
      label="资源编号"
      fieldKey="resourceNo"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="resourceName"
      fieldType="BaseInput"
      label="资源名称"
      fieldKey="resourceName"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="resourceType1"
      label="资源大类"
      fieldKey="resourceType1"
      fieldType="BaseSelect"
      parentKey="COM:AB:SUPPLIER_TYPE3"
    />,
    <SearchFormItem
      key="resourceType2"
      label="资源小类"
      fieldKey="resourceType2"
      fieldType="BaseSelect"
      parentKey="COM:AB:SUPPLIER_TYPE4"
    />,
    <SearchFormItem
      key="enabledStatus"
      fieldType="BaseSelect"
      label="可用状态"
      fieldKey="enabledStatus"
      options={[{ title: '已启用', value: 'true' }, { title: '未启用', value: 'false' }]}
    />,

    <SearchFormItem
      key="supplierNo"
      fieldType="BaseInput"
      label="供应商"
      fieldKey="supplierNo"
      defaultShow
      advanced
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
      allowClear
      allowEmpty={[false, true]}
      fieldType="BaseDateRangePicker"
    />,
  ];

  render() {
    const { getInternalState, visible, uploading, failedList } = this.state;

    // 表格列
    const columns = [
      {
        title: '资源编号',
        dataIndex: 'resourceNo',
        sorter: true,
        align: 'center',
        render: (value, row, index) => (
          <Link
            twUri={`/workTable/mediaResource/mediaResourceDisplay?id=${
              row.id
            }&mode=DESCRIPTION&refresh=${new Date().getTime()}`}
          >
            {value}
          </Link>
        ),
      },
      {
        title: '资源名称',
        dataIndex: 'resourceName',
        align: 'center',
      },
      {
        title: '资源状态',
        dataIndex: 'enabledStatusName',
        align: 'center',
        render: (text, record) => (
          <div size="middle">
            <Switch
              size="small"
              checkedChildren="已启用"
              unCheckedChildren="未启用"
              checked={record.enabledStatus === 'true'}
              onClick={() => {
                createConfirm({
                  content: remindString({
                    remindCode: '',
                    defaultMessage: `您是否确定要${
                      record.enabledStatus === 'true' ? '关闭' : '开启'
                    }如下资源:\n${record.resourceNo}`,
                  }),
                  onOk: () => {
                    this.changeStatus({
                      id: record.id,
                      enabledStatus: !(record.enabledStatus === 'true'), //change_7
                    }).then(res => {
                      const { refreshData } = getInternalState();
                      refreshData();
                    });
                  },
                });
              }}
            />
          </div>
        ),
      },
      {
        title: '城市',
        dataIndex: 'cityDesc',
        align: 'center',
      },
      {
        title: '资源位置1',
        dataIndex: 'location1Desc',
        align: 'center',
      },
      {
        title: '资源位置2',
        dataIndex: 'location2Desc',
        align: 'center',
      },
      {
        title: '广告形式',
        dataIndex: 'advertisementModeDesc',
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
      },
      {
        title: '备注',
        dataIndex: 'remark',
      },
    ];
    // excel导入模块配置
    const excelImportProps = {
      // eslint-disable-next-line no-restricted-globals
      templateUrl: location.origin + `/template/userInformationTemplate.xlsx`,
      option: {
        fileName: '导入失败记录',
        datas: [
          {
            sheetName: '导入失败记录', // 表名
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
              'errorMessage',
            ], // 列过滤
            sheetHeader: [
              '用户名',
              '姓名',
              '员工编号',
              '所属公司',
              '所属BU',
              'Base地',
              '职级',
              '职位',
              '直属上级',
              '入职日期',
              '手机号',
              '邮箱',
              '生日',
              '资源类型一',
              '性别',
              '是否开通系统账号',
              '失败原因',
            ], // 第一行标题
            // columnWidths: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], // 列宽 需与列顺序对应
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
      <PageWrapper title="资源列表">
        <ExcelImportExport
          {...excelImportProps}
          closeModal={this.toggleImportVisible}
          handleUpload={this.handleUpload}
        />
        <SearchTable
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          searchForm={this.renderSearchForm()} // 查询条件
          defaultSearchForm={{}} // 查询条件默认值,重置时查询条件默认这里面的值
          defaultSortBy="id"
          defaultSortDirection="DESC"
          fetchData={this.fetchData} // 获取数据的方法,请注意获取数据的格式
          columns={columns} // 要展示的列
          onAddClick={() => router.push('/workTable/mediaResource/mediaResourceDisplay?mode=EDIT')} // 新增按钮逻辑,不写不展示
          onEditClick={data =>
            router.push(`/workTable/mediaResource/mediaResourceDisplay?id=${data.id}&mode=EDIT`)
          } // 编辑按钮逻辑,不写不显示
          deleteData={this.deleteData} // 删除按钮逻辑,不写不显示
          defaultAdvancedSearch={false} // 查询条件默认为高级查询
          autoSearch // 进入页面默认查询数据
          tableExtraProps={{ scroll: { x: 1800 } }}
          extraButtons={[
            {
              key: 'importExcel',
              title: '导入Excel',
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

export default MediaResourceList;
