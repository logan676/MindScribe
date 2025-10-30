import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { deepSeekService } from '../services/deepseek.service.js';
import logger, { logError, logApiCall } from '../config/logger.js';

export class NotesController {
  /**
   * Generate clinical note from transcript
   */
  async generateNote(req: Request, res: Response) {
    try {
      const { sessionId, noteType } = req.body;
      const userId = 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1'; // TODO: Get from auth middleware

      if (!sessionId || !noteType) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'sessionId and noteType are required',
        });
      }

      if (noteType !== 'soap' && noteType !== 'dare') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'noteType must be either "soap" or "dare"',
        });
      }

      // Get transcript segments
      const segmentsResult = await pool.query(
        `
        SELECT speaker, text, start_time, end_time
        FROM transcript_segments
        WHERE session_id = $1
        ORDER BY start_time ASC
        `,
        [sessionId]
      );

      if (segmentsResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No transcript found for this session',
        });
      }

      // Format transcript
      const transcript = segmentsResult.rows
        .map((segment) => {
          const speaker = segment.speaker === 'therapist' ? 'Therapist' : 'Client';
          return `${speaker}: ${segment.text}`;
        })
        .join('\n\n');

      // Get patient context
      const patientResult = await pool.query(
        `
        SELECT p.first_name, p.last_name
        FROM patients p
        JOIN sessions s ON s.patient_id = p.id
        WHERE s.id = $1
        `,
        [sessionId]
      );

      const patientName = patientResult.rows[0]
        ? `${patientResult.rows[0].first_name} ${patientResult.rows[0].last_name}`
        : 'Unknown';

      // Generate note using DeepSeek
      const apiStart = Date.now();
      const noteContent = await deepSeekService.generateClinicalNote({
        transcript,
        noteType,
        patientContext: {
          name: patientName,
        },
      });
      logApiCall('DeepSeek', 'generateClinicalNote', Date.now() - apiStart, true);

      logger.info('Clinical note generated', { sessionId, noteType, patientName });

      // Save note to database
      const insertResult = await pool.query(
        `
        INSERT INTO clinical_notes (
          session_id, user_id, type, status,
          subjective, objective, assessment, plan,
          description, action, response, evaluation
        )
        VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
        `,
        [
          sessionId,
          userId,
          noteType,
          noteContent.subjective || null,
          noteContent.objective || null,
          noteContent.assessment || null,
          noteContent.plan || null,
          noteContent.description || null,
          noteContent.action || null,
          noteContent.response || null,
          noteContent.evaluation || null,
        ]
      );

      res.json({
        message: 'Clinical note generated successfully',
        note: insertResult.rows[0],
      });
    } catch (error) {
      logError(error as Error, { method: 'generateNote', sessionId: req.body.sessionId });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate clinical note',
      });
    }
  }

  /**
   * Create note manually
   */
  async createNote(req: Request, res: Response) {
    try {
      const { sessionId, type, ...noteContent } = req.body;
      const userId = 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1'; // TODO: Get from auth middleware

      if (!sessionId || !type) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'sessionId and type are required',
        });
      }

      const result = await pool.query(
        `
        INSERT INTO clinical_notes (
          session_id, user_id, type, status,
          subjective, objective, assessment, plan,
          description, action, response, evaluation
        )
        VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
        `,
        [
          sessionId,
          userId,
          type,
          noteContent.subjective || null,
          noteContent.objective || null,
          noteContent.assessment || null,
          noteContent.plan || null,
          noteContent.description || null,
          noteContent.action || null,
          noteContent.response || null,
          noteContent.evaluation || null,
        ]
      );

      res.status(201).json({ note: result.rows[0] });
    } catch (error) {
      logError(error as Error, { method: 'createNote', sessionId: req.body.sessionId });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create note',
      });
    }
  }

  /**
   * Get note by ID
   */
  async getNote(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM clinical_notes WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Note not found',
        });
      }

      res.json({ note: result.rows[0] });
    } catch (error) {
      logError(error as Error, { method: 'getNote', noteId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch note',
      });
    }
  }

  /**
   * Update note
   */
  async updateNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const allowedFields = [
        'subjective',
        'objective',
        'assessment',
        'plan',
        'description',
        'action',
        'response',
        'evaluation',
      ];

      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (field in updates) {
          updateFields.push(`${field} = $${paramIndex}`);
          params.push(updates[field]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No valid fields to update',
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const result = await pool.query(
        `
        UPDATE clinical_notes
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Note not found',
        });
      }

      res.json({ note: result.rows[0] });
    } catch (error) {
      logError(error as Error, { method: 'updateNote', noteId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update note',
      });
    }
  }

  /**
   * Sign note
   */
  async signNote(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        UPDATE clinical_notes
        SET status = 'signed', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Note not found',
        });
      }

      logger.info('Clinical note signed', { noteId: id });

      res.json({
        message: 'Note signed successfully',
        note: result.rows[0],
      });
    } catch (error) {
      logError(error as Error, { method: 'signNote', noteId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to sign note',
      });
    }
  }

  /**
   * Get notes for a session
   */
  async getSessionNotes(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const result = await pool.query(
        `
        SELECT * FROM clinical_notes
        WHERE session_id = $1
        ORDER BY created_at DESC
        `,
        [sessionId]
      );

      res.json({ notes: result.rows });
    } catch (error) {
      logError(error as Error, { method: 'getSessionNotes', sessionId: req.params.sessionId });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch notes',
      });
    }
  }
}

export const notesController = new NotesController();
