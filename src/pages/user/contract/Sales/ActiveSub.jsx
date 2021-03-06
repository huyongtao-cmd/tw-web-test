import React, { PureComponent } from 'react';
import classnames from 'classnames';
import { Button, Form, Card, Input, DatePicker, InputNumber, Table } from 'antd';
import { formatMessage } from 'umi/locale';
import { connect } from 'dva';
import moment from 'moment';
import { selectContract, selectFinperiod, selectBuProduct } from '@/services/user/Contract/sales';
import { FileManagerEnhance, Selection } from '@/pages/gen/field';
import createMessage from '@/components/core/AlertMessage';

import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import { div, mul } from '@/utils/mathUtils';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { closeThenGoto, mountToTab } from '@/layouts/routerControl';
import { fromQs } from '@/utils/stringUtils';
import { selectUsersWithBu } from '@/services/gen/list';

const DOMAIN = 'activeSubContract';
const { Field, FieldLine } = FieldList;
const FieldListLayout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

@connect(({ loading, activeSubContract, dispatch }) => ({
  loading,
  activeSubContract,
  dispatch,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    if (changedFields && Object.values(changedFields)[0]) {
      const { name, value } = Object.values(changedFields)[0];
      if (value instanceof Object && name !== 'signDate') {
        const key = name.split('Id')[0];
        props.dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: { [key + 'Id']: value.id, [key + 'Name']: value.name },
        });
      } else if (name === 'signDate') {
        props.dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: { [name]: formatDT(value) },
        });
      } else {
        props.dispatch({
          type: `${DOMAIN}/updateForm`,
          payload: { [name]: value },
        });
      }
    }
  },
})
@mountToTab()
class ActiveSub extends PureComponent {
  componentDidMount() {
    const { dispatch } = this.props;
    const { id } = fromQs();

    if (id) {
      dispatch({
        type: `${DOMAIN}/querySubContractDetail`,
        payload: { id },
      });
    }
  }

  handleSubmit = () => {
    const {
      form: { validateFieldsAndScroll },
      activeSubContract: { formData },
      dispatch,
    } = this.props;
    // ????????????????????????
    validateFieldsAndScroll((error, values) => {
      if (
        formData.endDate === null ||
        formData.startDate === null ||
        formData.signBuName === null ||
        formData.salesmanResName === null ||
        formData.deliResName === null ||
        formData.deliBuName === null ||
        formData.regionBuName === null ||
        formData.signDate === null ||
        formData.amt === null
      ) {
        createMessage({ type: 'warn', description: '???"*"??????????????????????????????????????????????????????' });
      } else {
        dispatch({
          type: `${DOMAIN}/saveSubContractDetail`,
          payload: { ...formData, remark: values.remark },
        });
      }
    });
  };

  render() {
    const {
      loading,
      dispatch,
      activeSubContract: { formData, ruleList = [], salesRegionBuDataSource = [] },
      form: { getFieldDecorator },
    } = this.props;
    const readOnly = true;

    const disabledBtn =
      loading.effects[`${DOMAIN}/querySubContractDetail`] ||
      loading.effects[`${DOMAIN}/saveSubContractDetail`];

    const tableProps = {
      rowKey: 'id',
      sortBy: 'id',
      dataSource: ruleList,
      loading: loading.effects[`${DOMAIN}/query`],
      size: 'small',
      // scroll: {
      //   x: '120%',
      // },

      columns: [
        {
          title: '???????????????',
          dataIndex: 'ruleNo',
          align: 'center',
        },
        {
          title: '??????????????????',
          dataIndex: 'groupRoleDesc',
          align: 'center',
        },
        {
          title: '??????????????????',
          dataIndex: 'groupPercent',
          align: 'center',
          render: value => `${value || 0}%`,
        },
        {
          title: '??????',
          dataIndex: 'groupBaseTypeDesc',
          align: 'center',
        },
        {
          title: '???????????????',
          dataIndex: 'lineSourceDesc',
          align: 'center',
        },
        {
          title: '?????? BU/??????',
          dataIndex: 'gainerBuName',
          align: 'center',
        },
        {
          title: '????????????',
          dataIndex: 'gainerIngroupPercent',
          align: 'center',
          width: 80,
          // required: true,
          render: value => `${value || 0}%`,
        },
        {
          title: '????????????????????????',
          dataIndex: 'allocationProportion',
          align: 'center',
          render: (value, allValues) =>
            `${value ||
              div(mul(allValues.groupPercent, allValues.gainerIngroupPercent || 0), 100)}%`,
        },
        {
          title: '???????????????',
          dataIndex: 'expectDistAmt',
          align: 'center',
        },
        {
          title: '??????',
          dataIndex: 'agreeStatusDesc',
          align: 'center',
        },
        {
          title: '???????????????',
          dataIndex: 'busifieldTypeDesc',
          align: 'center',
          render: value => value,
        },
        {
          title: '??????',
          dataIndex: 'remark',
          align: 'left',
          render: (value, row, index) => <Input disabled className="x-fill-100" value={value} />,
        },
      ],
    };

    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            disabled={disabledBtn}
            onClick={this.handleSubmit}
          >
            ??????
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            onClick={() => closeThenGoto('/sale/contract/salesList')}
            //
          >
            {formatMessage({ id: `misc.rtn`, desc: '??????' })}
          </Button>
        </Card>

        <Card className="tw-card-adjust" bordered={false}>
          <FieldList
            layout="horizontal"
            // legend={formatMessage({ id: `sys.system.basicInfo`, desc: '????????????????????????' })}
            legend="???????????????????????????"
            getFieldDecorator={getFieldDecorator}
            col={2}
            hasSeparator={1}
          >
            <Field
              name="contractNo"
              label="???????????????"
              {...FieldListLayout}
              decorator={{
                initialValue: formData.contractNo,
              }}
            >
              <Input disabled={readOnly} />
            </Field>
            <Field
              name="cname"
              label="???????????????"
              {...FieldListLayout}
              decorator={{
                initialValue: formData.cname,
              }}
            >
              <Input disabled={readOnly} />
            </Field>
            <Field
              name="signBuName"
              label="??????BU"
              required
              {...FieldListLayout}
              decorator={{
                initialValue: formData.signBuName,
              }}
            >
              <Selection.Columns
                disabled
                source={salesRegionBuDataSource}
                transfer={{ key: 'id', code: 'id', name: 'name' }}
                showSearch
              />
            </Field>

            <Field
              name="salesmanResName"
              label="???????????????"
              required
              {...FieldListLayout}
              decorator={{
                initialValue: formData.salesmanResName,
              }}
            >
              <Selection.Columns
                disabled={readOnly}
                source={selectUsersWithBu}
                columns={[
                  { dataIndex: 'code', title: '??????', span: 10 },
                  { dataIndex: 'name', title: '??????', span: 14 },
                ]}
                transfer={{ key: 'id', code: 'id', name: 'name' }}
                showSearch
              />
            </Field>

            <Field
              name="deliBuName"
              label="??????BU"
              required
              decorator={{
                initialValue: formData.deliBuName,
              }}
              {...FieldListLayout}
            >
              <Selection.Columns
                disabled
                source={salesRegionBuDataSource}
                transfer={{ key: 'id', code: 'id', name: 'name' }}
                showSearch
              />
            </Field>

            <Field
              name="deliResName"
              label="???????????????"
              required
              {...FieldListLayout}
              decorator={{
                initialValue: formData.deliResName,
              }}
            >
              <Selection.Columns
                disabled={readOnly}
                source={selectUsersWithBu}
                columns={[
                  { dataIndex: 'code', title: '??????', span: 10 },
                  { dataIndex: 'name', title: '??????', span: 14 },
                ]}
                transfer={{ key: 'id', code: 'id', name: 'name' }}
                showSearch
              />
            </Field>

            <Field
              name="regionBuName"
              label="????????????BU"
              required
              decorator={{
                initialValue: formData.regionBuName,
              }}
              {...FieldListLayout}
            >
              <Selection.Columns
                disabled
                source={salesRegionBuDataSource}
                transfer={{ key: 'id', code: 'id', name: 'name' }}
                showSearch
              />
            </Field>

            <Field
              name="signDate"
              label="????????????"
              required
              decorator={{
                initialValue: formData.signDate ? moment(formData.signDate) : null,
              }}
              {...FieldListLayout}
            >
              <DatePicker disabled format="YYYY-MM-DD" className="x-fill-100" placeholder=" " />
            </Field>

            <Field
              name="startDate"
              label="??????????????????"
              decorator={{
                initialValue: formData.startDate ? moment(formData.startDate) : null,
              }}
              {...FieldListLayout}
              required
            >
              <DatePicker disabled format="YYYY-MM-DD" className="x-fill-100" placeholder=" " />
            </Field>

            <Field
              name="endDate"
              label="??????????????????"
              required
              decorator={{
                initialValue: formData.endDate ? moment(formData.endDate) : null,
              }}
              {...FieldListLayout}
            >
              <DatePicker disabled format="YYYY-MM-DD" className="x-fill-100" placeholder=" " />
            </Field>

            <FieldLine label="???????????????/??????" required {...FieldListLayout}>
              <Field
                name="amt"
                required
                decorator={{
                  initialValue: formData.amt,
                }}
                wrapperCol={{ span: 23, xxl: 23 }}
              >
                <InputNumber disabled={readOnly} className="x-fill-100" />
              </Field>
              <Field
                name="taxRate"
                decorator={{
                  initialValue: formData.taxRate,
                }}
                wrapperCol={{ span: 23, offset: 1, xxl: 23 }}
              >
                <Input disabled={readOnly} type="number" addonAfter="%" />
              </Field>
            </FieldLine>

            <Field
              name="notRateAmt"
              label="???????????????"
              required
              {...FieldListLayout}
              decorator={{
                initialValue: formData.notRateAmt,
              }}
            >
              <Input disabled={readOnly} />
            </Field>

            <Field
              name="purchasingSum"
              label="??????????????????"
              decorator={{
                initialValue: formData.purchasingSum,
              }}
              {...FieldListLayout}
            >
              <Input disabled={readOnly} />
            </Field>

            <Field
              name="extraAmt"
              label="??????????????????"
              decorator={{
                initialValue: formData.extraAmt,
              }}
              {...FieldListLayout}
            >
              <Input disabled={readOnly} />
            </Field>

            <Field
              name="effectiveAmt"
              required
              label="???????????????"
              decorator={{
                initialValue: formData.effectiveAmt,
              }}
              {...FieldListLayout}
            >
              <Input disabled={readOnly} />
            </Field>

            <Field
              name="grossProfit"
              label="???????????????"
              decorator={{
                initialValue: formData.grossProfit,
              }}
              {...FieldListLayout}
            >
              <Input disabled={readOnly} />
            </Field>

            <Field
              key="productId"
              name="productId"
              label="??????"
              decorator={{
                initialValue: formData.productId || undefined,
              }}
              {...FieldListLayout}
            >
              <Selection
                disabled
                source={() => selectBuProduct()}
                placeholder="???????????????"
                showSearch
              />
            </Field>
            <Field
              key="attache"
              name="attache"
              label="??????"
              decorator={{
                initialValue: formData.attache,
                // rules: [
                //   {
                //     required:attache.requiredFlag,
                //     message:`?????????${attache.displayName}`,
                //   },
                // ],
              }}
              {...FieldListLayout}
            >
              <FileManagerEnhance
                api="/api/op/v1/contract/sub/sfs/token"
                dataKey={formData.id}
                listType="text"
                disabled
              />
            </Field>
            <Field
              name="remark"
              label={formatMessage({ id: `sys.baseinfo.subjTemplate.remark`, desc: '??????' })}
              decorator={{
                initialValue: formData.remark,
              }}
              fieldCol={1}
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input.TextArea placeholder="???????????????" rows={3} />
            </Field>
          </FieldList>

          <FieldList
            layout="horizontal"
            legend="???????????????????????????"
            getFieldDecorator={getFieldDecorator}
            col={2}
            hasSeparator={1}
            noReactive
          >
            <Table
              bordered
              rowKey="id"
              sortBy="id"
              dataSource={ruleList}
              loading={loading.effects[`${DOMAIN}/query`]}
              pagination={false}
              scroll={{ x: 1370 }}
              {...tableProps}
            />
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default ActiveSub;
