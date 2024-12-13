import express from 'express';

import authenticate from '../middlewares/authenticate';
import fishController from '../controllers/fish-controller';
import upload from '../utils/multer-config';
import { generalRateLimiter, uploadRateLimiter } from '../utils/rate-limiters';

const router = express.Router();

router.get('/', generalRateLimiter, fishController.getFish);
router.get(
	'/observed',
	authenticate,
	generalRateLimiter,
	fishController.getLatestFishesOfObservedUsers
);
router.get('/:uid', generalRateLimiter, fishController.getUsersFish);

router.use(authenticate);
router.post(
	'/',
	uploadRateLimiter,
	upload.single('image'),
	fishController.addFish
);

router.delete('/:fid', generalRateLimiter, fishController.removeFish);

export default router;
