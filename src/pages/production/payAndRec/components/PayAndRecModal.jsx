import React from 'react';
import { connect } from 'dva';
import { equals, clone, type, isEmpty } from 'ramda';
import { Switch, Modal } from 'antd';
import SearchTable from '@/components/production/business/SearchTable';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import createMessage from '@/components/core/AlertMessage';
import { projectTeamPagingRq } from '@/services/production/projectMgmt/projectTeam';

const DOMAIN = 'payAndRecModal';

@connect(({ projectMgmtListEdit, dispatch }) => ({
  ...projectMgmtListEdit,
  dispatch,
}))
class payAndRecModal extends React.Component {
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

  fetchData = async params => {
    const { selectedRows } = this.props;
    // todo 取出客户、供应商的id
    const { supplierId } = selectedRows[0];
    const { response } = await projectTeamPagingRq({ ...params, supplierId });
    const result = response.data;
    return result;
  };

  // 点击取消按钮
  onToggle = e => {
    const { onCancel } = this.props;
    type(onCancel) === 'Function' && onCancel();
  };

  handleSave = () => {
    const { dispatch, onOk, from, selectedRows } = this.props;
    const { getInternalState } = this.state;
    // 全选的时候会有重复项 去重
    const rows = Array.from(new Set(getInternalState().selectedRows));
    const target = selectedRows.concat(rows);
    // TODO:计算所有选中的项的总价格，应收为正，应付为负
    const totalPrice = target
      .map(item => {
        let currentValue = 0;
        if (item.planClass === 'COLLECTION') {
          currentValue = item.restAmt;
        } else {
          currentValue = 0 - item.restAmt;
        }
        return currentValue;
      })
      .reduce((accumulator, currentValue) => accumulator + currentValue);
    if (from === 'payment') {
      if (totalPrice > 0) {
        createMessage({
          type: 'warn',
          description: `应收款总金额小于应付款总金额才能进行付款申请！`,
        });
        return;
      }
    } else if (from === 'receive') {
      if (totalPrice < 0) {
        createMessage({
          type: 'warn',
          description: `应付款总金额小于应收款总金额才能进行收款！`,
        });
        return;
      }
    }
    onOk(target);
  };

  render() {
    // 表格列
    // TODO 修改参数名
    const columns = [
      {
        title: '公司',
        dataIndex: 'ouName',
        align: 'center',
      },
      {
        title: '类别',
        dataIndex: 'planClassDesc',
        align: 'center',
      },
      {
        title: '款项',
        dataIndex: 'clause',
        align: 'center',
      },
      {
        title: '客户/供应商',
        dataIndex: 'supplierName',
        align: 'center',
      },
      {
        title: '合同/订单编号',
        dataIndex: 'contractNo',
        align: 'center',
      },
      {
        title: '名称',
        dataIndex: 'contractName',
        align: 'center',
      },
      {
        title: '阶段',
        dataIndex: 'phase',
        align: 'center',
      },
      {
        title: '当期金额',
        dataIndex: 'amount',
        align: 'center',
      },

      {
        title: '预计收付日期',
        dataIndex: 'expectDate',
        align: 'center',
      },
      // TODO
      {
        title: '款项状态',
        dataIndex: 'resId',
        align: 'center',
      },
      {
        title: '开票状态',
        dataIndex: 'invoiceStatus',
        align: 'center',
      },
      {
        title: '发票号',
        dataIndex: 'invoiceNo',
        align: 'center',
      },
      {
        title: '开票金额',
        dataIndex: 'invoiceAmt',
        align: 'center',
      },
      {
        title: '开票日期',
        dataIndex: 'invoiceDate',
        align: 'center',
      },
      // TODO
      {
        title: '已收付金额',
        dataIndex: 'invoiceUnRevAmt',
        align: 'center',
      },
      {
        title: '未开票已收款金额',
        dataIndex: 'uninvoiceReceAmt',
        align: 'center',
      },
      {
        title: '未开票已付款金额',
        dataIndex: 'uninvoicePayAmt',
        align: 'center',
      },
      {
        title: '最近收付日期',
        dataIndex: 'recentDate',
        align: 'center',
      },
    ];
    const { visible } = this.state;
    const { selectedRows } = this.props;
    return (
      <Modal
        destroyOnClose
        title="应收应付列表"
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
          showSearchCardTitle={false}
          defaultSortBy="id"
          defaultSortDirection="DESC"
          fetchData={this.fetchData} // 获取数据的方法,请注意获取数据的格式
          columns={columns} // 要展示的列
          autoSearch // 进入页面默认查询数据
          tableExtraProps={{
            scroll: { x: 1800 },
            getCheckboxProps: record => ({ disabled: selectedRows.some(e => e.id === record.id) }),
          }}
        />
      </Modal>
    );
  }
}

export default payAndRecModal;
