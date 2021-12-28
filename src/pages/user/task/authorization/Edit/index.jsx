import React from 'react';
import { connect } from 'dva';
import {
  Button,
  Card,
  Checkbox,
  Tooltip,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Icon,
  Radio,
} from 'antd';
import { formatMessage } from 'umi/locale';
import classnames from 'classnames';
import update from 'immutability-helper';
import moment from 'moment';
import { isNil, sum, isEmpty } from 'ramda';
import { fromQs } from '@/utils/stringUtils';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { FileManagerEnhance, UdcSelect, Selection } from '@/pages/gen/field';
import { closeThenGoto, mountToTab } from '@/layouts/routerControl';
import AsyncSelect from '@/components/common/AsyncSelect';
import createMessage from '@/components/core/AlertMessage';
import SelectWithCols from '@/components/common/SelectWithCols';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import EditableDataTable from '@/components/common/EditableDataTable';
import FieldList from '@/components/layout/FieldList';
import { genFakeId, checkIfNumber, add, div, mul } from '@/utils/mathUtils';
import Loading from '@/components/core/DataLoading';

const DOMAIN = 'authonzation';
const { Field, FieldLine } = FieldList;

// --------------- 需要的数据写在这里,或者由数据文件import进来(*.data.js) -----------------

const SEL_COL = [
  // span为宽度。 合计不要超过24
  { dataIndex: 'code', title: '编号', span: 6 },
  { dataIndex: 'name', title: '名称', span: 14 },
];

const checkResSourceType = rst => rst === 'EXTERNAL_RES';

// 'jobType1,ExpenseBuId,receiverBuId,receiverResId';
const REQUEST_SETTLE = 'jobType1,reasonId,receiverResId';

/**
 * 任务新增/编辑
 */
@connect(({ loading, authonzation, user, global }) => ({
  loading,
  ...authonzation,
  user: user.user,
  global,
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    const { formData, dispatch, form, user } = props;
    if (changedFields && Object.values(changedFields)[0]) {
      const { name, value } = Object.values(changedFields)[0];
      const newFieldData = { [name]: value };
      switch (name) {
        default:
          break;
        // 接收资源 - 数据拆分
        case 'receiverResId':
          Object.assign(newFieldData, {
            receiverResId: value ? value.id : null,
            receiverResName: value ? value.name : null,
            receiverBuId: value ? value.receiverBuId : null,
            receiverBuName: value ? value.receiverBuName : null,
            resSourceType: value ? value.resSourceType : null,
            taskPackageType:
              value && value.resType2 === '5' ? 'REPORT_PACKAGE' : 'CONVENTION_TASK_PACKAGE',
            resType2: value ? value.resType2 : null,
          });
          if (value && checkResSourceType(value.resSourceType)) {
            Object.assign(newFieldData, {
              eqvaRatio: 1,
            });
          }
          break;
        // 事由号带出名称
        case 'reasonId':
          Object.assign(newFieldData, {
            reasonId: value ? value.id : null,
            reasonNo: value ? value.code : null,
            reasonName: value ? value.name : '',
            expenseBuId: value ? value.expenseBuId : null,
            expenseBuName: value ? value.expenseBuName : null,
          });
          break;

        // antD 时间组件返回的是moment对象 转成字符串提交
        case 'distDate':
        case 'planStartDate':
        case 'planEndDate':
          Object.assign(newFieldData, {
            [name]: formatDT(value),
          });
          break;
      }
      // newFieldData.disterResId= user.extInfo.resId;
      // 更新表单
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: newFieldData,
      });
    }
  },
})
@mountToTab()
class AuthonzationEdit extends React.PureComponent {
  state = {
    receiverResId: undefined,
  };

  /**
   * 渲染完成后要做的事情
   */
  componentDidMount() {
    const {
      dispatch,
      // formData: { acceptMethod },
    } = this.props;
    // dispatch({
    //   type: `${DOMAIN}/getPageConfig`,
    //   payload: { pageNo: 'TASK_MANAGER_SAVE' },
    // });
    // 资源列表
    dispatch({
      type: `${DOMAIN}/queryResList`,
    });
    // 项目列表
    dispatch({
      type: `${DOMAIN}/queryProjList`,
    });

    const param = fromQs();
    if (param.id) {
      dispatch({
        type: `${DOMAIN}/queryById`,
        payload: param.id,
      }).then(data => {
        this.handleChangeReasonId({ id: data.reasonId });
        this.setState({ receiverResId: data?.receiverResId });
      });
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        formData: {},
      },
    });
  }
  // --------------- 剩下的私有函数写在这里 -----------------

  handleChangeAcceptMethod = value => {
    const {
      dataList,
      dispatch,
      form: { setFieldsValue },
    } = this.props;
    // 验收方式为任务包时，给第一行赋默认值‘任务包结算特殊活动’
    if (value && value === '01' && !dataList?.filter(item => item.actNo === '0000').length) {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          dataList: [
            {
              id: genFakeId(-1),
              actNo: '0000',
              projActivityId: 0,
              actName: '任务包结算特殊活动',
              milestoneFlag: 1,
              settledEqva: 0,
              eqvaQty: 0,
              finishDesc: null,
              finishDate: null,
              requiredDocList: null,
              actStatus: null,
              planStartDate: moment(Date.now()),
              planEndDate: moment(Date.now()).add(1, 'days'),
            },
          ].concat(dataList),
        },
      });
    }
    // 验收方式不为任务包时，给去除‘任务包结算特殊活动’列
    if (value && value !== '01' && dataList?.map(item => item.actNo === '0000').length) {
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: { dataList: dataList?.filter(item => item.actNo !== '0000') },
      });
    }
    if (value !== '04') {
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { autoSettleFlag: 0 },
      });
      setFieldsValue({ autoSettleFlag: 0 });
    } else {
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: { autoSettleFlag: 1 },
      });
      setFieldsValue({ autoSettleFlag: 1 });
    }
  };

  // 选择事由号
  handleChangeReasonId = value => {
    const { dispatch, form, formData } = this.props;
    const param = fromQs();
    let authId;
    if (param.id) {
      authId = param.id;
    }
    dispatch({
      type: `${DOMAIN}/getReasonInfo`,
      payload: {
        reasonType: '01',
        reasonId: value.id,
        authId,
      },
    }).then(response => {
      form.setFieldsValue({
        budgetEqva: response?.budgetEqva,
        appropriationEqva: response?.appropriationEqva,
        distedEqva: response?.distedEqva,
        authedEqva: `${response?.authedEqva ?? ''}/${response?.authedDistedEqva ?? ''}`,
        availabledEqva: response?.availabledEqva,
      });
      dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: {
          budgetEqva: response?.budgetEqva,
          appropriationEqva: response?.appropriationEqva,
          distedEqva: response?.distedEqva,
          authedEqva: `${response?.authedEqva ?? ''}/${response?.authedDistedEqva ?? ''}`,
          availabledEqva: response?.availabledEqva,
        },
      });
    });

    // form.setFieldsValue({
    //   expenseBuName: value ? value.expenseBuName : null,
    // });
  };

  // 选择接收资源
  handleChangeReceiverResId = value => {
    const { dispatch, formData, form } = this.props;
    form.setFieldsValue({
      resSourceType: value ? value.resSourceType : null,
    });
    // dispatch({
    //   type: `${DOMAIN}/queryTaskSettleByCondition`,
    //   payload: {
    //     jobType1: formData?.jobType1,
    //     expenseBuId: formData?.expenseBuId,
    //     receiverBuId: value ? value.receiverBuId : null,
    //     receiverResId: value ? value.id : null,
    //     settlePriceFlag: formData?.settlePriceFlag,
    //     buSettlePrice: formData?.buSettlePrice,
    //     reasonType: formData?.reasonType,
    //     reasonId: formData?.reasonId,
    //     distDate: formData?.distDate,
    //   },
    // });
  };

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      dispatch,
      dataList = [],
    } = this.props;
    const param = fromQs();
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        // check dataList
        const unLegalRows = dataList.filter(data => isNil(data.actName) || isNil(data.eqvaQty));
        if (!isEmpty(unLegalRows)) {
          createMessage({ type: 'warn', description: '行编辑未通过，请检查输入项。' });
        } else {
          if (param.lodIds) {
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: { projectLogIds: param.lodIds.split(',') },
            });
          }
          const params = fromQs();
          // params 参数与派发的流程
          dispatch({
            type: `${DOMAIN}/save`,
            payload: { submit: false },
          });
        }
      }
    });
  };

  disAuthouzation = (params = {}) => {
    const { dispatch } = this.props;
    const p = {
      ...params,
      submit: true,
    };
    dispatch({
      type: `${DOMAIN}/save`,
      payload: p,
    });
  };
  // --------------- 私有函数区域结束 -----------------

  renderPage = () => {
    const {
      loading,
      dispatch,
      form,
      form: { getFieldDecorator },
      formData,
      resSource,
      resList,
      taskProjSource,
      taskProjList,
      user,
    } = this.props;
    const { subpackId } = fromQs();
    const { receiverResId } = this.state;
    const fromSubpack = (formData && formData?.transferFlag) || !!subpackId;
    const formDatac = formData;
    // formData.createTime = moment(formDatac.createTime).format('YYYY-MM-DD HH:mm:ss');
    const taskFields = [
      <Field
        // 发包人
        name="disterResName"
        key="disterResId"
        label="派发资源"
        decorator={{
          initialValue: formData?.disterResName || (user.extInfo && user.extInfo.resName),
          rules: [
            {
              required: false,
              message: '请输入派发资源',
            },
          ],
        }}
      >
        <Input disabled placeholder="[默认]" />
      </Field>,
      <Field
        name="authorizedNo"
        key="authorizedNo"
        label="编号"
        decorator={{
          initialValue: formData.authorizedNo,
        }}
      >
        <Input disabled placeholder="系统生成" />
      </Field>,
      <Field
        name="name"
        key="name"
        label="授权名称"
        decorator={{
          initialValue: formData.name,
          rules: [
            {
              required: true,
              message: '请输入授权名称',
            },
            {
              max: 50,
              message: '授权名称最大为50字符',
            },
          ],
        }}
      >
        <Input placeholder="请输入授权名称" />
      </Field>,
      <Field
        name="approvedType"
        key="approvedType"
        label="结算负责人"
        decorator={{
          initialValue: formData.approvedType,
          rules: [
            {
              required: true,
              message: '请选择结算负责人',
            },
          ],
        }}
      >
        <Radio.Group>
          <Radio value="PM">项目经理</Radio>
          <Radio value="PL">授权资源</Radio>
        </Radio.Group>
      </Field>,

      <Field
        name="reasonType"
        key="reasonType"
        label="事由类型"
        decorator={{
          initialValue: '01',
          rules: [
            {
              //  required: !!reasonType.requiredFlag,
              message: '请选择事由类型',
            },
          ],
        }}
      >
        <UdcSelect
          code="TSK.TASK_REASON_TYPE"
          placeholder="请选择事由类型"
          onChange={value => {
            form.setFieldsValue({
              reasonId: null,
              expenseBuName: null,
            });
          }}
          disabled
        />
      </Field>,
      <Field
        name="reasonId"
        key="reasonId"
        label="事由号"
        decorator={{
          initialValue: {
            code: formData.reasonId,
            name: formData.reasonName,
          },
          rules: [
            {
              required: true,
              message: '请选择事由号',
            },
          ],
        }}
      >
        <SelectWithCols
          labelKey="name"
          className="x-fill-100"
          placeholder="请选择事由号"
          columns={SEL_COL}
          dataSource={taskProjSource}
          onChange={value => {
            this.handleChangeReasonId(value);
          }}
          selectProps={{
            disabled: fromSubpack,
            showSearch: true,
            onSearch: value => {
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  taskProjSource: taskProjList.filter(
                    d =>
                      d.code.indexOf(value) > -1 ||
                      d.name.toLowerCase().indexOf(value.toLowerCase()) > -1
                  ),
                },
              });
            },
            allowClear: true,
          }}
        />
      </Field>,
      <Field
        name="receiverResId"
        key="receiverResId"
        label="接收资源"
        decorator={{
          initialValue: formData.receiverResId
            ? // warn: 后端其实没有存code，并不需要, 但是这里必须要一个值，所以只要name匹配就可以了。
              { code: formData.receiverResId, name: formData.receiverResName }
            : void 0,
          rules: [
            {
              required: true,
              message: '请输入接收资源',
            },
          ],
        }}
      >
        <SelectWithCols
          labelKey="name"
          className="x-fill-100"
          columns={SEL_COL}
          dataSource={resSource}
          onChange={value => {
            this.handleChangeReceiverResId(value);
          }}
          selectProps={{
            disabled: fromSubpack,
            showSearch: true,
            onSearch: value => {
              dispatch({
                type: `${DOMAIN}/updateState`,
                payload: {
                  resSource: resList?.filter(
                    d =>
                      d.code.indexOf(value) > -1 ||
                      d.name.toLowerCase().indexOf(value.toLowerCase()) > -1
                  ),
                },
              });
            },
            allowClear: true,
          }}
        />
      </Field>,
      // 费用承担BU
      <Field
        name="expenseBuName"
        key="expenseBuName"
        label="费用承担部门"
        decorator={{
          initialValue: formData.expenseBuName, // <UdcSelect code="ACC:REIM_EXP_BY" placeholder="请选择费用承担方" />
          rules: [
            {
              required: false,
              message: '请补充事由的BU信息',
            },
          ],
        }}
      >
        <Input placeholder="选择事由号带出" disabled />
      </Field>,
      <Field
        name="resSourceType"
        key="resSourceType"
        label="合作类型"
        decorator={{
          initialValue: formData.resSourceType,
          rules: [
            {
              required: false,
              message: '请输入合作类型',
            },
          ],
        }}
      >
        <UdcSelect code="RES.RES_TYPE1" placeholder="请输入合作类型" disabled />
      </Field>,

      <FieldLine key="acceptMethod" label="验收方式/计价方式" fieldCol={2} required>
        <Field
          name="acceptMethod"
          decorator={{
            initialValue: formData?.acceptMethod ?? '01',
            rules: [
              {
                required: true,
                message: '请输入验收方式',
              },
            ],
          }}
          wrapperCol={{ span: 24 }}
        >
          <UdcSelect
            code="TSK.ACCEPT_METHOD"
            placeholder="请选择验收方式"
            onChange={value => {
              this.handleChangeAcceptMethod(value);
            }}
            disabled
          />
        </Field>

        <Field
          name="pricingMethod"
          decorator={{
            initialValue: formData?.pricingMethod || '总价',
          }}
          wrapperCol={{ span: 24 }}
        >
          <Input disabled placeholder="[由验收方式带出]" />
        </Field>
      </FieldLine>,
      <Field
        name="authEqva"
        key="authEqva"
        label="授权派发当量"
        decorator={{
          initialValue: formData.authEqva,
          rules: [
            {
              required: true,
              message: '请输入授权派发当量',
            },
          ],
        }}
      >
        <InputNumber max={formData.availabledEqva} min={0} />
      </Field>,
      <Field
        name="authResPlanFlag"
        key="authResPlanFlag"
        label="授权做资源规划"
        decorator={{
          initialValue: formData.authResPlanFlag,
          // rules: [
          //   {
          //     required: true,
          //     message: '请输入授权派发当量',
          //   },
          // ],
        }}
      >
        <Checkbox
          // disabled={formData.reasonType === '01'}
          checked={formData.authResPlanFlag}
          // onChange={this.onCellChanged(index, 'milestoneFlag')}
        />
      </Field>,

      // <Field
      //   name="planStartDate"
      //   key="planStartDate"
      //   label="计划开始时间"
      //   decorator={{
      //     // initialValue: formData.planStartDate ? moment(formData.planStartDate) : null,
      //     rules: [
      //       {
      //         required: false,
      //         message: '请填写计划开始时间',
      //       },
      //       {
      //         validator: (rule, value, callback) => {
      //           if (
      //             value &&
      //             formData?.planEndDate &&
      //             moment(formData?.planEndDate).isBefore(value.format('YYYY-MM-DD'))
      //           ) {
      //             callback('计划开始日期应该早于结束日期');
      //           }
      //           // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
      //           callback();
      //         },
      //       },
      //     ],
      //   }}
      // >
      //   <DatePicker className="x-fill-100" placeholder="计划开始时间" format="YYYY-MM-DD" />
      // </Field>,
      // <Field
      //   name="planEndDate"
      //   key="planEndDate"
      //   label="计划结束时间"
      //   decorator={{
      //     // initialValue: formData.planEndDate ? moment(formData.planEndDate) : null,
      //     rules: [
      //       {
      //         required: false,
      //         message: '请填写计划结束时间',
      //       },
      //       {
      //         validator: (rule, value, callback) => {
      //           if (
      //             value &&
      //             formData?.planStartDate &&
      //             moment(value.format('YYYY-MM-DD')).isBefore(formData?.planStartDate)
      //           ) {
      //             callback('计划结束日期应该晚于开始日期');
      //           }
      //           // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
      //           callback();
      //         },
      //       },
      //     ],
      //   }}
      // >
      //   <DatePicker className="x-fill-100" placeholder="计划结束时间" format="YYYY-MM-DD" />
      // </Field>,
      // <Field name="requirement" label="任务需求附件">
      //   <FileManagerEnhance
      //     api={REQ_REPO}
      //     dataKey={formData?.id}
      //     listType="text"
      //     disabled={false}
      //   />
      // </Field>,
      // <Field name="deliverable" label="提交物模版附件">
      //   <FileManagerEnhance
      //     api={DEL_REPO}
      //     dataKey={formData?.id}
      //     listType="text"
      //     disabled={false}
      //   />
      // </Field>,
      // <Field
      //   name="attachuploadMethod"
      //   key="attachuploadMethod"
      //   label="附件上传方法"
      //   decorator={{
      //     // initialValue: formData.attachuploadMethod,
      //     rules: [
      //       {
      //         required: false,
      //         message: '请填写附件上传方法',
      //       },
      //     ],
      //   }}
      // >
      //   <Input placeholder="完工附件上传方法" />
      // </Field>,
      <Field
        name="remark"
        key="remark"
        label="备注"
        decorator={{
          initialValue: formData?.remark,
          rules: [
            {
              required: false,
              message: '请填写备注',
            },
            {
              max: 200,
              message: '备注最大支持200字符',
            },
          ],
        }}
      >
        <Input.TextArea rows={1} placeholder="请填写备注" />
      </Field>,
      <Field label="" presentational>
        &nbsp;
      </Field>,
      <Field
        name="createUserId"
        key="createUserId"
        label="创建人"
        decorator={{
          initialValue: formData?.createUserName || (user.info && user.info.name),
        }}
      >
        <Input disabled placeholder="[当前用户]" />
      </Field>,
      <Field
        name="createTime"
        key="createTime"
        label="创建时间"
        decorator={{
          initialValue: formData?.createTime || formatDT(Date.now()),
        }}
      >
        <Input disabled placeholder="[系统生成]" />
      </Field>,
    ];
    return (
      <>
        <Card className="tw-card-adjust" bordered={false} title="任务授权编辑">
          <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
            {taskFields}
          </FieldList>
        </Card>
        {receiverResId !== user.extInfo.resId && (
          <Card
            className="tw-card-adjust"
            bordered
            title="项目当量信息"
            // style={{ display: receiverResId === user.extInfo.resId ? 'none' : '' }}
          >
            <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
              <Field
                name="budgetEqva"
                key="budgetEqva"
                label="项目预算当量"
                decorator={{
                  initialValue: formData.budgetEqva,
                }}
              >
                <Input disabled placeholder="事由号带出" />
              </Field>
              <Field
                name="appropriationEqva"
                key="appropriationEqva"
                label="已拨付当量"
                decorator={{
                  initialValue: formData.appropriationEqva,
                }}
              >
                <Input disabled placeholder="事由号带出" />
              </Field>
              <Field
                name="distedEqva"
                key="distedEqva"
                label="已派发任务包当量"
                decorator={{
                  initialValue: formData.distedEqva,
                }}
              >
                <Input disabled placeholder="事由号带出" />
              </Field>
              <Field
                name="authedEqva"
                key="authedEqva"
                label="已授权派发当量"
                decorator={{
                  initialValue: formData.authedEqva,
                }}
              >
                <Input disabled placeholder="事由号带出" />
              </Field>
              <Field
                name="availabledEqva"
                key="availabledEqva"
                label="剩余可用当量"
                decorator={{
                  initialValue: formData.availabledEqva,
                }}
              >
                {/* <Tooltip title="剩余可用当量=已拨付当量-已派发任务包当量-已授权派发当量"> */}
                <Input disabled placeholder="事由号带出" />
                {/* </Tooltip> */}
              </Field>
            </FieldList>
          </Card>
        )}
      </>
    );
  };

  render() {
    const {
      loading,
      dispatch,
      form,
      form: { getFieldDecorator },
      formData,
    } = this.props;
    const disabledBtn =
      loading.effects[`${DOMAIN}/query`] ||
      loading.effects[`${DOMAIN}/queryTaskApply`] ||
      loading.effects[`${DOMAIN}/save`];

    return (
      <PageHeaderWrapper title="任务包信息">
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            icon="save"
            size="large"
            disabled={disabledBtn}
            onClick={this.handleSave}
          >
            {formatMessage({ id: `misc.save`, desc: '保存' })}
          </Button>
          <Button
            className="tw-btn-primary"
            size="large"
            disabled={disabledBtn}
            onClick={() => this.disAuthouzation({})}
          >
            派发
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={disabledBtn}
            onClick={() => {
              const { from } = fromQs();
              from ? closeThenGoto(from) : closeThenGoto(`/user/task/originated`);
            }}
          >
            {formatMessage({ id: `misc.rtn`, desc: '返回' })}
          </Button>
        </Card>
        {!loading.effects[`${DOMAIN}/getPageConfig`] ? this.renderPage() : <Loading />}
      </PageHeaderWrapper>
    );
  }
}

export default AuthonzationEdit;
