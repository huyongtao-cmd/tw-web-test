/* eslint-disable no-nested-ternary */
import React, { Component } from 'react';
import { connect } from 'dva';
import fetch from 'dva/fetch';
import $ from 'jquery';
import { Card, Col, Row } from 'antd';
import { isEmpty } from 'ramda';
import createMessage from '@/components/core/AlertMessage';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import Title from '@/components/layout/Title';

const DOMAIN = 'yeeDoc';

// eslint-disable-next-line no-undef
const yeeDocHttps = `${YEE_DOC_URL}PUAService/V1_0/Menu/Tree`;

@connect(({ user: { user }, dispatch, yeeDoc, loading }) => ({
  user,
  dispatch,
  ...yeeDoc,
  loading,
}))
class Panel extends Component {
  state = {
    menuList: [],
  };

  componentDidMount() {
    const {
      dispatch,
      user: {
        info: { login },
      },
    } = this.props;

    fetch(yeeDocHttps, {
      method: 'POST',
      // 'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Credentials': true,
      mode: 'cors',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        AppCode: 'YeeDocx',
        LoginName: 'administrator',
      }),
    }).then(res => {
      if (res) {
        res
          ?.json()
          .then(resDate => {
            if (resDate.Code === 0) {
              this.setState({
                menuList: Array.isArray(resDate.Data) ? resDate.Data : [],
              });
            } else {
              createMessage({ type: 'error', description: resDate.Msg || '获取易稻壳数据失败！' });
            }
          })
          .catch(data => {
            createMessage({ type: 'error', description: '获取易稻壳数据失败！' });
          });
      } else {
        createMessage({ type: 'error', description: '获取易稻壳数据失败！' });
      }
    });
  }

  render() {
    const { menuList } = this.state;

    return (
      <PageHeaderWrapper title="易稻壳面板">
        <Card
          className="tw-card-adjust"
          bordered={false}
          title={
            <Title
              icon="profile"
              text={
                // eslint-disable-next-line
                <a className="tw-link" href={YEE_DOC_URL} target="_blank">
                  易稻壳-文档管理系统
                </a>
              }
            />
          }
        >
          {!isEmpty(menuList) ? (
            menuList.map(v => (
              <Card
                title={v.CName || '-'}
                bodyStyle={{
                  padding: 0,
                }}
                headStyle={{
                  fontWeight: 'bolder',
                }}
                key={v.Code}
                style={{
                  marginBottom: '15px',
                }}
              >
                <Row type="flex" justify="start" align="flex-start" gutter={8}>
                  {Array.isArray(v.Children) ? (
                    v.Children.map(item => (
                      <Col key={item.Code} span={12}>
                        <Card type="inner" title={item.CName}>
                          <ul className="tw-styled-list">
                            {Array.isArray(item.Children) ? (
                              item.Children.map(item1 => (
                                <li key={item1.Code}>
                                  <a
                                    className="tw-link"
                                    // eslint-disable-next-line
                                    href={`${YEE_DOC_URL}${item1.Url}`}
                                    // eslint-disable-next-line react/jsx-no-target-blank
                                    target="_blank"
                                  >
                                    {item1.CName || '-'}
                                  </a>
                                </li>
                              ))
                            ) : (
                              <span>暂无数据</span>
                            )}
                          </ul>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <span>暂无数据</span>
                  )}
                </Row>
              </Card>
            ))
          ) : (
            <span>暂无数据</span>
          )}
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Panel;
