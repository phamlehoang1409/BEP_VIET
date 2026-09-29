const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../db/supabase');

// Memory storage for cloud buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh định dạng JPG, JPEG, PNG, WEBP, GIF!'));
    }
  }
});

// Single image upload route: Supabase Storage with local disk fallback
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file hình ảnh để tải lên' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const cleanName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
    const fileName = `food-${cleanName}-${uniqueSuffix}${ext}`;

    // 1. Try uploading to Supabase Storage if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('food-images')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from('food-images')
            .getPublicUrl(fileName);

          return res.json({
            success: true,
            url: publicUrlData.publicUrl,
            filename: fileName,
            storage: 'supabase',
            message: 'Tải ảnh lên Supabase Storage thành công!'
          });
        } else {
          console.warn('Supabase storage upload error, falling back to local disk:', error);
        }
      } catch (sbErr) {
        console.warn('Supabase exception, falling back to local disk:', sbErr);
      }
    }

    // 2. Fallback to local disk storage
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, fileName);
    fs.writeFileSync(localFilePath, req.file.buffer);

    return res.json({
      success: true,
      url: `/uploads/${fileName}`,
      filename: fileName,
      storage: 'local',
      message: 'Tải ảnh lên thành công!'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
