import React from 'react';
import moment from 'moment';
import { connect } from 'dva';
import { equals, clone, type, isEmpty } from 'ramda';
import { Modal, Form, Table } from 'antd';
import BusinessForm from '@/components/production/business/BusinessForm';
import FormItem from '@/components/production/business/FormItem';
import BusinessFormTitle from '@/components/production/business/BusinessFormTitle.tsx';
import EditTable from '@/components/production/business/EditTable';
import { scheduleStatusOverallRq } from '@/services/workbench/project';

const DOMAIN = 'communicationModal';

@connect(({ user: { user }, loading, dispatch, communicationModal, projectMgmtListEdit }) => ({
  loading,
  dispatch,
  ...communicationModal,
  user,
  projectMgmtListEdit,
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
class UpdateScheduleStatus extends React.Component {
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
      scheduleIdList,
      projectMgmtListEdit: {
        formData: { scheduleList },
      },
    } = this.props;
    validateFieldsAndScroll(async (error, values) => {
      if (!error) {
        // console.log(values)
        const { statusColumn, status } = values;
        let key = '';
        if (statusColumn === 'CUS_STATUS') {
          key = 'cusStatus';
        } else if (statusColumn === 'PUR_STATUS') {
          key = 'purStatus';
        } else {
          key = 'innStatus';
        }
        // const { response } = await scheduleStatusOverallRq({ ...values, idList: scheduleIdList });
        // if (response.ok) {
        //   onOk(true);
        //   this.clearState();
        // }
        // console.log(scheduleIdList)
        const newScheduleList = scheduleList;
        scheduleIdList.forEach(i => {
          const ind = newScheduleList.findIndex(j => j.id === i);
          newScheduleList[ind][key] = status;
        });
        dispatch({
          type: `projectMgmtListEdit/updateForm`,
          payload: {
            scheduleList: newScheduleList,
          },
        });
        onOk(true);
        this.clearState();
      }
    });
  };

  // 配置所需要的内容
  renderPage = () => {
    const { formData, formMode, form, permissionCode, mode } = this.props;
    const statusType = [
      (permissionCode.indexOf('CUS_STATUS_BATCH') !== -1 || mode === 'ADD') && {
        id: 'CUS_STATUS',
        title: '客户报价',
        value: 'CUS_STATUS',
      },
      permissionCode.indexOf('PUR_STATUS_BATCH') !== -1 && {
        id: 'PUR_STATUS',
        title: '采购报价',
        value: 'PUR_STATUS',
      },
      permissionCode.indexOf('INN_STATUS_BATCH') !== -1 && {
        id: 'INN_STATUS',
        title: '内部报价',
        value: 'INN_STATUS',
      },
    ].filter(Boolean);
    const fields = [
      <FormItem
        label="状态类型"
        fieldType="BaseSelect"
        key="statusColumn"
        fieldKey="statusColumn"
        descList={statusType}
      />,

      <FormItem
        label="调整状态"
        fieldType="BaseSelect"
        key="status"
        fieldKey="status"
        parentKey="PRO:SCHEDULE_STATUS"
      />,
    ];

    return (
      <BusinessForm
        formData={formData}
        form={form}
        formMode={formMode}
        defaultColumnStyle={24}
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
        title="批量更新状态"
        visible={visible}
        onOk={this.handleSave}
        onCancel={this.onToggle}
        width={500}
        afterClose={() => this.clearState()}
      >
        {this.renderPage()}
      </Modal>
    );
  }
}

export default UpdateScheduleStatus;
