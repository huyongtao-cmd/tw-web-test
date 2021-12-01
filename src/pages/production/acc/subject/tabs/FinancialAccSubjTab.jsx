import React from 'react';
import { connect } from 'dva';

import Loading from '@/components/production/basic/Loading';
import TreeSearch from '@/components/production/business/TreeSearch';
import { Form, Row, Col, Button } from 'antd';

import PageWrapper from '@/components/production/layout/PageWrapper';

import SearchTable from '@/components/production/business/SearchTable.tsx';
import router from 'umi/router';
import Link from '@/components/production/basic/Link.tsx';
import SearchFormItem from '@/components/production/business/SearchFormItem.tsx';
import { outputHandle } from '@/utils/production/outputUtil.ts';

import {
  financialAccSubjListPaging,
  financialAccSubjLogicalDelete,
} from '@/services/production/acc';
import { testMainLogicalDelete } from '@/services/demo/prod';

const DOMAIN = 'financialAccSubjTab';

@connect(({ loading, dispatch, financialAccSubjTab }) => ({
  treeLoading: loading.effects[`${DOMAIN}/init`],
  dispatch,
  ...financialAccSubjTab,
}))
class FinancialAccSubjTab extends React.PureComponent {
  componentDidMount() {
    this.callModelEffects('init');
  }

  // 修改model层state
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  // 调用model层异步方法
  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  onSelect = async selectedKeys => {
    const { getInternalState } = this.state;
    await this.updateModelState({ currentSelectId: selectedKeys[0] });
    getInternalState().refreshData();
  };

  onCheck = () => {};

  /**
   * 组装查询条件
   * @returns {*[]} 查询条件集合
   */
  renderSearchForm = () => [
    <SearchFormItem
      key="accCode"
      fieldType="BaseInput"
      label="编码"
      fieldKey="accCode"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="accName"
      fieldType="BaseInput"
      label="名称"
      fieldKey="accName"
      defaultShow
      advanced
    />,
    <SearchFormItem
      key="accLevel"
      fieldType="BaseInputNumber"
      label="科目级别"
      fieldKey="accLevel"
      visible={false}
      advanced
    />,
    <SearchFormItem
      key="drcrType"
      fieldType="BaseSelect"
      label="借/贷方"
      fieldKey="drcrType"
      parentKey="ACC:FINANCIAL_ACC_SUBJ:DRCR_TYPE"
      advanced
      visible={false}
    />,
    <SearchFormItem
      key="enabledFlag"
      fieldType="BaseSelect"
      label="状态"
      parentKey="COM:ENABLE_FLAG"
      fieldKey="enabledFlag"
      defaultShow
    />,
  ];

  /**
   * 查询数据方法,传给SearchTable组件使用
   * @param params 查询参数
   * @returns {Promise<*>} 查询到的结果,给SearchTable组件使用,展示数据
   */
  fetchData = async params => {
    const { currentSelectId } = this.props;
    const { data } = await outputHandle(financialAccSubjListPaging, {
      ...params,
      containSelfParentId: currentSelectId,
    });
    return data;
  };

  /**
   * 删除数据方法,传给SearchTable组件使用
   * @param keys 要删除的数据主键
   * @returns {Promise<*>} 删除结果,给SearchTable组件使用
   */
  deleteData = async keys => {
    const result = await outputHandle(
      financialAccSubjLogicalDelete,
      { keys: keys.join(',') },
      undefined,
      false
    );
    this.callModelEffects('init');
    return result;
  };

  render() {
    const { treeLoading, treeList } = this.props;

    // 表格展示列
    const columns = [
      {
        title: '编码',
        dataIndex: 'accCode',
        sorter: true,
        render: (value, row, index) => (
          <Link
            twUri={`/workTable/subject/financialAccSubjDisplayPage?id=${row.id}&mode=DESCRIPTION`}
          >
            {value}
          </Link>
        ),
      },
      {
        title: '会计科目名称',
        dataIndex: 'accName',
        sorter: true,
      },
      {
        title: '上级会计科目',
        dataIndex: 'parentIdDesc',
        sorter: true,
      },
      // {
      //   title: '科目级别',
      //   dataIndex: 'accLevel',
      // },
      // {
      //   title: '借/贷方',
      //   dataIndex: 'drcrTypeDesc',
      // },
      {
        title: '状态',
        dataIndex: 'enabledFlagDesc',
      },
    ];

    return (
      <PageWrapper>
        <Row>
          <Col span={6} style={{ overflow: 'auto', 'max-height': '794px' }}>
            {!treeLoading ? (
              <TreeSearch
                checkable={false}
                showSearch
                options={treeList}
                onSelect={this.onSelect}
                onCheck={this.onCheck}
              />
            ) : (
              <Loading />
            )}
          </Col>
          <Col span={18}>
            <SearchTable
              wrapperInternalState={internalState => {
                this.setState({ getInternalState: internalState });
              }}
              searchTitle={undefined}
              defaultAdvancedSearch={false}
              showSearchCardTitle={false}
              searchForm={this.renderSearchForm()} // 查询条件
              defaultSearchForm={{}} // 查询条件默认值,重置时查询条件默认这里面的值
              fetchData={this.fetchData} // 获取数据的方法,请注意获取数据的格式
              columns={columns} // 要展示的列
              onAddClick={() =>
                router.push('/workTable/subject/financialAccSubjDisplayPage?mode=EDIT')
              } // 新增按钮逻辑,不写不展示
              onEditClick={data =>
                router.push(
                  `/workTable/subject/financialAccSubjDisplayPage?id=${data.id}&mode=EDIT`
                )
              } // 编辑按钮逻辑,不写不显示
              deleteData={this.deleteData} // 删除按钮逻辑,不写不显示
            />
          </Col>
        </Row>
      </PageWrapper>
    );
  }
}

export default FinancialAccSubjTab;
