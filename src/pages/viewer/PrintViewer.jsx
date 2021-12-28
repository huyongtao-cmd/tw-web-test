/* eslint-disable */
import React from 'react';
import { Button } from 'antd';
import { isEmpty, isNil } from 'ramda';
import { getPrintData } from '@/services/print';
import { getHandlebars } from '../gen/handlebars';
import { fromQs } from '@/utils/stringUtils';
import classnames from 'classnames';
import DocumentTitle from 'react-document-title';
import BarCode from './BarCode';

class PrintViewer extends React.Component {
  state = {
    data: {},
    handlebars: undefined,
  };

  componentDidMount() {
    const { scope } = fromQs();
    this.setState(
      {
        handlebars: getHandlebars(scope),
      },
      () => {
        getPrintData().then(data => {
          this.setState({ data });
        });
      }
    );
  }

  render() {
    const { data, handlebars } = this.state;
    // console.warn('PrintViewer ::', handlebars);
    if (isEmpty(data) || isNil(data)) return null;
    const result = handlebars(data);
    console.log(result);

    // 渲染loading，同时拉取数据并渲染模版
    return (
      <div
        style={{
          background: '#eee',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <DocumentTitle title="单据打印" />
        <div>
          <div style={{ display: 'flex', margin: '10px 0' }}>
            <Button
              className={classnames('separate', 'tw-btn-primary')}
              icon="printer"
              // size="large"
              onClick={() => {
                const content = document.getElementById('print-frame');
                const pri = document.getElementById('fake-window').contentWindow;
                pri.document.open();
                pri.document.write(content.innerHTML);
                pri.document.close();
                pri.focus();
                pri.print();
              }}
            >
              打印
            </Button>
            <div style={{ width: 20 }} />
            <Button
              className={classnames('separate', 'tw-btn-error')}
              icon="close"
              // size="large"
              onClick={() => {
                window.opener = null;
                window.open('', '_self');
                window.close();
              }}
            >
              关闭
            </Button>
          </div>
        </div>

        <div
          id="print-frame"
          style={{
            background: '#FFF',
            padding: 24,
            width: '80%',
            border: '1px solid black',
            boxShadow: '0 2px 15px rgba(0, 0, 0, 0.45)',
            position: 'relative',
          }}
        >
          <BarCode
            content={data.formData.reimNo}
            style={{ position: 'absolute', right: '50px', top: '80px' }}
          />
          <div dangerouslySetInnerHTML={{ __html: result || '' }} style={{ marginTop: 80 }} />
        </div>
        <br />
        <iframe id="fake-window" style={{ display: 'none' }} />
      </div>
    );
  }
}

export default PrintViewer;
