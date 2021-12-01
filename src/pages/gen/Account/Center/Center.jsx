import React, { PureComponent } from 'react';
import { connect } from 'dva';
import Link from 'umi/link';
import router from 'umi/router';
import {
  Card,
  Row,
  Col,
  Icon,
  Divider,
  Input,
  // Carousel,
  Modal,
  Tabs,
  Badge,
  Form,
  Popover,
} from 'antd';
import { isNil } from 'ramda';
import GridContent from '@/components/layout/PageHeaderWrapper/GridContent';
// import Draggable from './Draggable';
import styles from './Center.less';
import FieldList from '@/components/layout/FieldList';
import Title from '@/components/layout/Title';
import { formatDT } from '@/utils/tempUtils/DateTime';
import { flowToRouter } from '@/utils/flowToRouter';
import { readNotify } from '@/services/user/flow/flow';
import { createConfirm } from '@/components/core/Confirm';
import { fromQs } from '@/utils/stringUtils';
import ShortcutMenu from '@/components/common/Workbench/ShortcutMenu';
import RemindModal from './RemindModal';
import DataTable from '@/components/production/business/DataTable.tsx';
import NewLink from '@/components/production/basic/Link';

const { Field } = FieldList;
const { TabPane } = Tabs;
const DOMAIN = 'userCenter';

@connect(({ dispatch, userCenter, loading }) => ({
  dispatch,
  userCenter,
  loadingShortcut: loading.effects[`${DOMAIN}/queryShortCut`],
  loadingScheduleList: loading.effects[`${DOMAIN}/queryScheduleList`],
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    const { name, value } = Object.values(changedFields)[0];
    props.dispatch({
      type: `${DOMAIN}/updateForm`,
      payload: { [name]: value },
    });
  },
})
class Center extends PureComponent {
  state = {
    isFound: false,
  };

  componentDidMount() {
    const { dispatch } = this.props;

    const { refresh } = fromQs();
    // 获取入职培训提示
    // !refresh && dispatch({ type: `${DOMAIN}/selectTrainingAll` });

    /* 常用功能图标 */
    dispatch({ type: `${DOMAIN}/queryShortCut` });
    dispatch({ type: `${DOMAIN}/queryMyInfo` });
    dispatch({
      type: `${DOMAIN}/todo`,
      payload: { limit: 4, sortBy: 'startTime', sortDirection: 'DESC' },
    });
    dispatch({
      type: `${DOMAIN}/back`,
      payload: { limit: 4, sortBy: 'startTime', sortDirection: 'DESC' },
    });
    dispatch({
      type: `${DOMAIN}/done`,
      payload: { limit: 4, sortBy: 'startTime', sortDirection: 'DESC' },
    });
    dispatch({
      type: `${DOMAIN}/notify`,
      payload: { limit: 4, sortBy: 'startTime', sortDirection: 'DESC', onlyShowUnRead: 1 },
    });
    dispatch({
      type: `${DOMAIN}/message`,
      payload: { sortBy: 'startTime', sortDirection: 'DESC' },
    });
    dispatch({
      type: `${DOMAIN}/messageCount`,
      payload: {},
    });
    dispatch({ type: `${DOMAIN}/recentWork` });
    dispatch({ type: `${DOMAIN}/queryScheduleList` });
  }

  handleChangeShortCut = parm => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/changeShortCut`,
      payload: {
        param: parm,
      },
    });
  };

  modalCancel = () => {
    this.setState({
      isFound: false,
    });
  };

  requestRealType = async (data, mode) => {
    router.push('/');
  };

  jumpLink = (data, todo = false) => {
    const { defKey, id, taskId, docId, procIden } = data;
    const mode = todo ? 'edit' : 'view';
    if (procIden === 'ACC_A22') {
      this.requestRealType(data, mode);
    } else {
      const route = flowToRouter(procIden, {
        id,
        taskId,
        docId,
        mode,
      });
      router.push(route);
    }
  };

  messageJumpLink = id => {
    router.push(`/user/center/message/detail?id=${id}`);
  };

  render() {
    const { isFound } = this.state;
    const {
      dispatch,
      userCenter: {
        myShortCut,
        sysShortCuts,
        newSortNo,
        formData,
        todoList,
        todoTotalCount,
        backList,
        backTotalCount,
        doneList,
        doneTotalCount,
        notifyList,
        notifyTotalCount,
        myInfo,
        approvalCount,
        recentWork,
        activeTabKey,
        messageList,
        messageTotalCount,
        visible1,
        visible2,
        visible3,
        schedulePointList,
        scheduleCCList,
      },
      form: { getFieldDecorator },
      loadingShortcut,
      loadingScheduleList,
    } = this.props;

    const { refresh } = fromQs();
    // const dropMyNext = () => {
    //   this.changeMyIndex.next();
    // };
    // const dropMyPrev = () => {
    //   this.changeMyIndex.prev();
    // };
    // const dropSysNext = () => {
    //   this.changeSysIndex.next();
    // };
    // const dropSysPrev = () => {
    //   this.changeSysIndex.prev();
    // };

    // const foundShortCut = () => {
    //   this.setState({
    //     isFound: !isFound,
    //   });
    // };
    const modalOk = () => {
      dispatch({
        type: `${DOMAIN}/foundShortCut`,
        payload: {
          sortNo: newSortNo,
          shortcutName: formData.newShortCutName,
          shortcutUrl: formData.newShortCutUrl,
          shortcutIcon: '',
        },
      });
      this.setState({
        isFound: false,
      });
    };
    const descriptionColumns = [
      {
        title: '项目编号',
        dataIndex: 'projectNo',
        render: (value, row, index) => (
          <NewLink
            onClick={() =>
              router.push(
                `/workTable/projectMgmt/projectMgmtList/projectApplyDisplay?id=${
                  row.projectId
                }&mode=DESCRIPTION&from=HOME`
              )
            }
          >
            {value}
          </NewLink>
        ),
      },
      {
        title: '项目名称',
        dataIndex: 'projectName',
      },
      {
        title: '客户',
        dataIndex: 'customer',
      },
      {
        title: '排期编号',
        dataIndex: 'scheduleNo',
        render: (value, row, index) => (
          <NewLink
            onClick={() =>
              router.push(
                `/workTable/projectMgmt/schedule?scheduleId=${row.id}&projectId=${
                  row.projectId
                }&mode=EDIT&from=HOME`
              )
            }
          >
            {value}
          </NewLink>
        ),
      },
      {
        title: '资源编号',
        dataIndex: 'resourceNo',
      },
      {
        title: '资源名称',
        dataIndex: 'resourceIdDesc',
      },
      {
        title: '指派人姓名',
        dataIndex: 'pointCreateUserIdDesc',
      },
      {
        title: '指派时间',
        dataIndex: 'pointCreateTime',
      },
    ];

    return (
      <GridContent className={styles.userCenter}>
        <Row gutter={24}>
          <Col lg={12} md={24}>
            <Card bordered={false} className={styles.userinfocard}>
              <DataTable
                title="指派给我"
                columns={descriptionColumns}
                dataSource={schedulePointList}
                prodSelection={false}
                showHandleRow={false}
                loadind={loadingScheduleList}
              />
              <DataTable
                title="抄送给我"
                columns={descriptionColumns}
                dataSource={scheduleCCList}
                prodSelection={false}
                showHandleRow={false}
                loadind={loadingScheduleList}
              />
            </Card>
          </Col>

          <Col lg={12} md={24}>
            <Card bordered={false} className={styles.todocard}>
              <Tabs
                activeKey={activeTabKey}
                onTabClick={activeKey =>
                  dispatch({ type: `${DOMAIN}/updateState`, payload: { activeTabKey: activeKey } })
                }
                tabBarExtraContent={
                  activeTabKey === '4' ? (
                    <Link to="/user/center/message" className={styles.more}>
                      更多&gt;
                    </Link>
                  ) : (
                    <Link to="/user/flow/process" className={styles.more}>
                      更多&gt;
                    </Link>
                  )
                }
              >
                <TabPane
                  tab={
                    <Badge count={todoTotalCount} offset={[5, -3]}>
                      我的待办
                    </Badge>
                  }
                  key="1"
                >
                  <ul>
                    {todoList &&
                      todoList.map(v => (
                        <li key={Math.random()}>
                          <div className={styles.item}>
                            <Icon type="file-text" />
                            <p onClick={() => this.jumpLink(v, true)}>{v.docName}</p>
                            <span>{formatDT(v.startTime)}</span>
                          </div>
                          <p className={styles.contennt}>
                            当前处理节点：
                            {v.todoInfo.taskNames}
                            &nbsp; | &nbsp; 当前处理人：
                            {v.todoInfo.workerNames}
                          </p>
                        </li>
                      ))}
                  </ul>
                </TabPane>
                <TabPane
                  tab={
                    <Badge count={backTotalCount} offset={[5, -3]}>
                      我的退回
                    </Badge>
                  }
                  key="5"
                >
                  <ul>
                    {backList &&
                      backList.map(v => (
                        <li key={Math.random()}>
                          <div className={styles.item}>
                            <Icon type="file-text" />
                            <p onClick={() => this.jumpLink(v, true)}>{v.docName}</p>
                            <span>{formatDT(v.startTime)}</span>
                          </div>
                          <p className={styles.contennt}>
                            当前处理节点：
                            {v.todoInfo.taskNames}
                            &nbsp; | &nbsp; 当前处理人：
                            {v.todoInfo.workerNames}
                          </p>
                        </li>
                      ))}
                  </ul>
                </TabPane>
                {/* <TabPane
                  tab={
                    // 已办不要角标
                    // <Badge count={doneTotalCount} offset={[5, -3]}>
                    <Badge count={undefined} offset={[5, -3]}>
                      我的已办
                    </Badge>
                  }
                  key="2"
                >
                  <ul>
                    {doneList &&
                      doneList.map(v => (
                        <li key={Math.random()}>
                          <div className={styles.item}>
                            <Icon type="file-text" />
                            <p onClick={() => this.jumpLink(v)}>{v.docName}</p>
                            <span>{formatDT(v.startTime)}</span>
                          </div>
                          {!isNil(v.todoInfo) ? (
                            <p className={styles.contennt}>
                              当前处理节点：
                              {v.todoInfo.taskNames}
                              &nbsp; | &nbsp; 当前处理人：
                              {v.todoInfo.workerNames}
                            </p>
                          ) : (
                            <p className={styles.contennt}>&nbsp;</p>
                          )}
                        </li>
                      ))}
                  </ul>
                </TabPane> */}

                <TabPane
                  tab={
                    <Badge count={notifyTotalCount} offset={[5, -3]}>
                      我的知会
                    </Badge>
                  }
                  key="3"
                >
                  <ul>
                    {notifyList &&
                      notifyList.map(v => (
                        <li key={Math.random()}>
                          <div className={styles.item}>
                            <Icon type="file-text" />
                            <p onClick={() => readNotify(v.taskId) && this.jumpLink(v)}>
                              {v.docName}
                            </p>
                            <span>{formatDT(v.startTime)}</span>
                          </div>
                          {!isNil(v.todoInfo) ? (
                            <p className={styles.contennt}>
                              当前处理节点：
                              {(v.todoInfo || {}).taskNames || '空'}
                              &nbsp; | &nbsp; 当前处理人：
                              {(v.todoInfo || {}).workerNames || '空'}
                            </p>
                          ) : (
                            <p className={styles.contennt}>&nbsp;</p>
                          )}
                        </li>
                      ))}
                  </ul>
                </TabPane>
                <TabPane
                  tab={
                    <Badge count={messageTotalCount} offset={[5, -3]}>
                      消息通知
                    </Badge>
                  }
                  key="4"
                >
                  <ul className={styles.message}>
                    {messageList &&
                      messageList.map(v => (
                        <li key={Math.random()}>
                          <div className={styles.item}>
                            <Icon type="file-text" className={v.isRead === 1 ? styles.read : ''} />
                            <p
                              onClick={() => this.messageJumpLink(v.noticeId)}
                              className={v.isRead === 1 ? styles.read : ''}
                            >
                              <span className={styles.messageTitle}>{v.releaseTitle}</span>
                              {Array.isArray(v.messageTagName) &&
                                v.messageTagName.map(item => (
                                  <span key={Math.random()} className={styles.messageTag}>
                                    {item}
                                  </span>
                                ))}
                            </p>
                            <span className={v.isRead === 1 ? styles.read : ''}>
                              {formatDT(v.releaseTime)}
                            </span>
                          </div>
                          <div
                            className={
                              v.isRead === 1 ? `${styles.read} ${styles.itemInfo}` : styles.itemInfo
                            }
                          >
                            {v.releaseTypeName}
                            <span>|</span>
                            发布来源:
                            {v.releaseSource}
                          </div>
                        </li>
                      ))}
                  </ul>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>

        <Card
          className="tw-card-adjust"
          bordered={false}
          loading={loadingShortcut}
          style={{ marginTop: 8 }}
          title={<Title icon="profile" id="user.center.menu.shortcut" defaultMessage="快捷入口" />}
        >
          <Row className={styles.quickLinksWrapper} type="flex" align="middle" justify="start">
            {/* {(sysShortCuts || []).map(v => (
              <div
                key={v.id}
                className={styles.quickLinks}
                onClick={() =>
                  router.push(v.shortcutUrl.startsWith('/') ? v.shortcutUrl : `/${v.shortcutUrl}`)
                }
              >
                <Row className={styles.linkImgWrapper} type="flex" justify="center" align="middle">
                  {isNil(v.shortcutIcon) ? (
                    <Icon type="shop" style={{ fontSize: 48 }} />
                  ) : (
                    <img className={styles.linkImg} src={v.shortcutIcon} alt={v.shortcutName} />
                  )}
                </Row>
                <div className={styles.linkBanner}>{v.shortcutName}</div>
              </div>
            ))} */}
            <ShortcutMenu currentPage="/user/home" />
          </Row>
        </Card>

        <Modal
          destroyOnClose
          title="自定义入口"
          visible={isFound}
          onOk={modalOk}
          onCancel={this.modalCancel}
        >
          <FieldList
            layout="horizontal"
            col={1}
            getFieldDecorator={getFieldDecorator}
            style={{ overflow: 'hidden' }}
          >
            <Field name="newShortCutName" label="名称" style={{ marginLeft: '-10%' }}>
              <Input placeholder="请输入名称" />
            </Field>
            <Field name="newShortCutUrl" label="路径" style={{ marginLeft: '-10%' }}>
              <Input placeholder="请输入URL路径   例如:/a/b/c" />
            </Field>
          </FieldList>
        </Modal>
        <RemindModal />
      </GridContent>
    );
  }
}

export default Center;
