import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

router.post('/clear', async (req, res) => {
  try {
    console.log('🧹 Clearing database...\n');

    // Delete in reverse order of foreign key dependencies
    await pool.query('DELETE FROM audit_logs');
    await pool.query('DELETE FROM appointments');
    await pool.query('DELETE FROM clinical_notes');
    await pool.query('DELETE FROM transcript_segments');
    await pool.query('DELETE FROM sessions');
    await pool.query('DELETE FROM patients');
    await pool.query('DELETE FROM users');

    console.log('✅ Database cleared successfully!\n');

    res.json({
      success: true,
      message: 'Database cleared successfully',
    });
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding database via API...\n');

    // Create test user with specific ID to match the hardcoded ID in controllers
    console.log('Creating test user...');
    const userId = 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1';
    const userResult = await pool.query(
      `
      INSERT INTO users (id, email, first_name, last_name, title, role)
      VALUES ($1, 'dr.smith@mindscribe.com', 'Eleanor', 'Smith', 'Clinical Psychologist', 'clinician')
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
      `,
      [userId]
    );
    console.log(`✓ Created user: Dr. Eleanor Smith (${userId})\n`);

    // Create test patients
    console.log('Creating test patients...');
    const patients = [
      {
        firstName: 'Amelia',
        lastName: 'Chen',
        clientId: 'CHE3459',
        dateOfBirth: '1995-08-15',
        email: 'amelia.chen@email.com',
        phone: '555-0101',
      },
      {
        firstName: 'Benjamin',
        lastName: 'Carter',
        clientId: 'CAR3460',
        dateOfBirth: '1988-03-22',
        email: 'ben.carter@email.com',
        phone: '555-0102',
      },
      {
        firstName: 'Chloe',
        lastName: 'Davis',
        clientId: 'DAV3461',
        dateOfBirth: '1992-11-30',
        email: 'chloe.davis@email.com',
        phone: '555-0103',
      },
      {
        firstName: 'Daniel',
        lastName: 'Anderson',
        clientId: 'AND3479',
        dateOfBirth: '1993-04-12',
        email: 'daniel.anderson@email.com',
        phone: '555-0121',
      },
      {
        firstName: 'Emily',
        lastName: 'Brooks',
        clientId: 'BRO3480',
        dateOfBirth: '1989-09-25',
        email: 'emily.brooks@email.com',
        phone: '555-0122',
      },
      {
        firstName: 'Fiona',
        lastName: 'Collins',
        clientId: 'COL3481',
        dateOfBirth: '1991-06-18',
        email: 'fiona.collins@email.com',
        phone: '555-0123',
      },
      {
        firstName: 'George',
        lastName: 'Dixon',
        clientId: 'DIX3482',
        dateOfBirth: '1987-11-03',
        email: 'george.dixon@email.com',
        phone: '555-0124',
      },
      {
        firstName: 'Hannah',
        lastName: 'Edwards',
        clientId: 'EDW3483',
        dateOfBirth: '1994-02-28',
        email: 'hannah.edwards@email.com',
        phone: '555-0125',
      },
      {
        firstName: 'Ian',
        lastName: 'Fletcher',
        clientId: 'FLE3484',
        dateOfBirth: '1986-07-14',
        email: 'ian.fletcher@email.com',
        phone: '555-0126',
      },
      {
        firstName: 'Julia',
        lastName: 'Green',
        clientId: 'GRE3485',
        dateOfBirth: '1992-12-09',
        email: 'julia.green@email.com',
        phone: '555-0127',
      },
      {
        firstName: 'Kevin',
        lastName: 'Harris',
        clientId: 'HAR3486',
        dateOfBirth: '1990-05-21',
        email: 'kevin.harris@email.com',
        phone: '555-0128',
      },
      {
        firstName: 'Laura',
        lastName: 'Jackson',
        clientId: 'JAC3487',
        dateOfBirth: '1988-10-17',
        email: 'laura.jackson@email.com',
        phone: '555-0129',
      },
      {
        firstName: 'Michael',
        lastName: 'King',
        clientId: 'KIN3488',
        dateOfBirth: '1985-03-06',
        email: 'michael.king@email.com',
        phone: '555-0130',
      },
      {
        firstName: 'Natalie',
        lastName: 'Lewis',
        clientId: 'LEW3489',
        dateOfBirth: '1996-08-23',
        email: 'natalie.lewis@email.com',
        phone: '555-0131',
      },
      {
        firstName: 'Oliver',
        lastName: 'Mitchell',
        clientId: 'MIT3490',
        dateOfBirth: '1991-01-15',
        email: 'oliver.mitchell@email.com',
        phone: '555-0132',
      },
      {
        firstName: 'Patricia',
        lastName: 'Nelson',
        clientId: 'NEL3491',
        dateOfBirth: '1989-06-30',
        email: 'patricia.nelson@email.com',
        phone: '555-0133',
      },
      {
        firstName: 'Quinn',
        lastName: 'Parker',
        clientId: 'PAR3492',
        dateOfBirth: '1993-11-11',
        email: 'quinn.parker@email.com',
        phone: '555-0134',
      },
      {
        firstName: 'Robert',
        lastName: 'Roberts',
        clientId: 'ROB3493',
        dateOfBirth: '1987-04-26',
        email: 'robert.roberts@email.com',
        phone: '555-0135',
      },
      {
        firstName: 'Sarah',
        lastName: 'Scott',
        clientId: 'SCO3494',
        dateOfBirth: '1995-09-08',
        email: 'sarah.scott@email.com',
        phone: '555-0136',
      },
      {
        firstName: 'Thomas',
        lastName: 'Turner',
        clientId: 'TUR3495',
        dateOfBirth: '1990-02-19',
        email: 'thomas.turner@email.com',
        phone: '555-0137',
      },
      {
        firstName: 'Ursula',
        lastName: 'Walker',
        clientId: 'WAL3496',
        dateOfBirth: '1988-07-04',
        email: 'ursula.walker@email.com',
        phone: '555-0138',
      },
      {
        firstName: 'Victor',
        lastName: 'White',
        clientId: 'WHI3497',
        dateOfBirth: '1992-12-16',
        email: 'victor.white@email.com',
        phone: '555-0139',
      },
      {
        firstName: 'Wendy',
        lastName: 'Young',
        clientId: 'YOU3498',
        dateOfBirth: '1994-05-27',
        email: 'wendy.young@email.com',
        phone: '555-0140',
      },
    ];

    const patientIds = [];
    for (const patient of patients) {
      const result = await pool.query(
        `
        INSERT INTO patients (user_id, first_name, last_name, client_id, date_of_birth, email, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (client_id) DO UPDATE SET email = EXCLUDED.email
        RETURNING id, first_name, last_name, client_id
        `,
        [
          userId,
          patient.firstName,
          patient.lastName,
          patient.clientId,
          patient.dateOfBirth,
          patient.email,
          patient.phone,
        ]
      );
      patientIds.push(result.rows[0].id);
      console.log(
        `✓ Created patient: ${result.rows[0].first_name} ${result.rows[0].last_name} (${result.rows[0].client_id})`
      );
    }
    console.log();

    // Create test sessions - 3 sessions for each patient
    console.log('Creating test sessions...');
    const sessions = [];
    const sessionDates = [
      { date: '2024-07-15', startTime: '09:00:00', endTime: '09:50:00' },
      { date: '2024-07-08', startTime: '11:00:00', endTime: '11:50:00' },
      { date: '2024-07-01', startTime: '14:00:00', endTime: '14:50:00' },
    ];

    // Create 3 sessions for each patient
    for (let i = 0; i < patientIds.length; i++) {
      for (const sessionDate of sessionDates) {
        sessions.push({
          patientId: patientIds[i],
          date: sessionDate.date,
          startTime: `${sessionDate.date} ${sessionDate.startTime}`,
          endTime: `${sessionDate.date} ${sessionDate.endTime}`,
          duration: 3000,
          status: 'completed',
          transcriptionStatus: 'completed',
        });
      }
    }

    const sessionIds = [];
    for (const session of sessions) {
      const result = await pool.query(
        `
        INSERT INTO sessions (
          patient_id, user_id, date, start_time, end_time,
          duration, status, transcription_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        `,
        [
          session.patientId,
          userId,
          session.date,
          session.startTime,
          session.endTime,
          session.duration,
          session.status,
          session.transcriptionStatus,
        ]
      );
      sessionIds.push(result.rows[0].id);
      console.log(`✓ Created session: ${session.date}`);
    }
    console.log();

    // Create test transcript segments
    console.log('Creating test transcript segments...');
    const transcriptSegments = [
      {
        sessionId: sessionIds[0],
        speaker: 'therapist',
        text: 'Good morning. Thank you for coming in today. How have things been since our last session?',
        startTime: 0,
        endTime: 5000,
        confidence: 0.95,
      },
      {
        sessionId: sessionIds[0],
        speaker: 'client',
        text: "Hi. Things have been... a bit of a rollercoaster. I tried that mindfulness exercise you suggested, and it helped sometimes. But this week at work was really stressful.",
        startTime: 5500,
        endTime: 15000,
        confidence: 0.92,
      },
      {
        sessionId: sessionIds[0],
        speaker: 'therapist',
        text: 'I see. Can you tell me more about what was stressful at work?',
        startTime: 15500,
        endTime: 20000,
        confidence: 0.96,
      },
      {
        sessionId: sessionIds[0],
        speaker: 'client',
        text: 'We had a major project deadline, and I felt like all the pressure was on me. I was working late, and my sleep schedule got all messed up again.',
        startTime: 20500,
        endTime: 30000,
        confidence: 0.94,
      },
    ];

    for (const segment of transcriptSegments) {
      await pool.query(
        `
        INSERT INTO transcript_segments (
          session_id, speaker, text, start_time, end_time, confidence
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          segment.sessionId,
          segment.speaker,
          segment.text,
          segment.startTime,
          segment.endTime,
          segment.confidence,
        ]
      );
    }
    console.log(`✓ Created ${transcriptSegments.length} transcript segments\n`);

    // Create test clinical notes
    console.log('Creating test clinical notes...');
    const notes = [
      {
        sessionId: sessionIds[0],
        type: 'soap',
        status: 'signed',
        subjective:
          'Client reports a "rollercoaster" week with significant work-related stress due to a major project deadline. She notes a recurrence of sleep disruption and the "familiar sense of dread on Sunday evening."',
        objective:
          'Client presented as alert and oriented. Affect was congruent with reported mood, appearing anxious when discussing work pressures. Speech was clear and goal-directed.',
        assessment:
          'Client continues to exhibit symptoms consistent with Generalized Anxiety Disorder, triggered by work-related stressors.',
        plan:
          'Continue CBT therapy with focus on stress management techniques. Assigned homework: practice mindfulness exercises daily, implement sleep hygiene routine.',
        signedAt: '2024-07-15 10:00:00',
      },
      {
        sessionId: sessionIds[1],
        type: 'soap',
        status: 'final',
        subjective:
          'Client reports improved sleep quality after implementing recommended sleep hygiene practices.',
        objective: 'Client appeared more relaxed. Appropriate affect throughout session.',
        assessment: 'Progress noted in managing anxiety symptoms.',
        plan: 'Continue current interventions. Schedule follow-up in two weeks.',
      },
    ];

    for (const note of notes) {
      await pool.query(
        `
        INSERT INTO clinical_notes (
          session_id, user_id, type, status,
          subjective, objective, assessment, plan, signed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          note.sessionId,
          userId,
          note.type,
          note.status,
          note.subjective,
          note.objective,
          note.assessment,
          note.plan,
          note.signedAt || null,
        ]
      );
      console.log(`✓ Created ${note.type.toUpperCase()} note (${note.status})`);
    }
    console.log();

    console.log('✅ Database seeded successfully!\n');

    res.json({
      success: true,
      message: 'Database seeded successfully',
      summary: {
        users: 1,
        patients: patients.length,
        sessions: sessions.length,
        transcriptSegments: transcriptSegments.length,
        clinicalNotes: notes.length,
      },
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
