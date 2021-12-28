import React, { PureComponent } from 'react';
import { FormattedMessage } from 'umi/locale';
import { Avatar, Button, Dropdown, Icon, Menu, Spin, Tag, Tooltip } from 'antd';
import moment from 'moment';
import { groupWith, isNil } from 'ramda';
import router from 'umi/router';
import { stringify } from 'qs';
//对生成的token进行加密：使用 Base64
import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';
import NoticeIcon from '../NoticeIcon/index';
import HeaderSearch from '../HeaderSearch/index';
import styles from './index.less';
import { getUrl } from '@/utils/flowToRouter';
import { getMyFeedStateHandle, updateMyFeedHandle } from '@/services/plat/feedback';
import avatarImg from '@/assets/img/avatar_user.png';
import placeholderIcon from '@/assets/img/avatar.png';
import feedbackIcon from '@/assets/img/feedback.png';

export default class GlobalHeaderRight extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      feedBackRedDot: false,
    };
  }

  componentDidMount() {
    const url = getUrl();
    getMyFeedStateHandle().then(res => {
      if (res.response.ok) {
        if (res.response.datum !== 0 && url !== '/user/myFeedbacks') {
          this.setState({
            feedBackRedDot: true,
          });
        }
        if (url === '/user/myFeedbacks') {
          updateMyFeedHandle();
        }
      }
    });
  }

  getNoticeData() {
    const { notices, notifyCount } = this.props;
    if (!notices || notices.length === 0) {
      return {};
    }
    // eslint-disable-next-line
    console.log('[EL-MSG]: notices received ->', notices, notifyCount);
    const newNotices = notices.map(notice => {
      const newNotice = { ...notice };
      if (newNotice.datetime) {
        newNotice.datetime = moment(notice.datetime).fromNow();
      }
      if (newNotice.id) {
        newNotice.key = newNotice.id;
      }
      if (newNotice.extra && newNotice.status) {
        const color = {
          todo: '',
          processing: 'blue',
          urgent: 'red',
          doing: 'gold',
        }[newNotice.status];
        newNotice.extra = (
          <Tag color={color} style={{ marginRight: 0 }}>
            {newNotice.extra}
          </Tag>
        );
      }
      return newNotice;
    });
    // 根据类型拆成3类
    return groupWith((a, b) => a.type === b.type, newNotices); // _.groupBy(newNotices, 'type');
  }

  // 把原代码的方法提取为一个共用方法
  onExtensionMenuClick = (mCode, mUrl, ELearningLink) => {
    const haveELearningLink = !isNil(ELearningLink);
    if (mUrl) {
      // 是否需要打卡外链
      if (mCode.includes('blank')) {
        if (mCode === 'yeeDoc_blank') {
          //获取token对象
          const token = localStorage.getItem('token_auth');
          // 对生成的token(ticket)进行加密：使用 Base64
          const ticket = Base64.stringify(Utf8.parse(token));
          window.open(mUrl + '?ticket=' + ticket);
          return;
        }
        window.open(mUrl);
        return;
      }
      // 头部右侧菜单收缩后点击跳转
      if (mCode === 'appDownload') {
        window.open('/download');
        return;
      }
      if (mCode === 'E-learning') {
        if (haveELearningLink) {
          window.open(ELearningLink);
        }
        return;
      }

      if (mCode === 'help') {
        const urls = getUrl();
        const from = stringify({ url: urls });
        router.push(`${mUrl}?${from}`);
        return;
      }
      router.push(mUrl);
    }
  };

  render() {
    const {
      user,
      isFetchingNotices,
      onNoticeVisibleChange,
      onChangeLang,
      onDisplayHelp,
      onELearning,
      ELearningLink,
      onMenuClick,
      onNoticeClear,
      theme,
      notifyCount,
      extensionInfo = [],
      headImgFile,
    } = this.props;

    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
        <Menu.Item key="userinfo">
          <Icon type="user" />
          <FormattedMessage id="ui.menu.account.message" defaultMessage="个人信息" />
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="userPassword">
          <Icon type="info-circle" />
          <FormattedMessage id="ui.menu.account.password" defaultMessage="修改密码" />
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="logout">
          <Icon type="logout" />
          <FormattedMessage id="ui.menu.account.logout" defaultMessage="登出" />
        </Menu.Item>
      </Menu>
    );
    const feedbackMenu = (
      <Menu className={`${styles.menu}`} selectedKeys={[]}>
        <Menu.Item
          key="new"
          onClick={() => {
            const urls = getUrl();
            const from = stringify({ fromPage: urls });
            router.push(`/user/feedback?${from}`);
          }}
        >
          <FormattedMessage id="ui.menu.feedback.new" defaultMessage="新建反馈" />
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          key="myFeedback"
          onClick={() => {
            router.push(`/user/myFeedbacks`);
            updateMyFeedHandle();
            this.setState({
              feedBackRedDot: false,
            });
          }}
        >
          <FormattedMessage id="ui.menu.feedback.my" defaultMessage="我的反馈" />
        </Menu.Item>
      </Menu>
    );
    const noticeData = this.getNoticeData() || [];
    let className = styles.right;
    if (theme === 'dark') {
      className = `${styles.right}  ${styles.dark}`;
    }
    const { feedBackRedDot } = this.state;
    return (
      <div className={className}>
        {extensionInfo &&
          extensionInfo.map(item => (
            <span
              key={item.id}
              className={styles.extensionWrap}
              onClick={() => {
                this.onExtensionMenuClick(item.menuCode, item.menuLink, ELearningLink);
              }}
            >
              <img
                src={item.imgFile ? `data:image/jpeg;base64,${item.imgFile}` : placeholderIcon}
                alt="icon"
                className={styles.iconStyle}
              />
              {item.menuName}
            </span>
          ))}

        <Dropdown overlay={feedbackMenu}>
          <span className={styles.extensionWrap} style={{ position: 'relative' }}>
            {feedBackRedDot ? (
              <span
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'red',
                }}
              />
            ) : null}
            <img src={feedbackIcon} alt="icon" className={styles.iconStyle} />
            问题反馈
          </span>
        </Dropdown>

        {user.info ? (
          <Dropdown overlay={menu}>
            <span className={`${styles.action} ${styles.account}`}>
              <Avatar
                size="small"
                className={styles.avatar}
                src={headImgFile !== '' ? `data:image/jpeg;base64,${headImgFile}` : avatarImg}
                alt="avatar"
              />
              {/* <img
                src={  avatarImg}
                // `data:image/jpeg;base64,${extensionInfo[0].imgFile}`
                alt="icon"
                className={styles.iconStyle}
              /> */}
              <span className={styles.name} data-user-id={user.info.id}>
                {user.info.name}
              </span>
            </span>
          </Dropdown>
        ) : (
          <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
        )}
      </div>
    );
  }
}
