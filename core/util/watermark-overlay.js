const sharp = require('sharp');
const Canvas = require('canvas-prebuilt');
// const fs = require('fs');

function captionOverlay({
  text,
  width,
  height,
  font = 'Arial',
  fontSize = 48,
  fontColor = 'rgb(255, 255, 255)',
  captionHeight = 120,
  offsetX = 0,
  offsetY = 0
}) {
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  const captionX = offsetX;
  const captionY = offsetY + height - captionHeight;
  const captionTextX = captionX + (width / 2);
  const captionTextY = captionY + (captionHeight / 2);

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(captionX, captionY, width, captionHeight);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `${fontSize}px ${font}`;
  ctx.fillStyle = fontColor;
  ctx.fillText(text, captionTextX, captionTextY);

  let buf = canvas.toBuffer();
  return buf;
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

function watermarkPipe(text, width, height) {
  const overlay = captionOverlay({text, width, height});
  let image = sharp();
  return image
    .png()
    .overlayWith(overlay, {gravity: sharp.gravity.southeast});
}

exports.watermarkPipe = watermarkPipe;
exports.watermarkApplier = watermarkApplier;
