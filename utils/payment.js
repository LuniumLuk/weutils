/**
 * WeUtils 微信小程序常用工具库
 * 
 * 微信小程序拉起微信支付
 * 
 * + requestPay()
 * + priceNumToStr()
 * + priceStrToNum()
 */

const WXPAY_CD = 1000;

/**
 * 处理微信支付通用方法
 * @param options 服务器返回的支付参数
 * @param success 支付成功回调函数
 * @param fail    支付失败回调函数
 */
export function requestPay(options, handle_success = () => { }, handle_fail = () => { }) {
  // 处理过高频率的发起微信支付
  if (this.wxpay_lock) {
    return;
  }
  this.wxpay_lock = true;
  setTimeout(() => {
    this.wxpay_lock = false;
  }, WXPAY_CD);

  const pay_correct = options.wxpay_correct;
  const pay_params = options.wxpay_params;
  const error_msg = options.wxpay_error_msg;
  if (!pay_correct) {
    console.warn("微信支付：支付异常", error_msg);
    handle_fail();
    return;
  }
  wx.requestPayment({
    ...pay_params,
    success: () => {
      console.log("微信支付：支付成功");
      handle_success();
    },
    fail: err => {
      if (err.errMsg == "requestPayment:fail cancel") {
        console.warn("微信支付：支付未完成", err);
      } else {
        console.warn("微信支付：支付异常", err);
      }
      handle_fail();
    }
  })
};

/**
 * 转换数字价格到字符串，比如2550 -> "25.50"
 * @param {Number} num 价格，单位为分
 */
export function priceNumToStr(num) {
  const yuan = Math.floor(num / 100);
  const fen = price % 100;
  return `${yuan}.${fen < 10 ? '0' + fen : fen}`;
};

/**
 * 转换字符串价格到数字，比如"25.50" -> 2550
 * @param {Number} price 价格
 */
export function priceStrToNum(price) {
  const split = price.split(".");
  return parseInt(split[0]) * 100 + parseInt(split[1]);
};