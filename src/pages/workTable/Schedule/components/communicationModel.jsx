import React from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { equals, clone, type, isEmpty } from 'ramda';
import { Modal, Form, Table } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import EditTable from '@/components/production/business/EditTable';
import {
  mediaResourcePagingRq,
  mediaResourceDetailRq,
} from '@/services/production/mrm/mediaResource';

const DOMAIN = 'communicationModal';

@connect(({ user: { user }, loading, dispatch, communicationModal, projectMgmtListEdit }) => ({
  loading,
  dispatch,
  ...communicationModal,
  projectMgmtListEdit,
  user,
}))
@Form.create({
  mapPropsToFields(props) {
    const { formData } = props;
    const fields = {};
    Object.keys(formData).forEach(key => {
      const tempValue = formData[key];
      if (Array.isArray(tempValue)) {
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
      type: `${DOMAIN}/updateForm`,
      payload: newFieldData,
    });
  },
})
class CommunicationModel extends React.Component {
  constructor(props) {
    super(props);
    const { visible } = props;

    this.state = {
      visible,
    };
  }

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {
    // 控制visible
    const { visible: nextVisible } = nextProps;
    const { visible } = this.state;
    if (!equals(visible, nextVisible)) {
      this.setState({
        visible: nextVisible,
      });
    }
  }

  clearState = () => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/cleanState`,
    });
  };

  handleSave = () => {
    const {
      dispatch,
      form: { validateFieldsAndScroll },
      onOk,
      formData,
      scheduleIdList,
      projectMgmtListEdit: {
        formData: { scheduleList },
        id,
      },
      submit,
      scheduleId,
      projectId,
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      if (!error) {
        // const params = [];
        const newScheduleList = scheduleList;
        const { type: newType, pointResId } = values;
        if (!submit) {
          scheduleIdList.forEach(i => {
            const obj = {
              ...values,
              ...formData,
              projectId: id,
              isPoint: pointResId ? 1 : 0,
            };
            i > 0 && (obj.scheduleId = i);
            const ind = newScheduleList.findIndex(j => j.id === i);
            const { pointList: newPointList = [] } = newScheduleList[ind];
            if (!newPointList.length) {
              newPointList.push(obj);
            } else {
              const ii = newPointList.findIndex(k => k.type === newType);
              newPointList.splice(ii, 1, obj);
            }
            newScheduleList[ind].pointList = newPointList;
            pointResId &&
              (newType === 'PURCHASE'
                ? (newScheduleList[ind].purchasePointResId = pointResId)
                : (newScheduleList[ind].salesPointResId = pointResId));
          });
          dispatch({
            type: `projectMgmtListEdit/updateForm`,
            payload: { scheduleList: newScheduleList },
          });
          this.clearState();
          onOk(true);
        } else {
          const obj = {
            ...values,
            ...formData,
            projectId,
            isPoint: pointResId ? 1 : 0,
            scheduleId,
          };
          pointResId &&
            (newType === 'PURCHASE'
              ? (obj.purchasePointResId = pointResId)
              : (obj.salesPointResId = pointResId));
          dispatch({
            type: `${DOMAIN}/scheduleCommSave`,
            payload: { ...obj },
          }).then(res => {
            this.clearState();
            onOk(true);
          });
        }
      }
    });
  };

  // 配置所需要的内容
  renderPage = () => {
    const {
      formData,
      formMode,
      form,
      projectMgmtListEdit: { projectRoleOptions },
      commType,
    } = this.props;
    const talkType = commType === 'PUR' ? 'PURCHASE' : 'SALE';
    const fields = [
      <BusinessFormTitle title="资源信息" />,
      <FormItem
        label="沟通类型"
        fieldType="BaseSelect"
        key="type"
        fieldKey="type"
        parentKey="PRO:TALK_TYPE"
        initialValue={talkType}
        disabled
      />,
      <FormItem
        label="附件"
        key="attachmentIds"
        fieldKey="attachmentIds"
        fieldType="FileUpload"
        fileList={formData.attachments}
        maxFileSize={2}
        accept="*"
        multiple
      />,
      <FormItem
        label="指派给"
        key="pointResId"
        fieldKey="pointResId"
        fieldType="ResSimpleSelect"
      />,
      <FormItem
        label="角色"
        fieldType="BaseSelect"
        descList={projectRoleOptions}
        key="pointRoleIdList"
        fieldKey="pointRoleIdList"
        mode="multiple"
      />,
      <FormItem
        label="抄送给"
        key="ccResIdList"
        fieldKey="ccResIdList"
        fieldType="ResSimpleSelect"
        mode="multiple"
      />,
      // <FormItem
      //   fieldType="BaseFileManagerEnhance"
      //   label="附件"
      //   key="enclosure"
      //   fieldKey="enclosure"
      //   api="/county/pro/project/sfs/token"
      //   listType="text"
      //   attach
      // />,
      <FormItem label="备注" key="remark" fieldKey="remark" fieldType="BaseInputTextArea" />,
    ];

    return (
      <BusinessForm
        formData={formData}
        form={form}
        formMode={formMode}
        defaultColumnStyle={12}
        renderTitleFlag={false}
      >
        {fields}
      </BusinessForm>
    );
  };

  // 点击取消按钮
  onToggle = e => {
    const { onCancel } = this.props;
    type(onCancel) === 'Function' && onCancel();
    this.clearState();
  };

  render() {
    const { visible } = this.state;
    return (
      <Modal
        destroyOnClose
        title="沟通记录"
        visible={visible}
        onOk={this.handleSave}
        onCancel={this.onToggle}
        width={1000}
        afterClose={() => this.clearState()}
      >
        {this.renderPage()}
      </Modal>
    );
  }
}

export default CommunicationModel;
