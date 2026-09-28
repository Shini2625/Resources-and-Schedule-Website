import path from 'path';
import { generateR2PresignedUrl } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getPresignedUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder = 'resources' } = req.body;

    if (!fileName || !fileType) {
      throw new ApiError(400, 'fileName and fileType are required.');
    }

    const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueKey = `${folder}/${req.user.id}/${Date.now()}-${sanitizedName}`;

    const presignedData = generateR2PresignedUrl({
      key: uniqueKey,
      contentType: fileType,
    });

    if (!presignedData.configured) {
      return ApiResponse.success(
        res,
        200,
        {
          configured: false,
          message: presignedData.message,
          key: uniqueKey,
          mockFileUrl: `/uploads/${uniqueKey}`,
        },
        'R2 credentials not yet configured. Provide direct file/link URLs or configure R2 credentials in .env'
      );
    }

    return ApiResponse.success(
      res,
      200,
      {
        configured: true,
        uploadUrl: presignedData.uploadUrl,
        fileUrl: presignedData.fileUrl,
        method: presignedData.method,
        headers: presignedData.headers,
        key: uniqueKey,
      },
      'Presigned upload URL generated successfully.'
    );
  } catch (error) {
    return next(error);
  }
};

export const getStorageConfig = async (req, res) => {
  const isConfigured = Boolean(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );

  return ApiResponse.success(
    res,
    200,
    {
      configured: isConfigured,
      bucket: process.env.R2_BUCKET || null,
      publicUrl: process.env.R2_PUBLIC_URL || null,
    },
    'Storage configuration status fetched.'
  );
};
