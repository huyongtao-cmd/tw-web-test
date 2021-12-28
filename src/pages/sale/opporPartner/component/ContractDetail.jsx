/* eslint-disable react/destructuring-assignment */
import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Button, Divider, Tooltip, Input, Form } from 'antd';
import DescriptionList from '@/components/layout/DescriptionList';
import DataTable from '@/components/common/DataTable';
import { FileManagerEnhance } from '@/pages/gen/field';
import { fromQs } from '@/utils/stringUtils';
import { mountToTab, closeThenGoto, markAsNoTab } from '@/layouts/routerControl';
import { formatDT } from '@/utils/tempUtils/DateTime';
import router from 'umi/router';
import createMessage from '@/components/core/AlertMessage';
import Link from 'umi/link';
import { getLink } from '@/pages/sale/purchaseContract/linkConfig';
import { formatMessage } from 'umi/locale';
import FieldList from '@/components/layout/FieldList';
import moment from 'moment';
import { isEmpty } from 'ramda';
import style from '../style.less';

const DOMAIN = 'partnerFlow';
const { Description } = DescriptionList;
const { Field } = FieldList;

@connect(({ loading, dispatch, partnerFlow, user }) => ({
  loading,
  dispatch,
  partnerFlow,
  user,
}))
@Form.create({
  onValuesChange(props, changedValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
@mountToTab()
class Detail extends PureComponent {
  componentDidMount() {
    this.props.onRef(this);
  }

  handleSave = () => {
    const {
      dispatch,
      user: {
        user: { extInfo },
      },
      partnerFlow: { detailData },
      form: { validateFieldsAndScroll },
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        dispatch({
          type: `${DOMAIN}/updateCoop`,
          payload: {
            ...values,
            applyStatus: detailData.applyStatus,
            apprStatus: detailData.apprStatus,
            id: detailData.id,
            reportedResId: extInfo.resId,
            reportedDate: formatDT(detailData.reportedDate, 'YYYY-MM-DD HH:mm:ss'),
          },
        });
      }
    });
  };

  render() {
    const {
      partnerFlow: { closeReason, pageConfig, fieldsConfig, detailData: formData },
      dispatch,
      loading,
      form: { getFieldDecorator },
    } = this.props;
    const { pageMode, taskId, mode } = fromQs();
    const { taskKey } = fieldsConfig;
    const isEdit = !(taskId && taskKey === 'TSK_C01_01_SUBMIT_i' && mode === 'edit');

    const mainFields = [
      <Description term="合作伙伴公司名称" key="coopCompanyName">
        <Tooltip title={`${formData.coopCompanyName || ''} `} className={style.ellipsis}>
          {formData.coopCompanyName}
        </Tooltip>
      </Description>,
      <Description term="合作伙伴对接人" key="coopPicName">
        {formData.coopPicName}
      </Description>,
      <Description term="合作伙伴行业" key="coopIndustry">
        {formData.coopIndustry}
      </Description>,
      <Description term="合作伙伴产品" key="coopProducts">
        {formData.coopProducts}
      </Description>,
      <Description term="对接人职位" key="coopPicPosition">
        {formData.coopPicPosition}
      </Description>,
      <Description term="联系方式" key="coopPicContact">
        {formData.coopPicContact}
      </Description>,
      <Description term="提报人" key="reportedResName">
        {formData.reportedResName}
      </Description>,
      <Description term="报备日期" key="reportedDate">
        {formatDT(formData.reportedDate, 'YYYY-MM-DD')}
      </Description>,
    ];

    return (
      <>
        {pageMode === 'over' ? (
          <Card className="tw-card-adjust" bordered={false}>
            <div className="tw-card-title">终止原因</div>
            <Input.TextArea
              style={{
                width: '80%',
                margin: '10px 0 0 50px',
              }}
              defaultValue={closeReason}
              rows={5}
              onChange={e => {
                dispatch({
                  type: `${DOMAIN}/updateState`,
                  payload: { closeReason: e.target.value },
                });
              }}
              disabled
            />
          </Card>
        ) : (
          ''
        )}
        <Card className="tw-card-adjust" bordered={false}>
          <div className="tw-card-title">合作伙伴信息</div>
          {/*<DescriptionList size="large" col={3} className={style.fill}>*/}
          {/*  {mainFields}*/}
          {/*</DescriptionList>*/}
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
            <Field
              name="coopCompanyName"
              label="合作伙伴公司名称"
              decorator={{
                initialValue: formData.coopCompanyName || '',
              }}
            >
              <Input disabled={isEdit} />
            </Field>
            <Field
              name="coopPicName"
              label="合作伙伴对接人"
              decorator={{
                initialValue: formData.coopPicName || '',
              }}
            >
              <Input disabled={isEdit} />
            </Field>
            <Field
              name="coopIndustry"
              label="合作伙伴行业"
              decorator={{
                initialValue: formData.coopIndustry,
              }}
            >
              <Input disabled={isEdit} />
            </Field>
            <Field
              name="coopProducts"
              label="合作伙伴产品"
              decorator={{
                initialValue: formData.coopProducts,
              }}
            >
              <Input disabled={isEdit} />
            </Field>
            <Field
              name="coopPicPosition"
              label="对接人职位"
              decorator={{
                initialValue: formData.coopPicPosition,
              }}
            >
              <Input disabled={isEdit} />
            </Field>
            <Field
              name="coopPicContact"
              label="联系方式"
              decorator={{
                initialValue: formData.coopPicContact,
              }}
            >
              <Input disabled={isEdit} />
            </Field>
            <Field
              name="reportedResName"
              label="提报人"
              decorator={{
                initialValue: formData.reportedResName,
              }}
            >
              <Input disabled />
            </Field>
            <Field
              name="reportedDate"
              label="报备日期"
              decorator={{
                initialValue: moment(formData.reportedDate).format('YYYY-MM-DD'),
              }}
            >
              <Input disabled />
            </Field>
          </FieldList>
        </Card>
      </>
    );
  }
}

export default Detail;
