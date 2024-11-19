import express from 'express';

import userController from '../controllers/user-controller';
import authenticate from '../middlewares/authenticate';
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
router.get('/observe/:uid', authenticate, userController.observeUser);
// PROTECTED ENDPOINTS

router.get('/search/:nickname', userController.searchUsersByNickname);
router.get('/:uid', userController.getUserById);

export default router;
