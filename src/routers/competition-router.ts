import express from 'express';

import authenticate from '../middlewares/authenticate';
import competitionController from '../controllers/competition-controller';
import { generalRateLimiter } from '../utils/rate-limiters';

const router = express.Router();

router.use(generalRateLimiter);
router.use(authenticate);
router.post('/', competitionController.createCompetition);
router.get('/', competitionController.getCompetition);
router.delete('/', competitionController.deleteCompetition);
router.get('/invites', competitionController.getMyInvites);
router.patch('/start', competitionController.startCompetition);
router.post('/invite/:uid', competitionController.inviteUserToCompetition);
router.patch('/:cid/accept', competitionController.acceptInvite);
router.delete('/quit', competitionController.quitCompetition);
router.delete('/remove/:uid', competitionController.removeUserFromCompetition);
router.delete('/save', competitionController.saveCompetitionResult);

export default router;
