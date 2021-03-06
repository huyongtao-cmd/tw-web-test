import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { stringify } from 'qs';
import { Card, Divider, Icon, Tooltip, Input, Radio, TreeSelect } from 'antd';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import DataTable from '@/components/common/DataTable';
import { Selection, DatePicker } from '@/pages/gen/field';
import Link from 'umi/link';
import { getUrl } from '@/utils/flowToRouter';

const DOMAIN = 'applicationRecord';

@connect(({ loading, dispatch, applicationRecord }) => ({
  loading: loading.effects[`${DOMAIN}/query`],
  dispatch,
  applicationRecord,
}))
@mountToTab()
class ApplicationRecord extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/clean` });
    dispatch({
      type: `${DOMAIN}/getPageConfig`,
      payload: {
        pageNo: 'CAPA_APPLY_HISTORY',
      },
    });
    dispatch({
      type: `${DOMAIN}/getCapaSetList`,
    });
    dispatch({
      type: `${DOMAIN}/getCapaUdcTree`,
    });
    dispatch({
      type: `${DOMAIN}/queryCapaset`,
    });
  }

  fetchData = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        dataSource: [],
        total: 0,
      },
    });
    dispatch({
      type: `${DOMAIN}/query`,
      payload: params,
    });
  };

  sortObj = (obj1, obj2) => {
    const a = obj1.sortNo;
    const b = obj2.sortNo;
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  };

  render() {
    const {
      dispatch,
      loading,
      applicationRecord: {
        dataSource = [],
        total = 0,
        searchForm = {},
        capaSetList = [],
        capaList = [],
        capaUdcTree = [],
        pageConfig = {},
        capasetData = [],
      },
    } = this.props;
    const { pageBlockViews = [] } = pageConfig;

    let columns = [];

    if (pageBlockViews && pageBlockViews.length > 0) {
      const { pageFieldViews = [] } = pageBlockViews[0];
      columns = pageFieldViews
        .filter(item => item.visibleFlag === 1)
        .sort(this.sortObj)
        .map(item => {
          const columnsItem = {
            title: item.displayName,
            dataIndex: item.fieldKey,
            align: 'center',
          };

          if (item.fieldKey === 'procNo') {
            columnsItem.render = (value, row, key) => {
              const urls = getUrl();
              const from = stringify({ fromPage: urls });
              const { defKey } = row;
              let baseUrl = '';
              if (defKey === 'ACC_A56') {
                // ????????????
                baseUrl = '/user/center/growth/compoundAbility/view';
              }
              if (defKey === 'ACC_A55') {
                // ?????????
                baseUrl = '/user/center/growth/checkPoint/view';
              }
              if (defKey === 'ACC_A54') {
                // ??????
                baseUrl = '/user/center/growth/certificate/view';
              }
              if (defKey === 'ACC_A67') {
                // ?????????
                baseUrl = '/user/center/growth/compoundPermission/view';
              }
              const jumpUrl = `${baseUrl}?id=${row.docId}&prcId=${row.procId}&taskId=${
                row.procTaskId
              }&mode=view&from=${from}`;

              return (
                <Link className="tw-link" to={jumpUrl}>
                  {value}
                </Link>
              );
            };
          }

          return columnsItem;
        });
    }

    const tableProps = {
      dispatch,
      loading,
      expirys: 0,
      rowKey: 'docId',
      showExport: false,
      enableSelection: false,
      dataSource,
      total,
      onChange: filters => {
        this.fetchData(filters);
      },
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      searchBarForm: [
        {
          title: '??????',
          dataIndex: 'capaApplyType',
          tag: <Selection.UDC code="RES:CAPA_APPLY_TYPE" placeholder="???????????????" />,
        },
        {
          title: '??????',
          dataIndex: 'apprStatus',
          options: {
            initialValue: searchForm.apprStatus,
          },
          tag: <Selection.UDC code="COM:APPR_STATUS" placeholder="???????????????" />,
        },
        {
          title: '??????????????????',
          dataIndex: 'capasetId',
          options: {
            initialValue: searchForm.capasetId,
          },
          tag: (
            <Selection.Columns
              source={capasetData || []}
              placeholder="???????????????????????????"
              showSearch
            />
          ),
        },
        {
          title: '??????????????????',
          dataIndex: 'capaId',
          options: {
            initialValue: searchForm.capaId,
          },
          tag: (
            <Input.Group className="tw-field-group" compact>
              <TreeSelect
                className="tw-field-group-field"
                treeData={Array.isArray(capaUdcTree) ? capaUdcTree : []}
                placeholder="??????"
                style={{
                  maxWidth: '50%',
                }}
                onChange={v => {
                  const catArray = v ? v.split('-') : [];
                  const catParam = {};
                  if (catArray && catArray.length === 1) {
                    [catParam.cat1Code] = catArray;
                  }
                  if (catArray && catArray.length === 2) {
                    [catParam.cat2Code, catParam.cat1Code] = catArray;
                  }
                  dispatch({
                    type: `${DOMAIN}/getCapaList`,
                    payload: {
                      ...catParam,
                    },
                  });
                }}
              />
              <Selection
                style={{
                  maxWidth: '50%',
                }}
                value={searchForm.capaId}
                className="tw-field-group-field"
                source={Array.isArray(capaList) ? capaList : []}
                placeholder="????????????"
                onChange={v => {
                  dispatch({
                    type: `${DOMAIN}/updateSearchForm`,
                    payload: {
                      ...searchForm,
                      capaId: v,
                    },
                  });
                }}
              />
            </Input.Group>
          ),
        },
        {
          title: '?????????',
          dataIndex: 'ability',
          options: {
            initialValue: searchForm.ability,
          },
        },

        {
          title: '????????????',
          dataIndex: 'apprResult',
          options: {
            initialValue: searchForm.apprResult,
          },
          tag: (
            <Radio.Group>
              <Radio value="YES">????????????</Radio>
              <Radio value="NO">???????????????</Radio>
              <Radio value="">??????</Radio>
            </Radio.Group>
          ),
        },

        {
          title: '????????????',
          dataIndex: 'procNo',
          options: {
            initialValue: searchForm.procNo,
          },
        },
        {
          title: '????????????',
          dataIndex: 'applyData',
          options: {
            initialValue: searchForm.applyData,
          },
          tag: <DatePicker.RangePicker format="YYYY-MM-DD" />,
        },
      ],
      columns: [...columns],
      leftButtons: [],
    };

    return (
      <>
        <Card className="tw-card-adjust" bordered={false}>
          <DataTable {...tableProps} />
        </Card>
      </>
    );
  }
}

export default ApplicationRecord;
