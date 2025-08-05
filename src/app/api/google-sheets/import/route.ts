import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Interface for CRM data from Google Sheets
interface CRMData {
  customerName: string;
  address: string;
  phone?: string;
  email?: string;
  systemSize?: string;
  contractValue?: string;
  installDate?: string;
  status?: string;
  salesRep?: string;
  notes?: string;
  [key: string]: any; // Allow for additional fields
}

// Interface for converted project data
interface ProjectData {
  id: string;
  customerName: string;
  address: string;
  installDate: string;
  paymentAmount: number;
  paymentDate: string;
  siteSurveyDate?: string;
  permitDate?: string;
  inspectionDate?: string;
  ptoDate?: string;
  status: "site_survey" | "install" | "pto" | "paid" | "cancelled";
  batteryType?: string;
  batteryQuantity?: number;
  panelType?: string;
  grossPPW?: string;
  systemSize?: string;
  financeType?: string;
  lender?: string;
  documents?: {
    utilityBill?: string;
    contract?: string;
    permitPlans?: string;
  };
  userId: string;
  commissionRate?: number;
  dealNumber?: number;
  createdAt?: string;
  cancelledDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      spreadsheetId, 
      range, 
      userId,
      apiKey,
      clientEmail,
      privateKey 
    } = body;

    if (!spreadsheetId || !range || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: spreadsheetId, range, or userId' },
        { status: 400 }
      );
    }

    // Validate private key format
    if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      return NextResponse.json(
        { error: 'Invalid private key format. Please ensure you copied the entire private key including the BEGIN and END markers.' },
        { status: 400 }
      );
    }

    // Validate client email format
    if (!clientEmail || !clientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid service account email format.' },
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

    // Read data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the specified range' },
        { status: 404 }
      );
    }

    // Assume first row contains headers
    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    // Convert CRM data to project format
    const projects: ProjectData[] = dataRows.map((row: any[], index: number) => {
      const rowData: CRMData = {
        customerName: '',
        address: ''
      };
      headers.forEach((header, i) => {
        rowData[header] = row[i] || '';
      });

      // Map CRM fields to project fields
      const project: ProjectData = {
        id: `imported-${Date.now()}-${index}`,
        customerName: rowData.customerName || rowData['Customer Name'] || 'Unknown Customer',
        address: rowData.address || rowData['Address'] || rowData['Property Address'] || '',
        installDate: rowData.installDate || rowData['Install Date'] || rowData['Installation Date'] || new Date().toISOString().split('T')[0],
        paymentAmount: parseFloat(rowData.contractValue || rowData['Contract Value'] || rowData['Total Amount'] || '0') || 0,
        paymentDate: rowData.paymentDate || rowData['Payment Date'] || new Date().toISOString().split('T')[0],
        systemSize: rowData.systemSize || rowData['System Size'] || rowData['kW'] || '',
        status: mapStatus(rowData.status || rowData['Status'] || 'site_survey'),
        userId: userId,
        createdAt: new Date().toISOString(),
        grossPPW: rowData.grossPPW || rowData['PPW'] || rowData['Price per Watt'] || '',
        financeType: rowData.financeType || rowData['Finance Type'] || '',
        lender: rowData.lender || rowData['Lender'] || '',
        batteryType: rowData.batteryType || rowData['Battery Type'] || '',
        batteryQuantity: parseInt(rowData.batteryQuantity || rowData['Battery Quantity'] || '0') || 0,
        panelType: rowData.panelType || rowData['Panel Type'] || '',
      };

      return project;
    });

    // Filter out projects with missing essential data
    const validProjects = projects.filter(project => 
      project.customerName && 
      project.customerName !== 'Unknown Customer' && 
      project.address
    );

    return NextResponse.json({
      success: true,
      importedCount: validProjects.length,
      totalRows: dataRows.length,
      projects: validProjects,
      headers: headers,
      sampleData: dataRows.slice(0, 3) // Return first 3 rows for preview
    });

  } catch (error) {
    console.error('Google Sheets import error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to import data from Google Sheets';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('ERR_OSSL_UNSUPPORTED') || errorDetails.includes('DECODER routines')) {
      errorMessage = 'Invalid private key format. Please ensure you copied the entire private key correctly.';
      errorDetails = 'The private key appears to be malformed or contains invalid characters.';
    } else if (errorDetails.includes('invalid_grant') || errorDetails.includes('unauthorized')) {
      errorMessage = 'Authentication failed. Please check your service account credentials.';
      errorDetails = 'The service account email or private key is incorrect.';
    } else if (errorDetails.includes('notFound')) {
      errorMessage = 'Spreadsheet not found or access denied.';
      errorDetails = 'Please check the spreadsheet ID and ensure the service account has access.';
    } else if (errorDetails.includes('range')) {
      errorMessage = 'Invalid range specified.';
      errorDetails = 'Please check the range format (e.g., A:Z, A1:Z100).';
    }
    
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}

// Helper function to map CRM status to project status
function mapStatus(crmStatus: string): "site_survey" | "install" | "pto" | "paid" | "cancelled" {
  const status = crmStatus.toLowerCase().trim();
  
  if (status.includes('survey') || status.includes('site')) return 'site_survey';
  if (status.includes('install') || status.includes('construction')) return 'install';
  if (status.includes('pto') || status.includes('permission')) return 'pto';
  if (status.includes('paid') || status.includes('complete')) return 'paid';
  if (status.includes('cancel') || status.includes('lost')) return 'cancelled';
  
  return 'site_survey'; // Default status
} 