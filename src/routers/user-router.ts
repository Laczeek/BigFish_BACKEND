import express from 'express';

import userController from '../controllers/user-controller';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import upload from '../utils/multer-config';
import { generalRateLimiter, uploadRateLimiter } from '../utils/rate-limiters';

const router = express.Router();

router.patch(
	'/me',
	uploadRateLimiter,
	authenticate,
	upload.single('image'),
	userController.updateMe
);
router.use(generalRateLimiter);
router.get('/', userController.getUsers);
router.get('/me', authenticate, userController.getMe);
router.delete('/me', authenticate, userController.deleteAccount);
router.delete(
	'/:uid',
	authenticate,
	authorize(['admin', 'moderator']),
	userController.banUserAndDeleteAccount
);
router.get('/observe/:uid', authenticate, userController.observeUser);

router.get('/search', userController.searchUsersByNickname);
router.get('/:uid', userController.getUserById);

export default router;
