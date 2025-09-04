import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Check if credentials are configured
    const hasEmailUser = !!process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com';
    const hasEmailPass = !!process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password-here';
    
    return NextResponse.json({
      emailConfigured: hasEmailUser && hasEmailPass,
      hasEmailUser,
      hasEmailPass,
      emailUser: process.env.EMAIL_USER,
      message: hasEmailUser && hasEmailPass 
        ? 'Email credentials are configured! You can now send emails.'
        : 'Email credentials not configured. Please update .env.local file with your Gmail credentials.'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json();
    
    if (!testEmail) {
      return NextResponse.json({ error: 'testEmail is required' }, { status: 400 });
    }

    // Check if credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_USER === 'your-email@gmail.com' || 
        process.env.EMAIL_PASS === 'your-app-password-here') {
      return NextResponse.json({
        error: 'Email credentials not configured',
        message: 'Please update .env.local with your Gmail credentials'
      }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: testEmail,
      subject: 'Test Email from Ambient Energy Group',
      text: 'This is a test email to verify email configuration is working.',
      html: '<h1>Test Email</h1><p>This is a test email to verify email configuration is working.</p>'
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
