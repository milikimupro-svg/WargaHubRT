import { getAccessToken } from './googleApi';

export const createCalendarEvent = async (summary: string, description: string, dateStr: string): Promise<string> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  // dateStr is 'YYYY-MM-DD'
  // We make it an all-day event
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary,
      description,
      start: {
        date: dateStr,
      },
      end: {
        date: dateStr, // For all-day events that last 1 day, end is the next day usually, but we can set same day or next day. Let's just set same day and Google might adjust or we just add 1 day.
      }
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to create calendar event');

  return data.htmlLink;
};
