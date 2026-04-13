import type { Response } from 'express';
import { uploadFileToS3, type UploadFolder } from '../services/s3Service.ts';

const VALID_FOLDERS: UploadFolder[] = ['profiles', 'pets', 'posts', 'events', 'stamps', 'reports', 'certificates'];

// @desc    Upload image to S3 and return the public URL
// @route   POST /api/upload/:folder  (folder: profiles | pets | posts | events)
export const uploadImage = async (req: any, res: Response): Promise<void> => {
  try {
    const folder = req.params.folder as UploadFolder;

    if (!VALID_FOLDERS.includes(folder)) {
      res.status(400).json({ message: `Invalid folder. Allowed: ${VALID_FOLDERS.join(', ')}` });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No image file provided. Use field name: image' });
      return;
    }

    const url = await uploadFileToS3(req.file.buffer, req.file.mimetype, folder);
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
};
