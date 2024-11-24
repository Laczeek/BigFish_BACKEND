import express from 'express';

import userController from '../controllers/user-controller';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import upload from '../utils/multer-config';

const router = express.Router();

router.get('/', userController.getUsers);

// PROTECTED ENDPOINTS
router.patch(
	'/me',
	authenticate,
	upload.single('image'),
	userController.updateMe
);
router.get('/me', authenticate, userController.getMe);
router.delete('/me', authenticate, userController.deleteAccount);
router.delete(
	'/:uid',
	authenticate,
	authorize(['admin', 'moderator']),
	userController.banUserAndDeleteAccount
);
router.get('/observe/:uid', authenticate, userController.observeUser);
// PROTECTED ENDPOINTS

router.get('/search/:nickname', userController.searchUsersByNickname);
router.get('/:uid', userController.getUserById);

export default router;
