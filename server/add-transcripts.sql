-- Add realistic therapy session transcripts
-- Session 1: Benjamin Carter - Work stress and anxiety
INSERT INTO transcript_segments (session_id, speaker, text, start_time, end_time, confidence) VALUES
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'therapist', 'Good morning, Benjamin. Thank you for coming in today. How have you been since our last session?', 15, 42, 0.98),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'client', 'Hi, Dr. Smith. Things have been... challenging. The project deadline at work is coming up and I feel like all the pressure is on my shoulders. I''ve been working late every night this week.', 45, 138, 0.96),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'therapist', 'That sounds incredibly stressful. Can you tell me more about what specific aspects of the project are causing the most anxiety?', 141, 185, 0.97),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'client', 'It''s mainly the fear of letting my team down. We''re short-staffed, and if I don''t deliver, the whole project could fail. I keep having this nightmare where I''m presenting to the board and I have nothing prepared.', 188, 275, 0.95),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'therapist', 'Those catastrophic thoughts are common with work-related anxiety. Have you been practicing the grounding techniques we discussed?', 278, 325, 0.98),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'client', 'I tried the breathing exercises a few times, and they did help in the moment. But I find it hard to remember to do them when I''m in the thick of things.', 328, 398, 0.96),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'therapist', 'That''s understandable. Let''s work on setting up some environmental cues to remind you. What about scheduling brief mindfulness breaks during your workday?', 401, 468, 0.97),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'client', 'I could try setting phone reminders. Maybe every two hours?', 471, 505, 0.96),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'therapist', 'That''s an excellent start. Also, I want you to consider this: if a colleague were in your position, would you expect them to be working until exhaustion every night?', 508, 582, 0.98),
('ba565600-23f9-4477-b19b-a8e7c7f44cba', 'client', 'No, I guess not. I''d probably tell them to take care of themselves.', 585, 629, 0.97);

-- Session 2: Amelia Chen - Relationship issues and communication
INSERT INTO transcript_segments (session_id, speaker, text, start_time, end_time, confidence) VALUES
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'therapist', 'Welcome back, Amelia. How did the conversation with your partner go after our last session?', 12, 58, 0.98),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'client', 'It went better than I expected, actually. I used the "I feel" statements we practiced, and he really listened this time instead of getting defensive.', 61, 138, 0.96),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'therapist', 'That''s wonderful progress! Can you give me a specific example of how you phrased something?', 141, 188, 0.97),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'client', 'Well, instead of saying "You never help with household chores," I said "I feel overwhelmed when I''m managing all the household tasks alone. Can we find a solution together?"', 191, 288, 0.95),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'therapist', 'Excellent reframing. That shifts from blame to expressing your needs. How did he respond?', 291, 338, 0.98),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'client', 'He apologized and said he hadn''t realized how much I was taking on. We made a chore chart together, and he''s been actually following it this week.', 341, 425, 0.96),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'therapist', 'That''s significant improvement. How does it feel to have that support?', 428, 468, 0.97),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'client', 'It feels really good. Like we''re a team again. I didn''t realize how much resentment I was building up.', 471, 538, 0.96),
('0ccb2ffd-550d-431b-a304-85b8a164fa31', 'therapist', 'Resentment is a natural consequence when needs aren''t communicated or met. I''m proud of the work you''ve done to address this constructively.', 541, 615, 0.98);

-- Session 3: Chloe Davis - Coping with life transitions
INSERT INTO transcript_segments (session_id, speaker, text, start_time, end_time, confidence) VALUES
('9ec979d1-f468-445e-a488-309439f165d4', 'therapist', 'Hi Chloe, thank you for coming in. I know this has been a difficult month with the recent move. How are you adjusting?', 18, 78, 0.98),
('9ec979d1-f468-445e-a488-309439f165d4', 'client', 'It''s been harder than I thought it would be. I knew moving to a new city would be challenging, but I feel so isolated. I don''t know anyone here.', 81, 165, 0.96),
('9ec979d1-f468-445e-a488-309439f165d4', 'therapist', 'Moving to a new place is one of life''s major stressors. It''s completely normal to feel isolated. What have you tried so far to build connections?', 168, 245, 0.97),
('9ec979d1-f468-445e-a488-309439f165d4', 'client', 'I joined a gym, but everyone seems to have their own routines and friends already. I feel awkward trying to approach people.', 248, 325, 0.95),
('9ec979d1-f468-445e-a488-309439f165d4', 'therapist', 'It takes courage to put yourself out there. Have you considered joining groups or activities based on your interests rather than just proximity?', 328, 398, 0.98),
('9ec979d1-f468-445e-a488-309439f165d4', 'client', 'I love reading and hiking, but I don''t know where to find those groups here.', 401, 448, 0.96),
('9ec979d1-f468-445e-a488-309439f165d4', 'therapist', 'Let''s explore that. There are apps like Meetup where you can find local book clubs and hiking groups. Would you be open to trying that this week?', 451, 528, 0.97),
('9ec979d1-f468-445e-a488-309439f165d4', 'client', 'Yes, I think I could do that. It feels less scary when there''s a shared interest.', 531, 585, 0.96),
('9ec979d1-f468-445e-a488-309439f165d4', 'therapist', 'Exactly. Shared activities give you a natural conversation starter. Also, remember that building meaningful connections takes time. Be patient with yourself.', 588, 665, 0.98);

-- Session 4: Benjamin Carter (second session) - Progress and setbacks
INSERT INTO transcript_segments (session_id, speaker, text, start_time, end_time, confidence) VALUES
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'therapist', 'Good to see you again, Benjamin. How did implementing the mindfulness breaks go this past week?', 15, 72, 0.98),
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'client', 'Actually, really well for the first few days. I set up the reminders like we discussed, and taking those breaks helped me feel more centered. But then Thursday happened.', 75, 168, 0.96),
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'therapist', 'What happened on Thursday?', 171, 188, 0.97),
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'client', 'We had a major client meeting that didn''t go well. The client wanted changes that would basically require us to restart the project. I felt that familiar panic setting in.', 191, 285, 0.95),
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'therapist', 'That sounds like a genuinely challenging situation. Did you use any of the coping strategies we''ve discussed?', 288, 348, 0.98),
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'client', 'I did, actually. During a bathroom break, I did the 4-7-8 breathing technique. It didn''t make the situation better, but it helped me think more clearly about what we could realistically accomplish.', 351, 465, 0.96),
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'therapist', 'That''s significant progress, Benjamin. You recognized your anxiety, took action to manage it, and were able to problem-solve. That''s exactly what we''ve been working toward.', 468, 558, 0.97),
('36989528-7cdd-4095-a46c-cc8f5d1ffd9b', 'client', 'I guess when you put it that way, it does sound like progress. I was so focused on still feeling anxious that I didn''t notice I was handling it differently.', 561, 648, 0.96);

-- Session 5: Amelia Chen (second session) - Deeper relationship exploration
INSERT INTO transcript_segments (session_id, speaker, text, start_time, end_time, confidence) VALUES
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'therapist', 'Amelia, last time we made great progress with communication. Today, I''d like to explore some deeper patterns in your relationship. Is that okay?', 12, 88, 0.98),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'client', 'Yes, I think I''m ready for that. I''ve been noticing something... I tend to avoid conflict even when something really bothers me.', 91, 168, 0.96),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'therapist', 'That''s an important observation. Can you tell me about a recent example?', 171, 215, 0.97),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'client', 'Last week, my partner made plans with his friends on our anniversary. When he told me, I just said "okay, that''s fine" even though I was really hurt.', 218, 305, 0.95),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'therapist', 'What was going through your mind when you said it was fine?', 308, 348, 0.98),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'client', 'I thought if I told him I was upset, he''d think I was being controlling or needy. And maybe he''d get angry.', 351, 425, 0.96),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'therapist', 'So there''s a fear that expressing your needs will lead to rejection or conflict. Where do you think that belief comes from?', 428, 505, 0.97),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'client', 'Probably from my childhood. My parents fought constantly, and I learned to just stay quiet and not make waves.', 508, 585, 0.96),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'therapist', 'That makes sense. You developed a protective strategy as a child. But now, that strategy might be preventing you from having your needs met in adult relationships. Would you like to work on that?', 588, 685, 0.98),
('a231aaec-5bf9-4917-a9d1-744f538bcb46', 'client', 'Yes, I really would. I don''t want to keep doing this.', 688, 728, 0.97);
