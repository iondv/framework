const sharp = require('sharp');
const Canvas = require('canvas-prebuilt');

function adjustFontSize(ctx, text, font, fontSize, imgWidth) {
  const fontParams = `${fontSize}px ${font}`;
  ctx.font = fontParams;
  const textWidth = ctx.measureText(text).width;
  if (textWidth > imgWidth / 2) {
    return adjustFontSize(ctx, text, font, fontSize - 1, imgWidth);
  }
  return fontParams;
}

function imgOverlay({overlayPath, width, height}) {
  let overlay = sharp(overlayPath);
  return overlay
    .metadata()
    .then((meta) => {
      let ovWidth = meta.width > width / 2 ? width / 2 : meta.width;
      let ovHeight = meta.height > height / 2 ? height / 2 : meta.height;
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
  fontSize = 480,
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

function watermarkApplier(imgPath, outputPath, text, width, height) {
  return new Promise((resolve, reject) => {
    const overlay = captionOverlay({text, width, height});
    sharp(imgPath)
      .png()
      .overlayWith(overlay, {gravity: sharp.gravity.southeast})
      .toFile(outputPath, (err, info) => {
        if (err) {
          return reject(err);
        }
        console.log(err, info);
      });

  });
}

function watermarkPipe(imgStream, {overlayPath, text, width, height}) {
  return new Promise((resolve, reject) => {
    let image = sharp();

    image
      .metadata()
      .then((meta) => {
        width = meta.width < width ? meta.width : width;
        height = meta.height < height ? meta.height : height;
        text = text || '';
        if (overlayPath) {
          return imgOverlay({overlayPath, width, height});
        }
        return captionOverlay({text, width, height});
      })
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

exports.watermarkPipe = watermarkPipe;
exports.watermarkApplier = watermarkApplier;
