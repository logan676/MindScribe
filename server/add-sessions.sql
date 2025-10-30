-- Add 30 more sessions distributed across patients
-- User ID: ba36204c-5cf6-4aa7-91a6-70199d87dfe1
-- Patients:
--   Amelia Chen: 1d2ee0f2-2564-409b-8d76-9bb866ee38c9
--   Benjamin Carter: 94b1d337-4e66-4169-a1d4-508dfb72e95e
--   Chloe Davis: 4b0c1d4e-ff66-4465-bffc-7cb8de00c739

-- Amelia Chen Sessions (10)
INSERT INTO sessions (patient_id, user_id, date, start_time, end_time, duration, status, transcription_status) VALUES
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-25', '2024-10-25 10:00:00', '2024-10-25 10:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-18', '2024-10-18 10:00:00', '2024-10-18 10:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-11', '2024-10-11 14:00:00', '2024-10-11 14:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-04', '2024-10-04 10:00:00', '2024-10-04 10:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-27', '2024-09-27 10:00:00', '2024-09-27 10:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-20', '2024-09-20 14:00:00', '2024-09-20 14:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-13', '2024-09-13 10:00:00', '2024-09-13 10:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-06', '2024-09-06 10:00:00', '2024-09-06 10:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-08-30', '2024-08-30 14:00:00', '2024-08-30 14:50:00', 3000, 'completed', 'completed'),
('1d2ee0f2-2564-409b-8d76-9bb866ee38c9', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-08-23', '2024-08-23 10:00:00', '2024-08-23 10:50:00', 3000, 'completed', 'completed');

-- Benjamin Carter Sessions (10)
INSERT INTO sessions (patient_id, user_id, date, start_time, end_time, duration, status, transcription_status) VALUES
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-26', '2024-10-26 11:00:00', '2024-10-26 11:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-19', '2024-10-19 11:00:00', '2024-10-19 11:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-12', '2024-10-12 15:00:00', '2024-10-12 15:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-05', '2024-10-05 11:00:00', '2024-10-05 11:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-28', '2024-09-28 11:00:00', '2024-09-28 11:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-21', '2024-09-21 15:00:00', '2024-09-21 15:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-14', '2024-09-14 11:00:00', '2024-09-14 11:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-07', '2024-09-07 11:00:00', '2024-09-07 11:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-08-31', '2024-08-31 15:00:00', '2024-08-31 15:50:00', 3000, 'completed', 'completed'),
('94b1d337-4e66-4169-a1d4-508dfb72e95e', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-08-24', '2024-08-24 11:00:00', '2024-08-24 11:50:00', 3000, 'completed', 'completed');

-- Chloe Davis Sessions (10)
INSERT INTO sessions (patient_id, user_id, date, start_time, end_time, duration, status, transcription_status) VALUES
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-24', '2024-10-24 14:00:00', '2024-10-24 14:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-17', '2024-10-17 14:00:00', '2024-10-17 14:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-10', '2024-10-10 09:00:00', '2024-10-10 09:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-10-03', '2024-10-03 14:00:00', '2024-10-03 14:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-26', '2024-09-26 14:00:00', '2024-09-26 14:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-19', '2024-09-19 09:00:00', '2024-09-19 09:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-12', '2024-09-12 14:00:00', '2024-09-12 14:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-09-05', '2024-09-05 14:00:00', '2024-09-05 14:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-08-29', '2024-08-29 09:00:00', '2024-08-29 09:50:00', 3000, 'completed', 'completed'),
('4b0c1d4e-ff66-4465-bffc-7cb8de00c739', 'ba36204c-5cf6-4aa7-91a6-70199d87dfe1', '2024-08-22', '2024-08-22 14:00:00', '2024-08-22 14:50:00', 3000, 'completed', 'completed');
