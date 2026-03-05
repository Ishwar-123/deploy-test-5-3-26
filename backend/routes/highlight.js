import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getHighlights,
    addHighlight,
    updateHighlight,
    deleteHighlight
} from '../controllers/highlightController.js';

const router = express.Router();

router.use(protect); // specific protection for all routes

router.route('/')
    .post(addHighlight);

router.route('/:id')
    .put(updateHighlight)
    .delete(deleteHighlight);

router.route('/book/:bookId')
    .get(getHighlights);

export default router;
