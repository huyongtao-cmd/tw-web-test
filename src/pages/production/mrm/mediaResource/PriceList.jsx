import React, { PureComponent } from 'react';
import router from 'umi/router';
import { Switch } from 'antd';
import PageWrapper from '@/components/production/layout/PageWrapper';
import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import Link from '@/components/production/basic/Link';
import { createConfirm } from '@/components/core/Confirm';
import { remindString } from '@/components/production/basic/Remind';
import message from '@/components/production/layout/Message';
import { outputHandle } from '@/utils/production/outputUtil.ts';
import {
  mediaResourcepageRq,
  mediaResourcePatchRq,
  mediaResourceChangeStatusRq,
} from '@/services/production/mrm/mediaResource';

class PriceList extends PureComponent {
  state = {
    getInternalState: null,
    rowSpanArray: [],
  };

  componentDidMount() {}

  fetchData = async params => {
    const { createTime, ...restparams } = params;

    if (Array.isArray(createTime) && (createTime[0] || createTime[1])) {
      [restparams.startDate, restparams.endDate] = createTime;
    }

    const { response } = await mediaResourcepageRq(restparams);
    let result = response.data;
    if (result.rows.length > 0) {
      const { rows, ...other } = result;
      const list = rows.map(item => {
        const { priceStatus, ...rest } = item;
        rest.priceStatusName = priceStatus === 'true' ? '已启用' : '未启用';

        return { priceStatus, ...rest };
      });
      // rows.forEach(item => {
      //   const { priceStatus, priceDetails, ...rest } = item;
      //   rest.priceStatusName = priceStatus === 'true' ? '已启用' : '未启用';
      //   list.push({
      //     ...rest,
      //     priceStatus,
      //     priceDetails,
      //   });
      // });

      // this.calcRowSpan(list); // 计算行合并情况
      result = {
        rows: list,
        ...other,
      };
    }
    return result;
  };

  // 获取数据的行和并数组
  calcRowSpan = data => {
    if (data && data.length > 0) {
      //保存上一个资源Id
      let x = '';
      //相同资源Id出现的次数
      let count = 0;
      //该资源Id第一次出现的位置
      let startindex = 0;
      const myArray = data.map(() => 1);
      for (let i = 0; i < data.length; i += 1) {
        const val = data[i].resourceId;
        if (i === 0) {
          x = val;
          count = 1;
          myArray[0] = 1;
        } else if (val === x) {
          count += 1;
          myArray[startindex] = count; //
          myArray[i] = 0;
        } else {
          count = 1;
          x = val;
          startindex = i;
          myArray[i] = 1;
        }
      }
      this.setState({
        rowSpanArray: myArray,
      });
    }
  };

  /**
   * 删除数据方法,传给SearchTable组件使用
   * @param keys 要删除的数据主键
   * @returns {Promise<*>} 删除结果,给SearchTable组件使用
   */
  // TODO: 修改删除接口
  deleteData = async keys =>
    outputHandle(mediaResourcePatchRq, { keys: keys.join(',') }, undefined, false);

  // 修改资源的状态
  changeStatus = async parmars => {
    const { response } = await mediaResourceChangeStatusRq(parmars);
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
      fieldType="BaseInput"
      label="资源大类"
      fieldKey="resourceType1"
    />,
    <SearchFormItem
      key="resourceType2"
      fieldType="BaseInput"
      label="资源小类"
      fieldKey="resourceType2"
    />,
    <SearchFormItem
      key="priceStatus"
      fieldType="BaseSelect"
      label="可用状态"
      fieldKey="priceStatus"
      parentKey="COMMON:YES-OR-NO"
    />,
    // <SearchFormItem
    //   key="resourceStatus"
    //   fieldType="BaseSelect"
    //   label="资源状态"
    //   fieldKey="resourceStatus"
    //   parentKey="FUNCTION:SYSTEM_REMIND:TYPE"
    // />,
    <SearchFormItem
      key="supplierNo"
      fieldType="BaseInput"
      label="供应商"
      fieldKey="supplierNo"
      defaultShow
      advanced
    />,
  ];

  render() {
    const { getInternalState, rowSpanArray } = this.state;

    // 表格列
    const columns = [
      {
        title: '资源编号',
        dataIndex: 'resourceNo',
        sorter: true,
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: (
              <Link
                twUri={`/workTable/mediaResource/mediaResourceDisplay?id=${
                  row.id
                }&mode=DESCRIPTION&refresh=${new Date().getTime()}`}
              >
                {value}
              </Link>
            ),
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '资源名称',
        dataIndex: 'resourceName',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '状态',
        dataIndex: 'priceStatusName',
        align: 'center',
      },
      {
        title: '城市',
        dataIndex: 'cityDesc',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      //change_6
      {
        title: '资源大类',
        dataIndex: 'resourceType1',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '资源小类',
        dataIndex: 'resourceType2',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '资源位置1',
        dataIndex: 'location1',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '资源位置2',
        dataIndex: 'location2',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '广告形式',
        dataIndex: 'advertisementMode',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      // {
      //   title: '广告规格',
      //   dataIndex: 'advertisement',
      //   align: 'center',
      //   render: (value, row, index) => {
      //     const obj = {
      //       children: value,
      //       props: {},
      //     };
      //     obj.props.rowSpan = rowSpanArray[index];
      //     return obj;
      //   },
      // },
      { title: '供应商', dataIndex: 'supplierNoDesc', align: 'center' },
      { title: '代理方式', align: 'center', dataIndex: 'agentMethodDesc' },
      { title: '售卖方式', align: 'center', dataIndex: 'saleMethodDesc' },
      { title: '售卖单位', align: 'center', dataIndex: 'saleUnitDesc' },
      { title: '刊例价', align: 'center', dataIndex: 'publishedPrice' },
      { title: '折扣', align: 'center', dataIndex: 'discount' },
      { title: '折扣价', align: 'center', dataIndex: 'finalPrice' },
      {
        title: '备注',
        dataIndex: 'remark',
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (text, record) => (
          <div size="middle">
            <Switch
              size="small"
              checkedChildren="启用"
              unCheckedChildren="关闭"
              checked={record.priceStatus === 'true'}
              onClick={() => {
                createConfirm({
                  content: remindString({
                    remindCode: '',
                    defaultMessage: `您是否确定要${
                      record.priceStatus === 'true' ? '关闭' : '开启'
                    }如下资源:\n${record.resourceNo}-${record.supplierNoDesc}`,
                  }),
                  onOk: () => {
                    this.changeStatus({
                      id: record.id,
                      priceStatus: !(record.priceStatus === 'true'), //change_7
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
          const { resourceId } = rows[0];
          const index = rows.findIndex(item => item.resourceId !== resourceId);
          if (index > -1) {
            message({
              type: 'error',
              content: remindString({
                defaultMessage: '只能同时删除同一资源的数据',
              }),
            });
          } else {
            createConfirm({
              // TODO:修改参数
              content: remindString({
                remindCode: '',
                defaultMessage: `您是否确定要删除如下资源:\n ${rows
                  .map(item => `${item.resourceName}/${item.supplierNoDesc}`)
                  .join(',')}`,
              }),
              onOk: () => {
                this.deleteData(selectedRowKeys).then(res => {
                  const { refreshData } = internalState;

                  refreshData();
                });
              },
            });
          }
        },
        disabled: internalState => {
          const { selectedRowKeys } = internalState;
          return selectedRowKeys.length < 1;
        },
      },
    ];
    return (
      <PageWrapper title="资源列表">
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
            router.push(
              `/workTable/mediaResource/mediaResourceDisplay?id=${data.resourceId}&mode=EDIT`
            )
          } // 编辑按钮逻辑,不写不显示
          // deleteData={this.deleteData} // 删除按钮逻辑,不写不显示
          defaultAdvancedSearch={false} // 查询条件默认为高级查询
          autoSearch // 进入页面默认查询数据
          extraButtons={extraButtons}
          tableExtraProps={{ scroll: { x: 1800 } }}
        />
      </PageWrapper>
    );
  }
}

export default PriceList;
