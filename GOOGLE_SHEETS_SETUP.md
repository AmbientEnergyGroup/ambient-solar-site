# Google Sheets CRM Integration Setup Guide

This guide will help you connect your CRM data from Google Sheets to the Ambient Projects system.

## Prerequisites

- A Google Cloud Project
- A Google Sheets spreadsheet with your CRM data
- Admin access to your Google Cloud Project

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Ambient CRM Integration")
4. Click "Create"

## Step 2: Enable Google Sheets API

1. In your Google Cloud Project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in the details:
   - **Service account name**: `ambient-crm-integration`
   - **Service account ID**: Will auto-generate
   - **Description**: `Service account for Ambient CRM integration`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Generate Service Account Key

1. In the Credentials page, find your service account and click on it
2. Go to the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - this will download a JSON file
6. **Keep this file secure** - it contains sensitive credentials

## Step 5: Share Your Google Sheet

1. Open your Google Sheets CRM spreadsheet
2. Click "Share" in the top right
3. Add your service account email (found in the JSON file under `client_email`)
4. Give it "Viewer" permissions
5. Click "Send"

## Step 6: Prepare Your CRM Data

Your Google Sheet should have columns that map to the following fields:

### Required Fields:
- **Customer Name** (or `Customer Name`, `Name`)
- **Address** (or `Address`, `Property Address`)
- **Contract Value** (or `Contract Value`, `Total Amount`)
- **Install Date** (or `Install Date`, `Installation Date`)

### Optional Fields:
- **System Size** (or `System Size`, `kW`)
- **Status** (or `Status`)
- **Payment Date** (or `Payment Date`)
- **PPW** (or `Price per Watt`)
- **Finance Type** (or `Finance Type`)
- **Lender** (or `Lender`)
- **Battery Type** (or `Battery Type`)
- **Battery Quantity** (or `Battery Quantity`)
- **Panel Type** (or `Panel Type`)

### Example Spreadsheet Structure:

| Customer Name | Address | Contract Value | Install Date | System Size | Status |
|---------------|---------|----------------|--------------|-------------|--------|
| John Smith | 123 Main St, City, CA | 25000 | 2024-01-15 | 8.5 | Site Survey |
| Jane Doe | 456 Oak Ave, City, CA | 32000 | 2024-01-20 | 10.2 | Install |

## Step 7: Use the Import Feature

1. Go to your Ambient Projects page
2. Click the "Import from Google Sheets" button
3. Fill in the form:
   - **Google Sheets URL or ID**: Paste your spreadsheet URL or ID
   - **Data Range**: Usually `A:Z` (all columns)
   - **Service Account Email**: From your JSON file (`client_email`)
   - **Private Key**: From your JSON file (`private_key`)
4. Click "Preview Data" to test the connection
5. Review the preview and click "Import Projects"

## Troubleshooting

### Common Issues:

1. **"Failed to import data from Google Sheets"**
   - Check that your service account email is correct
   - Verify the private key is copied correctly (including `-----BEGIN PRIVATE KEY-----`)
   - Ensure the Google Sheets API is enabled

2. **"No data found in the specified range"**
   - Check your range specification (e.g., `A:Z`)
   - Verify your spreadsheet has data in the specified range
   - Make sure the service account has access to the spreadsheet

3. **"Missing required parameters"**
   - Fill in all required fields in the import form
   - Check that your spreadsheet ID is correct

4. **Import shows 0 valid projects**
   - Verify your spreadsheet has the required columns (Customer Name, Address)
   - Check that the column headers match the expected names
   - Ensure there are no empty rows at the top of your data

### Status Mapping:

The system automatically maps CRM statuses to project statuses:

- `Site Survey`, `Survey` → Site Survey
- `Install`, `Construction` → Install  
- `PTO`, `Permission` → PTO
- `Paid`, `Complete` → Paid
- `Cancel`, `Lost` → Cancelled

## Security Notes

- **Never share your service account JSON file**
- **Keep your private key secure**
- **Consider using environment variables for production**
- **Regularly rotate your service account keys**

## Advanced Configuration

### Custom Field Mapping

If your spreadsheet uses different column names, you can modify the API route in `src/app/api/google-sheets/import/route.ts` to add additional field mappings.

### Batch Import

For large datasets, consider importing in smaller batches to avoid timeouts.

### Data Validation

The system validates imported data and only imports projects with:
- Valid customer names
- Valid addresses
- Proper date formats

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Cloud setup
3. Test with a small sample of data first
4. Ensure your spreadsheet format matches the expected structure 