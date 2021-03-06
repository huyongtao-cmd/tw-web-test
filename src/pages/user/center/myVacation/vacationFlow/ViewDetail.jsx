import React, { PureComponent } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Card, Divider, Tooltip } from 'antd';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab } from '@/layouts/routerControl';
import DataTable from '@/components/common/DataTable';
import Title from '@/components/layout/Title';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { FileManagerEnhance } from '@/pages/gen/field';
import DescriptionList from '@/components/layout/DescriptionList';
import DetailEntityTable from './table/DetailEntityTable';
import { sub } from '@/utils/mathUtils';

const { Description } = DescriptionList;

const DOMAIN = 'vacationApply';

@connect(({ loading, vacationApply, dispatch }) => ({
  loading,
  vacationApply,
  dispatch,
}))
@mountToTab()
class ViewDetail extends PureComponent {
  componentDidMount() {
    const { dispatch, user } = this.props;
    const { id } = fromQs();
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        formData: {
          resVacationApply: { detailViewList: [] },
          recentResVacationList: [],
          resVacationList: [],
        },
      },
    });
    dispatch({
      type: `${DOMAIN}/queryDetail`,
      payload: {
        id,
      },
    });
  }

  render() {
    const {
      loading,
      dispatch,
      vacationApply: {
        formData: { resVacationApply, recentResVacationList, resVacationList },
      },
    } = this.props;
    const { detailViewList } = resVacationApply;

    const resVacationTableProps = {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      loading: false,
      dataSource: resVacationList,
      showColumn: false,
      onRow: () => {},
      showSearch: false,
      showExport: false,
      pagination: false,
      enableDoubleClick: false,
      rowSelection: {
        type: 'radio',
        selectedRowKeys: [resVacationApply.vacationId] || [],
        onChange: () => {},
        getCheckboxProps: record => ({
          disabled: true,
        }),
      },
      columns: resVacationApply.enabledFlag
        ? [
            {
              title: '??????',
              dataIndex: 'vacationYear',
              align: 'center',
            },
            {
              title: '??????',
              dataIndex: 'vacationYear',
              align: 'center',
            },
            {
              title: '????????????',
              dataIndex: 'vacationTypeName',
              align: 'center',
            },
            {
              title: '????????????',
              dataIndex: 'startDate',
              align: 'center',
            },
            {
              title: '????????????',
              dataIndex: 'endDate',
              align: 'center',
            },
            {
              title: '?????????',
              dataIndex: 'expirationDate',
              align: 'center',
            },
            {
              title: '?????????',
              dataIndex: 'totalDays',
              align: 'center',
            },
            {
              title: '????????????',
              dataIndex: 'usedDays',
              width: 100,
              align: 'center',
            },
            {
              title: '????????????',
              dataIndex: 'canUsedDays',
              align: 'center',
              render: (value, row, index) => sub(row.totalDays, row.usedDays).toFixed(1),
            },
            {
              title: '??????',
              dataIndex: 'remark',
              render: (value, row, index) => <pre>{value}</pre>,
            },
          ]
        : [
            {
              title: '??????',
              dataIndex: 'vacationYear',
              align: 'center',
            },
            {
              title: '????????????',
              dataIndex: 'vacationTypeName',
              align: 'center',
            },
            {
              title: '????????????',
              dataIndex: 'startDate',
              align: 'center',
              render: value => moment(value).format('YYYY-MM-DD'),
            },
            {
              title: '????????????',
              dataIndex: 'endDate',
              align: 'center',
              render: value => moment(value).format('YYYY-MM-DD'),
            },
            {
              title: '?????????',
              dataIndex: 'expirationDate',
              align: 'center',
              render: value => moment(value).format('YYYY-MM-DD'),
            },
            {
              title: '??????',
              dataIndex: 'totalDays',
              align: 'center',
            },
            {
              title: '??????',
              dataIndex: 'usedDays',
              align: 'center',
            },
            {
              title: '??????',
              dataIndex: 'availableDays',
              align: 'center',
              render: (value, row, index) =>
                sub(sub(row.totalDays, row.usedDays), row.frozenDay).toFixed(1),
            },
            {
              title: '?????????',
              dataIndex: 'frozenDay',
              align: 'center',
            },
          ],
    };

    const detailViewTableProps = {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      loading: false,
      dataSource: detailViewList,
      showColumn: false,
      onRow: () => {},
      showSearch: false,
      showExport: false,
      pagination: false,
      enableSelection: false,
      enableDoubleClick: false,
      columns: [
        {
          title: '????????????',
          dataIndex: 'vacationYear',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'vacationTypeName',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'startDate',
          align: 'center',
        },
      ],
    };

    const recentResVacationTableProps = {
      sortBy: 'id',
      rowKey: 'detailId',
      sortDirection: 'DESC',
      loading: false,
      dataSource: recentResVacationList,
      showColumn: false,
      onRow: () => {},
      showSearch: false,
      showExport: false,
      // pagination: false,
      enableSelection: false,
      enableDoubleClick: false,
      columns: [
        {
          title: '????????????',
          dataIndex: 'applyNo',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'detailVDate',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'vacationTypeDesc',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'detailVDays',
          align: 'center',
        },
        {
          title: '??????',
          dataIndex: 'reason',
          render: (value, row, key) =>
            value && value.length > 15 ? (
              <Tooltip placement="left" title={<pre>{value}</pre>}>
                <span>{`${value.substr(0, 15)}...`}</span>
              </Tooltip>
            ) : (
              <span>{value}</span>
            ),
        },
      ],
    };

    return (
      <PageHeaderWrapper>
        <Card
          className="tw-card-adjust"
          style={{ marginTop: '6px' }}
          title={
            <Title icon="profile" id="ui.menu.plat.vacation.view" defaultMessage="??????????????????" />
          }
          bordered={false}
        >
          <DescriptionList size="large" col={2}>
            <Description term="????????????">{resVacationApply.applyNo || ''}</Description>
            <Description term="?????????">{resVacationApply.apprResName || ''}</Description>
            <Description term="BaseBU">{resVacationApply.buName || ''}</Description>
            <Description term="????????????">{resVacationApply.presName || ''}</Description>
            <Description term="????????????">{resVacationApply.ouName || ''}</Description>
            <Description term="????????????">{resVacationApply.vacationTypeDesc || ''}</Description>
            <Description term="????????????/????????????">
              {resVacationApply.startDate || ''}
              {resVacationApply.endDate ? '~' : ''}
              {resVacationApply.endDate || ''}
            </Description>
            <Description term="????????????">{resVacationApply.vacationDays || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large">
            <Description term="??????">
              <FileManagerEnhance
                api="/api/person/v1/vacationApply/sfs/token"
                dataKey={resVacationApply.id}
                listType="text"
                preview
              />
            </Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="????????????">
              <pre>{resVacationApply.reason || ''}</pre>
            </Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="????????????">
              <pre>{resVacationApply.workPlan || ''}</pre>
            </Description>
          </DescriptionList>
          <DescriptionList size="large" col={2}>
            <Description term="?????????">{resVacationApply.apprResName || ''}</Description>
            <Description term="????????????">{resVacationApply.apprDate || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="?????????????????????">
              {resVacationApply.addFlag === '1' && <pre>???</pre>}
              {resVacationApply.addFlag === '0' && <pre>???</pre>}
            </Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="??????????????????">
              <pre>{resVacationApply.addList || ''}</pre>
            </Description>
          </DescriptionList>
          <DescriptionList size="large">
            <Description term="????????????">
              <FileManagerEnhance
                api="/api/person/v1/vacationApply/supply/sfs/token"
                dataKey={resVacationApply.id}
                listType="text"
                preview
              />
            </Description>
          </DescriptionList>
          <Divider dashed />
          <DescriptionList title="????????????" size="large" col={1}>
            <DetailEntityTable />
          </DescriptionList>
          <Divider dashed />
          <DescriptionList title="????????????" size="large" col={1}>
            <DataTable {...resVacationTableProps} />
          </DescriptionList>
          <Divider dashed />
          <DescriptionList title="??????????????????" size="large" col={1}>
            <DataTable {...recentResVacationTableProps} />
          </DescriptionList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ViewDetail;
