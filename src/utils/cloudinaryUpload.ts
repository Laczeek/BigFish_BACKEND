import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import AppError from './AppError';

const DEFAULT_PUBLIC_ID = 'avatars/xkesqylhn9sgaxx1kfbi';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME!,
	api_key: process.env.CLOUDINARY_KEY!,
	api_secret: process.env.CLOUDINARY_SECRET!,
});

export const cloudinaryUpload = async (
	folderName: string,
	fileBuffer: Buffer
): Promise<UploadApiResponse | undefined> => {
	return new Promise((resolve, reject) => {
		const cld_upload_stream = cloudinary.uploader.upload_stream(
			{
				folder: folderName,
				format: 'webp',
				transformation: {
					width: undefined,
					height: undefined,
					crop: 'thumb',
					quality: 'auto',
				},
			},
			(error, result) => {
				if (error)
					return reject(
						new AppError('The new image could not be saved.', 500)
					);
				resolve(result);
			}
		);

		streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
	});
};

// DON'T CARE ABOUT RESULT, THIS MUST WORK IN THE BACKGROUND
export const cloudinaryDestroy = async (public_id: string) => {
	if (public_id !== DEFAULT_PUBLIC_ID) {
		cloudinary.uploader
			.destroy(public_id)
			.catch((err) => console.error(err));
	}
};
