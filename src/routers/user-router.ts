import express from 'express';

import userController from '../controllers/user-controller';
import authenticate from '../middlewares/authenticate';
import upload from '../utils/multer-config';

const router = express.Router();
router.post('/', userController.createAccount);
router.get('/', userController.getUsers);
router.get('/search/:nick', userController.getSearchUsers)
router.get('/:uid', userController.getSingleUser);

// PROTECTED ENDPOINTS
router.use(authenticate);
router.patch('/me', upload.single('image'), userController.updateUser);

export default router;
