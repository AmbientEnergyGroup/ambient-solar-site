# DocuSign Integration Setup

This document explains how to set up DocuSign integration for automatically sending rep agreements.

## Prerequisites

1. DocuSign Developer Account
2. DocuSign Application created
3. Rep Agreement Template created in DocuSign

## Environment Variables

Add these environment variables to your `.env.local` file and Vercel:

```bash
# DocuSign Configuration
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi/v2.1
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_TEMPLATE_ID=your-template-id
DOCUSIGN_CLIENT_ID=your-client-id
DOCUSIGN_PRIVATE_KEY=your-private-key
DOCUSIGN_USER_ID=your-user-id
```

## Setup Steps

### 1. Create DocuSign Developer Account
1. Go to [DocuSign Developer Center](https://developers.docusign.com/)
2. Sign up for a free developer account
3. Create a new application

### 2. Get API Credentials
1. In your DocuSign account, go to "Apps & Keys"
2. Create a new integration key
3. Note down:
   - Integration Key (Client ID)
   - Account ID
   - User ID (your DocuSign account email)

### 3. Generate Private Key
1. In your integration settings, generate a private key
2. Download the private key file
3. Convert to base64 or store securely

### 4. Create Rep Agreement Template
1. In DocuSign, go to "Templates"
2. Create a new template with your rep agreement document
3. Add signature fields for the rep
4. Add a text field for addendum (optional)
5. Note the Template ID

### 5. Configure Authentication
The current implementation uses JWT authentication. You may need to:
1. Implement proper JWT token generation
2. Handle token refresh
3. Store tokens securely

## Features

### Current Implementation
- ✅ Addendum field in Team tab
- ✅ DocuSign API integration structure
- ✅ Rep agreement display component
- ✅ Automatic agreement sending on invite

### To Complete
- 🔄 JWT authentication implementation
- 🔄 Template configuration
- 🔄 Status tracking
- 🔄 Webhook handling for status updates

## Testing

1. Set up environment variables
2. Create a test rep agreement template
3. Test the invite flow
4. Verify agreement is sent to rep's email
5. Check status updates in account page

## Troubleshooting

### Common Issues
1. **Authentication errors**: Check JWT implementation
2. **Template not found**: Verify template ID
3. **Envelope not sent**: Check account permissions
4. **Status not updating**: Implement webhook handling

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed API logs.

## Security Notes

- Store private keys securely
- Use environment variables for all credentials
- Implement proper JWT token management
- Consider using DocuSign's OAuth flow for production
