import React, { PureComponent } from 'react';
import { connect } from 'dva';
import Link from 'umi/link';
import { Col, Row, Button, Divider, Input, Form } from 'antd';
import DataTable from '@/components/common/DataTable';
import TreeSearch from '@/components/common/TreeSearch';
import Loading from '@/components/core/DataLoading';
import { Selection } from '@/pages/gen/field';
import { mountToTab } from '@/layouts/routerControl';

const DOMAIN = 'orgbuLinmon';
@connect(({ dispatch, loading, orgbuLinmon }) => ({
  dispatch,
  orgbuLinmon,
  loading,
}))
@mountToTab()
class ChangeHistory extends PureComponent {
  state = {
    buVisible: false,
    buVersionsId: '',
    buVersionsNo: '',
  };

  componentDidMount() {
    this.fetchBuVersion({ offset: 0, limit: 10, sortBy: 'id', sortDirection: 'DESC' });
  }

  fetchBuVersion = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/getBuVersion`, payload: params });
  };

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/queryVersion`, payload: params });
  };

  onSelect = (selectedKeys, selectedRows) => {
    const { buVersionsId } = this.state;
    this.fetchData({ id: selectedRows[0].id, buVersionsId });
  };

  showBu = selectedRows => {
    const { dispatch } = this.props;
    this.setState({
      buVisible: true,
      buVersionsId: selectedRows[0]?.id,
      buVersionsNo: selectedRows[0]?.versionNo,
    });
    dispatch({ type: `${DOMAIN}/getTreeByVersion`, payload: selectedRows[0]?.id });
    this.fetchData({ buVersionsId: selectedRows[0]?.id });
  };

  render() {
    const { loading, orgbuLinmon, dispatch } = this.props;
    const { buVisible, buVersionsId, buVersionsNo } = this.state;
    const {
      versionSearchForm,
      versionList,
      versionTotal,
      totalVersion,
      listVersion,
      buHistoryTree,
    } = orgbuLinmon;
    const tableProps = {
      rowKey: 'id',
      scroll: {
        x: '150%',
      },
      columnsCache: DOMAIN,
      dispatch,
      loading: loading.effects[`${DOMAIN}/queryVersion`],
      expirys: 0,
      totalVersion,
      showExport: false,
      dataSource: listVersion,
      onChange: filters => {
        this.fetchData({ ...filters, buVersionsId });
      },
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateVersionSearchForm`,
          payload: { ...allValues, buVersionsId },
        });
      },
      searchBarForm: [
        {
          title: 'BU??????',
          dataIndex: 'buNo',
          options: {
            initialValue: versionSearchForm.buNo,
          },
        },
        {
          title: 'BU??????',
          dataIndex: 'buName',
          options: {
            initialValue: versionSearchForm.buName,
          },
        },
        {
          title: 'BU??????',
          dataIndex: 'buType',
          options: {
            initialValue: versionSearchForm.buType,
          },
          tag: <Selection.UDC code="ORG.BU_TYPE" placeholder="?????????BU??????" />,
        },
      ],
      columns: [
        {
          title: 'BU??????',
          dataIndex: 'buNo',
          width: 100,
          sorter: true,
          align: 'center',
          fixed: 'left',
          render: (buNo, rowData) => {
            const href = `/org/bu/particulars?buId=${rowData.id}`;
            return (
              <Link className="tw-link" to={href}>
                {buNo}
              </Link>
            );
          },
        },
        {
          title: 'BU??????',
          dataIndex: 'buName',
          width: 200,
          sorter: true,
          fixed: 'left',
        },
        {
          title: '???BU',
          dataIndex: 'pname',
          sorter: true,
        },
        {
          title: 'BU??????',
          dataIndex: 'buStatus',
          sorter: true,
          align: 'center',
          width: 200,
          render: (value, row, index) => row.buStatusDesc,
        },
        {
          title: '????????????',
          dataIndex: 'apprStatus',
          sorter: true,
          align: 'center',
          render: (value, row, index) => row.apprStatusDesc,
        },
        {
          title: '?????????',
          dataIndex: 'inchargeResName',
          sorter: true,
          render: (value, row, index) => row.inchargeResName,
        },
        {
          title: 'BU??????',
          dataIndex: 'buType',
          sorter: true,
          align: 'center',
          render: (value, row, index) => row.buTypeDesc,
        },
        {
          title: '????????????',
          dataIndex: 'accTmplName',
          sorter: true,
        },
        {
          title: '??????????????????',
          dataIndex: 'finPeriodName',
          width: '10%',
          sorter: true,
          align: 'right',
        },
        {
          title: '??????',
          dataIndex: 'currCode',
          sorter: true,
          render: (value, row, index) => row.currCodeDesc,
        },
        {
          title: '???????????????',
          dataIndex: 'regionCode',
          width: '10%',
          sorter: true,
          render: (value, row, index) => row.regionCodeDesc,
        },
      ],
    };
    const tableVersionProps = {
      rowKey: 'id',
      scroll: {
        y: 120,
      },
      showSearch: false,
      columnsCache: DOMAIN,
      rowSelection: {
        type: 'radio',
      },
      dispatch,
      loading: loading.effects[`${DOMAIN}/getBuVersion`],
      expirys: 0,
      versionTotal,
      dataSource: versionList,
      leftButtons: [
        {
          key: 'view',
          title: '??????????????????',
          className: 'tw-btn-primary',
          icon: 'eye',
          loading: false,
          hidden: false,
          disabled: false,
          minSelections: 0,
          cb: (selectedRowKeys, selectedRows, queryParams) => {
            this.showBu(selectedRows);
          },
        },
      ],
      columns: [
        {
          title: '?????????',
          dataIndex: 'versionNo',
          width: '25%',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'changeDesc',
          width: '25%',
        },
        {
          title: '?????????',
          dataIndex: 'createUserIdName',
          width: '25%',
        },
        {
          title: '????????????',
          dataIndex: 'createTime',
          align: 'center',
          width: '25%',
        },
      ],
    };
    const mergeDeep = child =>
      Array.isArray(child)
        ? child.map(item => ({
            ...item,
            buName: item.className,
            child: item.child ? mergeDeep(item.child) : null,
          }))
        : [];

    const treeData = mergeDeep(buHistoryTree);

    return (
      <>
        <DataTable {...tableVersionProps} />
        <Divider dashed />
        {buVisible && (
          <Row gutter={5}>
            <Col
              span={6}
              style={{
                borderRight: '1px dashed #e8e8e8',
                paddingRight: '24px',
                minHeight: '600px',
              }}
            >
              {!loading.effects[`${DOMAIN}/getTreeByVersion`] ? (
                <>
                  <Form.Item
                    style={{ marginBottom: '11px', marginTop: '9px' }}
                    labelCol={{ span: 4, xxl: 4 }}
                    wrapperCol={{ span: 20, xxl: 20 }}
                    label="?????????"
                  >
                    <Input disabled defaultValue={buVersionsNo} />
                  </Form.Item>
                  <TreeSearch
                    showSearch
                    placeholder="??????????????????"
                    treeData={treeData}
                    onSelect={this.onSelect}
                    defaultExpandedKeys={treeData.map(item => `${item.id}`)}
                  />
                </>
              ) : (
                <Loading />
              )}
            </Col>
            <Col span={18}>
              <DataTable {...tableProps} />
            </Col>
          </Row>
        )}
      </>
    );
  }
}

export default ChangeHistory;
