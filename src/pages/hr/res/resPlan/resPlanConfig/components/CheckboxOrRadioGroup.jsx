import React, { PureComponent, Fragment } from 'react';
import { Checkbox, Radio } from 'antd';
import { queryUdc } from '@/services/gen/app';
import { type, isEmpty, equals, isNil } from 'ramda';
import { strToHump } from '@/utils/stringUtils';

const listAddValue = list => list.map(v => ({ ...v, changeName: strToHump(v.code) }));

const valueAddMap = (list = []) => {
  let value = {};
  listAddValue(list).forEach((v, i) => {
    value = { ...value, [v.changeName]: { value01: 'N', value02: null } };
  });
  return value;
};

class CheckboxOrRadioGroup extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
      valueMap: {},
      valueMapCopy: {},
    };
  }

  componentDidMount() {
    const { udcCode: code, value = {} } = this.props;
    queryUdc(code).then(res => {
      if (res.status === 200 && Array.isArray(res.response)) {
        this.setState({
          list: listAddValue(res.response),
          valueMap: !isNil(value) && !isEmpty(value) ? value : valueAddMap(res.response),
          valueMapCopy: valueAddMap(res.response),
        });
      }
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (snapshot !== null) {
      setTimeout(() => {
        this.setState({ valueMap: snapshot });
      }, 0);
    }
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    const { value = {} } = this.props;
    if (!equals(prevState.valueMap, value)) {
      return value;
    }
    return null;
  }

  handleChange = (value, name) => {
    const { valueMap } = this.state;
    const { onChange } = this.props;
    type(onChange) === 'Function' &&
      onChange({ ...valueMap, [name]: { ...valueMap[name], value01: value } });
  };

  handleChange1 = (value, name) => {
    const { valueMapCopy } = this.state;
    const { onChange } = this.props;
    type(onChange) === 'Function' &&
      onChange({ ...valueMapCopy, [name]: { ...valueMapCopy[name], value01: value } });
  };

  render() {
    const { list, valueMap } = this.state;
    const { moduleType, disabled = false } = this.props;
    return (
      <>
        {moduleType === 'checkbox' &&
          list.map(v => (
            <div key={v.code}>
              <Checkbox
                onChange={e => {
                  this.handleChange(e.target.checked ? 'Y' : 'N', v.changeName);
                }}
                checked={v?.changeName && valueMap[(v?.changeName)]?.value01 === 'Y'}
                disabled={disabled}
              >
                {v.name}
              </Checkbox>
            </div>
          ))}
        {moduleType === 'radio' &&
          list.map(v => (
            <div key={v.code}>
              <Radio
                onChange={e => {
                  this.handleChange1(e.target.checked ? 'Y' : 'N', v.changeName);
                }}
                checked={v?.changeName && valueMap[(v?.changeName)]?.value01 === 'Y'}
                disabled={disabled}
              >
                {v.name}
              </Radio>
            </div>
          ))}
      </>
    );
  }
}

export default CheckboxOrRadioGroup;
