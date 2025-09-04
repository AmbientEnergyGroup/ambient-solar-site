import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasEmailPass: !!process.env.EMAIL_PASS,
    hasEmailUser: !!process.env.EMAIL_USER,
    emailPassValue: process.env.EMAIL_PASS ? 'Set (hidden)' : 'Not set',
    emailUserValue: process.env.EMAIL_USER || 'Not set',
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('EMAIL'))
  });
}
