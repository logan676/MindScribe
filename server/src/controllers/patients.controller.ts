import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { logError } from '../config/logger.js';

export class PatientsController {
  /**
   * Get all patients for a user
   */
  async getPatients(req: Request, res: Response) {
    try {
      const userId = 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1'; // TODO: Get from auth middleware

      const result = await pool.query(
        `
        SELECT
          id,
          first_name,
          last_name,
          client_id,
          date_of_birth,
          email,
          phone,
          avatar_url,
          created_at,
          (first_name || ' ' || last_name) as full_name
        FROM patients
        WHERE user_id = $1
        ORDER BY last_name, first_name
        `,
        [userId]
      );

      res.json({ patients: result.rows });
    } catch (error) {
      logError(error as Error, { method: 'getPatients' });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch patients',
      });
    }
  }

  /**
   * Get single patient with session count
   */
  async getPatient(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const patientResult = await pool.query(
        `
        SELECT
          p.*,
          (p.first_name || ' ' || p.last_name) as full_name,
          COUNT(s.id) as session_count
        FROM patients p
        LEFT JOIN sessions s ON s.patient_id = p.id
        WHERE p.id = $1
        GROUP BY p.id
        `,
        [id]
      );

      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Patient not found',
        });
      }

      res.json({ patient: patientResult.rows[0] });
    } catch (error) {
      logError(error as Error, { method: 'getPatient', patientId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch patient',
      });
    }
  }

  /**
   * Create new patient
   */
  async createPatient(req: Request, res: Response) {
    try {
      const { firstName, lastName, dateOfBirth, email, phone } = req.body;
      const userId = 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1'; // TODO: Get from auth middleware

      // Validation
      if (!firstName || !lastName || !dateOfBirth) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'firstName, lastName, and dateOfBirth are required',
        });
      }

      // Generate unique client ID
      const clientIdPrefix = lastName.substring(0, 3).toUpperCase();
      const clientIdSuffix = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      const clientId = `${clientIdPrefix}${clientIdSuffix}`;

      const result = await pool.query(
        `
        INSERT INTO patients (
          user_id,
          first_name,
          last_name,
          client_id,
          date_of_birth,
          email,
          phone
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [userId, firstName, lastName, clientId, dateOfBirth, email, phone]
      );

      res.status(201).json({
        message: 'Patient created successfully',
        patient: result.rows[0],
      });
    } catch (error) {
      logError(error as Error, { method: 'createPatient' });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create patient',
      });
    }
  }

  /**
   * Update patient
   */
  async updatePatient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, dateOfBirth, email, phone } = req.body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (firstName) {
        updates.push(`first_name = $${paramIndex}`);
        params.push(firstName);
        paramIndex++;
      }

      if (lastName) {
        updates.push(`last_name = $${paramIndex}`);
        params.push(lastName);
        paramIndex++;
      }

      if (dateOfBirth) {
        updates.push(`date_of_birth = $${paramIndex}`);
        params.push(dateOfBirth);
        paramIndex++;
      }

      if (email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        params.push(email);
        paramIndex++;
      }

      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex}`);
        params.push(phone);
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
        UPDATE patients
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
        `,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Patient not found',
        });
      }

      res.json({
        message: 'Patient updated successfully',
        patient: result.rows[0],
      });
    } catch (error) {
      logError(error as Error, { method: 'updatePatient', patientId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update patient',
      });
    }
  }

  /**
   * Delete patient (soft delete by archiving)
   */
  async deletePatient(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if patient has sessions
      const sessionsResult = await pool.query(
        'SELECT COUNT(*) FROM sessions WHERE patient_id = $1',
        [id]
      );

      const sessionCount = parseInt(sessionsResult.rows[0].count);

      if (sessionCount > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Cannot delete patient with ${sessionCount} existing session(s)`,
        });
      }

      const result = await pool.query(
        'DELETE FROM patients WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Patient not found',
        });
      }

      res.json({
        message: 'Patient deleted successfully',
      });
    } catch (error) {
      logError(error as Error, { method: 'deletePatient', patientId: req.params.id });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete patient',
      });
    }
  }

  /**
   * Get patient sessions
   */
  async getPatientSessions(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        SELECT
          s.*,
          p.first_name,
          p.last_name,
          p.client_id
        FROM sessions s
        JOIN patients p ON s.patient_id = p.id
        WHERE s.patient_id = $1
        ORDER BY s.start_time DESC
        `,
        [id]
      );

      res.json({ sessions: result.rows });
    } catch (error) {
      logError(error as Error, { method: 'getPatientSessions', patientId: req.params.patientId });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch patient sessions',
      });
    }
  }
}

export const patientsController = new PatientsController();
