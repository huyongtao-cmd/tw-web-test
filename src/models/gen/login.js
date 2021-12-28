import router from 'umi/router';
import { formatMessage } from 'umi/locale';
import { stringify } from 'qs';
import { isEmpty } from 'ramda';
import { accountLogin, accountLoginToken, accountlogout, fetchCaptcha } from '@/services/gen/app';
import { getHomeConfigList } from '@/services/sys/system/homeConfig';
import { setAuthority } from '@/utils/authUtils';
import { fromQs } from '@/utils/stringUtils';
import { reloadAuthorized } from '@/layouts/Authorized';
import { createNotify } from '@/components/core/Notify';
import { setAuthToken } from '@/utils/networkUtils';
//对生成的token进行加密：使用 Base64
import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';

export default {
  namespace: 'login',

  state: {
    status: void 0,
    captcha: void 0,
  },

  effects: {
    *login({ payload }, { call, put }) {
      const { response, code, status } = yield call(accountLogin, payload);
      yield put({
        type: 'changeLoginStatus',
        payload: {
          ...response,
          status: 'ok',
          currentAuthority: 'admin',
        },
      });
      if (status === 100) {
        // abort request
      }
      // Login successfully
      else if (code === 'OK') {
        reloadAuthorized();
        const tokenResponse = yield call(accountLoginToken);

        if (tokenResponse.status === 200) {
          const token = tokenResponse.code;
          const { autoLogin } = payload;
          autoLogin && setAuthToken(token);
        }

        const { status: sts, response: res } = yield call(getHomeConfigList, payload);
        const { returnurl } = payload;

        if (sts === 100) {
          return;
        }
        if (sts === 200 && res.ok) {
          const { datum = [] } = res;
          if (Array.isArray(datum) && !isEmpty(datum)) {
            const defaultHomePage = datum.filter(v => v.wbStatus === 'YES');

            if (!isEmpty(returnurl) && returnurl !== undefined) {
              let decodeReturnurl = decodeURIComponent(returnurl);
              // 对生成的token(ticket)进行加密：使用 Base64
              const encoderTicket = Base64.stringify(Utf8.parse(tokenResponse.code));
              const ret = decodeReturnurl.indexOf('?');
              if (ret === -1) {
                window.location.href = decodeReturnurl + '?ticket=' + encoderTicket;
              } else {
                const len = decodeReturnurl.length;
                const first = decodeReturnurl.indexOf('?');
                decodeReturnurl = decodeReturnurl.replaceAll('?', '&');
                const url =
                  decodeReturnurl.substring(0, first) +
                  '?ticket=' +
                  encoderTicket +
                  decodeReturnurl.substring(first, len);
                window.location.href = url;
              }
              return;
            }

            if (!isEmpty(defaultHomePage)) {
              router.replace(defaultHomePage[0].wbLink || '/');
              return;
            }
          }
        }

        // 这是原来的逻辑,前面邏輯未找到對應的首頁，則繼續執行原來的邏輯
        const urlParams = new URL(window.location.href);
        const params = fromQs();
        let { redirect } = params;
        if (redirect) {
          const redirectUrlParams = new URL(redirect);
          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);
            if (redirect.startsWith('/#')) {
              redirect = redirect.substr(2);
            }
          } else {
            window.location.href = redirect;
            return;
          }
        }
        router.replace(redirect || '/');
      } else {
        createNotify({ title: 'login.ng', code: `login.${code}`, type: 'error' });
        // 登录失败刷新验证码
        yield put({ type: 'getCaptcha' });
      }
    },

    *getCaptcha({ payload }, { call, put }) {
      const { response } = yield call(fetchCaptcha, payload);
      // console.log('captcha resp ->', response);
      yield put({
        type: 'updateCaptcha',
        payload: isEmpty(response) ? undefined : response,
      });
    },

    *logout(_, { put, call }) {
      yield call(accountlogout);
      yield put({
        type: 'changeLoginStatus',
        payload: {
          status: false,
          currentAuthority: 'guest',
        },
      });
      reloadAuthorized();
      return router.push({
        pathname: '/auth/login',
        // 主动登出，不记录 redirect
        // search: stringify({
        //   redirect: window.location.href,
        // }),
      });
    },

    // 单纯调一下登出接口，不跳转至登录页
    *logoutOnly(_, { put, call }) {
      yield call(accountlogout);
      yield put({
        type: 'changeLoginStatus',
        payload: {
          status: false,
          currentAuthority: 'guest',
        },
      });
      reloadAuthorized();
    },

    *relogin(_, { put }) {
      yield router.push({
        pathname: '/auth/login',
        // search: stringify({
        //   redirect: window.location.href,
        // }),
      });
    },
  },

  reducers: {
    updateCaptcha(state, { payload }) {
      return {
        ...state,
        captcha: payload,
      };
    },
    changeLoginStatus(state, { payload }) {
      setAuthority(payload.currentAuthority);
      return {
        ...state,
        status: payload.status,
        type: payload.type,
      };
    },
  },
};
