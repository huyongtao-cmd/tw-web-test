import React from 'react';
import moment from 'moment';
import { connect } from 'dva';
import router from 'umi/router';
import { equals, clone, type, isEmpty } from 'ramda';
import { Modal, Form, Table, Card } from 'antd';
import PageWrapper from '@/components/production/layout/PageWrapper';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import EditTable from '@/components/production/business/EditTable';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';
import FileUpload from '@/components/common/FileUpload/index.tsx';
import { fromQs } from '@/utils/production/stringUtil';
import { closeThenGoto } from '@/layouts/routerControl';
import {
  mediaResourcePagingRq,
  mediaResourceDetailRq,
} from '@/services/production/mrm/mediaResource';
import { roleSelectRq, projectPermissionRq } from '@/services/workbench/project';
import CommunicationModel from '@/pages/workTable/Schedule/components/communicationModel';

const DOMAIN = 'scheduleMoadl';

@connect(({ user: { user }, loading, dispatch, scheduleMoadl }) => ({
  loading,
  dispatch,
  ...scheduleMoadl,
  user,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      if (Array.isArray(tempValue) && key.includes('putList')) {
        tempValue.forEach((temp, index) => {
          Object.keys(temp).forEach(detailKey => {
            fields[`${key}[${index}].${detailKey}`] = Form.createFormField({
              value: temp[detailKey],
            });
          });
        });
      } else {
        fields[key] = Form.createFormField({ value: tempValue });
      }
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
      type: `${DOMAIN}/updateFormForEditTable`,
      payload: newFieldData,
    });
  },
})
class AddModel extends React.Component {
  state = {
    operationkey: 'tab1',
    roleList: [],
    comVisible: false,
    commType: '',
    submit: true,
  };

  componentDidMount() {
    const { mode, scheduleId, from, projectId } = fromQs();
    const formMode =
      mode === 'edit' || mode === 'ADD' || mode === 'EDIT' || !mode ? 'EDIT' : 'DESCRIPTION';
    this.updateModelState({ formMode, id: scheduleId, mode, projectId });
    scheduleId && projectId && this.getprojectPermission(projectId);
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/queryDetail`,
      payload: {
        id: scheduleId,
        projectId,
      },
    }).then(res => {
      const { startDate, endDate, putList } = res;
      if (Array.isArray(putList) && !putList.length) {
        this.putListHandle(startDate, endDate);
      }
    });
    // this.callModelEffects('queryDetail',{id:scheduleId,projectId}).then(res=>console.log(res))
    // const {formData} = this.props
    // console.log(formData)
    // const {
    //   projectMgmtListEdit: {
    //     formData: { scheduleList },
    //   },
    // } = this.props;
    // let formList = []
    // if(from !== 'HOME'){
    //   const scheduleIndex = scheduleList.findIndex(item => item.id === Number(scheduleId));
    //   this.updateModelState({ scheduleIndex });
    //   const list = scheduleList[scheduleIndex];
    //   formList = {
    //     ...list,
    //     date: list.startDate && list.endDate && [list.startDate, list.endDate],
    //   };
    //   const { putList } = formList;
    //   if (Array.isArray(putList) && putList.length > 0) {
    //     const obj1 = { value0: '??????' };
    //     const obj2 = { value0: '??????' };
    //     const obj3 = { value0: '??????' };
    //     let arr = [];
    //     const columnList = [''];
    //     if (putList.length) {
    //       putList.forEach((item, index) => {
    //         obj1['value' + (index + 1)] = item.putDate;
    //         obj2['value' + (index + 1)] = item.putNumber;
    //         obj3['value' + (index + 1)] = item.remark;
    //       });
    //       arr = [obj1, obj2, obj3];
    //       Object.keys(obj1).forEach(item => {
    //         columnList.push(obj1[item].slice(0, 7));
    //       });
    //       columnList.splice(0, 1);
    //     }
    //     formList.putList = arr;
    //     formList.columnList = columnList;
    //     this.callModelEffects('updateForm', formList);
    //   } else {
    //     this.callModelEffects('updateForm', formList);
    //     formList.startDate &&
    //       formList.endDate &&
    //       this.putListHandle(formList.startDate, formList.endDate);
    //   }
    // }else{
    //   this.callModelEffects('queryDetail',{id:scheduleId,projectId})
    // }

    // id && this.callModelEffects('queryDetail', { id });
    // this.getMediaResource();
    // this.getRoleLost();
  }

  componentWillUnmount() {
    this.clearState();
  }

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  /**
   * ??????model???state
   * ??????????????????????????????????????????,????????????model???state???????????????????????????dispatch
   * @param params state??????
   */
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  clearState = () => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/cleanState`,
    });
  };

  getRoleLost = async params => {
    //??????????????????
    const {
      response: { data },
    } = await roleSelectRq(params);
    const list = data.rows.map(item => ({
      ...item,
      id: item.code,
      title: item.name,
      value: item.code,
    }));
    this.setState({
      roleList: list,
    });
  };

  getMediaResource = async params => {
    //??????????????????
    const {
      response: {
        data: { rows },
      },
    } = await mediaResourcePagingRq({ limit: 0 });
    const MediaResourceList = rows.map(item => ({
      ...item,
      title: item.resourceName,
      value: item.id,
    }));
    this.updateModelState({ MediaResourceList });
  };

  getSupplierDetail = async params => {
    //???????????????
    const { dispatch } = this.props;
    const {
      response: {
        data: { priceDetails },
      },
    } = await mediaResourceDetailRq({ key: params });
    const supplierList = priceDetails.map(item => ({
      ...item,
      title: item.supplierNoDesc,
      value: item.id,
    }));
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: {
        supplierList,
      },
    });
  };

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      formData,
      dispatch,
      // projectMgmtListEdit: {
      //   formData: { scheduleList },
      //   href,
      // },
      // scheduleIndex,
    } = this.props;
    // const { mode,  } = fromQs();
    const { putList } = formData;
    //????????????????????????  start
    const newPutList = [];
    if (putList.length) {
      Object.keys(putList[0]).forEach(item => {
        const obj = {
          putDate: putList[0][item],
          putNumber: putList[1][item],
          remark: putList[2][item],
        };
        newPutList.push(obj);
      });
      newPutList.splice(0, 1);
    }
    //????????????????????????  end
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        // console.log(newPutList)
        dispatch({
          type: `${DOMAIN}/scheduleSave`,
          payload: {
            ...formData,
            putList: newPutList,
          },
        });

        // const list = scheduleList;
        // list[scheduleIndex].putList = newPutList;
        // console.log(list)
        // dispatch({
        //   type: `projectMgmtListEdit/updateForm`,
        //   payload: {
        //     scheduleList: list,
        //   },
        // });
        // closeThenGoto(href);
      }
    });
  };

  onOperationTabChange = key => {
    this.setState({ operationkey: key });
  };

  handleOK = flag => {
    if (flag) {
      const { dispatch } = this.props;
      this.setState({ comVisible: false });
      const { scheduleId, projectId } = fromQs();
      dispatch({
        type: `${DOMAIN}/queryDetail`,
        payload: {
          id: scheduleId,
          projectId,
        },
      }).then(res => {
        const { startDate, endDate, putList } = res;
        if (Array.isArray(putList) && !putList.length) {
          this.putListHandle(startDate, endDate);
        }
      });
    }
  };

  putListHandle = (startDate, endDate) => {
    const { dispatch } = this.props;
    const daysDiff = moment(endDate).diff(moment(startDate), 'days');
    const daysArr = [];
    // ????????????????????????????????????????????????????????????
    for (let i = 0; i <= daysDiff; i += 1) {
      const vdate = moment(startDate)
        .add(i, 'days')
        .format('YYYY-MM-DD');
      const vmonth = moment(startDate)
        .add(i, 'days')
        .format('YYYY-MM');
      daysArr.push({
        keyId: i,
        vdate,
        vmonth,
      });
    }
    const dateList = { value0: '??????' };
    const numList = { value0: '??????' };
    const remarkList = { value0: '??????' };
    const columnList = [''];
    daysArr.forEach((item, index) => {
      const title = 'value' + (index + 1);
      columnList.push(item.vmonth);
      dateList[title] = item.vdate;
      numList[title] = '';
      remarkList[title] = '';
    });
    const arr = [dateList, numList, remarkList];
    dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: {
        putList: arr,
        columnList,
      },
    });
  };

  getprojectPermission = async params => {
    //??????????????????????????????
    // const { projectId } = params;
    const {
      response: {
        data: { permissionCode },
        ok,
      },
    } = await projectPermissionRq({ projectId: params });
    if (ok) {
      this.updateModelState({ permissionCode });
    }
  };

  showCommModal = async params => {
    this.setState({
      commType: params,
      comVisible: true,
      submit: true,
    });
  };

  // ????????????????????????
  renderPage = () => {
    const {
      dispatch,
      form,
      MediaResourceList,
      formData,
      formMode,
      supplierList,
      id,
      mode,
      permissionCode,
      // remarkFlag,
    } = this.props;
    const {
      putNumber,
      cusNetPrice,
      purNetPrice,
      innNetPrice,
      cusPublishedPrice,
      cusDiscount,
      purPublishedPrice,
      purDiscount,
      innPublishedPrice,
      innDiscount,
      priceDiffer,
      grossProfit,
    } = formData;
    const fields = [
      <BusinessFormTitle title="????????????" />,
      <FormItem
        fieldType="BaseSelect"
        label="??????"
        key="resourceName"
        fieldKey="resourceName"
        descList={MediaResourceList}
        initialValue={formData.resourceIdDesc}
        disabled
      />,
      <FormItem
        fieldType="BaseSelect"
        label="?????????"
        key="supNo"
        fieldKey="supNo"
        descList={supplierList}
        initialValue={formData.supAbNoDesc}
        disabled
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="resourceType"
        fieldKey="resourceType"
        initialValue={formData.resourceType}
        disabled
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="resourceLocation"
        fieldKey="resourceLocation"
        initialValue={formData.location}
        disabled
      />,
      <FormItem
        fieldType="BaseSelect"
        parentKey="PRO:PUT_UNIT"
        label="????????????"
        key="putUnit"
        fieldKey="putUnit"
        disabled
        initialValue={formData.putUnit}
      />,
      <FormItem
        fieldType="BaseInputNumber"
        label="????????????"
        key="putNumber"
        fieldKey="putNumber"
        disabled
        initialValue={formData.putNumber}
        onBlur={() => {
          dispatch({
            type: `${DOMAIN}/updateForm`,
            payload: {
              cusTotalNetPrice: putNumber && cusNetPrice && putNumber * cusNetPrice,
              purTotalNetPrice: putNumber && purNetPrice && putNumber * purNetPrice,
              innTotalNetPrice: putNumber && innNetPrice && putNumber * innNetPrice,
              grossProfit:
                cusPublishedPrice &&
                cusDiscount &&
                purPublishedPrice &&
                purDiscount &&
                putNumber &&
                (cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount) * putNumber,
            },
          });
        }}
      />,
      <FormItem
        fieldType="BaseDateRangePicker"
        label="???????????? "
        key="date"
        disabled
        fieldKey="date"
        initialValue={formData.date}
        onChange={(dates, dateStrings) => {
          this.putListHandle(dates[0], dates[1]);
        }}
      />,
      permissionCode.indexOf('TOP_PRICE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="??????"
          key="priceDiffer"
          fieldKey="priceDiffer"
          disabled
          initialValue={formData.priceDiffer}
        />
      ),
      permissionCode.indexOf('TOP_PRICE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="??????"
          key="grossProfit"
          fieldKey="grossProfit"
          disabled
          initialValue={formData.grossProfit}
        />
      ),
      <FormItem
        label="??????"
        key="remark"
        fieldKey="remark"
        fieldType="BaseInputTextArea"
        disabled
        // required={remarkFlag}
      />,
      <BusinessFormTitle title="??????????????????" />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="saleMethodDesc"
        fieldKey="saleMethodDesc"
        initialValue={formData.saleMethodDesc}
        disabled
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="saleUnitDesc"
        fieldKey="saleUnitDesc"
        initialValue={formData.saleUnitDesc}
        disabled
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="effectivePeriod"
        fieldKey="effectivePeriod"
        initialValue={formData.effectivePeriod}
        disabled
      />,
      <FormItem
        fieldType="BaseInput"
        label="????????????"
        key="agentMethodDesc"
        fieldKey="agentMethodDesc"
        initialValue={formData.agentMethodDesc}
        disabled
      />,
      (permissionCode.indexOf('CUS_QUOTE') !== -1 || mode === 'ADD') && (
        <BusinessFormTitle title="????????????" />
      ),
      (permissionCode.indexOf('CUS_QUOTE') !== -1 || mode === 'ADD') && (
        <FormItem
          fieldType="BaseInputAmt"
          label="?????????"
          key="cusPublishedPrice"
          fieldKey="cusPublishedPrice"
          initialValue={formData.cusPublishedPrice}
          disabled
          onBlur={() => {
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                cusNetPrice: cusPublishedPrice && cusDiscount && cusPublishedPrice * cusDiscount,
                cusTotalNetPrice:
                  putNumber &&
                  cusPublishedPrice &&
                  cusDiscount &&
                  putNumber * cusPublishedPrice * cusDiscount,
                priceDiffer:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount,
                grossProfit:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  putNumber &&
                  (cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount) * putNumber,
              },
            });
          }}
        />
      ),
      (permissionCode.indexOf('CUS_QUOTE') !== -1 || mode === 'ADD') && (
        <FormItem
          fieldType="BaseInputNumber"
          label="??????"
          key="cusDiscount"
          fieldKey="cusDiscount"
          disabled
          initialValue={formData.cusDiscount}
          onBlur={() => {
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                cusNetPrice: cusPublishedPrice && cusDiscount && cusPublishedPrice * cusDiscount,
                cusTotalNetPrice:
                  putNumber &&
                  cusPublishedPrice &&
                  cusDiscount &&
                  putNumber * cusPublishedPrice * cusDiscount,
                priceDiffer:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount,
                grossProfit:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  putNumber &&
                  (cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount) * putNumber,
              },
            });
          }}
        />
      ),
      (permissionCode.indexOf('CUS_QUOTE') !== -1 || mode === 'ADD') && (
        <FormItem
          fieldType="BaseInputAmt"
          label="??????"
          key="cusNetPrice"
          fieldKey="cusNetPrice"
          disabled
          initialValue={formData.cusNetPrice}
        />
      ),
      (permissionCode.indexOf('CUS_QUOTE') !== -1 || mode === 'ADD') && (
        <FormItem
          fieldType="BaseInputAmt"
          label="?????????"
          key="cusTotalNetPrice"
          fieldKey="cusTotalNetPrice"
          disabled
          initialValue={formData.cusTotalNetPrice}
        />
      ),
      permissionCode.indexOf('INN_QUOTE') !== -1 && <BusinessFormTitle title="????????????" />,
      permissionCode.indexOf('INN_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="?????????"
          key="innPublishedPrice"
          fieldKey="innPublishedPrice"
          initialValue={formData.innPublishedPrice}
          disabled
          onBlur={() => {
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                innNetPrice: innPublishedPrice && innDiscount && innPublishedPrice * innDiscount,
                innTotalNetPrice:
                  putNumber &&
                  innPublishedPrice &&
                  innDiscount &&
                  putNumber * innPublishedPrice * innDiscount,
              },
            });
          }}
        />
      ),
      permissionCode.indexOf('INN_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputNumber"
          label="??????"
          key="innDiscount"
          fieldKey="innDiscount"
          initialValue={formData.innDiscount}
          disabled
          onBlur={() => {
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                innNetPrice: innPublishedPrice && innDiscount && innPublishedPrice * innDiscount,
                innTotalNetPrice:
                  putNumber &&
                  innPublishedPrice &&
                  innDiscount &&
                  putNumber * innPublishedPrice * innDiscount,
              },
            });
          }}
        />
      ),
      permissionCode.indexOf('INN_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="??????"
          key="innNetPrice"
          fieldKey="innNetPrice"
          disabled
          initialValue={formData.innNetPrice}
        />
      ),
      permissionCode.indexOf('INN_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="?????????"
          key="innTotalNetPrice"
          fieldKey="innTotalNetPrice"
          disabled
          initialValue={formData.innTotalNetPrice}
        />
      ),
      permissionCode.indexOf('PUR_QUOTE') !== -1 && <BusinessFormTitle title="????????????" />,
      permissionCode.indexOf('PUR_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="?????????"
          key="purPublishedPrice"
          fieldKey="purPublishedPrice"
          initialValue={formData.purPublishedPrice}
          disabled
          onBlur={() => {
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                purNetPrice: purPublishedPrice && purDiscount && purPublishedPrice * purDiscount,
                purTotalNetPrice:
                  putNumber &&
                  purPublishedPrice &&
                  purDiscount &&
                  putNumber * purPublishedPrice * purDiscount,
                priceDiffer:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount,
                grossProfit:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  putNumber &&
                  (cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount) * putNumber,
              },
            });
          }}
        />
      ),
      permissionCode.indexOf('PUR_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputNumber"
          label="??????"
          key="purDiscount"
          fieldKey="purDiscount"
          initialValue={formData.purDiscount}
          disabled
          onBlur={() => {
            dispatch({
              type: `${DOMAIN}/updateForm`,
              payload: {
                purNetPrice: purPublishedPrice && purDiscount && purPublishedPrice * purDiscount,
                purTotalNetPrice:
                  putNumber &&
                  purPublishedPrice &&
                  purDiscount &&
                  putNumber * purPublishedPrice * purDiscount,
                priceDiffer:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount,
                grossProfit:
                  cusPublishedPrice &&
                  cusDiscount &&
                  purPublishedPrice &&
                  purDiscount &&
                  putNumber &&
                  (cusPublishedPrice * cusDiscount - purPublishedPrice * purDiscount) * putNumber,
              },
            });
          }}
        />
      ),
      permissionCode.indexOf('PUR_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="??????"
          key="purNetPrice"
          fieldKey="purNetPrice"
          disabled
          initialValue={formData.purNetPrice}
        />
      ),
      permissionCode.indexOf('PUR_QUOTE') !== -1 && (
        <FormItem
          fieldType="BaseInputAmt"
          label="?????????"
          key="purTotalNetPrice"
          fieldKey="purTotalNetPrice"
          disabled
          initialValue={formData.purTotalNetPrice}
        />
      ),
    ].filter(Boolean);
    return (
      <div>
        <BusinessForm
          formData={formData}
          form={form}
          formMode={formMode}
          defaultColumnStyle={12}
          renderTitleFlag={false}
        >
          {fields}
        </BusinessForm>
      </div>
    );
  };

  render() {
    const { operationkey, roleList, comVisible, commType, submit } = this.state;
    const {
      loading,
      dispatch,
      form,
      formData: { putList, columnList, logList },
      formMode,
      id,
      mode,
      projectId,
      permissionCode,
    } = this.props;
    const operationTabList = [
      permissionCode.indexOf('SALE_LOG') !== -1 && {
        key: 'tab1',
        tab: '??????????????????',
      },
      permissionCode.indexOf('PURCHASE_LOG') !== -1 && {
        key: 'tab2',
        tab: '??????????????????',
      },
    ].filter(Boolean);
    const queryDetail = loading.effects[`${DOMAIN}/queryDetail`];
    const disabledBtn = loading.effects[`${DOMAIN}/scheduleSave`];
    const listFlag = true;
    const contentList = {
      tab1: (
        <>
          <Button
            icon="save"
            size="large"
            type="primary"
            onClick={() => this.showCommModal('SALE')}
            disabled={disabledBtn}
          >
            ????????????
          </Button>
          {logList &&
            logList.filter(item => item.type === 'COMMON' || item.type === 'SALE').map(
              (item, index) => (
                // if(item.type==='COMMON' || item.type==='SALES'){return
                <p>
                  {index + 1}.{item.createTimeDesc}???{item.describes}
                  {item.attachments !== null &&
                    item.attachments.length > 0 && (
                      <FileUpload preview listFlag={listFlag} fileList={item.attachments} />
                    )}
                </p>
              )
              // }
            )}
        </>
      ),
      tab2: (
        <>
          <Button
            icon="save"
            size="large"
            type="primary"
            onClick={() => this.showCommModal('PUR')}
            disabled={disabledBtn}
          >
            ????????????
          </Button>
          {logList &&
            logList.filter(item => item.type === 'COMMON' || item.type === 'PURCHASE').map(
              (item, index) => (
                // if(item.type==='COMMON' || item.type==='PUTCHASE'){return
                <p>
                  {index + 1}.{item.createTimeDesc}???{item.describes}
                  {item.attachments !== null &&
                    item.attachments.length > 0 && (
                      <FileUpload preview listFlag={listFlag} fileList={item.attachments} />
                    )}
                </p>
              )
              // }
            )}
        </>
      ),
    };
    return (
      <PageWrapper loading={queryDetail}>
        {(mode === 'EDIT' || mode === 'ADD') && (
          <ButtonCard>
            <Button
              icon="save"
              size="large"
              type="primary"
              onClick={this.handleSave}
              disabled={disabledBtn}
            >
              ??????
            </Button>
          </ButtonCard>
        )}
        {this.renderPage()}
        <EditTable
          form={form}
          title="????????????"
          scroll={{ x: 900 }}
          selectType={null}
          dataSource={putList} // ?????????????????????,??????????????????????????????
          columns={columnList.map((item, index) => ({
            title: !index ? '' : `${item}`,
            width: '100px',
            dataIndex: `value${index}`,
            render: (val, row, i) => {
              if (i === 0 || index === 0) {
                return val;
              }
              return (
                <FormItem
                  form={form}
                  fieldType="BaseInput"
                  fieldKey={`putList[${i}].value${index}`}
                  // disabled={id}
                />
              );
            },
          }))}
        />
        {mode !== 'ADD' && (
          <Card
            className="tw-card-multiTab"
            bordered={false}
            tabList={operationTabList}
            onTabChange={this.onOperationTabChange}
          >
            {contentList[operationkey]}
          </Card>
        )}
        <CommunicationModel //??????modal
          visible={comVisible}
          onOk={this.handleOK}
          onCancel={() => this.setState({ comVisible: false })}
          roleList={roleList}
          scheduleId={id}
          commType={commType}
          submit={submit}
          projectId={projectId}
        />
      </PageWrapper>
    );
  }
}

export default AddModel;
