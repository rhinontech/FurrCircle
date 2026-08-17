import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.ts';
import { upload, uploadMedia } from '../middleware/uploadMiddleware.ts';
import { uploadImage } from '../controllers/uploadController.ts';

const router = Router();

const multerErrorHandler = (err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 10 MB for images, 200 MB for videos.' : err.message;
    return res.status(413).json({ message: msg });
  }
  if (err) return res.status(400).json({ message: err.message || 'Upload error' });
  next();
};

// Stories accept images + videos up to 100 MB
router.post('/stories', protect, uploadMedia.single('image'), (req: any, _res: any, next: any) => {
  req.params.folder = 'stories';
  next();
}, multerErrorHandler, uploadImage);

// Support videos for community posts, fall back to images only for other folders
router.post('/:folder', protect, (req: any, res: any, next: any) => {
  if (req.params.folder === 'posts') {
    return uploadMedia.single('image')(req, res, next);
  }
  return upload.single('image')(req, res, next);
}, multerErrorHandler, uploadImage);

export default router;
