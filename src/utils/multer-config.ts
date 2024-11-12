import { Request } from 'express';
import multer from 'multer';

const MAX_FILE_SIZE = 3000000; // 3MB

const storage = multer.memoryStorage();

const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback
) => {
	const fileType = file.mimetype.split('/')[0];
	if (fileType !== 'image') {
		return cb(
			new multer.MulterError(
				'LIMIT_UNEXPECTED_FILE',
				'Invalid file type. Only image allowed.'
			)
		);
	}

	cb(null, true);
};

const upload = multer({
	storage,
	fileFilter,
	limits: { files: 1, fileSize: MAX_FILE_SIZE },
});

export default upload;
