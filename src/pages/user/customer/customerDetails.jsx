import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import classnames from 'classnames';
import { Button, Form, Card, Input, Select, Divider } from 'antd';
import AsyncSelect from '@/components/common/AsyncSelect';
import { FileManagerEnhance, UdcSelect } from '@/pages/gen/field';
import DescriptionList from '@/components/layout/DescriptionList';
import Title from '@/components/layout/Title';
import { getUrl } from '@/utils/flowToRouter';
import { stringify } from 'qs';

import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import { fromQs } from '@/utils/stringUtils';

const { Field } = FieldList;
const DOMAIN = 'customer';
const { Option } = Select;
const { Description } = DescriptionList;

@connect(({ loading, dispatch, customer }) => ({
  loading,
  dispatch,
  customer,
}))
@mountToTab()
class CustomerDetail extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id } = fromQs();
    dispatch({
      type: `${DOMAIN}/customerDetails`,
      payload: id,
    });
  }

  handleCancel = () => {
    const { from } = fromQs();
    closeThenGoto(from);
  };

  render() {
    const {
      loading,
      form,
      customer: { formData },
    } = this.props;
    const urls = getUrl();
    const from = stringify({ from: urls });

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            onClick={() => {
              const { id } = fromQs();
              const { abNo } = formData;
              if (abNo) {
                router.push(`/sale/management/customerInfoEdit?id=${id}&no=${abNo}&${from}`);
              } else {
                router.push(`/sale/management/customerInfoEdit?id=${id}&${from}`);
              }
            }}
          >
            {formatMessage({ id: `misc.update`, desc: '??????' })}
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={this.handleCancel}
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>
        <Card
          className="tw-card-adjust"
          bordered={false}
          style={{ marginTop: '6px' }}
          title={
            <Title
              icon="profile"
              id="ui.menu.user.management.customerDetails"
              defaultMessage="????????????"
            />
          }
        >
          <DescriptionList size="large" col={2} title="??????????????????">
            <Description term="????????????">{formData.custName || ''}</Description>
            <Description term="??????/??????/??????">
              {formData.custRegIonName ? formData.custRegIonName + '/' : ''}
              {formData.provInceName ? formData.provInceName + '/' : ''}
              {formData.cityName}
            </Description>
            <Description term="????????????">{formData.switchBoard || ''}</Description>
            <Description term="????????????">{formData.companyEmail || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="??????????????????">
              <pre>{formData.headOfficeAddr || ''}</pre>
            </Description>
          </DescriptionList>
          <DescriptionList size="large" col={2}>
            <Description term="????????????1">{formData.custLabel1 || ''}</Description>
            <Description term="????????????2">{formData.custLabel2 || ''}</Description>
            <Description term="????????????3">{formData.custLabel3 || ''}</Description>
            <Description term="????????????4">{formData.custLabel4 || ''}</Description>
            <Description term="????????????5">{formData.custLabel5 || ''}</Description>
            <Description term="????????????6">{formData.custLabel6 || ''}</Description>
            <Description term="????????????7">{formData.custLabel7 || ''}</Description>
            <Description term="????????????8">{formData.custLabel8 || ''}</Description>
            <Description term="????????????9">{formData.custLabel9 || ''}</Description>
            <Description term="????????????10">{formData.custLabel10 || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="????????????">{formData.dataFrom || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="??????">
              <pre>{formData.remark || ''}</pre>
            </Description>
          </DescriptionList>
          <Divider dashed />
          <DescriptionList size="large" col={2} title="?????????????????????">
            <Description term="?????????(?????????)-??????/??????/??????" labelWidth="260">
              {formData.chairManName ? formData.chairManName + '/' : ''}
              {formData.chairManTel ? formData.chairManTel + '/' : ''}
              {formData.chairManEmail}
            </Description>
            <Description term="IT?????????-??????/??????/??????" labelWidth="260">
              {formData.itAdminName ? formData.itAdminName + '/' : ''}
              {formData.itAdminTel ? formData.itAdminTel + '/' : ''}
              {formData.itAdminEmail}
            </Description>
            <Description term="???????????????-??????/??????/??????" labelWidth="260">
              {formData.otherPicName ? formData.otherPicName + '/' : ''}
              {formData.otherPicTel ? formData.otherPicTel + '/' : ''}
              {formData.otherPicEmail}
            </Description>
          </DescriptionList>
          <Divider dashed />
          <DescriptionList size="large" col={2} title="????????????">
            <Description term="??????">{formData.custStatusName || ''}</Description>
            <Description term="???????????????(%)">{formData.dataInteGrity || ''}</Description>
            <Description term="???????????????">{formData.dataCheckerName || ''}</Description>
            <Description term="??????VP">{formData.saleVpName || ''}</Description>
            <Description term="???????????????">{formData.salePicName || ''}</Description>
            <Description term="??????????????????">{formData.assingDate || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={2}>
            <Description term="????????????????????????">{formData.lastCheckDate || ''}</Description>
            <Description term="????????????????????????">{formData.lastModifyDate || ''}</Description>
          </DescriptionList>
          <DescriptionList size="large" col={1}>
            <Description term="????????????">
              <pre>{formData.modifyRecord || ''}</pre>
            </Description>
          </DescriptionList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CustomerDetail;
