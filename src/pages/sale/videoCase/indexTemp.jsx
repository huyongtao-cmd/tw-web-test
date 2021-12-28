import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import Link from 'umi/link';
import { Input, Radio, Switch } from 'antd';
import { mountToTab, markAsNoTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker } from '@/pages/gen/field';
import { getUrl } from '@/utils/flowToRouter';
import { stringify } from 'qs';
import TreeSearch from '@/components/common/TreeSearch';
import Loading from '@/components/core/DataLoading';
import { formatMessage } from 'umi/locale';
import { selectBuMultiCol } from '@/services/org/bu/bu';
import {
  selectUsersWithBu,
  selectCoop, // 合作伙伴
} from '@/services/gen/list';
import {
  selectCust, // 客户
  selectSupplier, // 供应商
  selectBuProduct, // 产品
  selectContract, //  合同下拉
} from '@/services/user/Contract/sales';

const RadioGroup = Radio.Group;
const DOMAIN = 'videoMgmt';

const particularColumns = [
  { dataIndex: 'code', title: '编号', span: 8 },
  { dataIndex: 'name', title: '名称', span: 16 },
];

@connect(({ loading, dispatch, videoMgmt }) => ({
  treeLoading: loading.effects[`${DOMAIN}/getTagTree`],
  videoMgmt,
  dispatch,
  loading,
}))
@mountToTab()
class VideoMgmtList extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/cleanSearchForm` });
    // 标签数据
    dispatch({
      type: `${DOMAIN}/getTagTree`,
      payload: { key: 'TAG' },
    });
    // 获取页面配置信息
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: { pageNo: 'VIDEO' },
    });
    // 视频大类、视频小类、服务属性
    dispatch({
      type: `${DOMAIN}/selectVideoDrop`,
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/queryCust`, payload: { ...params } });
  };

  onCheck = (checkedKeys, info, parm3, param4) => {
    const { dispatch } = this.props;
    const allCheckedKeys = checkedKeys.concat(info.halfCheckedKeys);
    this.updateModelState({ checkedKeys, allCheckedKeys });
    dispatch({
      type: `${DOMAIN}/updateSearchForm`,
      payload: { tagIds: allCheckedKeys.length > 0 ? allCheckedKeys.join(',') : '' },
    });
  };

  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  render() {
    const {
      loading,
      dispatch,
      videoMgmt: {
        tagTree,
        flatTags,
        checkedKeys,
        list,
        total,
        searchForm,
        pageConfig: { pageBlockViews = [] },
        vCat1List,
        vCat2List,
        vCat5List,
      },
    } = this.props;

    let defaultSelectVcat1 = 'xxx';
    const map = vCat1List
      .filter(vCat1 => vCat1.catDesc === '客户合同案例')
      .map(vCat1 => vCat1.catVal);
    if (map && map.length > 0) {
      defaultSelectVcat1 = map[0];
    }

    const tableLoading = loading.effects[`${DOMAIN}/queryCust`];

    const urls = getUrl();
    const fromUrl = stringify({ from: urls });

    if (!pageBlockViews || pageBlockViews.length < 1) {
      return <div />;
    }
    const currentListConfig = pageBlockViews.filter(v => v.blockPageName === '视频信息表单');
    const { pageFieldViews = {} } = currentListConfig[0];
    const pageFieldJson = {};
    if (pageFieldViews) {
      pageFieldViews.forEach(field => {
        pageFieldJson[field.fieldKey] = field;
      });
    }
    const {
      vNo = {},
      vName = {},
      vCat1 = {},
      vCat2 = {},
      vCat5 = {},
      inchargeResId = {},
      buId = {},
      supplierId = {},
      prodId = {},
      coopId = {},
      custId = {},
      contractId = {},
      showFlag = {},
      uploadDate = {},
      viewCnt = {},
    } = pageFieldJson;

    const tableProps = {
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      loading: tableLoading,
      total,
      dataSource: list,
      scroll: { x: 3130 },
      onChange: filters => this.fetchData(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchForm,
      searchBarForm: [
        {
          title: '视频名称/编号',
          dataIndex: 'vnoOrVName',
          options: {
            initialValue: searchForm.vnoOrVName,
          },
          tag: <Input placeholder="编号/名称" />,
        },
        {
          title: '标签',
          dataIndex: 'tagIds',
          options: {
            initialValue: searchForm.tagIds,
          },
          tag: (
            <TreeSearch
              className="x-fill-100"
              checkable
              // checkStrictly
              showSearch={false}
              treeData={tagTree}
              defaultExpandedKeys={tagTree.map(item => `${item.id}`)}
              checkedKeys={checkedKeys}
              onCheck={this.onCheck}
            />
          ),
        },
        {
          title: vCat1.displayName,
          dataIndex: 'vcat1',
          options: {
            initialValue: defaultSelectVcat1,
          },
          tag: (
            <Selection
              key="vCat1"
              className="x-fill-100"
              source={vCat1List}
              disabled={true}
              transfer={{ key: 'catVal', code: 'catVal', name: 'catDesc' }}
              dropdownMatchSelectWidth={false}
              showSearch
              onColumnsChange={value => {}}
              placeholder={`请选择${vCat1.displayName}`}
            />
          ),
        },
        // {
        //   title: vCat2.displayName,
        //   dataIndex: 'vcat2',
        //   options: {
        //     initialValue: searchForm.vcat2,
        //   },
        //   tag: (
        //     <Selection
        //       key="vCat2"
        //       className="x-fill-100"
        //       source={vCat2List}
        //       transfer={{ key: 'catVal', code: 'catVal', name: 'catDesc' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${vCat2.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: vCat5.displayName,
        //   dataIndex: 'vcat5',
        //   options: {
        //     initialValue: searchForm.vcat5,
        //   },
        //   tag: (
        //     <Selection
        //       key="vCat5"
        //       className="x-fill-100"
        //       source={vCat5List}
        //       transfer={{ key: 'catVal', code: 'catVal', name: 'catDesc' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${vCat5.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: buId.displayName,
        //   dataIndex: 'buId',
        //   options: {
        //     initialValue: searchForm.buId,
        //   },
        //   tag: (
        //     <Selection.Columns
        //       key="buId"
        //       className="x-fill-100"
        //       source={() => selectBuMultiCol()}
        //       columns={particularColumns}
        //       transfer={{ key: 'id', code: 'id', name: 'name' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${buId.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: supplierId.displayName,
        //   dataIndex: 'supplierId',
        //   options: {
        //     initialValue: searchForm.supplierId,
        //   },
        //   tag: (
        //     <Selection
        //       key="supplierId"
        //       className="x-fill-100"
        //       source={() => selectSupplier()}
        //       transfer={{ key: 'id', code: 'id', name: 'name' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${supplierId.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: prodId.displayName,
        //   dataIndex: 'prodId',
        //   options: {
        //     initialValue: searchForm.prodId,
        //   },
        //   tag: (
        //     <Selection
        //       key="prodId"
        //       className="x-fill-100"
        //       source={() => selectBuProduct()}
        //       transfer={{ key: 'id', code: 'id', name: 'name' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${prodId.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: coopId.displayName,
        //   dataIndex: 'coopId',
        //   options: {
        //     initialValue: searchForm.coopId,
        //   },
        //   tag: (
        //     <Selection
        //       key="coopId"
        //       className="x-fill-100"
        //       source={() => selectCoop()}
        //       transfer={{ key: 'id', code: 'id', name: 'name' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${coopId.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: custId.displayName,
        //   dataIndex: 'custId',
        //   options: {
        //     initialValue: searchForm.custId,
        //   },
        //   tag: (
        //     <Selection
        //       key="custId"
        //       className="x-fill-100"
        //       source={() => selectCust()}
        //       transfer={{ key: 'id', code: 'id', name: 'name' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${custId.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: contractId.displayName,
        //   dataIndex: 'contractId',
        //   options: {
        //     initialValue: searchForm.contractId,
        //   },
        //   tag: (
        //     <Selection
        //       key="contractId"
        //       className="x-fill-100"
        //       source={() => selectContract()}
        //       transfer={{ key: 'id', code: 'id', name: 'name' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${contractId.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: inchargeResId.displayName,
        //   dataIndex: 'inchargeResId',
        //   options: {
        //     initialValue: searchForm.inchargeResId,
        //   },
        //   tag: (
        //     <Selection.Columns
        //       key="inchargeResId"
        //       className="x-fill-100"
        //       source={() => selectUsersWithBu()}
        //       columns={particularColumns}
        //       transfer={{ key: 'id', code: 'id', name: 'name' }}
        //       dropdownMatchSelectWidth={false}
        //       showSearch
        //       onColumnsChange={value => {}}
        //       placeholder={`请选择${inchargeResId.displayName}`}
        //     />
        //   ),
        // },
        // {
        //   title: uploadDate.displayName,
        //   dataIndex: 'uploadDate',
        //   options: {
        //     initialValue: searchForm.uploadDate,
        //   },
        //   tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        // },
        // {
        //   title: showFlag.displayName,
        //   dataIndex: 'showFlag',
        //   options: {
        //     initialValue: searchForm.showFlag || '',
        //   },
        //   tag: (
        //     <RadioGroup initialValue={searchForm.showFlag || ''}>
        //       <Radio value="SHOW">展示</Radio>
        //       <Radio value="HIDE">隐藏</Radio>
        //       <Radio value="">全部</Radio>
        //     </RadioGroup>
        //   ),
        // },
      ],
      columns: [
        {
          title: vNo.displayName,
          dataIndex: 'vno',
          width: 100,
          align: 'center',
          render: (val, row) => {
            const href = `/user/littleVideo/videoMgmt/view?id=${row.id}&${fromUrl}`;
            return (
              <Link className="tw-link" to={href}>
                {val}
              </Link>
            );
          },
        },
        {
          title: vName.displayName,
          dataIndex: 'vname',
          width: 200,
          align: 'center',
        },
        // {
        //   title: showFlag.displayName,
        //   dataIndex: 'showFlag',
        //   width: 80,
        //   align: 'center',
        //   render: (val, row, index) => (
        //     <Switch
        //       checkedChildren="是"
        //       unCheckedChildren="否"
        //       checked={val === 'SHOW'}
        //       disabled={true}
        //     />
        //   ),
        // },
        {
          title: vCat1.displayName,
          dataIndex: 'vcat1Name',
          width: 200,
          align: 'center',
        },
        {
          title: vCat2.displayName,
          dataIndex: 'vcat2Name',
          width: 200,
          align: 'center',
        },
        {
          title: vCat5.displayName,
          dataIndex: 'vcat5Name',
          width: 200,
          align: 'center',
        },
        {
          title: buId.displayName,
          dataIndex: 'buId',
          width: 200,
          align: 'center',
          render: (val, row) => row.buName,
        },
        {
          title: supplierId.displayName,
          dataIndex: 'supplierId',
          width: 200,
          align: 'center',
          render: (val, row) => row.supplierName,
        },
        {
          title: prodId.displayName,
          dataIndex: 'prodId',
          width: 200,
          align: 'center',
          render: (val, row) => row.prodName,
        },
        {
          title: coopId.displayName,
          dataIndex: 'coopId',
          width: 200,
          align: 'center',
          render: (val, row) => row.coopName,
        },
        {
          title: custId.displayName,
          dataIndex: 'custId',
          width: 200,
          align: 'center',
          render: (val, row) => row.custName,
        },
        {
          title: contractId.displayName,
          dataIndex: 'contractId',
          width: 200,
          align: 'center',
          render: (val, row) => row.contractName,
        },
        {
          title: inchargeResId.displayName,
          dataIndex: 'inchargeResId',
          width: 200,
          align: 'center',
          render: (val, row) => row.inchargeResName,
        },
        {
          title: viewCnt.displayName,
          dataIndex: 'viewCnt',
          width: 100,
          align: 'center',
        },
        {
          title: uploadDate.displayName,
          dataIndex: 'uploadDate',
          width: 150,
          align: 'center',
          render: (val, row) => row.uploadDate,
        },
      ]
        .filter(Boolean)
        .sort((field1, field2) => field1.sortNo - field2.sortNo),
      leftButtons: [],
    };

    return (
      <PageHeaderWrapper title="视频管理列表">
        <DataTable {...tableProps} />
      </PageHeaderWrapper>
    );
  }
}

export default VideoMgmtList;
