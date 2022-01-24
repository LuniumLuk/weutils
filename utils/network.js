/**
 * WeUtils 微信小程序常用工具库
 * 
 * 网络请求模块
 * 
 * + globalErrorHandler()
 * + prereq()
 * + get()
 * + post()
 * + put()
 * + del()
 */

const DEBUG = false; // console.log打印DEBUG信息
const RETRY_INTERVAL = 1000; // 当前置条件不满足时的重试发送请求间隔

/**
 * 全局网络请求错误处理
 * @param error 网络请求的错误返回
 */
export function globalErrorHandler(error) {
  // 在这里进行全局网络请求错误处理
}

/**
 * 判断发送网络请求的前置条件是否满足
 * 可在这里处理：
 * - 微信小程序登陆
 * - 获取服务端Token
 * - 判断网络情况
 * @returns {Boolean}
 */
export function prereq() {
  // 在这里处理网络请求前置条件，若返回false，当前的网络请求将被暂时搁置
  return true;
}

/**
 * 发送GET请求
 * @param url     请求路径 必填
 * @param data    请求参数 GET请求的参数会自动拼到地址后面
 * @param headers 请求头 选填
 * @param ttl     当前置条件未满足时的尝试次数 选填
 * @returns {Promise}
 */
export function get(url, data = {}, headers, ttl = 5) {
  request("GET", url, data, headers, ttl);
}
/**
 * 发送POST请求
 * @param url     请求路径 必填
 * @param data    请求参数
 * @param headers 请求头 选填
 * @param ttl     当前置条件未满足时的尝试次数 选填
 * @returns {Promise}
 */
export function post(url, data = {}, headers, ttl = 5) {
  request("POST", url, data, headers, ttl);
}
/**
 * 发送PUT请求
 * @param url     请求路径 必填
 * @param data    请求参数
 * @param headers 请求头 选填
 * @param ttl     当前置条件未满足时的尝试次数 选填
 * @returns {Promise}
 */
export function put(url, data = {}, headers, ttl = 5) {
  request("PUT", url, data, headers, ttl);
}
/**
 * 发送DELETE请求
 * @param url     请求路径 必填
 * @param data    请求参数 DELETE请求的参数会自动拼到地址后面
 * @param headers 请求头 选填
 * @param ttl     当前置条件未满足时的尝试次数 选填
 * @returns {Promise}
 */
export function del(url, data = {}, headers, ttl = 5) {
  request("DELETE", url, data, headers, ttl);
}

/**
 * 网络请求基类方法
 * @param method  请求方法 必填
 * @param url     请求路径 必填
 * @param data    请求参数 选填
 * @param header  请求头 选填
 * @param ttl     当前置条件未满足时的尝试次数 必填
 * @returns {Promise}
 */
function request(method, url, data, header = { "Content-Type": "application/json" }, ttl) {
  return new Promise((resolve, reject) => {
    if (prereq()) {
      _request(resolve, reject, url, method, data, header);
    } else {
      if (!this.pending_reqs) {
        this.pending_reqs = [{
          resolve, reject, url, method, data, header, ttl,
        }];
      } else {
        this.pending_reqs.push({
          resolve, reject, url, method, data, header, ttl,
        });
      }
      if (!this.pending_timer) {
        this.pending_timer = setInterval(() => {
          this.pending_reqs.forEach((item, index) => {
            item.ttl -= 1;
            if (prereq()) {
              _request(item.resolve, item.reject, item.url, item.method, item.data, item.header);
              this.pending_reqs.splice(index, 1);
            }
          });
          if (this.pending_reqs.length == 0) {
            clearInterval(this.pending_timer);
            this.pending_timer = null;
          }
        }, RETRY_INTERVAL);
      }
    }
  });
}

/**
 * 发送微信小程序网络请求
 * @param url 请求路径
 * @param method 请求方法
 * @param data 请求参数
 * @param header 请求头
 * @returns {Promise}
 */
function _request(resolve, reject, url, method, data, header) {
  const response = {};
  wx.request({
    url, method, data, header,
    success: res => {
      const code = res.statusCode.toString();
      if (code.startsWith("2")) {
        response.success = res.data || true;
      } else {
        response.fail = { ...res, ...res.data, url };
      }
    },
    fail: error => {
      response.fail = { ...error, url };
    },
    complete: () => {
      if (DEBUG) {
        if (response.success)
          console.groupCollapsed(`发送网络请求：${method} ${url} <成功>`);
        else
          console.groupCollapsed(`发送网络请求：${method} ${url} >>失败<<`);
        if (data) console.info("参数：", data);
        if (header) console.log("请求头：", header);
      }
      if (response.success) {
        if (DEBUG) console.info("请求成功：", response.success);
        resolve(response.success);
      } else {
        if (DEBUG) console.warn("请求失败：", response.fail);
        // 通用错误处理
        globalErrorHandler(response.fail);
        reject(response.fail);
      }
      if (DEBUG) console.groupEnd();
    }
  });
}
