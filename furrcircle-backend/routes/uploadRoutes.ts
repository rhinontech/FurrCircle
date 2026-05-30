import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.ts';
import { upload, uploadMedia } from '../middleware/uploadMiddleware.ts';
import { uploadImage } from '../controllers/uploadController.ts';

const router = Router();

// Stories accept images + videos up to 50 MB
router.post('/stories', protect, uploadMedia.single('image'), (req: any, _res: any, next: any) => {
  req.params.folder = 'stories';
  next();
}, uploadImage);

// Support videos for community posts, fall back to images only for other folders
router.post('/:folder', protect, (req: any, res: any, next: any) => {
  if (req.params.folder === 'posts') {
    return uploadMedia.single('image')(req, res, next);
  }
  return upload.single('image')(req, res, next);
}, uploadImage);

export default router;
