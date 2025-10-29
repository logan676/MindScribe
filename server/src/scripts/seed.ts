import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    console.log('🌱 Seeding database...\n');

    // Create test user
    console.log('Creating test user...');
    const userResult = await pool.query(
      `
      INSERT INTO users (email, first_name, last_name, title, role)
      VALUES ('dr.smith@mindscribe.com', 'Eleanor', 'Smith', 'Clinical Psychologist', 'clinician')
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
      `
    );
    const userId = userResult.rows[0].id;
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

    // Create test sessions
    console.log('Creating test sessions...');
    const sessions = [
      {
        patientId: patientIds[0],
        date: '2024-07-15',
        startTime: '2024-07-15 09:00:00',
        endTime: '2024-07-15 09:50:00',
        duration: 3000,
        status: 'completed',
        transcriptionStatus: 'completed',
      },
      {
        patientId: patientIds[0],
        date: '2024-07-08',
        startTime: '2024-07-08 09:00:00',
        endTime: '2024-07-08 09:50:00',
        duration: 3000,
        status: 'completed',
        transcriptionStatus: 'completed',
      },
      {
        patientId: patientIds[1],
        date: '2024-07-10',
        startTime: '2024-07-10 14:00:00',
        endTime: '2024-07-10 14:50:00',
        duration: 3000,
        status: 'completed',
        transcriptionStatus: 'completed',
      },
    ];

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

    // Create test appointments
    console.log('Creating test appointments...');
    const today = new Date();
    const appointments = [
      {
        patientId: patientIds[0],
        startTime: new Date(today.setHours(9, 0, 0, 0)),
        endTime: new Date(today.setHours(9, 50, 0, 0)),
        status: 'scheduled',
      },
      {
        patientId: patientIds[1],
        startTime: new Date(today.setHours(11, 0, 0, 0)),
        endTime: new Date(today.setHours(11, 50, 0, 0)),
        status: 'scheduled',
      },
      {
        patientId: patientIds[2],
        startTime: new Date(today.setHours(14, 0, 0, 0)),
        endTime: new Date(today.setHours(14, 50, 0, 0)),
        status: 'scheduled',
      },
    ];

    for (const appointment of appointments) {
      await pool.query(
        `
        INSERT INTO appointments (patient_id, user_id, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [appointment.patientId, userId, appointment.startTime, appointment.endTime, appointment.status]
      );
      console.log(
        `✓ Created appointment: ${appointment.startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })}`
      );
    }
    console.log();

    console.log('✅ Database seeded successfully!\n');
    console.log('Test Data Summary:');
    console.log('- 1 clinician user');
    console.log('- 3 patients');
    console.log('- 3 sessions');
    console.log(`- ${transcriptSegments.length} transcript segments`);
    console.log('- 2 clinical notes');
    console.log('- 3 appointments');
    console.log('\nYou can now login with: dr.smith@mindscribe.com\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seed();
