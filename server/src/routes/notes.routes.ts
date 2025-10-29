import express from 'express';
import { notesController } from '../controllers/notes.controller.js';

const router = express.Router();

// Routes
router.post('/generate', notesController.generateNote.bind(notesController));
router.post('/', notesController.createNote.bind(notesController));
router.get('/:id', notesController.getNote.bind(notesController));
router.put('/:id', notesController.updateNote.bind(notesController));
router.post('/:id/sign', notesController.signNote.bind(notesController));
router.get('/session/:sessionId', notesController.getSessionNotes.bind(notesController));

export default router;
