import React from 'react';
import { Dropdown, Icon, Layout, Menu, Tabs } from 'antd';
import DocumentTitle from 'react-document-title';
import { equals, isNil } from 'ramda';
import memoizeOne from 'memoize-one';
import { connect } from 'dva';
import { formatMessage } from 'umi/locale';
import router from 'umi/router';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import pathToRegexp from 'path-to-regexp';
import { enquireScreen, unenquireScreen } from 'enquire-js';
import SiderMenu from '@/components/layout/SiderMenu';
import Authorized, { reloadAuthorized } from '@/layouts/Authorized';
import SettingDrawer from '@/components/layout/SettingDrawer';
import { createConfirm } from '@/components/core/Confirm';
import PageLoading from '@/components/core/PageLoading';
import elGlobal from '@/utils/elGlobal';
import logo from '../assets/img/logo.svg';
import Footer from './Footer';
import Header from './Header';
import Context from './MenuContext';
import { fromQs } from '@/utils/stringUtils';
import Exception403 from '../pages/gen/Exception/403';
import { menuDataFormatter, tryInitAuth, mergeRoutes, consoleNavs } from './_util';
import styles from '../components/layout/TabBar/index.less';
import createMessage from '../components/core/AlertMessage';
import { getBreadcrumb } from '../components/_utils/pathTools';

window.elGlobal = elGlobal;

const getBreadcrumbNameMapStatic = routes => {
  const routes2 = menuDataFormatter(routes);
  const routerMap = {};
  const mergeMenuAndRouter = data => {
    data.forEach(menuItem => {
      if (menuItem.children) {
        mergeMenuAndRouter(menuItem.children);
      }
      // Reduce memory usage
      routerMap[menuItem.path] = menuItem;
    });
  };
  mergeMenuAndRouter(routes2);
  return routerMap;
};

const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
    maxWidth: 1599,
  },
  'screen-xxl': {
    minWidth: 1600,
  },
};

@connect(({ global, uiSettings, loading }) => ({
  layout: uiSettings.layout,
  collapsed: global.collapsed,
  metaNameSpace: global.meta,
  tabData: global.tabData,
  authRoutes: global.authRoutes,
  logoInfo: global.logoInfo,
  extensionInfo: global.extensionInfo,
  tenantAuthRoutes: global.tenantAuthRoutes,
  panes: global.panes,
  activePane: global.activePane,
  prevClosePane: global.prevClosePane,
  prevCloseIndex: global.prevCloseIndex,
  homepage: global.homepage,
  ...uiSettings,
  loading,
}))
class BasicLayout extends React.Component {
  state = {
    rendering: true,
    isMobile: false,
    csrfLoaded: false,
  };

  constructor(props) {
    super(props);
    // this.getPageTitle = memoizeOne(this.getPageTitle);
    // this.getBreadcrumbNameMap = memoizeOne(this.getBreadcrumbNameMap, equals);
    this.breadcrumbNameMap = this.getBreadcrumbNameMap();
    // this.matchParamsPath = memoizeOne(this.matchParamsPath, equals);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      panes,
      activePane,
      children,
      dispatch,
      route,
      location,
      prevClosePane,
      prevCloseIndex,
    } = nextProps;
    const paneKey = location.pathname;
    const temp = location.search.length > 0 && location.search.indexOf('?') === -1 ? '?' : '';
    const paneUrl = paneKey + temp + location.search;
    const index = panes.findIndex(pane => pane.key === activePane);
    const urlParamFlag =
      panes[index] &&
      panes[index].key === paneKey &&
      !equals(fromQs(panes[index].url), fromQs(paneUrl));
    let prevClosePaneTemp = prevClosePane;
    if (activePane === undefined) {
      if (prevClosePane === paneUrl) {
        return null;
      }
      prevClosePaneTemp = '';
    }
    if (!panes.some(pane => pane.key === paneKey) || urlParamFlag) {
      const maxTab = 15;
      if (!urlParamFlag && panes.length >= maxTab) {
        createMessage({
          type: 'warn',
          description: `???????????????????????????: ${maxTab},?????????????????????`,
        });
        return null;
      }
      const memoizeBread = memoizeOne(getBreadcrumbNameMapStatic);
      const { locale = '' + '' } = getBreadcrumb(memoizeBread(route.routes), paneKey);
      if (urlParamFlag === undefined) {
        panes.splice(prevCloseIndex, 0, {
          key: paneKey,
          content: React.cloneElement(children, { key: paneUrl }),
          title: formatMessage({ id: locale, desc: paneKey }),
          url: paneUrl,
        });
      } else {
        panes.splice(urlParamFlag ? index : index + 1, urlParamFlag ? 1 : 0, {
          key: paneKey,
          content: React.cloneElement(children, { key: paneUrl }),
          title: formatMessage({ id: locale, desc: paneKey }),
          url: paneUrl,
        });
      }

      dispatch({
        type: 'global/updateState',
        payload: {
          panes: [...panes],
          activePane: paneKey,
          prevClosePane: prevClosePaneTemp,
        },
      });
    } else {
      dispatch({
        type: 'global/updateState',
        payload: {
          activePane: paneKey,
          prevClosePane: prevClosePaneTemp,
        },
      });
    }
    return null;
  }

  // componentWillMount() {
  //   const { dispatch } = this.props;
  // eslint-disable-next-line
  // console.warn(
  //   [
  //     '[EL-TIPS]: To developer - ',
  //     '\tThis will ONLY appear ONCE when trying enter main page. Hot module reload (HMR) may cause multiple executions when basic layout changes.',
  //     '\tSince React.js exec render() on every state updates, multiple logs appear in the same render() means state of designated component or in Redux has been updated that many times.',
  //     "\tDon't panic, sip some java and relax.",
  //   ].join('\n')
  // ); // hmm, ?????????????????????????????????????????????

  // ???????????????????????????????????????csrf

  // }

  componentDidMount() {
    const { dispatch } = this.props;
    tryInitAuth.call(this, dispatch);
    // ????????????
    dispatch({
      type: 'user/authChecking',
    }).then(principal => {
      // eslint-disable-next-line
      if (principal) {
        //??????????????????
        dispatch({
          type: 'user/getAvatarFn',
        });
        // ??????????????????
        // request auth permission menus
        dispatch({
          type: 'global/queryTenantAuthMenus',
        });
        // ??????????????????
        dispatch({
          type: 'global/querySysHomeConfig',
        });

        // ???????????? logo ???????????????????????????
        dispatch({
          type: 'global/querySysLogoAndExtension',
        });

        // ???????????????????????????
        dispatch({
          type: 'global/getPortalLocale',
        });
        // ????????????????????????
        dispatch({
          type: 'global/getPortalRemind',
        });

        // ????????????UI??????
        dispatch({
          type: 'uiSettings/getSetting',
        });

        principal === true
          ? window.location.reload()
          : (this.renderRef = requestAnimationFrame(() => {
              this.setState({
                rendering: false,
              });
            }));
      } else {
        reloadAuthorized();
        router.replace('/auth/login');
        window.location.reload();
        this.renderRef = requestAnimationFrame(() => {
          this.setState({
            rendering: false,
          });
        });
      }
    });

    this.enquireHandler = enquireScreen(mobile => {
      const { isMobile } = this.state;
      if (isMobile !== mobile) {
        this.setState({
          isMobile: mobile,
        });
      }
    });
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    // eslint-disable-next-line
    return !!this.state.csrfLoaded;
  }

  componentDidUpdate(preProps) {
    // After changing to phone mode,
    // if collapsed is true, you need to click twice to display
    this.breadcrumbNameMap = this.getBreadcrumbNameMap();
    const { isMobile } = this.state;
    const { collapsed } = this.props;
    if (isMobile && !preProps.isMobile && !collapsed) {
      this.handleMenuCollapse(false);
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.renderRef);
    unenquireScreen(this.enquireHandler);
  }

  // ???????????????????????????????????????
  getContext = () => {
    const {
      location,
      route: { routes },
    } = this.props;
    return {
      location,
      breadcrumbNameMap: this.getBreadcrumbNameMap(),
      breadcrumbNameMapUnlimited: this.getBreadcrumbNameMap(menuDataFormatter(routes)),
    };
  };

  getMenuData = meta => {
    const {
      route: { routes: umiRoutes },
      authRoutes,
    } = this.props;
    // tag:: for print routs2sql
    // ????????????????????????????????????????????????????????????????????????????????????????????????
    // const routes = [...umiRoutes]; // ???????????????????????????????????????
    const routes = mergeRoutes(authRoutes, umiRoutes); // ????????????????????????????????????????????????????????????????????????
    if (meta) {
      return menuDataFormatter(
        this.findWhichMenuShouldIUseUnderCurrentMeta(routes, meta),
        `${meta}/`,
        void 0,
        `ui.menu.${meta}`
      );
    }

    // Common situation
    return menuDataFormatter(routes);
  };

  /**
   * ?????????????????????
   * @param {Object} menuData ????????????
   */
  getBreadcrumbNameMap = routes => {
    const routerMap = {};
    const mergeMenuAndRouter = data => {
      data.forEach(menuItem => {
        if (menuItem.children) {
          mergeMenuAndRouter(menuItem.children);
        }
        // Reduce memory usage
        routerMap[menuItem.path] = menuItem;
      });
    };
    mergeMenuAndRouter(routes || this.getMenuData());
    return routerMap;
  };

  getSideMenu = metaNameSpace => {
    const filterMenuData = menuData =>
      menuData.map(item => ({
        ...item,
        children: item.children && filterMenuData(item.children),
      }));
    return filterMenuData(this.getMenuData(metaNameSpace));
  };

  // The truth lies within the sacred code befell - in a humble place the last child dwell.
  // - by Richard, with love.
  findWhichMenuShouldIUseUnderCurrentMeta = (routes, meta) =>
    (routes.filter(menu => menu.meta && menu.name === meta).pop() || {}).routes || [];

  matchParamsPath = pathname => {
    const pathKey = Object.keys(this.breadcrumbNameMap).find(key =>
      pathToRegexp(key).test(pathname)
    );
    return this.breadcrumbNameMap[pathKey];
  };

  getPageTitle = pathname => {
    const currRouterData = this.matchParamsPath(pathname);

    if (!currRouterData) {
      return 'TELEWORK ????????????';
    }
    const message = formatMessage({
      id: currRouterData.locale || currRouterData.name,
      defaultMessage: currRouterData.name,
    });
    return `${message} - TELEWORK ????????????`;
  };

  getLayoutStyle = () => {
    const { isMobile } = this.state;
    const { fixSiderbar, collapsed, layout } = this.props;
    if (fixSiderbar && layout !== 'topmenu' && !isMobile) {
      return {
        paddingLeft: collapsed ? '80px' : '220px',
      };
    }
    return null;
  };

  getContentStyle = () => {
    const { fixedHeader } = this.props;
    return {
      margin: '0',
      paddingTop: fixedHeader ? 48 : 0,
    };
  };

  handleMenuCollapse = collapsed => {
    const { dispatch } = this.props;
    dispatch({
      type: 'global/updateState',
      payload: {
        collapsed,
      },
    });
  };

  onTabChange = activeKey => {
    const { dispatch, panes } = this.props;
    const index = panes.findIndex(pane => pane.key === activeKey);
    const { url } = panes[index];

    // tab?????????????????????
    const refreshList = ['/user/flow/process', '/user/home', '/okr/okrMgmt/userHome'];
    const urlParam = fromQs(url);
    if (refreshList.findIndex(key => key === activeKey) > -1) {
      urlParam.refresh = new Date().getTime();
    }
    router.push({ pathname: activeKey, query: urlParam });

    // router.push(url);
    // dispatch({
    //   type: 'global/updateState',
    //   payload: {
    //     activePane: activeKey,
    //   },
    // });
    // window.history.pushState(undefined, '', url);
  };

  onTabEdit = (targetKey, action) => {
    const { dispatch, panes, activePane } = this.props;
    if (action === 'remove') {
      if (panes.length <= 1) {
        createMessage({ type: 'warn', description: '??????????????????,????????????' });
        return;
      }
      const index = panes.findIndex(pane => pane.key === targetKey);

      if (targetKey === activePane) {
        let activeIndex = 0;
        if (index === 0) {
          activeIndex = 1;
        } else {
          activeIndex = index + 1 >= panes.length ? panes.length - 2 : index - 1;
        }
        // activeKey = panes[activeIndex].key;
        const { key } = panes[activeIndex];
        panes.splice(index, 1);
        dispatch({
          type: 'global/updateState',
          payload: {
            panes,
            // activePane: activeKey,
          },
        });
        // window.history.pushState(undefined, '', url);
        this.onTabChange(key);
      } else {
        panes.splice(index, 1);
        dispatch({
          type: 'global/updateState',
          payload: {
            panes: [...panes],
          },
        });
      }
    }
  };

  // ??????tab??????
  handleTabControlClick = ({ key }) => {
    const currentPath = window.location.pathname + window.location.search;
    const { dispatch, panes, activePane } = this.props;
    const index = panes.findIndex(pane => pane.key === activePane);
    let activeKey;
    switch (key) {
      case 'curr': {
        if (panes.length <= 1) {
          createMessage({ type: 'warn', description: '??????????????????,????????????' });
          return;
        }
        let activeIndex = 0;
        if (index === 0) {
          activeIndex = 1;
        } else {
          activeIndex = index + 1 >= panes.length ? panes.length - 2 : index - 1;
        }
        activeKey = panes[activeIndex].key;
        const { url } = panes[activeIndex];
        panes.splice(index, 1);
        dispatch({
          type: 'global/updateState',
          payload: {
            panes,
            activePane: activeKey,
          },
        });
        window.history.pushState(undefined, '', url);
        break;
      }
      case 'other': {
        dispatch({
          type: 'global/updateState',
          payload: {
            panes: [panes[index]],
          },
        });
        break;
      }
      case 'reload': {
        const urlParam = fromQs();
        urlParam.refresh = new Date().getTime();
        router.push({ pathname: window.location.pathname, query: urlParam });
        break;
      }
      default:
        break;
    }
  };

  // ????????????????????????
  renderSettingDrawer() {
    // Do show SettingDrawer in production
    const { rendering } = this.state;
    if ((rendering || process.env.NODE_ENV === 'production') && APP_TYPE !== 'site') {
      return null;
    }
    return <SettingDrawer />;
  }

  render() {
    const {
      navTheme,
      layout: PropsLayout,
      children,
      location: { pathname },
      tabData,
      metaNameSpace, // = pathname.split('/')[1],
      loading,
      logoInfo,
      extensionInfo,
      tenantAuthRoutes,
      panes,
      activePane,
      homepage,
      dispatch,
    } = this.props;
    const { isMobile, rendering } = this.state;
    const isTop = PropsLayout === 'topmenu';
    // ????????????????????? ??????????????????ajax ??????????????????????????????????????????
    // ?????????tab?????????????????????????????????????????????????????????????????????????????????????????????
    // Header????????????context api???props????????????????????????
    // const menuData = this.getMenuData();
    const menuData = tenantAuthRoutes.map(temp => ({ ...temp, meta: true }));
    // eslint-disable-next-line
    // const scopedMenuData = metaNameSpace ? this.getSideMenu(metaNameSpace) : [];
    const filterMetaNav = menuData.filter(temp => temp.code === metaNameSpace);
    const scopedMenuData = filterMetaNav.length > 0 ? filterMetaNav[0].children : [];
    // const routerConfig = this.matchParamsPath(pathname);

    // const isAuthCheckDone = loading.effects['user/authChecking'] === false;
    // !! ??????????????? isAuthCheckDone ?????????PC???????????????????????????????????????????????????????????????????????????????????????????????????????????????
    // !! ???????????????????????????????????????????????????????????????????????????????????????rendering???????????????
    // !! ?????????authChecking
    // !! 1- ?????? ?????????????????????????????????????????????rendering??????false
    // !! 2- ?????? true??????????????????,rendering??????true????????????loading????????? window.location.reload() ????????????
    // !! ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????PC??????
    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={this.handleTabControlClick}>
        <Menu.Item key="reload">
          <Icon type="reload" />
          ????????????
        </Menu.Item>
        <Menu.Item key="curr">
          <Icon type="close" />
          ????????????
        </Menu.Item>
        <Menu.Item key="other">
          <Icon type="close" />
          ????????????
        </Menu.Item>
      </Menu>
    );
    const operations = (
      <Dropdown overlay={menu}>
        <a className={styles.tabsControl}>
          <Icon className={styles.iconPrimaryHover} type="down-square" />
        </a>
      </Dropdown>
    );
    return (
      <>
        <DocumentTitle title={this.getPageTitle(pathname)}>
          <ContainerQuery query={query}>
            {params => (
              <Context.Provider value={this.getContext()}>
                <div className={classNames(params)}>
                  {rendering ? (
                    <PageLoading />
                  ) : (
                    <Layout>
                      {isTop && !isMobile ? null : (
                        <SiderMenu
                          logo={logo}
                          Authorized={Authorized}
                          theme={navTheme}
                          onCollapse={this.handleMenuCollapse}
                          menuData={menuData}
                          scopedMenuData={scopedMenuData}
                          isMobile={isMobile}
                          logoInfo={logoInfo}
                          {...this.props}
                        />
                      )}
                      <Layout
                        style={{
                          ...this.getLayoutStyle(),
                          minHeight: '100vh',
                        }}
                      >
                        <Header
                          menuData={menuData}
                          scopedMenuData={scopedMenuData}
                          tabData={tabData}
                          handleMenuCollapse={this.handleMenuCollapse}
                          logo={logo}
                          isMobile={isMobile}
                          extensionInfo={extensionInfo}
                          {...this.props}
                        />
                        {/* ?????????????????? */}
                        <Layout.Content style={this.getContentStyle()}>
                          {/* ?????????Tab?????? URL?????????????????????????????????????????? ???TAB??????????????????????????????????????????state?????????key?????? */}
                          {/* React.cloneElement(children, { key: window.location.href }) */}
                          <Tabs
                            className={`${styles.tabsBarNew}`}
                            hideAdd
                            tabBarStyle={{
                              fontSize: '14px',
                              margin: '0 0 10px 0',
                              zIndex: '990',
                              position: 'fixed',
                              display: 'flex',
                            }}
                            onChange={this.onTabChange}
                            activeKey={activePane}
                            type="editable-card"
                            onEdit={this.onTabEdit}
                            tabBarExtraContent={operations}
                            tabBarGutter={0}
                          >
                            {panes.map(pane => (
                              <Tabs.TabPane
                                tab={pane.title}
                                key={pane.key}
                                closable={pane.key !== homepage}
                              >
                                {pane.content}
                              </Tabs.TabPane>
                            ))}
                          </Tabs>
                        </Layout.Content>
                        {/* <Footer /> */}
                      </Layout>
                    </Layout>
                  )}
                </div>
              </Context.Provider>
            )}
          </ContainerQuery>
        </DocumentTitle>
        {this.renderSettingDrawer()}
      </>
    );
  }
}

export default BasicLayout;
