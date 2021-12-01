import React from 'react';
import { connect } from 'dva';
import { equals, clone, type, isEmpty } from 'ramda';
import { Switch, Modal } from 'antd';
import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import { mediaResourcepageRq } from '@/services/production/mrm/mediaResource';

const DOMAIN = 'projectMgmtListEdit';

@connect(({ projectMgmtListEdit }) => ({
  ...projectMgmtListEdit,
}))
class ResourceModal extends React.Component {
  constructor(props) {
    super(props);
    const { visible } = props;

    this.state = {
      rowSpanArray: [],
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

  // 获取数据的行和并数组
  calcRowSpan = data => {
    if (data && data.length > 0) {
      //保存上一个资源Id
      let x = '';
      //相同资源Id出现的次数
      let count = 0;
      //该资源Id第一次出现的位置
      let startindex = 0;
      const myArray = data.map(() => 1);
      for (let i = 0; i < data.length; i += 1) {
        const val = data[i].resourceId;
        if (i === 0) {
          x = val;
          count = 1;
          myArray[0] = 1;
        } else if (val === x) {
          count += 1;
          myArray[startindex] = count; //
          myArray[i] = 0;
        } else {
          count = 1;
          x = val;
          startindex = i;
          myArray[i] = 1;
        }
      }
      this.setState({
        rowSpanArray: myArray,
      });
    }
  };

  fetchData = async params => {
    const { createTime, ...restparams } = params;

    if (Array.isArray(createTime) && (createTime[0] || createTime[1])) {
      [restparams.startDate, restparams.endDate] = createTime;
    }
    restparams.priceStatus = 'true';
    const { response } = await mediaResourcepageRq(restparams);
    let result = response.data;
    if (result.rows.length > 0) {
      const { rows, ...other } = result;
      const list = rows.map(item => {
        const { priceStatus, ...rest } = item;
        rest.priceStatusName = priceStatus === 'true' ? '已启用' : '未启用';

        return { priceStatus, ...rest };
      });
      result = {
        rows: list,
        ...other,
      };
    }
    return result;
  };

  // 点击取消按钮
  onToggle = e => {
    const { onCancel } = this.props;
    type(onCancel) === 'Function' && onCancel();
  };

  handleSave = () => {
    const {
      dispatch,
      formData: { scheduleList },
      scheduleId,
      onOk,
    } = this.props;
    const { getInternalState } = this.state;
    const { selectedRows } = getInternalState();
    const ind = scheduleList.findIndex(item => item.id === scheduleId);
    scheduleList[ind].priceId = selectedRows[0].id;
    scheduleList[ind].supAbNoDesc = selectedRows[0].supplierNoDesc;
    scheduleList[ind].supAbNo = selectedRows[0].supplierNo;
    scheduleList[ind].resourceNo = selectedRows[0].resourceNo;
    scheduleList[ind].resourceName = selectedRows[0].resourceName;
    scheduleList[ind].resourceId = selectedRows[0].resourceId;
    scheduleList[ind].location = selectedRows[0].location;
    scheduleList[ind].saleMethodDesc = selectedRows[0].saleMethodDesc;
    scheduleList[ind].saleUnitDesc = selectedRows[0].saleUnitDesc;
    scheduleList[ind].effectivePeriod = selectedRows[0].effectivePeriod;
    scheduleList[ind].agentMethodDesc = selectedRows[0].agentMethodDesc;
    dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: {
        scheduleList,
      },
    });
    onOk(true);
  };

  /**
   * 组装查询条件
   * @returns {*[]} 查询条件集合
   */
  renderSearchForm = () => {
    const {
      formData: { scheduleList },
      supplierOptions,
      scheduleId,
    } = this.props;
    let supAbNo = '';
    scheduleList.forEach((item, index) => {
      if (item.id === scheduleId) {
        supAbNo = item.supAbNoDesc;
      }
    });
    return [
      <SearchFormItem
        key="resourceNo"
        fieldType="BaseInput"
        label="资源编号"
        fieldKey="resourceNo"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="resourceName"
        fieldType="BaseInput"
        label="资源名称"
        fieldKey="resourceName"
        defaultShow
        advanced
      />,
      <SearchFormItem
        key="supplierNo"
        fieldType="BaseSelect"
        descList={supplierOptions}
        label="供应商"
        fieldKey="supplierNo"
        initialValue={supAbNo}
        defaultShow
        advanced
      />,
    ];
  };

  render() {
    const { getInternalState, rowSpanArray } = this.state;

    // 表格列
    const columns = [
      {
        title: '资源编号',
        dataIndex: 'resourceNo',
        sorter: true,
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '资源名称',
        dataIndex: 'resourceName',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '资源位置1',
        dataIndex: 'location1',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '资源位置2',
        dataIndex: 'location2',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      {
        title: '广告形式',
        dataIndex: 'advertisementMode',
        align: 'center',
        render: (value, row, index) => {
          const obj = {
            children: value,
            props: {},
          };
          obj.props.rowSpan = rowSpanArray[index];
          return obj;
        },
      },
      { title: '供应商', dataIndex: 'supplierNoDesc', align: 'center' },
      { title: '代理方式', align: 'center', dataIndex: 'agentMethodDesc' },
      { title: '售卖方式', align: 'center', dataIndex: 'saleMethodDesc' },
      { title: '售卖单位', align: 'center', dataIndex: 'saleUnitDesc' },
      { title: '刊例价', align: 'center', dataIndex: 'publishedPrice' },
      { title: '折扣', align: 'center', dataIndex: 'discount' },
      { title: '折扣价', align: 'center', dataIndex: 'finalPrice' },
      {
        title: '备注',
        dataIndex: 'remark',
      },
    ];
    const { visible } = this.state;
    return (
      <Modal
        destroyOnClose
        title="资源价格列表"
        visible={visible}
        onOk={this.handleSave}
        onCancel={this.onToggle}
        width={1500}
        // afterClose={() => this.clearState()}
      >
        <SearchTable
          wrapperInternalState={internalState => {
            this.setState({ getInternalState: internalState });
          }}
          searchForm={this.renderSearchForm()} // 查询条件
          defaultSearchForm={{}} // 查询条件默认值,重置时查询条件默认这里面的值
          defaultSortBy="id"
          defaultSortDirection="DESC"
          fetchData={this.fetchData} // 获取数据的方法,请注意获取数据的格式
          columns={columns} // 要展示的列
          showSearchCardTitle={false}
          onChange={data => {
            const { selectedRows } = getInternalState();
          }}
          // defaultAdvancedSearch={false} // 查询条件默认为高级查询
          autoSearch // 进入页面默认查询数据
          // extraButtons={extraButtons}
          tableExtraProps={{ scroll: { x: 1800 } }}
          selectType="radio"
        />
      </Modal>
    );
  }
}

export default ResourceModal;
