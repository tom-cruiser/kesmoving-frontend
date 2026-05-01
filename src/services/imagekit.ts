import api from './api';

type ImageKitAuthResponse = {
  signature: string;
  token: string;
  expire: number;
  publicKey: string;
};

type ImageKitUploadResponse = {
  url: string;
};

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const imageKitEnv = import.meta as ImportMeta & { env?: { VITE_IMAGEKIT_AUTH_ENDPOINT?: string } };
const rawAuthEndpoint = imageKitEnv.env?.VITE_IMAGEKIT_AUTH_ENDPOINT || '/uploads/imagekit/auth';
const IMAGEKIT_AUTH_ENDPOINT = rawAuthEndpoint.replace(/^\/api(?=\/)/, '');

async function getImageKitAuth(): Promise<ImageKitAuthResponse> {
  const response = await api.get(IMAGEKIT_AUTH_ENDPOINT);
  const payload = response.data as { success: boolean; data: ImageKitAuthResponse };
  if (!payload.success || !payload.data) {
    throw new Error('Invalid image upload auth response');
  }

  return payload.data;
}

export async function uploadFilesToImageKit(files: File[], folder = 'booking-photos'): Promise<string[]> {
  if (files.length === 0) return [];

  const auth = await getImageKitAuth();

  const uploads = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');
      formData.append('publicKey', auth.publicKey);
      formData.append('signature', auth.signature);
      formData.append('token', auth.token);
      formData.append('expire', String(auth.expire));

      const response = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let message = 'Failed to upload image to ImageKit';
        try {
          const errPayload = await response.json() as { message?: string; error?: string };
          message = errPayload.message || errPayload.error || message;
        } catch {
          // Keep default message when response is not JSON.
        }
        throw new Error(message);
      }

      const payload = await response.json() as ImageKitUploadResponse;
      if (!payload.url) {
        throw new Error('ImageKit did not return a URL');
      }

      return payload.url;
    }),
  );

  return uploads;
}