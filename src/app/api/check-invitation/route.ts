import { NextRequest, NextResponse } from 'next/server';

// In a real app, this would be stored in a database
// For now, we'll use a simple in-memory list that gets populated when invitations are sent
let invitedEmails = new Set<string>();

// Add email to invited list when invitation is sent
export function addInvitedEmail(email: string) {
  invitedEmails.add(email.toLowerCase());
}

// Check if email is invited
export function isEmailInvited(email: string): boolean {
  return invitedEmails.has(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const invited = isEmailInvited(email);
    
    return NextResponse.json({
      invited,
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Error checking invitation:', error);
    return NextResponse.json(
      { error: 'Failed to check invitation' },
      { status: 500 }
    );
  }
}
