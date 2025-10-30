import { Router } from 'express';
import { getTranscriptSegments } from '../controllers/transcriptions.controller';

const router = Router();

// GET /api/transcriptions/:sessionId/segments - Get transcript segments for a session
router.get('/:sessionId/segments', getTranscriptSegments);

export default router;
