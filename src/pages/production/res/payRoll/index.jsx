import React from 'react';
import { connect } from 'dva';
import { Form, Switch, Row, Col } from 'antd';
import { isEmpty } from 'ramda';
import SearchFormItem from '@/components/production/business/SearchFormItem';
import PageWrapper from '@/components/production/layout/PageWrapper';
import ExcelImportExport from '@/components/common/ExcelImportExport';
import SearchTable from '@/components/production/business/SearchTable';
import PayRollDetail from './components/detail';
import { outputHandle } from '@/utils/production/outputUtil';
import createMessage from '@/components/core/AlertMessage';
import { payRollPagingRq, payRollDeleteRq } from '@/services/production/res';

const DOMAIN = 'resPayRoll';

@connect(({ loading, dispatch, resPayRoll }) => ({
  loading,
  dispatch,
  resPayRoll,
}))
class Payroll extends React.Component {
  state = {
    visible: false,
    failedList: [],
    formData: {},
  };

  componentDidMount() {}

  fetchData = async params => {
    const { response } = await payRollPagingRq({
      ...params,
    });
    return response.data;
  };

  toggleImportVisible = () => {
    const { visible } = this.state;
    this.setState({ visible: !visible }, () => {
      this.setState({
        failedList: [],
      });
    });
  };

  renderColumns = () => {
    const { pageConfig } = this.props;

    const fields = [
      {
        title: '序号',
        key: 'serNo',
        dataIndex: 'serNo',
        align: 'center',
      },
      {
        title: '年份',
        key: 'year',
        dataIndex: 'year',
        align: 'center',
      },
      {
        title: '月份',
        key: 'month',
        dataIndex: 'month',
        align: 'center',
      },
      {
        title: '部门名称',
        key: 'buName',
        dataIndex: 'buName',
        align: 'center',
      },
      {
        title: '用户名',
        key: 'userName',
        dataIndex: 'userName',
        align: 'center',
      },
      {
        title: '姓名',
        key: 'name',
        dataIndex: 'name',
        align: 'center',
      },
    ];

    return fields;
  };

  renderSearchForm = () => {
    const { pageConfig } = this.props;

    const fields = [
      <SearchFormItem
        key="year"
        fieldKey="year"
        label="年份"
        placeholder="请输入年份"
        fieldType="BaseInput"
        defaultShow
      />,
      <SearchFormItem
        label="月份"
        fieldKey="month"
        key="month"
        placeholder="请输入月份"
        fieldType="BaseInput"
        defaultShow
      />,
      <SearchFormItem
        label="部门名称"
        fieldKey="buName"
        key="buName"
        placeholder="请输入部门名称"
        // fieldType="BuSimpleSelect"
        fieldType="BaseInput"
        defaultShow
      />,
      <SearchFormItem
        label="姓名"
        fieldKey="queryName"
        key="queryName"
        placeholder="请输入姓名/用户名"
        // fieldType="ResSimpleSelect"
        fieldType="BaseInput"
        defaultShow
      />,
    ];

    return fields;
  };

  deleteData = async keys =>
    outputHandle(payRollDeleteRq, { ids: keys.join(',') }, undefined, false);

  onRow = data => {
    this.setState({ formData: data });
  };

  handleUpload = fileList => {
    const fileData = new FormData();
    fileList.forEach(file => {
      fileData.append('excel', file);
    });
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/upload`,
      payload: fileData,
    }).then(res => {
      if (res.ok) {
        createMessage({ type: 'success', description: '上传成功' });
        this.toggleImportVisible();

        const { getInternalState } = this.state;
        const { refreshData } = getInternalState();
        refreshData();
        return;
      }
      if (res.data && Array.isArray(res.data) && !isEmpty(res.data)) {
        createMessage({
          type: 'warn',
          description: res.msg || '部分数据上传失败，请下载错误数据进行更正',
        });
        this.setState({
          failedList: res.data,
        });
      } else {
        createMessage({ type: 'error', description: res.msg || '部分数据上传失败,返回结果为空' });
        this.toggleImportVisible();
      }
    });
  };

  render() {
    const { dispatch, loading } = this.props;
    const { getInternalState, visible, failedList, projectId, formData } = this.state;

    const excelImportProps = {
      // eslint-disable-next-line no-restricted-globals
      templateUrl: location.origin + `/template/payRollTemplate.xls`,
      option: {
        fileName: '导入失败记录',
        datas: [
          {
            sheetName: '导入失败记录', // 表名
            sheetFilter: [
              'serNo',
              'year',
              'month',
              'buName',
              'userName',
              'name',
              'monthlySalary',
              'addition',
              'deduction',
              'grossPay',
              'endowmentInsurance',
              'medicare',
              'unemploymentInsurance',
              'perAccFund',
              'addPerAccFund',
              'taxableIncome',
              'specialDeduction',
              'personalIncomeTax',
              'netPaySum',
              'errorMessage',
            ], // 列过滤
            sheetHeader: [
              '序号',
              '年份',
              '月份',
              '部门名称',
              '用户名',
              '姓名',
              '月薪',
              '加项',
              '扣项',
              '应发工资',
              '养老保险',
              '医疗保险',
              '失业保险',
              '公积金',
              '补充公积金',
              '应纳税所得额',
              '专项扣除',
              '月个人所得税',
              '实发合计',
              '失败原因',
            ], // 第一行标题
            columnWidths: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], // 列宽 需与列顺序对应
          },
        ],
      },
      controlModal: {
        visible,
        failedList,
        uploading: loading.effects[`${DOMAIN}/upload`],
      },
    };

    return (
      <PageWrapper>
        <Row gutter={8}>
          <Col span={16}>
            <ExcelImportExport
              {...excelImportProps}
              closeModal={this.toggleImportVisible}
              handleUpload={this.handleUpload}
            />
            <SearchTable
              wrapperInternalState={internalState => {
                this.setState({ getInternalState: internalState });
              }}
              defaultSortBy="id"
              defaultSortDirection="DESC"
              showSearchCardTitle={false}
              searchForm={this.renderSearchForm()}
              defaultColumnStyle={12}
              defaultSearchForm={{}}
              fetchData={this.fetchData}
              columns={this.renderColumns()}
              onRow={record => ({
                onClick: () => {
                  this.onRow(record);
                }, // 点击行
                onMouseEnter: () => {
                  this.onRow(record);
                }, // 鼠标经过
              })}
              deleteData={data => this.deleteData(data)}
              extraButtons={[
                {
                  key: 'importExcel',
                  title: '导入Excel',
                  type: 'primary',
                  size: 'large',
                  loading: false,
                  cb: internalState => {
                    this.setState({
                      visible: true,
                    });
                  },
                },
              ]}
            />
          </Col>
          <Col span={8}>
            <PayRollDetail formData={formData} />
          </Col>
        </Row>
      </PageWrapper>
    );
  }
}

export default Payroll;
