import express from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getStats } from '../controllers/stats.controller.js';

const router = express.Router();

router.route("/").get(getHome);
router.route("/stats").get(getStats);

export default router;