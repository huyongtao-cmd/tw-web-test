import math from 'mathjs';
import { compose, curry, fromPairs, keys } from 'ramda';



/**
 * Get a random floating point number between `min` and `max`.
 *
 * @param {number} min - min number
 * @param {number} max - max number
 * @param {number} precision - float point
 * @return {String} a random floating point number
 */
const getRandomFlt = ({ min = 0, max = 1, precision = 2 }) => {
  return (Math.random() * (max - min) + min).toFixed(precision);
};

/**
 * Get a random integer between `min` and `max`.
 *
 * @param {number} min - min number
 * @param {number} max - max number
 * @return {string} a random integer
 */
const getRandomInt = ({ min, max }:any) => getRandomFlt({ min, max, precision: 0 });




/**
 * 生成一个不重复的ID(数字类型，以便于后端接收)
 * 该方法与stringUtils中的getUid不可混用
 * TODO 看到下面的两行注释了吗，可以放开来做一些测试。这玩意的声明周期就是当前用户访问网页开始 最大生成ID条数不能超过255条（否则会重复）
 */
const genFakeId = (sign = 1) => sign * ~~(Math.random() * 100000000);
// const idProvider = IdProvider.getInstance();
// const genFakeId = sign => idProvider.nextId(sign);


export {
  getRandomInt,
  getRandomFlt,
  genFakeId,
};
