/**
 * WeUtils 微信小程序常用工具库
 * 
 * Canvas处理类
 */

class CanvasHandler {
  /**
   * CanvasHandler
   * @constructor
   * @param {String} id Canvas ID
   * @param {Object} page Miniprogram Page Object
   * @param {Number} width Logical width for canvas
   * @param {Number} height Logical height for canvas
   */
  constructor(id, page, width = null, height = null) {
    this._logical_W = width;
    this._logical_H = height;
    this._canvas = null;
    this._ctx = null;

    return this._initCanvas(id, page);
  }

  _initCanvas(id, page) {
    return new Promise((resolve) => {
      page.createSelectorQuery().select(id).fields({
        node: true,
        size: true,
      }).exec(res => {
        const width = res[0].width;
        const height = res[0].height;
        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Scale Canvas Context
        if (this._logical_H === null || this._logical_W === null) {
          ctx.scale(1, 1);
          this._logical_H = canvas.height;
          this._logical_W = canvas.width;
        } else {
          ctx.scale(canvas.width / this._logical_W, canvas.height / this._logical_H);
        }
        this._ctx = ctx;
        this._canvas = canvas;
        this._physical_W = canvas.width;
        this._physical_H = canvas.height;

        resolve(this);
      });
    });
  }

  get isReady() {
    return this._ctx != null;
  }

  get canvas() {
    return this._canvas;
  }

  get ctx() {
    return this._ctx;
  }

  /** 
   * Draw filled polygons on canvas
   * @param {Object} ctx Canvas Context 2D
   */
  drawPolygon(polygon, ctx = this._ctx) {
    ctx.save();
    ctx.beginPath();
    polygon.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(...pt);
      else ctx.lineTo(...pt);
    });
    ctx.fill();
    ctx.restore();
  }

  /**
   * Clear Canvas Context
   * @param {Object} ctx Canvas Context 2D
   */
  clearCanvas(ctx = this._ctx) {
    ctx.clearRect(0, 0, this._logical_W, this._logical_H);
  }

  /**
   * Get Temp Image File Path for Current Canvas
   * @param {Object} ctx Canvas Context 2D
   * @param {Number} w Export Image Width
   * @param {Number} h Export Image Height
   */
  getTempFilePath(canvas = this._canvas, w = this._physical_W, h = this._physical_H) {
    return new Promise((resolve) => {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: this._logical_W,
        height: this._logical_H,
        destWidth: w,
        destHeight: h,
        canvas: canvas,
        success: res => {
          resolve(res.tempFilePath);
        },
        fail: err => {
          throw Error(err);
        },
      });
    });
  }

  get logicalWidth() {
    return this._logical_W;
  }
  get logicalHeight() {
    return this._logical_H;
  }
  get physicalHeight() {
    return this._physical_H;
  }
  get physicalWidth() {
    return this._physical_W;
  }

  /**
   * 绘制文字
   * @param {String} text 文字内容
   * @param {Number} x 文字横坐标
   * @param {Number} y 文字纵坐标
   * @param {String} color 文字颜色 接受Hex颜色和CSS颜色名
   * @param {Number} size 字体大小 单位：px
   * @param {String} align 对齐方式：left right center
   * @param {String} baseline 设置文字的竖直对齐：normal top bottom middle
   * @param {String} weight 字重： normal bold lighter bolder
   * @param {Object} ctx CanvasContext对象
   */
  drawText({
    text, x, y, color = "black", size = 10, align = "left", baseline = "normal", weight = "normal", ctx = this._ctx, font = "sans-serif",
  }) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawRoundRect({
    x, y, w, h, r, color = "#000000", ctx = this._ctx,
  }) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 绘制图片
   * @param {String} url 图片地址/图片数据
   * @param {Number} x 绘制起点横坐标 px
   * @param {Number} y 绘制起点纵坐标 px
   * @param {Number} w 绘制宽度 px
   * @param {Number} h 绘制高度 px
   * @param {Boolean} data 是否是图片数据格式
   * @param {Object} canvas Canvas对象
   * @param {Object} ctx CanvasContext对象
   */
  drawImage({
    url, x, y, w, h, data = false, canvas = this._canvas, ctx = this._ctx
  }) {
    return new Promise((resolve, reject) => {
      let img = canvas.createImage();
      let clip_size = null;
      img.onload = () => {
        console.log("图片加载成功");
        // ctx.save();
        if (clip_size) {
          ctx.drawImage(img, clip_size.x, clip_size.y, clip_size.w, clip_size.h, x, y, w, h);
        } else {
          ctx.drawImage(img, x, y, w, h);
        }
        // ctx.restore();
        resolve();
      };
      img.onerror = err => {
        console.log("图片绘制错误", err);
        resolve(err);
      }

      if (data) {
        console.log("加载base64图片数据...");
        img.src = url;
      } else {
        const url_split = url.split(".");
        const ext = url_split[url_split.length - 1];
        console.log("下载网络图片数据...", url, "拓展名", ext);
        // wx.request({
        //   url,
        //   method: "GET",
        //   responseType: "arraybuffer",
        //   success: res => {
        //     img.src = _arrayBufferToBase64(res.data, EXT_DICT[ext]);
        //   }
        // });
        wx.getImageInfo({
          src: url,
          success: res => {
            console.log("获取图片信息成功", res);
            const image_width = res.width;
            const image_height = res.height;
            clip_size = {};
            if (image_width / image_height < w / h) {
              clip_size.x = 0;
              clip_size.y = (image_height - image_width * h / w) / 2;
              clip_size.w = image_width;
              clip_size.h = image_width * h / w;
            } else {
              clip_size.x = (image_width - image_height * w / h) / 2;
              clip_size.y = 0;
              clip_size.w = image_height * w / h;
              clip_size.h = image_height;
            }
            img.src = res.path;
          },
          fail: err => {
            console.log("获取图片信息失败", err);
            img.src = url;
          },
        });
        // wx.downloadFile({
        //   url,
        //   success: res => {
        //     console.log("下载图片文件成功", res);
        //     wx.getImageInfo({
        //       src: res.tempFilePath,
        //       success: res => {
        //         console.log("获取图片信息成功", res);
        //         const image_width = res.width;
        //         const image_height = res.height;
        //         clip_size = {};
        //         if (image_width / image_height < w / h) {
        //           clip_size.x = 0;
        //           clip_size.y = (image_height - image_width * h / w) / 2;
        //           clip_size.w = image_width;
        //           clip_size.h = image_width * h / w;
        //         } else {
        //           clip_size.x = (image_width - image_height * w / h) / 2;
        //           clip_size.y = 0;
        //           clip_size.w = image_height * w / h;
        //           clip_size.h = image_height;
        //         }
        //         img.src = res.path;
        //       },
        //       fail: err => {
        //         console.log("获取图片信息失败", err, res.tempFilePath);
        //         img.src = res.tempFilePath;
        //       },
        //     });
        //   },
        //   fail: err => {
        //     console.log("图片文件下载失败", err);
        //     reject(err);
        //   },
        // });
      }
    });
  }
};

// reference : https://github.com/equicy/weapp-jwt-decode
var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function _btoa(string) {
  string = String(string);
  var bitmap, a, b, c, result = "", i = 0, rest = string.length % 3;
  for (; i < string.length;) {
    if ((a = string.charCodeAt(i++)) > 255 ||
      (b = string.charCodeAt(i++)) > 255 ||
      (c = string.charCodeAt(i++)) > 255)
      throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");
    bitmap = (a << 16) | (b << 8) | c;
    result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63) +
      b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
  }
  return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
};

function _arrayBufferToBase64(buffer, type = "webp") {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  var binary = "";
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/${type};base64,${_btoa(binary)}`;
}

function saveToAlbum(canvas_handler, seal_url, poster_url) {
  wx.showLoading({
    title: "加载中",
  });
  const width = canvas_handler.logicalWidth;
  const height = canvas_handler.logicalHeight;
  console.log("保存图片中：", {
    width, height, seal_url, poster_url,
  });
  canvas_handler.clearCanvas();
  canvas_handler.drawImage({
    url: poster_url,
    x: 0, y: 0, w: width, h: height,
  }).then(() => {
    console.log("保存图片中：绘制背景完成");
    let data = seal_url.startsWith("data:image");
    return canvas_handler.drawImage({
      url: seal_url, data,
      x: Math.floor(width * 128 / 320), y: Math.floor(width * 488 / 320),
      w: Math.floor(width * 64 / 320), h: Math.floor(width * 64 / 320),
    });
  }).then(() => {
    console.log("保存图片中：绘制印面完成");
    return canvas_handler.getTempFilePath();
  }).then(res => {
    console.log("保存图片中：获取临时图片地址完成", res);
    wx.compressImage({
      src: res,
      quality: 80,
      success: compressed => {
        console.log("保存图片中：压缩图片完成", compressed);
        _saveImageToPhotosAlbum(compressed.tempFilePath);
      },
      fail: () => {
        console.log("保存图片中：压缩图片失败，保存原图");
        _saveImageToPhotosAlbum(res);
      }
    });
  }).catch(err => {
    console.log("保存图片：发生错误");
    wx.hideLoading();
    wx.showToast({
      title: "保存失败",
      icon: "none",
      duration: 1000
    });
  });
}

function _saveImageToPhotosAlbum(src) {
  wx.saveImageToPhotosAlbum({
    filePath: src,
    success: () => {
      wx.hideLoading();
      wx.showToast({
        title: "保存成功",
        icon: "success",
        duration: 1000
      });
    },
    fail: () => {
      wx.hideLoading();
      wx.showToast({
        title: "保存失败",
        icon: "none",
        duration: 1000
      });
    }
  });
}


export { CanvasHandler, saveToAlbum };