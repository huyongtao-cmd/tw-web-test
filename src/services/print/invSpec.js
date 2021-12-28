import { queryInvPrint } from '@/services/plat/recv/InvBatch';
import { request } from '@/utils/networkUtils';

export async function getPrintInvData(id) {
  // 发票打印基础信息
  const { status: printStatus, response: printRes } = await queryInvPrint(id);
  // 发票打印扩展信息（发票创建人、合同号、收款比例）
  const { status: invStatus, response: invRes } = await request('/api/worth/v1/invBatch/' + id);
  // 发票收款比例
  const { status: recStatus, response: recRes } = await request(
    `/api/worth/v1/invBatchs/${id}/recvplan`
  );
  // console.log(res)
  let res = {};
  if (printStatus === 200 && invStatus === 200 && recStatus === 200) {
    recRes.datum[0].recvRatio = recRes.datum.map(item => item.recvRatio * 100);
    res = {
      printRes: { ...printRes.datum },
      invRes: { ...invRes.datum },
      recRes: { ...recRes.datum },
    };
    return res;
    // return res
  }
  return {};
}
