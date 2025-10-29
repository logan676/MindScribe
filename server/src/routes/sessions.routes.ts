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
    const allowedMimes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
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
