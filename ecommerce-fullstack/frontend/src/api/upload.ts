import request from '../utils/request';

export interface UploadImageResult {
  fileUrl: string;
}

export const uploadApi = {
  async uploadImage(file: File): Promise<UploadImageResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await request.post<UploadImageResult>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = (res as any).data || res;
    return {
      fileUrl: payload?.fileUrl || '',
    };
  },
};
