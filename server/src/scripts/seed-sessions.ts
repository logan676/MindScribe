import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedSessions() {
  try {
    console.log('🎬 Seeding sessions for all patients...\n');

    // Get the user ID
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = 'dr.smith@mindscribe.com' LIMIT 1`
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found. Please run the main seed script first.');
    }

    const userId = userResult.rows[0].id;
    console.log(`✓ Found user: ${userId}\n`);

    // Get all patients
    const patientsResult = await pool.query(
      `SELECT id, first_name, last_name, client_id FROM patients ORDER BY created_at`
    );

    const patients = patientsResult.rows;
    console.log(`✓ Found ${patients.length} patients\n`);

    // Session statuses and transcription statuses
    const sessionStatuses = ['completed', 'completed', 'completed', 'in_progress'];
    const transcriptionStatuses = ['completed', 'completed', 'in_progress', 'pending'];

    // Create 2-5 sessions for each patient
    let totalSessions = 0;

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const sessionCount = Math.floor(Math.random() * 4) + 2; // 2-5 sessions per patient

      console.log(`Creating ${sessionCount} sessions for ${patient.first_name} ${patient.last_name}...`);

      for (let j = 0; j < sessionCount; j++) {
        // Generate dates going backwards in time (most recent first)
        const daysAgo = (j * 7) + (i * 2); // Weekly sessions, staggered by patient
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - daysAgo);

        const startTime = new Date(sessionDate);
        startTime.setHours(9 + (j * 2), 0, 0, 0); // 9am, 11am, 1pm, 3pm, 5pm

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 50); // 50-minute sessions

        const duration = 3000; // 50 minutes in seconds

        // Most recent session might be in progress or pending
        const statusIndex = j === 0 && Math.random() > 0.7 ? 3 : Math.floor(Math.random() * 3);
        const status = sessionStatuses[statusIndex];
        const transcriptionStatus = transcriptionStatuses[statusIndex];

        // Create session
        const sessionResult = await pool.query(
          `
          INSERT INTO sessions (
            patient_id, user_id, date, start_time, end_time,
            duration, status, transcription_status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
          `,
          [
            patient.id,
            userId,
            sessionDate.toISOString().split('T')[0],
            startTime.toISOString(),
            endTime.toISOString(),
            duration,
            status,
            transcriptionStatus,
          ]
        );

        const sessionId = sessionResult.rows[0].id;
        totalSessions++;

        // Add sample transcript segments for completed sessions
        if (transcriptionStatus === 'completed') {
          const transcripts = [
            {
              speaker: 'therapist',
              text: `Good ${startTime.getHours() < 12 ? 'morning' : 'afternoon'}. How have you been since our last session?`,
              startTime: 0,
              endTime: 5000,
            },
            {
              speaker: 'client',
              text: "I've been doing okay. This week was a bit challenging, but I managed to use some of the techniques we discussed.",
              startTime: 5500,
              endTime: 12000,
            },
            {
              speaker: 'therapist',
              text: "That's great to hear. Can you tell me more about what was challenging?",
              startTime: 12500,
              endTime: 17000,
            },
            {
              speaker: 'client',
              text: "Work has been stressful with the new project deadlines. I felt overwhelmed at times, but I tried the breathing exercises.",
              startTime: 17500,
              endTime: 25000,
            },
          ];

          for (const segment of transcripts) {
            await pool.query(
              `
              INSERT INTO transcript_segments (
                session_id, speaker, text, start_time, end_time, confidence
              )
              VALUES ($1, $2, $3, $4, $5, $6)
              `,
              [sessionId, segment.speaker, segment.text, segment.startTime, segment.endTime, 0.95]
            );
          }

          // Add clinical note for some completed sessions
          if (Math.random() > 0.5) {
            const noteType = Math.random() > 0.5 ? 'soap' : 'dare';
            const noteStatus = Math.random() > 0.3 ? 'signed' : 'final';

            if (noteType === 'soap') {
              await pool.query(
                `
                INSERT INTO clinical_notes (
                  session_id, user_id, type, status,
                  subjective, objective, assessment, plan, signed_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `,
                [
                  sessionId,
                  userId,
                  noteType,
                  noteStatus,
                  'Client reports feeling stressed due to work demands. Notes improvement in using coping strategies.',
                  'Client appeared alert and engaged. Affect congruent with mood.',
                  'Continued progress in managing stress and anxiety symptoms.',
                  'Continue current treatment plan. Practice mindfulness exercises daily.',
                  noteStatus === 'signed' ? endTime.toISOString() : null,
                ]
              );
            } else {
              await pool.query(
                `
                INSERT INTO clinical_notes (
                  session_id, user_id, type, status,
                  description, action, response, evaluation, signed_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `,
                [
                  sessionId,
                  userId,
                  noteType,
                  noteStatus,
                  'Client discussed work-related stress and interpersonal challenges.',
                  'Reviewed coping strategies and introduced new cognitive reframing techniques.',
                  'Client engaged well with interventions and demonstrated understanding.',
                  'Positive response to treatment. Continue with current approach.',
                  noteStatus === 'signed' ? endTime.toISOString() : null,
                ]
              );
            }
          }
        }
      }

      console.log(`  ✓ Created ${sessionCount} sessions for ${patient.first_name} ${patient.last_name}`);
    }

    console.log(`\n✅ Successfully created ${totalSessions} sessions!\n`);

    // Summary
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN transcription_status = 'completed' THEN 1 END) as transcribed
      FROM sessions
    `);

    const noteStats = await pool.query(`
      SELECT
        COUNT(*) as total_notes,
        COUNT(CASE WHEN status = 'signed' THEN 1 END) as signed,
        COUNT(CASE WHEN type = 'soap' THEN 1 END) as soap_notes,
        COUNT(CASE WHEN type = 'dare' THEN 1 END) as dare_notes
      FROM clinical_notes
    `);

    console.log('Database Summary:');
    console.log(`- Total sessions: ${stats.rows[0].total_sessions}`);
    console.log(`- Completed sessions: ${stats.rows[0].completed}`);
    console.log(`- In-progress sessions: ${stats.rows[0].in_progress}`);
    console.log(`- Transcribed sessions: ${stats.rows[0].transcribed}`);
    console.log(`- Total notes: ${noteStats.rows[0].total_notes}`);
    console.log(`- Signed notes: ${noteStats.rows[0].signed}`);
    console.log(`- SOAP notes: ${noteStats.rows[0].soap_notes}`);
    console.log(`- DARE notes: ${noteStats.rows[0].dare_notes}\n`);

  } catch (error) {
    console.error('❌ Error seeding sessions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seedSessions();
