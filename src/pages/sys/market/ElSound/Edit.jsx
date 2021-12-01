import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { formatMessage } from 'umi/locale';
import { isEmpty } from 'ramda';
import classnames from 'classnames';
import { Button, Form, Card, Input, Select, Radio, InputNumber } from 'antd';
import AsyncSelect from '@/components/common/AsyncSelect';
import { FileManagerEnhance, UdcSelect } from '@/pages/gen/field';

import { mountToTab, closeThenGoto } from '@/layouts/routerControl';
import PageHeaderWrapper from '@/components/layout/PageHeaderWrapper';
import FieldList from '@/components/layout/FieldList';
import RichText from '@/components/common/RichText';
import { fromQs } from '@/utils/stringUtils';
import { genFakeId } from '@/utils/mathUtils';
import ColorPic from './Color';

const { Field } = FieldList;
const DOMAIN = 'sysMarketElSoundEdit';
const { Option } = Select;
const RadioGroup = Radio.Group;

@connect(({ loading, dispatch, sysMarketElSoundEdit }) => ({
  loading,
  dispatch,
  sysMarketElSoundEdit,
}))
@Form.create({
  onValuesChange(props, changedValues) {
    if (!isEmpty(changedValues)) {
      props.dispatch({
        type: `${DOMAIN}/updateForm`,
        payload: changedValues,
      });
    }
  },
})
@mountToTab()
class elSoundEdit extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      artTitleColor: '#000000',
    };
  }

  componentDidMount() {
    const param = fromQs().id;
    const { dispatch } = this.props;
    dispatch({
      type: `${DOMAIN}/clearForm`,
    });
    dispatch({
      type: `${DOMAIN}/getDetails`,
      payload: param,
    });
  }

  handleSave = () => {
    const {
      form: { validateFieldsAndScroll },
      sysMarketElSoundEdit: { formData },
      dispatch,
    } = this.props;
    validateFieldsAndScroll((error, values) => {
      const param = fromQs().id;
      const { artThumb, ...params } = values;
      const { artTitleColor } = this.state;
      if (!error) {
        dispatch({
          type: `${DOMAIN}/save`,
          payload: { id: param, artTitleColor, ...params },
        });
      }
    });
  };

  handleCancel = () => {
    closeThenGoto('/plat/contentMgmt/elSound');
  };

  render() {
    const {
      loading,
      form,
      dispatch,
      sysMarketElSoundEdit: { formData },
      form: { getFieldDecorator, setFieldsValue, getFieldValue },
    } = this.props;
    const { artTitleColor } = this.state;
    const submitting = loading.effects[`${DOMAIN}/save`];

    this.setState({
      artTitleColor: formData.artTitleColor,
    });
    return (
      <PageHeaderWrapper>
        <Card className="tw-card-rightLine">
          <Button
            className="tw-btn-primary"
            type="primary"
            icon="save"
            size="large"
            disabled={submitting}
            onClick={this.handleSave}
          >
            {formatMessage({ id: `misc.save`, desc: '保存' })}
          </Button>
          <Button
            className={classnames('separate', 'tw-btn-default')}
            icon="undo"
            size="large"
            disabled={false}
            onClick={this.handleCancel}
          >
            {formatMessage({ id: `misc.rtn`, desc: '返回' })}
          </Button>
        </Card>
        <Card className="tw-card-adjust" bordered={false}>
          <FieldList getFieldDecorator={getFieldDecorator} col={2} legend="基本信息">
            <Field
              name="artTitle"
              label={formatMessage({ id: 'sys.market.elSound.artTitle', desc: '标题' })}
              decorator={{
                initialValue: formData.artTitle || '',
                rules: [{ required: true, message: '必填' }],
              }}
            >
              <Input
                placeholder="请输入标题"
                addonAfter={
                  <ColorPic
                    color={formData.artTitleColor || {}}
                    onChange={color => {
                      this.setState({
                        artTitleColor: color,
                      });
                      dispatch({
                        type: `${DOMAIN}/updateForm`,
                        payload: {
                          artTitleColor: color,
                        },
                      });
                    }}
                  />
                }
              />
            </Field>
            <Field
              name="artSubTitle"
              label={formatMessage({ id: 'sys.market.elSound.abstract', desc: '摘要' })}
              decorator={{
                initialValue: formData.artSubTitle || '',
              }}
            >
              <Input placeholder="请输入摘要" />
            </Field>
            <Field
              name="categoryCode"
              label={formatMessage({ id: 'sys.market.elSound.category', desc: '分类' })}
              decorator={{
                initialValue: formData.categoryCode || '',
              }}
            >
              <UdcSelect code="OPE:ARTICLE_CATEGORY_CODE" placeholder="请选择分类" />
            </Field>
            <Field
              name="artType"
              label={formatMessage({ id: 'sys.market.elSound.type', desc: '类型' })}
              decorator={{
                initialValue: formData.artType || '',
              }}
            >
              <UdcSelect code="OPE:ARTICLE_TYPE" placeholder="请选择类型" />
            </Field>
            <Field
              name="artUrl"
              label={formatMessage({ id: 'sys.market.elSound.link', desc: '链接' })}
              decorator={{
                initialValue: formData.artUrl || '',
              }}
            >
              <Input placeholder="请输入链接" />
            </Field>
            <Field
              name="artAuthor"
              label={formatMessage({ id: 'sys.market.elSound.auth', desc: '作者' })}
              decorator={{
                initialValue: formData.artAuthor || '',
              }}
            >
              <Input placeholder="请输入作者" />
            </Field>
            <Field
              name="artSource"
              label={formatMessage({ id: 'sys.market.elSound.artSource', desc: '来源' })}
              decorator={{
                initialValue: formData.artSource || '',
              }}
            >
              <Input placeholder="请输入来源" />
            </Field>
            <Field
              name="artOrtop"
              label={formatMessage({ id: 'sys.market.elSound.isTop', desc: '是否置顶' })}
              decorator={{
                initialValue: formData.artOrtop || '',
              }}
            >
              <RadioGroup initialValue={formData.artOrtop || ''}>
                <Radio value={1}>是</Radio>
                <Radio value={0}>否</Radio>
              </RadioGroup>
            </Field>
            <Field
              name="artSort"
              label={formatMessage({ id: 'sys.market.elSound.sort', desc: '排序' })}
              decorator={{
                initialValue: formData.artSort || '',
              }}
            >
              <InputNumber className="x-fill-100" placeholder="请输入排序" />
            </Field>
            <Field
              name="readCount"
              label={formatMessage({ id: 'sys.market.elSound.readNum', desc: '阅读次数' })}
              decorator={{
                initialValue: formData.readCount || '',
              }}
            >
              <InputNumber className="x-fill-100" placeholder="请输入阅读次数" />
            </Field>
            <Field name="artThumb" label="缩略图">
              <FileManagerEnhance
                api="/api/op/v1/article/sfs/token"
                listType="text"
                disabled={false}
                multiple={false}
                dataKey={formData.id}
              />
            </Field>
            <Field
              presentational
              labelCol={{ span: 4, xxl: 3 }}
              wrapperCol={{ span: 22, xxl: 22 }}
              style={{ color: 'red' }}
            >
              附件要求：支持*.jpg, *.gif, *.png，尺寸为500*500，文件最大1MB。
            </Field>
            <Field
              name="remark"
              label={formatMessage({ id: 'sys.system.remark', desc: '备注' })}
              fieldCol={1}
              labelCol={{ span: 4, xxl: 3 }}
              wrapperCol={{ span: 19, xxl: 20 }}
              decorator={{
                initialValue: formData.remark || '',
              }}
            >
              <Input.TextArea rows={3} placeholder="请输入备注" />
            </Field>
            {formData.artContent && (
              <Field
                name="artContent"
                label={formatMessage({ id: 'sys.market.elSound.artContent', desc: '文章内容' })}
                fieldCol={1}
                labelCol={{ span: 4, xxl: 3 }}
                wrapperCol={{ span: 19, xxl: 20 }}
                decorator={{
                  initialValue: formData.artContent,
                }}
              >
                <RichText />
              </Field>
            )}
          </FieldList>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default elSoundEdit;
