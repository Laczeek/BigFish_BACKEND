import express from 'express';

import userController from '../controllers/user-controller';

const router = express.Router();
router.post('/', userController.createAccount);
router.get('/', userController.getUsers);
router.get('/search/:nick', userController.getSearchUsers)
router.get('/:uid', userController.getSingleUser);

export default router;
