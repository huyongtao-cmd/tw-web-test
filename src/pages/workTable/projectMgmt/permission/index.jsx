import React from 'react';
import { connect } from 'dva';
import update from 'immutability-helper';
import { isEmpty } from 'ramda';
import { Form, Checkbox } from 'antd';
import FormItem from '@/components/production/business/FormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import EditTable from '@/components/production/business/EditTable';
import ButtonCard from '@/components/production/layout/ButtonCard';
import Button from '@/components/production/basic/Button';
import { projectPermissionSelectRq } from '@/services/workbench/project';
import confirm from '@/components/production/layout/Confirm';

const DOMAIN = 'projectPermission';

@connect(({ loading, dispatch, projectPermission }) => ({
  loading,
  dispatch,
  ...projectPermission,
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
      type: `${DOMAIN}/updateFormForEditTable`,
      payload: newFieldData,
    });
  },
})
class ProjectPermission extends React.Component {
  componentDidMount() {
    this.getProjectPermissionList();
  }

  callModelEffects = (method, params) => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/${method}`,
      payload: params,
    });
  };

  /**
   * 修改model层state
   * 这个方法是仅是封装一个小方法,后续修改model的state时不需要每次都解构dispatch
   * @param params state参数
   */
  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  getProjectPermissionList = async params => {
    const { response } = await projectPermissionSelectRq();
    if (response.ok) {
      const {
        data: { connectList, permissionColumn, roleColumn },
      } = response;
      this.updateModelState({ connectList, permissionColumn, roleColumn });
    }
  };

  checkBoxChange = e => {
    const { dispatch, connectList } = this.props;
    // const newConnectList = this.props.connectList
    const {
      target: { roleColumnId, permissionId },
    } = e;
    const index = connectList.findIndex(
      item => item.projectRoleId === roleColumnId && item.projectPermissionId === permissionId
    );
    if (index !== -1) {
      // newConnectList.splice(index,1)
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          connectList: update(connectList, {
            $splice: [[index, 1]],
          }),
        },
      });
    } else {
      // newConnectList.push({projectRoleId:roleColumnId,projectPermissionId:permissionId})
      dispatch({
        type: `${DOMAIN}/updateState`,
        payload: {
          connectList: update(connectList, {
            $push: [
              {
                projectRoleId: roleColumnId,
                projectPermissionId: permissionId,
              },
            ],
          }),
        },
      });
    }
  };

  fetctData = () => {
    const { connectList } = this.props; //projectRoleId -row    projectPermissionId  -col
    const dataList = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
    if (connectList && connectList.length > 0) {
      for (let i = 0; i < connectList.length; i += 1) {
        const index = connectList[i].projectRoleId - 1;
        const key = connectList[i].projectPermissionId + '';
        dataList[index][key] = 1;
      }
    }
    return dataList;
  };

  wrapColumns = () => {
    const { permissionColumn } = this.props;
    let columns = [];
    const column = {
      title: '字段',
      children: [],
    };
    const columnBtn = {
      title: '按钮',
      children: [],
    };
    const columnTab = {
      title: 'TAB页面',
      children: [],
    };
    if (permissionColumn && permissionColumn.length) {
      for (let i = 0; i < permissionColumn.length; i += 1) {
        const obj = {};
        obj.title = permissionColumn[i].permissionName;
        obj.dataIndex = permissionColumn[i].id + '';
        obj.width = 75;
        obj.align = 'center';
        obj.render = (value, row, index) => (
          <Checkbox
            checked={value === 1}
            onChange={this.checkBoxChange}
            roleColumnId={index + 1}
            permissionId={permissionColumn[i].id}
          />
        );
        if (permissionColumn[i].type === 'COLUMN') {
          column.children.push(obj);
        } else if (permissionColumn[i].type === 'BUTTON') {
          columnBtn.children.push(obj);
        } else if (permissionColumn[i].type === 'TAB') {
          columnTab.children.push(obj);
        }
      }
      columns = [column, columnBtn, columnTab];
    }
    return columns;
  };

  render() {
    const { form, permissionList, roleColumn } = this.props;
    const { loading } = this.props;
    const columns = [
      {
        title: '',
        dataIndex: 'fake',
        render: (value, row, index) => (
          <span style={{ fontWeight: 'bold' }}>
            {roleColumn && roleColumn.length && roleColumn[index].roleName}
          </span>
        ),
      },
    ];
    columns.push(...this.wrapColumns());
    return (
      <PageWrapper>
        <ButtonCard>
          <Button
            icon="save"
            size="large"
            type="primary"
            onClick={() => {
              confirm({
                content: '权限修改功能暂未开放',
                okType: 'primary',
              });
            }}
            // disabled={disabledBtn}
          >
            保存
          </Button>
        </ButtonCard>
        <EditTable
          form={form}
          scroll={{ x: 1175 }}
          selectType={null}
          dataSource={this.fetctData()} // 获取数据的方法,请注意获取数据的格式
          columns={columns}
        />
      </PageWrapper>
    );
  }
}

export default ProjectPermission;
