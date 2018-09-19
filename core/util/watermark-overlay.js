const sharp = require('sharp');
const Canvas = require('canvas-prebuilt');
const {toAbsolute} = require('core/system');

/**
 * @param {{}} ctx
 * @param {String} text
 * @param {String} font
 * @param {Number} fontSize
 * @param {Number} imgWidth
 * @returns {String}
 */
function adjustFontSize(ctx, text, font, fontSize, imgWidth) {
  const fontParams = `${fontSize}px ${font}`;
  if (font && fontSize > 0) {
    ctx.font = fontParams;
    const textWidth = ctx.measureText(text).width;
    if (textWidth > imgWidth / 2) {
      return adjustFontSize(ctx, text, font, fontSize - 1, imgWidth);
    }
  }
  return fontParams;
}

/**
 * @param {{}} options
 * @param {String} options.overlayPath
 * @param {String} options.width
 * @param {Number} options.height
 * @returns {Promise}
 */
function imgOverlay({overlayPath, width, height}) {
  if (!overlayPath || !width || !height) {
    return Promise.reject(new Error('не переданы необходимые параметры для watermark'));
  }
  let overlay = sharp(toAbsolute(overlayPath));
  return overlay
    .metadata()
    .then((meta) => {
      let ovWidth = meta.width > width / 2 ? parseInt(width / 2, 10) : meta.width;
      let ovHeight = meta.height > height / 2 ? parseInt(height / 2, 10) : meta.height;
      return overlay
        .resize(ovWidth, ovHeight)
        .background({r: 0, g: 0, b: 0, alpha: 0})
        .embed()
        .toBuffer();
    });
}

/**
 * @param {{}} options
 * @param {String} options.text
 * @param {String} options.width
 * @param {Number} options.height
 * @param {String} options.font
 * @param {String} options.fontSize
 * @param {Number} options.fontColor
 * @returns {Promise}
 */
function captionOverlay({text, width, height, font, fontSize, fontColor}) {
  text = text || '';
  width = width || 0;
  height = height || 0;
  font = font || 'Arial';
  fontSize = fontSize || 48;
  fontColor = fontColor || 'rgba(255, 255, 255, 0.7)';
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'right';
  ctx.font = adjustFontSize(ctx, text, font, fontSize, width);
  ctx.fillStyle = fontColor;
  ctx.fillText(text, width, height);

  return canvas.toBuffer();
}

/**
 * @param {{}} meta
 * @param {{}} options
 * @returns {Promise|Buffer}
 */
function produceOverlay(meta, options) {
  options.width = options.width || meta.width;
  options.height = options.height || meta.height;
  options.width = meta.width < options.width ? meta.width : options.width;
  options.height = meta.height < options.height ? meta.height : options.height;
  options.text = options.text || '';
  if (options.overlayPath) {
    return imgOverlay(options);
  }
  return captionOverlay(options);
}

/**
 * @param {String|Buffer} imgSource
 * @param {{}} options
 * @returns {Promise}
 */
function watermarkApplier(imgSource, options) {
  options = options || {};
  if (!process.env.FONTCONFIG_PATH && options.configPath) {
    process.env.FONTCONFIG_PATH = toAbsolute(options.configPath);
  }
  let format = options.format || 'png';
  let image = sharp(imgSource);
  return image
    .metadata()
    .then(meta => produceOverlay(meta, options))
    .then(overlay => image.png()
      .overlayWith(overlay, {gravity: sharp.gravity.southeast})
      .toFormat(format.toLowerCase())
      .toBuffer()
    );
}

/**
 * @param {Stream} imgStream
 * @param {{}} options
 * @returns {Promise}
 */
function watermarkStream(imgStream, options) {
  options = options || {};
  if (!process.env.FONTCONFIG_PATH && options.configPath) {
    process.env.FONTCONFIG_PATH = toAbsolute(options.configPath);
  }
  return new Promise((resolve, reject) => {
    try {
      let image = sharp();

      image
        .metadata()
        .then(meta => produceOverlay(meta, options))
        .then((overlay) => {
          const overlayStream = image
            .png()
            .overlayWith(overlay, {gravity: sharp.gravity.southeast});
          return resolve(overlayStream);
        })
        .catch(err => reject(err));

      imgStream.on('error', err => reject(err));
      imgStream.pipe(image);
    } catch (err) {
      reject(err);
    }
  });
}

exports.watermarkStream = watermarkStream;
exports.watermarkApplier = watermarkApplier;
