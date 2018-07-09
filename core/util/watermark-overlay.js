const sharp = require('sharp');
const Canvas = require('canvas-prebuilt');
const {createWriteStream} = require('fs');
const {Image} = require('canvas-prebuilt');

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    function cleanup() {
      image.onload = null;
      image.onerror = null;
    }

    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = (err) => {
      cleanup();
      reject(err);
    };

    image.src = src;
  });
}

function createImageFromBuffer(buffer) {
  const image = new Image();
  image.src = buffer;

  return image;
}

function captionOverlay({
  text,
  width,
  height,
  font = 'Arial',
  fontSize = 48,
  captionHeight = 120,
  decorateCaptionTextFillStyle = null,
  decorateCaptionFillStyle = null,
  offsetX = 0,
  offsetY = 0
}) {
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Hold computed caption position
  const captionX = offsetX;
  const captionY = offsetY + height - captionHeight;
  const captionTextX = captionX + (width / 2);
  const captionTextY = captionY + (captionHeight / 2);

  const createGradient = (first, second) => {
    const grd = ctx.createLinearGradient(width, captionY, width, height);
    grd.addColorStop(0, first);
    grd.addColorStop(1, second);

    return grd;
  };

  // Fill caption rect
  ctx.fillStyle = decorateCaptionFillStyle ?
    decorateCaptionFillStyle(ctx) :
    createGradient('rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.45)');
  ctx.fillRect(captionX, captionY, width, captionHeight);

  // Fill caption text
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = `${fontSize}px ${font}`;
  ctx.fillStyle = decorateCaptionTextFillStyle ?
    decorateCaptionTextFillStyle(ctx) :
    'white';
  ctx.fillText(text, captionTextX, captionTextY);

  return canvas.toBuffer();
}

function watermarkApplier(imgPath, overlayPath, outputPath, text, width, height) {
  const overlay = captionOverlay({text, width, height});

  let applier = sharp(imgPath)
    .overlayWith(overlay, {gravity: sharp.gravity.southeast})
    .toFile(outputPath, (err, info) => {
      console.log(err, info);
    });
}

module.exports = watermarkApplier;
