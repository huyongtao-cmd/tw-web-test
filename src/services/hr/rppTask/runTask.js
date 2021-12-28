import { request } from '@/utils/networkUtils';
import api from '@/api';
import { toQs, toUrl } from '@/utils/stringUtils';

const { selectListRppConfigApi, taskStartApi } = api.hr.rppTask;

// =====资源规划所有的配置文件========
export async function selectListRppConfig() {
  return request.get(selectListRppConfigApi);
}

// =====任务运行========
export async function taskStartFun(params) {
  return request.post(toQs(taskStartApi, params));
}
