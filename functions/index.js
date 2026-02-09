const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');

admin.initializeApp();
const db = admin.firestore();
const rtdb = admin.database();

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const IMAGE_MAX_BYTES = 1 * 1024 * 1024;
const VIDEO_MAX_BYTES = 20 * 1024 * 1024;

function getTypeFromPath(filePath) {
  if (filePath.startsWith('images/')) return 'images';
  if (filePath.startsWith('videos/')) return 'videos';
  if (filePath.startsWith('files/')) return 'files';
  return null;
}

async function updateMetadata(type, storagePath, compressedUrl) {
  if (!type || !storagePath || !compressedUrl) return;

  const snap = await db.collection(type).where('storagePath', '==', storagePath).get();
  const updates = [];
  snap.forEach(doc => {
    updates.push(doc.ref.update({ compressedURL: compressedUrl, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
  });

  const uploadsSnap = await rtdb.ref(`uploads/${type}`).once('value');
  uploadsSnap.forEach(child => {
    const val = child.val();
    if (val && val.storagePath === storagePath) {
      updates.push(child.ref.update({ compressedURL: compressedUrl, updatedAt: Date.now() }));
    }
  });

  await Promise.all(updates);
}

exports.compressMediaOnUpload = functions.storage.object().onFinalize(async (object) => {
  const bucket = admin.storage().bucket(object.bucket);
  const filePath = object.name;
  const contentType = object.contentType || '';
  const type = getTypeFromPath(filePath || '');

  if (!filePath || !type) return null;
  if (filePath.startsWith('compressed/')) return null;

  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const outputFileName = fileName.replace(/\.[^/.]+$/, '') + '_compressed' + path.extname(fileName);
  const outputPath = path.join(os.tmpdir(), outputFileName);
  const compressedPath = `compressed/${type}/${outputFileName}`;

  await bucket.file(filePath).download({ destination: tempFilePath });

  try {
    if (type === 'images' && contentType.startsWith('image/')) {
      let pipeline = sharp(tempFilePath).rotate();
      const metadata = await pipeline.metadata();
      if (metadata.width && metadata.width > 1920) {
        pipeline = pipeline.resize(1920);
      }

      let quality = 80;
      let buffer = await pipeline.jpeg({ quality }).toBuffer();
      while (buffer.length > IMAGE_MAX_BYTES && quality > 50) {
        quality -= 10;
        buffer = await pipeline.jpeg({ quality }).toBuffer();
      }

      fs.writeFileSync(outputPath, buffer);
    } else if (type === 'videos' && contentType.startsWith('video/')) {
      await new Promise((resolve, reject) => {
        ffmpeg(tempFilePath)
          .outputOptions([
            '-vcodec libx264',
            '-preset fast',
            '-crf 28',
            '-acodec aac',
            '-b:a 96k'
          ])
          .size('?x720')
          .save(outputPath)
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      return null;
    }

    const stats = fs.statSync(outputPath);
    if ((type === 'images' && stats.size > IMAGE_MAX_BYTES) || (type === 'videos' && stats.size > VIDEO_MAX_BYTES)) {
      return null;
    }

    await bucket.upload(outputPath, {
      destination: compressedPath,
      metadata: {
        contentType: contentType
      }
    });

    const [url] = await bucket.file(compressedPath).getSignedUrl({
      action: 'read',
      expires: '03-01-2030'
    });

    await updateMetadata(type, filePath, url);
  } finally {
    fs.unlinkSync(tempFilePath);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }

  return null;
});
