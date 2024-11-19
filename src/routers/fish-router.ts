import express from 'express';

import authenticate from '../middlewares/authenticate';
import fishController from '../controllers/fish-controller';
import upload from '../utils/multer-config';

const router = express.Router();

router.post('/', authenticate, upload.single('image'), fishController.addFish);
router.delete('/:fid', authenticate, fishController.removeFish);


export default router;