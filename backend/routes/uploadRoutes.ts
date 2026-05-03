import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.ts';
import { upload, uploadMedia } from '../middleware/uploadMiddleware.ts';
import { uploadImage } from '../controllers/uploadController.ts';

const router = Router();

// Stories accept images + videos up to 50 MB
router.post('/stories', protect, uploadMedia.single('image'), uploadImage);

// All other folders: images only up to 5 MB
router.post('/:folder', protect, upload.single('image'), uploadImage);

export default router;
