const sharp = require('sharp');
const Canvas = require('canvas-prebuilt');
const {toAbsolute} = require('core/system');

function adjustFontSize(ctx, text, font, fontSize, imgWidth) {
  const fontParams = `${fontSize}px ${font}`;
  ctx.font = fontParams;
  const textWidth = ctx.measureText(text).width;
  if (textWidth > imgWidth / 2) {
    return adjustFontSize(ctx, text, font, fontSize - 1, imgWidth);
  }
  return fontParams;
}

function imgOverlay({
  overlayPath,
  width,
  height
}) {
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

function captionOverlay({
  text,
  width,
  height,
  font = 'Arial',
  fontSize = 48,
  fontColor = 'rgba(255, 255, 255, 0.7)'
}) {
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

function watermarkApplier(imgSource, options) {
  let image = sharp(imgSource);
  return image
    .metadata()
    .then(meta => produceOverlay(meta, options))
    .then(overlay => image.png()
      .overlayWith(overlay, {gravity: sharp.gravity.southeast})
      .toFormat(options.format || 'png')
      .toBuffer()
    );
}

function watermarkStream(imgStream, options) {
  return new Promise((resolve, reject) => {
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
  });
}

exports.watermarkStream = watermarkStream;
exports.watermarkApplier = watermarkApplier;
