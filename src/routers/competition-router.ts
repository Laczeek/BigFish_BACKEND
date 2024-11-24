import express from 'express';

import authenticate from '../middlewares/authenticate';
import competitionController from '../controllers/competition-controller';

const router = express.Router();

router.use(authenticate);
router.post('/', competitionController.createCompetition);

export default router;