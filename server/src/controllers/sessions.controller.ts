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
    const { patientId, status } = req.query;
    try {
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
    const { id } = req.params;
    logger.info('📤 ========== AUDIO UPLOAD STARTED ==========', { sessionId: id });

    try {
      const file = req.file;

      if (!file || !file.path) {
        logger.warn('❌ Audio upload failed: No file provided', { sessionId: id });
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No audio file provided',
        });
      }

      logger.info('📁 Audio file received', {
        sessionId: id,
        filename: file.originalname,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        mimetype: file.mimetype,
        path: file.path,
      });

      // Save file path to database
      logger.info('💾 Saving file path to database', { sessionId: id });
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
        logger.error('❌ Session not found in database', { sessionId: id });
        return res.status(404).json({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      logger.info('✅ File path saved to database successfully', {
        sessionId: id,
        status: result.rows[0].status,
      });

      // Start transcription asynchronously (file.path is guaranteed to exist by check above)
      logger.info('🚀 Starting async transcription pipeline', { sessionId: id });
      // @ts-expect-error - file.path is guaranteed to be defined by the check above
      void this.startTranscriptionAsync(id, file.path);

      logger.info('✅ ========== AUDIO UPLOAD COMPLETED ==========', { sessionId: id });

      res.json({
        message: 'Recording uploaded successfully',
        session: result.rows[0],
      });
    } catch (error) {
      logger.error('❌ ========== AUDIO UPLOAD FAILED ==========', {
        sessionId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      logError(error as Error, { method: 'uploadRecording', sessionId: id });
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
    logger.info('🎬 ========== TRANSCRIPTION PIPELINE STARTED ==========', { sessionId });

    try {
      // ==================== STEP 1: Initialize ====================
      logger.info('📝 Step 1/7: Initializing transcription', { sessionId });
      await pool.query(
        `UPDATE sessions SET transcription_status = 'pending' WHERE id = $1`,
        [sessionId]
      );
      logger.info('✅ Step 1/7: Database updated - status set to "pending"', { sessionId });

      // ==================== STEP 2: Read Audio File ====================
      logger.info('📂 Step 2/7: Reading audio file from disk', { sessionId, filePath });
      const readStart = Date.now();
      const audioBuffer = await fs.readFile(filePath);
      const fileStats = await fs.stat(filePath);
      logger.info('✅ Step 2/7: Audio file read successfully', {
        sessionId,
        fileSize: `${(fileStats.size / 1024 / 1024).toFixed(2)} MB`,
        bufferSize: `${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`,
        readTime: `${Date.now() - readStart}ms`,
      });

      // ==================== STEP 3: Upload to AssemblyAI ====================
      logger.info('☁️ Step 3/7: Uploading audio to AssemblyAI', {
        sessionId,
        bufferSize: `${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      });
      const uploadStart = Date.now();
      const audioUrl = await assemblyAIService.uploadAudio(audioBuffer);
      const uploadDuration = Date.now() - uploadStart;
      logApiCall('AssemblyAI', 'upload', uploadDuration, true);
      logger.info('✅ Step 3/7: Audio uploaded to AssemblyAI successfully', {
        sessionId,
        audioUrl: audioUrl.substring(0, 50) + '...',
        uploadTime: `${uploadDuration}ms`,
        uploadSpeed: `${((audioBuffer.length / 1024 / 1024) / (uploadDuration / 1000)).toFixed(2)} MB/s`,
      });

      // ==================== STEP 4: Create Transcription Job ====================
      logger.info('🎤 Step 4/7: Creating transcription job with speaker diarization', {
        sessionId,
        features: ['speaker_labels', 'punctuate', 'format_text'],
        language: 'en',
      });
      const transcriptStart = Date.now();
      const transcriptId = await assemblyAIService.createTranscript(audioUrl);
      const createDuration = Date.now() - transcriptStart;
      logApiCall('AssemblyAI', 'createTranscript', createDuration, true);
      logger.info('✅ Step 4/7: Transcription job created', {
        sessionId,
        transcriptId,
        createTime: `${createDuration}ms`,
      });

      // Update status to in_progress
      await pool.query(
        `UPDATE sessions SET transcription_status = 'in_progress' WHERE id = $1`,
        [sessionId]
      );
      logger.info('💾 Database updated - status set to "in_progress"', { sessionId });

      // ==================== STEP 5: Poll for Completion ====================
      logger.info('⏳ Step 5/7: Polling for transcription completion (checks every 3s)', {
        sessionId,
        transcriptId,
      });
      const pollStart = Date.now();
      let pollCount = 0;
      const transcript = await assemblyAIService.pollTranscript(transcriptId, (status) => {
        pollCount++;
        logger.info(`🔄 Poll #${pollCount}: Transcription status = "${status}"`, {
          sessionId,
          transcriptId,
          elapsedTime: `${((Date.now() - pollStart) / 1000).toFixed(1)}s`,
        });
      });
      const pollDuration = Date.now() - pollStart;
      logApiCall('AssemblyAI', 'pollTranscript', pollDuration, true);
      logger.info('✅ Step 5/7: Transcription completed by AssemblyAI', {
        sessionId,
        transcriptId,
        pollCount,
        totalWaitTime: `${(pollDuration / 1000).toFixed(1)}s`,
        averagePollTime: `${(pollDuration / pollCount / 1000).toFixed(1)}s`,
        transcriptStatus: transcript.status,
        audioLength: transcript.audio_duration ? `${transcript.audio_duration}s` : 'unknown',
      });

      // ==================== STEP 6: Process Utterances ====================
      logger.info('🗣️ Step 6/7: Processing utterances (speaker diarization)', { sessionId });
      const processStart = Date.now();
      const utterances = assemblyAIService.processUtterances(transcript);
      logger.info('✅ Step 6/7: Utterances processed successfully', {
        sessionId,
        totalUtterances: utterances.length,
        processTime: `${Date.now() - processStart}ms`,
        speakers: {
          therapist: utterances.filter((u) => u.speaker === 'therapist').length,
          client: utterances.filter((u) => u.speaker === 'client').length,
        },
        averageConfidence: (
          utterances.reduce((sum, u) => sum + u.confidence, 0) / utterances.length
        ).toFixed(3),
      });

      // ==================== STEP 7: Save to Database ====================
      logger.info('💾 Step 7/7: Saving transcript segments to database', {
        sessionId,
        segmentCount: utterances.length,
      });
      const saveStart = Date.now();
      let savedCount = 0;

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
        savedCount++;

        if (savedCount % 10 === 0 || savedCount === utterances.length) {
          logger.info(`💾 Progress: ${savedCount}/${utterances.length} segments saved`, {
            sessionId,
            progress: `${((savedCount / utterances.length) * 100).toFixed(1)}%`,
          });
        }
      }
      const saveDuration = Date.now() - saveStart;
      logger.info('✅ Step 7/7: All transcript segments saved to database', {
        sessionId,
        segmentCount: utterances.length,
        saveTime: `${saveDuration}ms`,
        averageTimePerSegment: `${(saveDuration / utterances.length).toFixed(1)}ms`,
      });

      // ==================== FINAL: Update Session Status ====================
      logger.info('🏁 Finalizing session status', { sessionId });
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
      logger.info('🎉 ========== TRANSCRIPTION PIPELINE COMPLETED ==========', {
        sessionId,
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
        breakdown: {
          readFile: `${Date.now() - readStart}ms`,
          uploadToAssemblyAI: `${uploadDuration}ms`,
          createTranscript: `${createDuration}ms`,
          waitForCompletion: `${(pollDuration / 1000).toFixed(1)}s`,
          processUtterances: `${Date.now() - processStart}ms`,
          saveToDatabase: `${saveDuration}ms`,
        },
        results: {
          totalSegments: utterances.length,
          therapistSegments: utterances.filter((u) => u.speaker === 'therapist').length,
          clientSegments: utterances.filter((u) => u.speaker === 'client').length,
        },
      });
    } catch (error) {
      logger.error('❌ ========== TRANSCRIPTION FAILED ==========', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      logError(error as Error, { method: 'startTranscriptionAsync', sessionId });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update status to failed with error message
      logger.info('📝 Updating session to "failed" status', { sessionId, errorMessage });
      await pool.query(
        `UPDATE sessions
         SET transcription_status = 'failed',
             transcription_error = $1
         WHERE id = $2`,
        [errorMessage, sessionId]
      );
      logger.error('💾 Session marked as failed in database', { sessionId, errorMessage });
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
