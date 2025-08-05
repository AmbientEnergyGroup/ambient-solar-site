import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientEmail, privateKey, spreadsheetId } = body;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { error: 'Missing required parameters: clientEmail, privateKey, or spreadsheetId' },
        { status: 400 }
      );
    }

    // Validate private key format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      return NextResponse.json(
        { error: 'Invalid private key format. Please ensure you copied the entire private key including the BEGIN and END markers.' },
        { status: 400 }
      );
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .trim(),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Test connection by getting spreadsheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ['A1:A1'], // Just get a single cell to test access
    });

    return NextResponse.json({
      success: true,
      message: 'Connection successful!',
      spreadsheetTitle: response.data.properties?.title || 'Unknown',
      spreadsheetId: response.data.spreadsheetId,
    });

  } catch (error) {
    console.error('Google Sheets test error:', error);
    
    let errorMessage = 'Failed to connect to Google Sheets';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('ERR_OSSL_UNSUPPORTED') || errorDetails.includes('DECODER routines')) {
      errorMessage = 'Invalid private key format';
      errorDetails = 'The private key appears to be malformed. Please ensure you copied the entire key correctly.';
    } else if (errorDetails.includes('invalid_grant') || errorDetails.includes('unauthorized')) {
      errorMessage = 'Authentication failed';
      errorDetails = 'The service account email or private key is incorrect.';
    } else if (errorDetails.includes('notFound')) {
      errorMessage = 'Spreadsheet not found or access denied';
      errorDetails = 'Please check the spreadsheet ID and ensure the service account has access.';
    }
    
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
} 