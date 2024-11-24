import express from 'express';

import authenticate from '../middlewares/authenticate';
import competitionController from '../controllers/competition-controller';

const router = express.Router();

router.use(authenticate);
router.post('/', competitionController.createCompetition);

router.get('/invites', competitionController.getMyInvites);
router.post('/:cid/invite/:uid', competitionController.inviteUserToCompetition);
router.patch('/:cid/accept', competitionController.acceptInvite);
router.delete('/:cid/remove/:uid', competitionController.removeUserFromCompetition);

export default router;