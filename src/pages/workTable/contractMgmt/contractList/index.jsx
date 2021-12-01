import React from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { Form, Modal } from 'antd';
import { isEmpty } from 'ramda';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import Link from '@/components/production/basic/Link';
import PageWrapper from '@/components/production/layout/PageWrapper';
import SearchTable, { DataOutput } from '@/components/production/business/SearchTable';
import createMessage from '@/components/core/AlertMessage';
import { createConfirm } from '@/components/core/Confirm';
import { remindString } from '@/components/production/basic/Remind';
import { outputHandle } from '@/utils/production/outputUtil';
import { fromQs } from '@/utils/production/stringUtil';

// @ts-ignore
import {
  contractPagingRq,
  contractDeleteRq,
  pcontractChangeStatusRq,
} from '@/services/workbench/contract';

const DOMAIN = 'contractList';

@connect(({ loading, dispatch, contractList }) => ({
  treeLoading: loading.effects[`${DOMAIN}/init`],
  dispatch,
  ...contractList,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      fields[key] = Form.createFormField({ value: tempValue });
    });
    return fields;
  },
  onValuesChange(props, changedValues, allValues) {
    if (isEmpty(changedValues)) return;
    const name = Object.keys(changedValues)[0];
    const value = changedValues[name];
    const newFieldData = { [name]: value };

    switch (name) {
      default:
        break;
    }
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: newFieldData,
    });
  },
})
class list extends React.PureComponent {
  state = {
    visible: false,
    modalFormData: {},
  };

  componentDidMount() {
    // this.callModelEffects("init")
    // const { dispatch } = this.props;
    // dispatch({
    //   type: `${DOMAIN}/getPageConfig`,
    //   payload: { pageNo: 'PROD_CONTACT_LIST' },
    // });
  }

  fetchData = async params => {
    const { effectiveStartDate, createTime, ...restparams } = params;
    if (Array.isArray(effectiveStartDate) && (effectiveStartDate[0] || effectiveStartDate[1])) {
      [restparams.effectStartDate, restparams.effectEndDate] = effectiveStartDate;
    }

    if (Array.isArray(createTime) && (createTime[0] || createTime[1])) {
      [restparams.createStartTime, restparams.createEndTime] = createTime;
    }

    const { response } = await contractPagingRq(restparams);
    return response.data;
  };

  deleteData = async keys =>
    outputHandle(contractDeleteRq, { ids: keys.join(',') }, undefined, false);

  changeStatus = async parmars => {
    const { response } = await pcontractChangeStatusRq(parmars);
    return response.data;
  };

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

  onSelect = selectedKeys => {
    this.callModelEffects('handleSelectChange', { id: selectedKeys[0] });
  };

  renderSearchForm = () => {
    const { dispatch, contractClass2List } = this.props;
    const { getInternalState = () => {} } = this.state;
    const internalState = getInternalState();

    return [
      <SearchFormItem
        key="contractName"
        fieldKey="contractName"
        label="合同名称"
        fieldType="BaseInput"
        defaultShow
      />,
      <SearchFormItem
        key="contractNo"
        fieldKey="contractNo"
        label="合同编号	"
        fieldType="BaseInput"
        defaultShow
      />,
      <SearchFormItem
        label="合同状态"
        fieldKey="contractStatus"
        key="contractStatus"
        fieldType="BaseSelect"
        parentKey="FUNCTION:CONTRACT:STATUS"
        defaultShow
      />,
      <SearchFormItem
        key="contractClass1"
        label="合同类型"
        fieldType="BaseSystemCascaderMultiSelect"
        fieldKey="contractClass1"
        parentKey="FUNCTION:CONTRACT:CLASS1"
        defaultShow
        onChange={(value, option, allOptions) => {
          internalState.form.setFieldsValue({
            contractClass2: null,
          });
          dispatch({
            type: `${DOMAIN}/systemSelectionCascaderRq`,
            payload: {
              key: 'FUNCTION:CONTRACT:CLASS1',
              cascaderValues: value,
            },
          });
        }}
      />,
      <SearchFormItem
        key="contractClass2"
        label="合同小类"
        fieldType="BaseSelect"
        fieldKey="contractClass2"
        descList={contractClass2List}
        defaultShow
      />,
      // <SearchFormItem
      //   key="contractParties"
      //   label="签约方"
      //   fieldType="BaseInput"
      //   fieldKey="contractParties"
      //   defaultShow
      // />,
      <SearchFormItem
        key="dutyResId"
        label="合同负责人"
        fieldType="ResSimpleSelect"
        fieldKey="dutyResId"
        defaultShow
      />,
      // <SearchFormItem
      //   key="inchargeBuId"
      //   label="所属部门"
      //   fieldType="BuSimpleSelect"
      //   fieldKey="inchargeBuId"
      //   defaultShow
      // />,
      <SearchFormItem
        label="签约公司"
        fieldType="BaseSelect"
        key="contractCompany"
        fieldKey="contractCompany"
        parentKey="FUNCTION:COMPANY:NAME"
        defaultShow
      />,

      // <SearchFormItem
      //   label="法务意见"
      //   fieldType="BaseInput"
      //   key="legalComments"
      //   fieldKey="legalComments"
      //   defaultShow
      // />,
      // <SearchFormItem
      //   label="相关项目"
      //   fieldType="ProjectSimpleSelect"
      //   key="relatedProject"
      //   fieldKey="relatedProject"
      //   defaultShow
      // />,
      // <SearchFormItem
      //   key="relatedProduct"
      //   label="相关产品"
      //   fieldKey="relatedProduct"
      //   fieldType="ProductSimpleSelect"
      //   defaultShow
      // />,
      <SearchFormItem
        key="effectiveStartDate"
        label="生效日期"
        fieldKey="effectiveStartDate"
        fieldType="BaseDateRangePicker"
        defaultShow
      />,
      <SearchFormItem
        key="createUserId"
        label="创建人"
        fieldType="UserSimpleSelect"
        fieldKey="createUserId"
        defaultShow
      />,
      <SearchFormItem
        key="createTime"
        fieldKey="createTime"
        label="创建日期"
        fieldType="BaseDateRangePicker"
        defaultShow
        advanced
      />,
    ];
  };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    const {
      form: { validateFieldsAndScroll },
      formData,
      dispatch,
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        const { getInternalState, modalFormData } = this.state;
        const { refreshData } = getInternalState();

        this.changeStatus({ ...formData, ...values, ...modalFormData }).then(res => {
          refreshData();
        });
      }
    });

    this.setState(
      {
        visible: false,
        modalFormData: {},
      },
      () => {
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            formData: {},
          },
        });
      }
    );
  };

  handleCancel = e => {
    const { dispatch } = this.props;
    this.setState(
      {
        visible: false,
        modalFormData: {},
      },
      () => {
        dispatch({
          type: `${DOMAIN}/updateState`,
          payload: {
            formData: {},
          },
        });
      }
    );
  };

  render() {
    const { pageConfig, formData, formMode, form } = this.props;
    const { visible, getInternalState } = this.state;

    const columns = [
      {
        title: '合同编号',
        key: 'contractNo',
        dataIndex: 'contractNo',
        align: 'center',
        sorter: true,
        render: (value, row, index) => (
          <Link
            onClick={() =>
              router.push(`/workTable/contractMgmt/contractCreate?id=${row.id}&mode=DESCRIPTION`)
            }
          >
            {value}
          </Link>
        ),
      },
      {
        title: '合同名称',
        key: 'contractName',
        dataIndex: 'contractName',
        align: 'center',
      },
      {
        title: '合同状态',
        key: 'contractStatus',
        dataIndex: 'contractStatusDesc',
        align: 'center',
      },
      {
        title: '合同类型',
        key: 'contractClass1',
        dataIndex: 'contractClass1Desc',
        align: 'center',
      },
      {
        title: '合同小类',
        key: 'contractClass2',
        dataIndex: 'contractClass2Desc',
        align: 'center',
      },
      {
        title: '参考合同号',
        key: 'contractEntityNo',
        dataIndex: 'contractEntityNo',
        align: 'center',
      },
      {
        title: '合同金额',
        dataIndex: 'contractAmount',
        align: 'right',
        render: val => val && val.toFixed(2),
      },
      // {
      //   title: '签约公司',
      //   key: 'signingCompany',
      //   dataIndex: 'signingCompanyDesc',
      //   align: 'center',
      // },
      {
        title: '合同负责人',
        key: 'dutyResIdDesc',
        dataIndex: 'dutyResIdDesc',
        align: 'center',
      },
      {
        title: '甲方',
        key: 'partyFirstDesc',
        dataIndex: 'partyFirstDesc',
        align: 'center',
      },
      {
        title: '乙方',
        key: 'partySecondDesc',
        dataIndex: 'partySecondDesc',
        align: 'center',
      },
      // {
      //   title: '所属部门',
      //   key: 'inchargeBuId',
      //   dataIndex: 'inchargeBuIdDesc',
      //   align: 'center',
      // },

      {
        title: '签订日期',
        key: 'contractSignDate',
        dataIndex: 'contractSignDate',
        align: 'center',
      },
      {
        title: '生效日期',
        key: 'effectStartDate',
        dataIndex: 'effectStartDate',
        align: 'center',
      },
      {
        title: '终止日期',
        key: 'effectEndDate',
        dataIndex: 'effectEndDate',
        align: 'center',
      },
      // {
      //   title: '相关合同',
      //   key: 'relatedContract',
      //   dataIndex: 'relatedContractDesc',
      //   align: 'center',
      // },
      // {
      //   title: '相关项目',
      //   key: 'relatedProject',
      //   dataIndex: 'relatedProjectDesc',
      //   align: 'center',
      // },
      // {
      //   title: '相关产品',
      //   key: 'relatedProduct',
      //   dataIndex: 'relatedProductDesc',
      //   align: 'center',
      // },
      {
        title: '创建人',
        key: 'createUserId',
        dataIndex: 'createUserIdDesc',
        align: 'center',
      },
      {
        title: '创建时间',
        key: 'createTimeDesc',
        dataIndex: 'createTimeDesc',
        align: 'center',
      },
      // {
      //   title: '法务意见',
      //   key: 'legalComments',
      //   dataIndex: 'legalComments',
      // },
      // {
      //   title: '关闭原因',
      //   key: 'closeReasonDesc',
      //   dataIndex: 'closeReasonDesc',
      //   align: 'center',
      // },
    ];

    return (
      <PageWrapper>
        <Modal
          destroyOnClose
          title="合同关闭"
          visible={visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          width="65%"
        >
          <BusinessForm formData={formData} form={form} formMode={formMode} defaultColumnStyle={12}>
            <FormItem
              fieldType="BaseSelect"
              label="关闭原因"
              fieldKey="closeReason"
              parentKey="CUS:CONTRACT_CLOSE_REASON"
              initialValue={formData.signingCompany}
              required
            />
            <FormItem
              required
              fieldType="BaseInputTextArea"
              label="备注"
              fieldKey="closeRemark"
              initialValue={formData.closeRemark}
            />
          </BusinessForm>
        </Modal>
        <SearchTable
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          showSearchCardTitle={false}
          defaultSortBy="id"
          defaultSortDirection="DESC"
          searchForm={this.renderSearchForm()}
          defaultSearchForm={{}}
          fetchData={this.fetchData}
          columns={columns}
          onAddClick={() => router.push('/workTable/contractMgmt/contractCreate')}
          onEditClick={data => {
            const { selectedRows } = getInternalState();
            const tt = selectedRows.filter(v => v.contractStatus !== 'CREATE');
            if (!isEmpty(tt)) {
              createMessage({
                type: 'warn',
                description: `仅“新建”状态允许修改！`,
              });
              return;
            }
            router.push(`/workTable/contractMgmt/contractCreate?id=${data.id}&mode=EDIT`);
          }}
          deleteData={data => {
            const { selectedRows } = getInternalState();
            const tt = selectedRows.filter(v => v.contractStatus !== 'CREATE');
            if (!isEmpty(tt)) {
              createMessage({
                type: 'warn',
                description: remindString({
                  remindCode: 'COM:W:DELETE_WARN',
                  defaultMessage: `仅新建状态的合同才能删除！`,
                }),
              });
              return Promise.resolve({ ok: false });
            }
            return this.deleteData(data);
          }}
          tableExtraProps={{
            scroll: {
              x: 2000,
            },
          }}
          extraButtons={[]}
        />
      </PageWrapper>
    );
  }
}

export default list;
