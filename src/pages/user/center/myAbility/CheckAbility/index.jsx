import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { routerRedux } from 'dva/router';
import { Card, Divider, Icon, Tooltip } from 'antd';
import Link from 'umi/link';
import { stringify } from 'qs';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import DataTable from '@/components/common/DataTable';
import CheckModal from './CheckModal';
import styles from '../index.less';
import capaStyles from './capa.less';

import { getUrl } from '@/utils/flowToRouter';

const DOMAIN = 'checkAbility';

@connect(({ loading, dispatch, checkAbility }) => ({
  loading,
  dispatch,
  checkAbility,
}))
@mountToTab()
class CheckAbility extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/clean` }).then(res => {
      this.fetchDataResCapaPost({
        sortBy: 'id',
        sortDirection: 'DESC',
        offset: 0,
        limit: 10,
      });
      this.fetchDataResCapaReview({
        sortBy: 'id',
        sortDirection: 'DESC',
        offset: 0,
        limit: 10,
      });
      this.fetchDataResTaskCapaPost({
        sortBy: 'id',
        sortDirection: 'DESC',
        offset: 0,
        limit: 10,
      });
    });
  }

  fetchDataResCapaReview = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/queryResCapaReviewList`, payload: { ...params } });
  };

  fetchDataResCapaPost = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/queryResCapaPostList`, payload: { ...params } });
  };

  fetchDataResTaskCapaPost = params => {
    const { dispatch } = this.props;
    dispatch({ type: `${DOMAIN}/queryResTaskCapaList`, payload: { ...params } });
  };

  visibleChange = () => {
    const {
      dispatch,
      checkAbility: {
        formData: { visible },
      },
    } = this.props;

    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        formData: {
          visible: !visible,
        },
      },
    });
  };

  resCapaReviewChecked = row => {
    const { dispatch } = this.props;
    this.visibleChange();
    dispatch({
      type: `${DOMAIN}/capaAbility`,
      payload: {
        abilityId: row.leveldId,
        entryType: row.entryType,
      },
    }).then(res => {
      if (res.ok) {
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            ...row,
            flag: 1,
          },
        });
      }
    });
  };

  waitCapaAbilityChecked = row => {
    const { dispatch } = this.props;
    this.visibleChange();
    dispatch({
      type: `${DOMAIN}/waitCapaAbility`,
      payload: {
        abilityId: row.id,
        capaType: row.renewType,
      },
    }).then(res => {
      if (res.ok) {
        dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: {
            ...row,
            flag: 2,
          },
        });
      }
    });
  };

  abilityType = value => (
    <>
      {value.map(item => (
        <div className={capaStyles['detail-point-style']} key={item.id}>
          {item.capaName}
        </div>
      ))}
    </>
  );

  abilityPoint = value => (
    <>
      {value.map(item => (
        <div
          className={capaStyles['detail-point-style']}
          style={{ cursor: 'pointer', color: '#1890ff' }}
          key={item.id}
          onClick={() => {
            const { obtainStatus, id, levelId } = item;
            if (!obtainStatus) {
              this.resCapaReviewChecked({ leveldId: levelId, entryType: 1 });
            }
            if (obtainStatus && parseInt(obtainStatus, 10) === 4) {
              this.waitCapaAbilityChecked({ id, renewType: 'CAPA' });
            }
          }}
        >
          ?????????
        </div>
      ))}
    </>
  );

  render() {
    const {
      dispatch,
      loading,
      checkAbility: {
        formData,
        checkoutList,
        checkoutTotal,
        waitList,
        waitTotal,
        taskCapaList,
        taskCapaTotal,
      },
    } = this.props;

    const urls = getUrl();
    const from = stringify({ fromPage: urls });

    const tableProps = {
      title: () => (
        <div>
          <span style={{ fontSize: '20px', fontWeight: 'bolder' }}>???????????????</span>
          &nbsp; &nbsp; &nbsp; &nbsp;
          <span style={{ color: '#1890ff', margin: '5px 0' }}>
            <Icon type="exclamation-circle" />
            &nbsp;
            <span>?????????????????????/???????????????????????????????????????????????????</span>
          </span>
        </div>
      ),
      rowKey: 'capasetLevelId',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      loading: loading.effects[`${DOMAIN}/queryResCapaPostList`],
      total: checkoutTotal,
      dataSource: checkoutList,
      onChange: filters => this.fetchDataResCapaPost(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      showSearch: false,
      showColumn: false,
      showExport: false,
      enableSelection: false,
      searchBarForm: [],
      columns: [
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'capasetLevelName',
        },
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'progName',
          render: (val, row, index) => (
            <span
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => {
                dispatch(
                  routerRedux.push({
                    pathname: `/user/center/myTrain`,
                    state: {
                      item: row,
                    },
                  })
                );
              }}
            >
              {val}
            </span>
          ),
        },
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'trnCurProg',
          render: val => `${val}%`,
        },
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'startDate',
        },
        {
          title: '????????????',
          align: 'center',
          dataIndex: 'endDate',
        },
        {
          title: '??????',
          align: 'center',
          dataIndex: 'trnStatusName',
        },
      ],
      leftButtons: [],
    };

    const waitTableProps = {
      title: () => (
        <div>
          <span style={{ fontSize: '20px', fontWeight: 'bolder' }}>?????????</span>
          &nbsp; &nbsp; &nbsp; &nbsp;
          <span style={{ color: '#1890ff', margin: '5px 0' }}>
            <Icon type="exclamation-circle" />
            &nbsp;
            <span>
              ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
            </span>
          </span>
        </div>
      ),
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      loading: loading.effects[`${DOMAIN}/queryResCapaReviewList`],
      total: waitTotal,
      dataSource: waitList,
      onChange: filters => this.fetchDataResCapaReview(filters),
      onSearchBarChange: (changedValues, allValues) => {
        dispatch({
          type: `${DOMAIN}/updateSearchForm`,
          payload: allValues,
        });
      },
      showSearch: false,
      showColumn: false,
      showExport: false,
      enableSelection: false,
      searchBarForm: [],
      columns: [
        {
          title: '??????',
          dataIndex: 'renewTypeName',
          align: 'center',
          width: '15%',
        },
        {
          title: '??????',
          dataIndex: 'name',
          align: 'center',
          width: '30%',
          // render: (val, row, index) => (
          //   <span>
          //     {val}
          //     {row.renewResStatus === 'INVALID' ? (
          //       <span style={{ color: 'red', marginLeft: '10px', fontWeight: 'bolder' }}>
          //         ?????????
          //       </span>
          //     ) : (
          //       ''
          //     )}
          //   </span>
          // ),
        },
        {
          title: '???????????????',
          dataIndex: 'endDate',
          align: 'center',
          width: '15%',
        },
        {
          title: '????????????',
          dataIndex: 'ddesc',
          width: '30%',
          render: (value, row, index) =>
            value && value.length > 30 ? (
              <Tooltip placement="left" title={<pre>{value}</pre>}>
                <pre>{`${value.substr(0, 30)}...`}</pre>
              </Tooltip>
            ) : (
              <pre>{value}</pre>
            ),
        },
        {
          title: '',
          dataIndex: 'createTime',
          width: '10%',
          align: 'center',
          render: (val, row, index) => (
            <span
              style={{ cursor: 'pointer', color: '#1890ff' }}
              onClick={() => {
                this.waitCapaAbilityChecked(row);
              }}
            >
              ?????????
            </span>
          ),
        },
      ],
      leftButtons: [],
    };

    const capaTableProps = {
      title: () => (
        <div>
          <span style={{ fontSize: '20px', fontWeight: 'bolder' }}>?????????????????????</span>
          &nbsp; &nbsp; &nbsp; &nbsp;
          <span style={{ color: '#1890ff', margin: '5px 0' }}>
            <Icon type="exclamation-circle" />
            &nbsp;
            <span>???????????????????????????????????????</span>
          </span>
        </div>
      ),
      rowKey: 'id',
      columnsCache: DOMAIN,
      sortBy: 'id',
      sortDirection: 'DESC',
      loading: loading.effects[`${DOMAIN}/queryResTaskCapaList`],
      total: taskCapaTotal || 0,
      dataSource: taskCapaList || [],
      // onChange: filters => this.fetchDataResTaskCapaPost(filters),
      // onSearchBarChange: (changedValues, allValues) => {
      //   dispatch({
      //     type: `${DOMAIN}/updateSearchForm`,
      //     payload: allValues,
      //   });
      // },
      showSearch: false,
      showColumn: false,
      showExport: false,
      enableSelection: false,
      searchBarForm: [],
      columns: [
        {
          title: '????????????',
          dataIndex: 'distNo',
          align: 'center',
          render: (value, row, index) => (
            <Link
              className="tw-link"
              to={`/user/distribute/detail?id=${parseInt(row.id, 10)}&prcId=${row.procId}&taskId=${
                row.procTaskId
              }&mode=view&from=${from}`}
            >
              {value}
            </Link>
          ),
        },
        {
          title: '????????????',
          dataIndex: 'reasonName',
          align: 'center',
        },
        {
          title: '?????????',
          dataIndex: 'disterResName',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'distTime',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'distDesc',
          render: (value, row, index) =>
            value && value.length > 20 ? (
              <Tooltip placement="left" title={<pre>{value}</pre>}>
                <pre style={{ padding: '0 12px' }}>{`${value.substr(0, 20)}...`}</pre>
              </Tooltip>
            ) : (
              <pre style={{ padding: '0 12px' }}>{value}</pre>
            ),
        },
        {
          title: '????????????',
          dataIndex: 'needCapaList',
          align: 'center',
          render: (value, row, index) => this.abilityType(value),
        },
        {
          title: '?????????',
          dataIndex: 'needCapaList',
          align: 'center',
          render: (value, row, index) => this.abilityPoint(value),
        },
      ],
      leftButtons: [],
    };

    return (
      <>
        <div className={styles['text-select-box']}>
          <Card className="tw-card-adjust" bordered={false}>
            <DataTable {...tableProps} />
            <div style={{ height: '20px' }} />
            <Divider dashed />
            <DataTable {...waitTableProps} />
            <div style={{ height: '20px' }} />
            <Divider dashed />
            <div className={capaStyles['table-clear-padding']}>
              <DataTable {...capaTableProps} />
            </div>
          </Card>
        </div>
        <CheckModal data={formData} visibleChange={() => this.visibleChange()} />
      </>
    );
  }
}

export default CheckAbility;
