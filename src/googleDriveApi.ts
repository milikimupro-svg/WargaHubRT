import { getAccessToken } from './googleApi';

export const saveToGoogleDrive = async (fileName: string, content: string, mimeType: string = 'text/plain'): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const metadata = {
    name: fileName,
    mimeType: mimeType, // Google Docs format usually requires multipart upload, we use plain or text/html
  };

  const fileData = new Blob([content], { type: mimeType });
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileData);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to upload to Drive');

  return `https://drive.google.com/file/d/${data.id}/view`;
};
