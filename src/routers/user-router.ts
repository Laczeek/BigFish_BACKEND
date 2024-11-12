import express from 'express';

import userController from '../controllers/user-controller';
import authenticate from '../middlewares/authenticate';

const router = express.Router();
router.post('/', userController.createAccount);
router.get('/', userController.getUsers);
router.get('/search/:nick', userController.getSearchUsers)
router.get('/:uid', userController.getSingleUser);

// PROTECTED ENDPOINTS
router.use(authenticate);
router.patch('/me', userController.updateUser);

export default router;
