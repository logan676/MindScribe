import express from 'express';
import multer from 'multer';
import path from 'path';
import { sessionsController } from '../controllers/sessions.controller.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '500000000'), // 500MB default
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types (including multiple M4A variants)
    const allowedMimes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/x-m4a',
      'audio/m4a',
      'application/octet-stream', // Some clients send this for audio files
    ];

    // Allowed file extensions (fallback validation)
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.mp4'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Accept if MIME type matches OR extension matches (handles octet-stream case)
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only audio files are allowed. Got: ${file.mimetype} (${fileExtension})`));
    }
  },
});

// Routes
router.get('/', sessionsController.getSessions.bind(sessionsController));
router.get('/:id', sessionsController.getSession.bind(sessionsController));
router.post('/', sessionsController.createSession.bind(sessionsController));
router.post(
  '/:id/recording',
  upload.single('audio'),
  sessionsController.uploadRecording.bind(sessionsController)
);
router.patch('/:id', sessionsController.updateSession.bind(sessionsController));

export default router;
