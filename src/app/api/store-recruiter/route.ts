import { NextRequest, NextResponse } from 'next/server';

// In-memory store for recruiter information
// In production, this would be stored in a database
const recruiterStore = new Map<string, {
  email: string;
  recruitedBy: string;
  invitedAt: string;
  addendum?: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const { email, recruitedBy, addendum } = await request.json();

    if (!email || !recruitedBy) {
      return NextResponse.json(
        { error: 'Email and recruitedBy are required' },
        { status: 400 }
      );
    }

    // Store recruiter information
    recruiterStore.set(email, {
      email,
      recruitedBy,
      invitedAt: new Date().toISOString(),
      addendum: addendum || ''
    });

    console.log('Stored recruiter information for:', email, 'recruited by:', recruitedBy);

    return NextResponse.json({
      success: true,
      message: 'Recruiter information stored successfully'
    });

  } catch (error) {
    console.error('Error storing recruiter information:', error);
    return NextResponse.json(
      { error: 'Failed to store recruiter information' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const recruiterInfo = recruiterStore.get(email);

    if (!recruiterInfo) {
      return NextResponse.json(
        { error: 'No recruiter information found for this email' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      recruiterInfo
    });

  } catch (error) {
    console.error('Error retrieving recruiter information:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve recruiter information' },
      { status: 500 }
    );
  }
}
