# Email Setup for Rep Invitations

## Current Configuration
- **From Email**: `support@ambientenergygroup.com` (hardcoded)
- **App Password**: `eata mhko zuff klyx` (from your personal Gmail)

## Important Note
The current app password is associated with your personal Gmail account, not the support account. For production use, you should:

1. **Set up 2-Factor Authentication** on `support@ambientenergygroup.com`
2. **Generate a new App Password** for the support account
3. **Update the .env.local file** with the new app password

## Testing
To test the email system:
1. Go to the Team page
2. Click "Add New Rep"
3. Fill out the form with a test email
4. Submit the form
5. Check the console for success/error messages

## Troubleshooting
If emails fail to send:
- Check that the app password is correct
- Verify 2FA is enabled on the Gmail account
- Check the console for detailed error messages
- Ensure the support email account has proper permissions
