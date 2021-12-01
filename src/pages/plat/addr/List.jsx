import React from 'react';
import router from 'umi/router';
import Link from 'umi/link';
import PageWrapper from '@/components/production/layout/PageWrapper.tsx';
import SearchTable from '@/components/production/business/SearchTable.tsx';
import message from '@/components/production/layout/Message.tsx';
import SearchFormItem from '@/components/production/business/SearchFormItem.tsx';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import { queryAddrPaging, deleteAddrById } from '@/services/plat/addr/addr';

class AddrList extends React.PureComponent {
  renderSearchForm = () => [
    <SearchFormItem key="abNo" fieldKey="abNo" label="编号" fieldType="BaseInput" />,
    <SearchFormItem key="abName" label="名称" fieldType="BaseInput" fieldKey="abName" />,
    <SearchFormItem
      key="abType"
      label="类型"
      fieldType="BaseSelect"
      parentKey="COM:AB:TYPE"
      fieldKey="abType"
    />,
    <SearchFormItem key="idenNo" label="唯一识别号" fieldType="BaseInput" fieldKey="idenNo" />,
    <SearchFormItem
      key="relateType"
      label="相关主档"
      fieldType="BaseSelect"
      parentKey="COM:AB:RELATE_TYPE"
      fieldKey="relateType"
    />,
  ];

  fetchData = async params => {
    const { data } = await outputHandle(queryAddrPaging, params);
    return data;
  };

  deleteData = async (keys, rows) => {
    if (keys.length !== 1) {
      message({ type: 'error', content: '请选择一条数据删除!' });
      return Promise.reject();
    }
    return outputHandle(deleteAddrById, { id: keys[0] }, undefined, false);
  };

  /**
   * 交给React渲染页面的函数(任何this.state和connect中解构的this.props中监听的对象属性修改都会触发这个操作)
   * @return {React.ReactElement}
   */
  render() {
    const columns = [
      {
        title: '编号',
        dataIndex: 'abNo',
        sorter: true,
        align: 'center',
        render: (value, row, key) => (
          <Link className="tw-link" to={`/plat/addr/view?no=${row.abNo}&id=${row.id}`}>
            {value}
          </Link>
        ),
      },
      {
        title: '名称',
        dataIndex: 'abName',
      },
      {
        title: '唯一识别号',
        dataIndex: 'idenNo',
        align: 'center',
      },
      {
        title: '类型',
        dataIndex: 'abTypeName', // abType
        align: 'center',
      },
      {
        title: '相关主档',
        dataIndex: 'relateTypeName',
      },
      {
        title: '创建人',
        dataIndex: 'createUserName',
      },
      {
        title: '创建日期',
        dataIndex: 'createTime',
        align: 'center',
      },
    ];

    return (
      <PageWrapper>
        <SearchTable
          searchTitle={undefined}
          defaultAdvancedSearch={false}
          showSearchCardTitle={false}
          searchForm={this.renderSearchForm()}
          defaultSearchForm={{}}
          defaultSortBy="id"
          defaultSortDirection="DESC"
          fetchData={this.fetchData}
          columns={columns}
          onAddClick={() => router.push('/plat/addr/edit?mode=EDIT')} // 新增按钮逻辑,不写不展示
          onEditClick={data => {
            router.push(`/plat/addr/edit?&mode=EDIT&no=${data.abNo}`);
          }}
          deleteData={this.deleteData}
          extraButtons={
            [
              // {
              //   key: 'revoke',
              //   title: '撤回',
              //   type: 'primary',
              //   size: 'large',
              //   loading: false,
              //   cb: internalState => {
              //     const { selectedRowKeys, selectedRows } = internalState;
              //     console.log(selectedRowKeys)
              //   },
              //   disabled: internalState => {
              //     const { selectedRowKeys } = internalState;
              //     return selectedRowKeys.length !== 1;
              //   },
              // },
            ]
          }
        />
      </PageWrapper>
    );
  }
}

export default AddrList;
