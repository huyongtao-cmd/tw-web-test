import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Button } from 'antd';

@connect(({ syssetting }) => ({ syssetting }))
class SystemSetting extends PureComponent {
  clearCacheHandle = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'syssetting/clearCacheHandleFn',
    });
  };

  reloadUdcCacheHandle = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'syssetting/reloadCacheDefIdFn',
      payload: { defId: 'SQL_LOG_CONFIG' },
    });
  };

  render() {
    return (
      <div
        className="telework-components-layout-page-header-wrapper-index-content"
        style={{ background: '#fff', padding: '10px 24px' }}
      >
        <Button
          size="large"
          className="tw-btn-primary"
          onClick={() => {
            this.clearCacheHandle();
          }}
        >
          下拉缓存清除
        </Button>

        <Button
          size="large"
          className="tw-btn-primary"
          onClick={() => {
            this.reloadUdcCacheHandle();
          }}
        >
          重载SQL日志配置相关缓存
        </Button>
      </div>
    );
  }
}

export default SystemSetting;
