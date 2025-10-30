import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import logger from '../config/logger.js';

export const getTranscriptSegments = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info('Fetching transcript segments', { sessionId });

    const result = await pool.query(
      `SELECT id, session_id, speaker, text, start_time, end_time, confidence
       FROM transcript_segments
       WHERE session_id = $1
       ORDER BY start_time ASC`,
      [sessionId]
    );

    // Format the segments to match frontend expectations
    const segments = result.rows.map(row => ({
      id: row.id,
      speaker: row.speaker,
      text: row.text,
      time: formatTime(row.start_time),
      start_time: row.start_time,
      end_time: row.end_time,
      confidence: row.confidence
    }));

    res.json({
      segments,
      count: segments.length
    });
  } catch (error) {
    logger.error('Error fetching transcript segments:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch transcript segments'
    });
  }
};

// Helper function to format seconds to MM:SS
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
