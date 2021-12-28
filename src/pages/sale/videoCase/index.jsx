import React from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import { Card, Col, Form, Input, Row, Button, Avatar, Tag, Tooltip } from 'antd';
import { formatMessage, FormattedMessage } from 'umi/locale';

import { mountToTab, markAsTab } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import TreeSearch from '@/components/common/TreeSearch';
import Loading from '@/components/core/DataLoading';
import { Selection } from '@/pages/gen/field';
import { getUrl } from '@/utils/flowToRouter';
import { stringify } from 'qs';
import styles from './index.less';

// --------------- 需要的数据写在这里,或者由数据文件import进来 -----------------

const DOMAIN = 'videoCase';

const { Field } = FieldList;

const searchModel = {
  vnoOrVNameVDesc: null, // 关键字
  tagIds: null, // 标签
  vcat1: null,
};

/**
 * 公共空白模版页面
 */
@connect(({ loading, videoCase }) => ({
  loading: loading.effects[`${DOMAIN}/fetch`],
  treeLoading: loading.effects[`${DOMAIN}/getTagTree`],
  videoCase,
  // loading: loading.effects['namespace/submodule'], // 菊花旋转等待数据源(领域空间/子模块)
}))
@Form.create({
  onFieldsChange(props, changedFields) {
    const key = Object.keys(changedFields)[0];
    const { value } = Object.values(changedFields)[0];

    searchModel[key] = value;
  },
})
@mountToTab()
class VideoCase extends React.PureComponent {
  /**
   * 渲染完成后要做的事情
   */
  componentDidMount() {
    const { dispatch } = this.props;
    // 客户标签数据
    dispatch({
      type: `${DOMAIN}/getTagTree`,
      payload: { key: 'TAG' },
    });
    // 视频大类、视频小类、服务属性
    dispatch({
      type: `${DOMAIN}/selectVideoDrop`,
    });

    // this.fetchPageData();
  }

  // --------------- 剩下的私有函数写在这里 -----------------

  fetchPageData = params => {
    const { dispatch } = this.props;
    searchModel.limit = 0;
    dispatch({
      type: `${DOMAIN}/fetch`,
      payload: searchModel,
    });
  };

  onCheck = (checkedKeys, info, parm3, param4) => {
    const { dispatch } = this.props;
    const allCheckedKeys = checkedKeys.concat(info.halfCheckedKeys);
    this.updateModelState({ checkedKeys, allCheckedKeys });
    searchModel.tagIds = allCheckedKeys.length > 0 ? allCheckedKeys.join(',') : '';
    searchModel.limit = 0;
    dispatch({
      type: `${DOMAIN}/fetch`,
      payload: searchModel,
    });
  };

  updateModelState = params => {
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/updateState`,
      payload: params,
    });
  };

  // --------------- 私有函数区域结束 -----------------

  /**
   * 交给React渲染页面的函数
   * @return {React.ReactElement}
   */
  render() {
    const {
      form: { getFieldDecorator },
      treeLoading,
      videoCase: {
        list,
        vCat1List, // 视频大类数据
        tagTree, // 标签数据
        checkedKeys, // 选中的标签
      },
    } = this.props;

    // let defaultSelectVcat1 = 'xxx';
    // const map = vCat1List.filter(vCat1 => vCat1.catDesc === '客户合同案例').map(vCat1 =>vCat1.catVal);
    // if(map && map.length >0){
    //   defaultSelectVcat1 = map[0];
    // }

    return (
      <PageHeaderWrapper
        title={
          /* 页面标题: 把注释写在后面 */
          <FormattedMessage id="ui.menu.demo.case" defaultMessage="页面标题 - 使用国际化标签" />
        }
      >
        <Row gutter={12}>
          <Col lg={6} md={24}>
            {!treeLoading ? (
              <TreeSearch
                className="bg-white p-b-5"
                checkable
                // checkStrictly
                showSearch={false}
                treeData={tagTree}
                defaultExpandedKeys={tagTree.map(item => `${item.id}`)}
                checkedKeys={checkedKeys}
                onCheck={this.onCheck}
              />
            ) : (
              <Loading />
            )}
          </Col>
          <Col lg={18} md={24}>
            <Card className="tw-card-adjust" bordered={false}>
              {/* 循环一下，可能有多个，或者写死 */}
              <Row>
                <Col span={20}>
                  <FieldList layout="horizontal" getFieldDecorator={getFieldDecorator} col={2}>
                    <Field name="vnoOrVNameVDesc" label="关键字">
                      <Input placeholder="请输入关键字" />
                    </Field>
                    <Field
                      name="vcat1"
                      label="视频大类"
                      // decorator={{
                      //   initialValue: defaultSelectVcat1,
                      // }}
                    >
                      <Selection
                        className="x-fill-100"
                        source={vCat1List}
                        // disabled={true}
                        transfer={{ key: 'catVal', code: 'catVal', name: 'catDesc' }}
                        dropdownMatchSelectWidth={false}
                        showSearch
                        onColumnsChange={value => {}}
                        placeholder={`请选择视频大类`}
                      />
                    </Field>
                  </FieldList>
                </Col>
                <Col offset={1} span={3}>
                  <Button className="tw-btn-primary" onClick={this.fetchPageData}>
                    查询
                  </Button>
                </Col>
              </Row>
            </Card>
            <br />

            <Card className={['tw-card-adjust', styles.productList].join(' ')} bordered={false}>
              {list.map(item => (
                <Card.Grid
                  className={styles.productGrid}
                  key={item.id}
                  onClick={() => {
                    const urls = getUrl();
                    const from = stringify({ from: urls });
                    router.push(`/sale/productHouse/showHomePage/view?id=${item.id}&${from}`);
                  }}
                >
                  <Card.Meta
                    className={styles.meta}
                    avatar={
                      <Avatar
                        shape="square"
                        size={64}
                        src={
                          item.logoFile
                            ? `data:image/jpeg;base64,${item.logoFile}`
                            : '/el-logo-product.png'
                        }
                      />
                    }
                    title={
                      <div className={styles.gridLine}>
                        <Tooltip placement="top" title={item.vname || undefined}>
                          <div className={styles['gridLine-main']}>
                            {item.vname || '- 暂无名称 -'}
                          </div>
                        </Tooltip>
                        {/* <Tag className={styles['gridLine-right']} color="red">
                          {item.tagDesc || '- 空 -'}
                        </Tag> */}
                      </div>
                    }
                    description={item.introduce || '- 暂无产品简介 -'}
                  />
                  <div className={styles.gridLine}>
                    {item.className && <Tag color="gold">{item.className || ''}</Tag>}
                    {item.buName && (
                      <Tag className={styles['gridLine-right']} color="Blue">
                        {item.buName || '- 无所属BU -'}
                      </Tag>
                    )}
                  </div>
                </Card.Grid>
              ))}
            </Card>
          </Col>
        </Row>
      </PageHeaderWrapper>
    );
  }
}

export default VideoCase;
