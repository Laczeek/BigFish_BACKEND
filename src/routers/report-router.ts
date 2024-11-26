import express from 'express';

import reportController from '../controllers/report-controller';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import { generalRateLimiter } from '../utils/rate-limiters';

const router = express.Router();

router.use(generalRateLimiter)
router.use(authenticate);
router.post('/:uid', reportController.reportUser);

router.use(authorize(['admin', 'moderator']));
router.get('/:rid', reportController.getReport);

export default router;
