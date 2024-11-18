import express from 'express';

import authController from '../controllers/auth-controller';

const router = express.Router();

router.post('/login', authController.login);
router.get('/refresh-token', authController.refreshToken);

export default router;