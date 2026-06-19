import { getAccessToken } from './googleApi';

export const exportToGoogleSheets = async (
  title: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // 1. Create a new spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData.error?.message || 'Failed to create spreadsheet');
  const spreadsheetId = createData.spreadsheetId;

  // 2. Update the data
  const data = [headers, ...rows];
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: data,
      }),
    }
  );

  const updateData = await updateRes.json();
  if (!updateRes.ok) throw new Error(updateData.error?.message || 'Failed to update spreadsheet');

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
};
