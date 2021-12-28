import React from 'react';
import { Upload, Button, Modal, Icon, Checkbox } from 'antd';
import { type, equals } from 'ramda';
import ExportJsonExcel from 'js-export-excel';

const { Dragger } = Upload;

class ZipImportExport extends React.Component {
  constructor(props) {
    super(props);
    const { controlModal } = this.props;
    this.state = {
      controlModal,
      fileList: [],
      checked: false,
    };
  }

  componentDidMount() {
    const { onRef } = this.props;
    onRef(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (snapshot !== null) {
      setTimeout(() => {
        this.setState({ controlModal: snapshot });
      }, 0);
    }
  }

  getSnapshotBeforeUpdate(prevProps, prevState, snapshot) {
    const { controlModal } = this.props;
    if (!equals(prevState.controlModal, controlModal)) {
      return controlModal;
    }
    return null;
  }

  toggleVisible = () => {
    this.setState(
      {
        fileList: [],
      },
      () => {
        const { closeModal } = this.props;
        const { visible: visibles } = this.props;
        type(closeModal) === 'Function' && closeModal(visibles);
      }
    );
  };

  handleUpload = (v, index) => {
    const { fileList } = this.state;
    const { handleUpload } = this.props;
    type(handleUpload) === 'Function' && handleUpload(fileList);
  };

  handleCancel = () => {
    this.toggleVisible();
  };

  /**
   * 导出excel
   */

  downLoadFaileExcel = () => {
    const {
      controlModal: { failedList },
      option,
    } = this.props;
    option.datas[0].sheetData = failedList;
    const toExcel = new ExportJsonExcel(option); // new
    toExcel.saveExcel();
  };

  downloadTemplate = () => {
    const { templateUrl, templateName } = this.props;
    // saveAs(templateUrl, templateName);
    window.location.href = templateUrl;
  };

  changeCheck = e => {
    this.setState({ checked: e.target.checked });
  };

  render() {
    const { fieldsMap = {}, templateUrl } = this.props;
    const {
      controlModal: { failedList, uploading, visible },
      fileList,
      checked,
    } = this.state;

    const uploadProps = {
      accept: 'application/zip,.zip,',
      onRemove: file => {
        this.setState(state => {
          const index = state.fileList.indexOf(file);
          const newFileList = state.fileList.slice();
          newFileList.splice(index, 1);
          return {
            fileList: newFileList,
          };
        });
      },
      beforeUpload: file => {
        this.setState(state => ({
          fileList: [...state.fileList, file],
        }));
        return false;
      },
      fileList,
    };

    return (
      <Modal
        title="选择Zip文件"
        visible={visible}
        // onOk={this.handleOk}
        onCancel={this.handleCancel}
        destroyOnClose
        footer={
          templateUrl
            ? [
                failedList.length > 0 ? (
                  <Button key="failedButton" onClick={this.downLoadFaileExcel}>
                    下载失败结果
                  </Button>
                ) : null,
                // eslint-disable-next-line react/jsx-indent
                <Checkbox
                  style={{ marginLeft: '10px' }}
                  checked={checked}
                  onChange={this.changeCheck}
                >
                  覆盖已有
                </Checkbox>,
                // eslint-disable-next-line
                <Button icon="download" key="downloadTemplate" onClick={this.downloadTemplate}>
                  下载模板
                </Button>,
                // eslint-disable-next-line
                <Button
                  type="primary"
                  key="upload"
                  className="tw-btn-warning"
                  onClick={this.handleUpload}
                  disabled={fileList.length === 0}
                  loading={uploading}
                  style={{ marginTop: 16 }}
                >
                  {uploading ? '上传中...' : '确认上传'}
                </Button>,
              ]
            : null
        }
      >
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-upload-hint">点击或拖曳上传</p>
        </Dragger>
      </Modal>
    );
  }
}

export default ZipImportExport;
