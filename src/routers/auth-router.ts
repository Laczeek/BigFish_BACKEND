import express from 'express';

import { generalRateLimiter, loginRateLimiter } from '../utils/rate-limiters';
import authController from '../controllers/auth-controller';

const router = express.Router();

router.post('/login', loginRateLimiter, authController.login);

router.use(generalRateLimiter);
router.get('/refresh-token', authController.refreshToken);
router.post('/signup', authController.signup);
router.get('/logout', authController.logout);

export default router;
