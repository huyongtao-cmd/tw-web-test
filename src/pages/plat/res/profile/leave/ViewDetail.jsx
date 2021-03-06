import React, { Component } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import moment from 'moment';
import { isEmpty, isNil, hasIn } from 'ramda';
import classnames from 'classnames';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Radio,
  TimePicker,
  InputNumber,
  Select,
  Switch,
  Checkbox,
} from 'antd';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import AsyncSelect from '@/components/common/AsyncSelect';
import FieldList from '@/components/layout/FieldList';
import Title from '@/components/layout/Title';
import { createConfirm } from '@/components/core/Confirm';
import DataTable from '@/components/common/DataTable';
import BpmWrapper from '@/pages/gen/BpmMgmt/BpmWrapper';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import { formatMessage } from 'umi/locale';
import { FileManagerEnhance, Selection } from '@/pages/gen/field';
import { pushFlowTask } from '@/services/gen/flow';
import { stringify } from 'qs';
import { selectInternalOus } from '@/services/gen/list';
import { getUrl } from '@/utils/flowToRouter';
import createMessage from '@/components/core/AlertMessage';
import DescriptionList from '@/components/layout/DescriptionList';

const { Description } = DescriptionList;

const DOMAIN = 'leave';

@connect(({ leave }) => ({
  leave,
}))
@mountToTab()
class ViewDetail extends Component {
  // componentDidMount() {
  //   const { dispatch } = this.props;
  //   const { id } = fromQs();
  //   id &&
  //     dispatch({
  //       type: `${DOMAIN}/query`,
  //       payload: id,
  //     }).then(res => {
  //       const { applyDate, resId } = res;
  //       dispatch({ type: `${DOMAIN}/myVacationList`, payload: { resId, applyDate } });
  //     });
  //   id &&
  //     dispatch({
  //       type: `${DOMAIN}/checkresultList`,
  //       payload: id,
  //     });
  // }

  render() {
    const {
      loading,
      leave: {
        formData,
        resChkData,
        finChkData,
        offiChkData,
        hrChkData,
        ITChekData,
        myVacationList,
      },
    } = this.props;

    const holidayTableProps = {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      loading: false,
      dataSource: myVacationList,
      showColumn: false,
      onRow: () => {},
      showSearch: false,
      showExport: false,
      pagination: false,
      enableSelection: false,
      enableDoubleClick: false,
      columns: [
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
        },
      ],
    };
    const leavelResTableProps = {
      sortBy: 'id',
      rowKey: 'id',
      sortDirection: 'DESC',
      loading: false,
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
          dataIndex: 'chkItemName',
        },
        {
          title: '????????????',
          dataIndex: 'chkDesc',
        },
        {
          title: '????????????',
          dataIndex: 'finishStatus',
          align: 'center',
        },
        {
          title: '??????',
          dataIndex: 'remark',
          render: (value, row, index) => <pre>{value}</pre>,
        },
      ],
    };

    return (
      <PageHeaderWrapper>
        <Card
          className="tw-card-adjust"
          style={{ marginTop: '6px' }}
          title={
            <Title icon="profile" id="ui.menu.plat.res.leaveApply" defaultMessage="????????????" />
          }
          bordered={false}
        >
          <DescriptionList size="large" col={2}>
            <Description term="??????">{formData.resName || ''}</Description>
            <Description term="????????????">{formData.enrollDate || ''}</Description>
            <Description term="BaseBU">{formData.baseBuName || ''}</Description>
            <Description term="Base???">{formData.baseCityName || ''}</Description>
            <Description term="????????????">{formData.ouName || ''}</Description>
            <Description term="????????????">{formData.presName || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={1} style={{ marginTop: '-32px' }}>
            <Description term="????????????">
              <pre>{formData.leaveDesc}</pre>
            </Description>
          </DescriptionList>
          <DescriptionList size="large" col={2} style={{ marginTop: '-48px' }}>
            <Description term="??????????????????">
              {formData.jobHandOverFlag === 1 && <pre>???</pre>}
              {formData.jobHandOverFlag === 0 && <pre>???</pre>}
            </Description>
            <Description term="???????????????">{formData.jobHandOverName || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={1} style={{ marginTop: '-45px' }}>
            <Description term="??????????????????">
              <pre>{formData.jobContent}</pre>
            </Description>
          </DescriptionList>
          <DescriptionList size="large" col={2} style={{ marginTop: '-30px' }}>
            <Description term="???????????????">{formData.lastJobDate || ''}</Description>
            <Description term="????????????????????????">{formData.contractEndDate || ''}</Description>
            <Description term="????????????">
              {formData.emailSet === 'CLOSE' && '????????????'}
              {formData.emailSet === 'RECEIVER' && '???????????????'}
            </Description>
            <Description term="???????????????">{formData.emailReceiverName || ''}</Description>
            <Description term="??????">{formData.empNo || ''}</Description>
            <Description term="??????">{formData.email || ''}</Description>
            <Description term="?????????">{formData.applyResName || ''}</Description>
            <Description term="????????????">{formData.applyDate || ''}</Description>
          </DescriptionList>
        </Card>
        <Card
          className="tw-card-adjust"
          title={<Title icon="profile" id="ui.menu.plat.res.holiday" defaultMessage="????????????" />}
          bordered={false}
          style={{ marginTop: '6px' }}
        >
          <Checkbox
            style={{ marginLeft: '30px' }}
            checked={formData.vacationFlag === '?????????'}
            disabled
          >
            ???????????????????????????
          </Checkbox>
          <DataTable {...holidayTableProps} />
        </Card>
        <Card
          className="tw-card-adjust"
          title={
            <Title
              icon="profile"
              id="ui.menu.plat.res.leavelRes"
              defaultMessage="??????????????????-????????????"
            />
          }
          bordered={false}
          style={{ marginTop: '6px' }}
        >
          <DataTable {...leavelResTableProps} dataSource={resChkData} />
        </Card>
        <Card
          className="tw-card-adjust"
          title={
            <Title
              icon="profile"
              id="ui.menu.plat.res.leavelFinance"
              defaultMessage="??????????????????-??????"
            />
          }
          bordered={false}
          style={{ marginTop: '6px' }}
        >
          <DataTable {...leavelResTableProps} dataSource={finChkData} />
        </Card>
        <Card
          className="tw-card-adjust"
          title={
            <Title
              icon="profile"
              id="ui.menu.plat.res.leavelAdm"
              defaultMessage="??????????????????-??????"
            />
          }
          bordered={false}
          style={{ marginTop: '6px' }}
        >
          <DataTable {...leavelResTableProps} dataSource={offiChkData} />
        </Card>
        <Card
          className="tw-card-adjust"
          title={
            <Title
              icon="profile"
              id="ui.menu.plat.res.leavelPerson"
              defaultMessage="??????????????????-??????"
            />
          }
          bordered={false}
          style={{ marginTop: '6px' }}
        >
          <DataTable {...leavelResTableProps} dataSource={hrChkData} />
        </Card>
        <Card
          className="tw-card-adjust"
          title={
            <Title icon="profile" id="ui.menu.plat.res.leavelIT" defaultMessage="??????????????????-IT" />
          }
          bordered={false}
          style={{ marginTop: '6px' }}
        >
          <DataTable {...leavelResTableProps} dataSource={ITChekData} />
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ViewDetail;
