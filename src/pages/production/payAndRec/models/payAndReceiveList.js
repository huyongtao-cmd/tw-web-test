// 产品化引用
import { commonModelReducers } from '@/utils/production/modelUtils';
// service方法

// 默认状态
const defaultState = {
  // 选中参与收付款，开票的列表项
  selectedRows: [
    {
      supplierId: '',
      supplierName: '',
      chargeProjectId: '',
      chargeBuId: '',
      chargeCompany: '',
      originalCurrency: '',
      poName: '',
      paymentStage: '',
      poId: '',
      budgetItemId: '',
    },
  ],
  paymentTotalAmt: 0,
  paymentRequestName: '',
  minExpectedPayment: '',
  invoiceTotalAmt: 0, // 开票总金额
};
export default {
  namespace: 'payAndReceiveList',

  state: defaultState,

  // 异步方法
  effects: {},

  // 同步方法
  reducers: {
    // 使用工具方法快速写updateState,updateForm,cleanState 方法
    ...commonModelReducers(defaultState),
  },
};
