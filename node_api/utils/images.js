const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

function extractBase64(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return null;
  return dataUri.includes('base64,') ? dataUri.split('base64,')[1] : dataUri;
}

function getUploadsBasePath() {
  return process.env.IMG_REPOSITORY_PATH || process.env.UPLOADS_BASE_PATH || './uploads';
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

async function processImageBuffer(buffer, maxWidth = 1920, maxHeight = 1920, quality = 100) {
  const metadata = await sharp(buffer).metadata();
  const outputBuffer = await sharp(buffer)
    .rotate()
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
  return { outputBuffer, metadata };
}

async function saveBase64Image(base64String, prefix = 'foto_club') {
  const uploadsBasePath = process.env.IMG_REPOSITORY_PATH || '/var/www/GFC-PUBLIC-ASSETS';
  const year = new Date().getFullYear().toString();
  const dir = ensureDir(path.join(uploadsBasePath, year));
  const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
  const ext = matches ? matches[1] : 'jpg';
  const base64Data = matches ? matches[2] : base64String;
  const filename = `${prefix}_${Date.now()}.${ext}`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, base64Data, 'base64');
  return path.join(year.toString(), filename);
}

async function saveImageFromBase64(photoBase64File) {
  const base64Data = extractBase64(photoBase64File);
  if (!base64Data) return null;

  const uploadsBasePath = getUploadsBasePath();
  const imagesDir = ensureDir(path.join(uploadsBasePath, 'images'));
  const uniqueSuffix = crypto.randomBytes(8).toString('hex');
  const filename = `${Date.now()}_${uniqueSuffix}.jpg`;
  const filepath = path.join(imagesDir, filename);

  const buffer = Buffer.from(base64Data, 'base64');
  const { outputBuffer, metadata } = await processImageBuffer(buffer);
  fs.writeFileSync(filepath, outputBuffer);

  return {
    url: path.posix.join('images', filename),
    width: metadata.width || null,
    height: metadata.height || null,
    format: metadata.format
  };
}

function saveUploadedFile(file, prefix) {
  const uploadsBasePath = getUploadsBasePath();
  const imagesDir = ensureDir(path.join(uploadsBasePath, 'images'));
  const ext = path.extname(file.originalname) || `.${(file.mimetype || 'jpeg').split('/').pop()}`;
  const filename = `${prefix}_${Date.now()}${ext}`;
  const filepath = path.join(imagesDir, filename);
  fs.writeFileSync(filepath, file.buffer);
  return path.posix.join('images', filename);
}

function getMimeType(format) {
  const mimeMap = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', tiff: 'image/tiff', svg: 'image/svg+xml' };
  return mimeMap[format] || `image/${format}`;
}

function getThumbnailGuard(imageId, imageUrl) {
  const uploadsBasePath = getUploadsBasePath();
  const sourcePath = path.join(uploadsBasePath, imageUrl);
  if (fs.existsSync(sourcePath)) {
    return { imageId, sourcePath };
  }
  return null;
}

module.exports = {
  extractBase64, getUploadsBasePath, ensureDir, processImageBuffer,
  saveBase64Image, saveImageFromBase64, saveUploadedFile, getMimeType,
  getThumbnailGuard
};
