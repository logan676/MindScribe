import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { assemblyAIService } from '../services/assemblyai.service.js';
import logger, { logError, logApiCall } from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';

export class SessionsController {
  /**
   * Get all sessions
   */
  async getSessions(req: Request, res: Response) {
    try {
      const { patientId, status } = req.query;
      const userId = 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1'; // TODO: Get from auth middleware

      let query = `
        SELECT s.*, p.first_name, p.last_name, p.client_id
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        WHERE s.user_id = $1
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (patientId) {
        query += ` AND s.patient_id = $${paramIndex}`;
        params.push(patientId);
        paramIndex++;
      }

      if (status) {
        query += ` AND s.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ' ORDER BY s.start_time DESC';

      const result = await pool.query(query, params);
      res.json({ sessions: result.rows });
    } catch (error) {
      logError(error as Error, { method: 'getSessions', patientId, status });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch sessions',
      });
    }
  }

  /**
   * Get single session
   */
  async getSession(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        SELECT s.*, p.first_name, p.last_name, p.client_id
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        WHERE s.id = $1
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      res.json({ session: result.rows[0] });
    } catch (error) {
      logError(error as Error, { method: 'getSession', sessionId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch session',
      });
    }
  }

  /**
   * Create new session
   */
  async createSession(req: Request, res: Response) {
    try {
      const { patientId } = req.body;
      const userId = 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1'; // TODO: Get from auth middleware

      if (!patientId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'patientId is required',
        });
      }

      const result = await pool.query(
        `
        INSERT INTO sessions (patient_id, user_id, date, start_time, status)
        VALUES ($1, $2, CURRENT_DATE, CURRENT_TIMESTAMP, 'recording')
        RETURNING *
        `,
        [patientId, userId]
      );

      res.status(201).json({
        session: result.rows[0],
        sessionId: result.rows[0].id,
      });
    } catch (error) {
      logError(error as Error, { method: 'createSession', patientId: req.body.patientId });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create session',
      });
    }
  }

  /**
   * Upload recording
   */
  async uploadRecording(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No audio file provided',
        });
      }

      // Save file path to database
      const result = await pool.query(
        `
        UPDATE sessions
        SET recording_path = $1, status = 'processing', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [file.path, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      // Start transcription asynchronously
      this.startTranscriptionAsync(id, file.path);

      res.json({
        message: 'Recording uploaded successfully',
        session: result.rows[0],
      });
    } catch (error) {
      logError(error as Error, { method: 'uploadRecording', sessionId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to upload recording',
      });
    }
  }

  /**
   * Start transcription process (async)
   */
  private async startTranscriptionAsync(sessionId: string, filePath: string) {
    const startTime = Date.now();
    try {
      logger.info('Starting transcription', { sessionId });

      // Update status
      await pool.query(
        `UPDATE sessions SET transcription_status = 'pending' WHERE id = $1`,
        [sessionId]
      );

      // Read audio file
      const audioBuffer = await fs.readFile(filePath);

      // Upload to AssemblyAI
      const uploadStart = Date.now();
      const audioUrl = await assemblyAIService.uploadAudio(audioBuffer);
      logApiCall('AssemblyAI', 'upload', Date.now() - uploadStart, true);

      // Start transcription
      const transcriptStart = Date.now();
      const transcriptId = await assemblyAIService.createTranscript(audioUrl);
      logApiCall('AssemblyAI', 'createTranscript', Date.now() - transcriptStart, true);

      // Update status
      await pool.query(
        `UPDATE sessions SET transcription_status = 'in_progress' WHERE id = $1`,
        [sessionId]
      );

      // Poll for completion
      const pollStart = Date.now();
      const transcript = await assemblyAIService.pollTranscript(transcriptId);
      logApiCall('AssemblyAI', 'pollTranscript', Date.now() - pollStart, true);

      // Process utterances
      const utterances = assemblyAIService.processUtterances(transcript);
      logger.info('Processed transcript segments', { sessionId, segmentCount: utterances.length });

      // Save transcript segments
      for (const utterance of utterances) {
        await pool.query(
          `
          INSERT INTO transcript_segments (session_id, speaker, text, start_time, end_time, confidence)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            sessionId,
            utterance.speaker,
            utterance.text,
            utterance.startTime,
            utterance.endTime,
            utterance.confidence,
          ]
        );
      }

      // Update session
      await pool.query(
        `
        UPDATE sessions
        SET transcription_status = 'completed',
            status = 'completed',
            end_time = CURRENT_TIMESTAMP,
            duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time))::INTEGER,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [sessionId]
      );

      const totalDuration = Date.now() - startTime;
      logger.info('Transcription completed', { sessionId, duration: `${totalDuration}ms` });
    } catch (error) {
      logError(error as Error, { method: 'startTranscriptionAsync', sessionId });

      // Update status to failed
      await pool.query(
        `UPDATE sessions SET transcription_status = 'failed' WHERE id = $1`,
        [sessionId]
      );
    }
  }

  /**
   * Update session
   */
  async updateSession(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, endTime } = req.body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (endTime) {
        updates.push(`end_time = $${paramIndex}`);
        params.push(endTime);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No fields to update',
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const result = await pool.query(
        `
        UPDATE sessions
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      res.json({ session: result.rows[0] });
    } catch (error) {
      logError(error as Error, { method: 'updateSession', sessionId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update session',
      });
    }
  }
}

export const sessionsController = new SessionsController();
