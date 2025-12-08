// api/writeToSheet.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { Lead } from '../types';

// This is the main handler for the serverless function
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const lead: Lead = req.body;

    // 1. Authenticate with Google
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Vercel needs this replacement
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 2. Initialize the Sheet
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID as string, serviceAccountAuth);
    await doc.loadInfo(); // loads document properties and worksheets
    const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsByTitle['YourSheetTitle']

    // 3. Append the new row
    await sheet.addRow({
      id: lead.id,
      name: lead.name,
      title: lead.title,
      company: lead.company,
      linkedinUrl: lead.linkedinUrl,
      postContent: lead.postContent,
      status: lead.status,
      email: lead.email || '', // Handle optional fields
    });

    return res.status(200).json({ message: 'Success: Lead added to sheet.' });

  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: 'Failed to write to Google Sheet.', details: errorMessage });
  }
}
