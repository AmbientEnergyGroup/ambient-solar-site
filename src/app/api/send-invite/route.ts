import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, role, office, recruitedBy } = await request.json();

    // Validate required fields
    if (!name || !email || !role || !office || !recruitedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter using Gmail SMTP
    // Always use support@ambientenergygroup.com for rep invitations
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'support@ambientenergygroup.com', // Always use support email
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    // Create email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to Ambient Energy Group!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been invited to join our team</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${name}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            You've been invited to join Ambient Energy Group as a <strong>${role}</strong> at our <strong>${office}</strong> office.
          </p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Your Details:</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Role:</strong> ${role}</li>
              <li><strong>Office:</strong> ${office}</li>
              <li><strong>Manager:</strong> ${recruitedBy}</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Click the button below to access your new account and get started with your role. 
            If you have any questions, don't hesitate to reach out to your recruiter or our support team.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://ambient-solar-site.vercel.app" 
               style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-right: 10px;">
              Access Your Account
            </a>
            <a href="mailto:support@ambientenergygroup.com" 
               style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Contact Support
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>This is an automated message from Ambient Energy Group</p>
          <p>If you believe you received this email in error, please contact support.</p>
        </div>
      </div>
    `;

    const textContent = `
Welcome to Ambient Energy Group!

Hello ${name}!

You've been invited to join Ambient Energy Group as a ${role} at our ${office} office.

Your Details:
- Name: ${name}
- Email: ${email}
- Role: ${role}
- Office: ${office}
- Manager: ${recruitedBy}

Click the link below to access your new account and get started with your role:
https://ambient-solar-site.vercel.app

If you have any questions, don't hesitate to reach out to your recruiter or our support team.

Contact Support: support@ambientenergygroup.com

This is an automated message from Ambient Energy Group
If you believe you received this email in error, please contact support.
    `;

    // Send the email
    const mailOptions = {
      from: 'support@ambientenergygroup.com', // Always from support email
      to: email,
      subject: `Welcome to Ambient Energy Group - ${name}`,
      text: textContent,
      html: htmlContent
    };

    // Debug environment variables
    console.log('Environment check:', {
      hasEmailPass: !!process.env.EMAIL_PASS,
      hasEmailUser: !!process.env.EMAIL_USER,
      emailPassLength: process.env.EMAIL_PASS?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      allEmailKeys: Object.keys(process.env).filter(key => key.includes('EMAIL'))
    });

    // If no email password is configured, log the email instead
    if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-app-password-here') {
      console.log('Email password not configured. Email would be sent:', {
        to: email,
        subject: mailOptions.subject,
        from: 'support@ambientenergygroup.com',
        name,
        role,
        office,
        recruitedBy,
        hasEmailPass: !!process.env.EMAIL_PASS,
        emailPassValue: process.env.EMAIL_PASS ? 'Set (hidden)' : 'Not set'
      });
      
      return NextResponse.json({
        success: true,
        message: `Email invitation prepared for ${name} at ${email} (password not configured - check console)`,
        debug: {
          from: 'support@ambientenergygroup.com',
          hasEmailPass: !!process.env.EMAIL_PASS,
          emailPassValue: process.env.EMAIL_PASS ? 'Set (hidden)' : 'Not set',
          allEmailKeys: Object.keys(process.env).filter(key => key.includes('EMAIL'))
        }
      });
    }

    // Actually send the email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully from support@ambientenergygroup.com:', {
        messageId: info.messageId,
        to: email,
        subject: mailOptions.subject
      });

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${name} at ${email} from support@ambientenergygroup.com`,
        messageId: info.messageId
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json({
        error: `Failed to send email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
        details: 'Check if the app password is correct for support@ambientenergygroup.com'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { error: `Failed to send invitation: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
