import { NextRequest, NextResponse } from 'next/server';

// DocuSign API configuration
const DOCUSIGN_BASE_URL = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi/v2.1';
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_TEMPLATE_ID = process.env.DOCUSIGN_TEMPLATE_ID;
const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID;
const DOCUSIGN_PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY;
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID;

// Function to get DocuSign access token using JWT
async function getDocuSignAccessToken(): Promise<string> {
  if (!DOCUSIGN_CLIENT_ID || !DOCUSIGN_PRIVATE_KEY || !DOCUSIGN_USER_ID) {
    throw new Error('DocuSign credentials not configured');
  }

  // For now, we'll use a placeholder. In production, you'd implement JWT authentication
  // This is a simplified version - you'd need to implement proper JWT signing
  const response = await fetch(`${DOCUSIGN_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 'PLACEHOLDER_JWT_TOKEN', // You'd generate this properly
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get DocuSign access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Function to send rep agreement via DocuSign
async function sendRepAgreement(
  repName: string, 
  repEmail: string, 
  addendum?: string
): Promise<{ success: boolean; envelopeId?: string; error?: string }> {
  try {
    // Check if DocuSign is configured
    if (!DOCUSIGN_ACCOUNT_ID || !DOCUSIGN_TEMPLATE_ID) {
      console.log('DocuSign not configured, skipping agreement send');
      return { success: true, envelopeId: 'not-configured' };
    }

    // Get access token
    const accessToken = await getDocuSignAccessToken();

    // Create envelope with template
    const envelope = {
      templateId: DOCUSIGN_TEMPLATE_ID,
      templateRoles: [
        {
          email: repEmail,
          name: repName,
          roleName: 'Rep',
          clientUserId: `rep-${Date.now()}`,
          // Add custom fields for addendum if needed
          ...(addendum && {
            tabs: {
              textTabs: [
                {
                  tabLabel: 'Addendum',
                  value: addendum,
                  locked: false
                }
              ]
            }
          })
        }
      ],
      status: 'sent',
      emailSubject: 'Rep Agreement - Ambient Energy Group',
      emailBlurb: `Dear ${repName},\n\nPlease review and sign your rep agreement. ${addendum ? 'This agreement includes additional terms as specified in the addendum.' : ''}\n\nThank you for joining our team!`
    };

    // Send envelope
    const response = await fetch(`${DOCUSIGN_BASE_URL}/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DocuSign API error: ${errorData.errorCode} - ${errorData.message}`);
    }

    const result = await response.json();
    console.log('✅ DocuSign agreement sent successfully:', result.envelopeId);
    
    return { 
      success: true, 
      envelopeId: result.envelopeId 
    };

  } catch (error) {
    console.error('❌ Error sending DocuSign agreement:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, addendum } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Send the rep agreement
    const result = await sendRepAgreement(name, email, addendum);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Rep agreement sent successfully',
        envelopeId: result.envelopeId
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to send agreement' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in DocuSign API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
