import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.ts';
import { upload } from '../middleware/uploadMiddleware.ts';
import { uploadImage } from '../controllers/uploadController.ts';

const router = Router();

// POST /api/upload/:folder
// folder: profiles | pets | posts | events
// body: multipart/form-data with field "image"
router.post('/:folder', protect, upload.single('image'), uploadImage);

export default router;
