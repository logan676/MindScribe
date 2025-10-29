import express from 'express';
import { patientsController } from '../controllers/patients.controller.js';

const router = express.Router();

// Routes
router.get('/', patientsController.getPatients.bind(patientsController));
router.get('/:id', patientsController.getPatient.bind(patientsController));
router.post('/', patientsController.createPatient.bind(patientsController));
router.put('/:id', patientsController.updatePatient.bind(patientsController));
router.delete('/:id', patientsController.deletePatient.bind(patientsController));
router.get('/:id/sessions', patientsController.getPatientSessions.bind(patientsController));

export default router;
