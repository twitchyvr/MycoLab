// ============================================================================
// EMAIL SERVICE
// Utility for sending notification emails via Netlify Functions
// ============================================================================

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  category?: string;
  priority?: 'low' | 'normal' | 'high';
  entityType?: string;
  entityId?: string;
  entityName?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
  provider?: string;
}

/**
 * Send an email notification via the Netlify function
 * Falls back gracefully if email service is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const response = await fetch('/.netlify/functions/send-notification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('[Email] Failed to send email:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to send email',
      };
    }

    console.log('[Email] Email sent successfully:', data.messageId);
    return {
      success: true,
      messageId: data.messageId,
      provider: data.provider,
    };
  } catch (err: any) {
    // Network errors or function not available - fail gracefully
    console.warn('[Email] Email service unavailable:', err.message);
    return {
      success: false,
      error: 'Email service unavailable',
    };
  }
}

// ============================================================================
// CONTRIBUTION EMAIL TEMPLATES
// ============================================================================

/**
 * Send confirmation email when a user submits a contribution
 */
export async function sendContributionConfirmationEmail(
  userEmail: string,
  contributionType: string,
  entityName: string,
  title: string
): Promise<EmailResult> {
  const typeLabels: Record<string, string> = {
    correction: 'correction suggestion',
    addition: 'information addition',
    photo: 'photo submission',
    tip: 'cultivation tip',
    source: 'source/reference',
  };

  const typeLabel = typeLabels[contributionType] || 'contribution';

  return sendEmail({
    to: userEmail,
    subject: `We received your ${typeLabel} for ${entityName}`,
    body: `Thank you for contributing to the MycoLab community!

We've received your ${typeLabel}:
"${title}"

For: ${entityName}

What happens next:
• Our team will review your submission
• You'll receive an email when it's been reviewed
• If approved, your contribution will be visible to the community

We typically review submissions within a few days. Thank you for helping make MycoLab better for everyone!

If you have any questions, feel free to reach out.

Happy cultivating!
The MycoLab Team`,
    category: 'contribution',
    priority: 'normal',
    entityName,
  });
}

/**
 * Send email when a contribution is approved
 */
export async function sendContributionApprovedEmail(
  userEmail: string,
  contributionType: string,
  entityName: string,
  title: string,
  adminMessage?: string
): Promise<EmailResult> {
  const typeLabels: Record<string, string> = {
    correction: 'correction',
    addition: 'information',
    photo: 'photos',
    tip: 'cultivation tip',
    source: 'source/reference',
    species: 'species suggestion',
    strain: 'strain suggestion',
  };

  const typeLabel = typeLabels[contributionType] || 'contribution';

  let body = `Great news! Your ${typeLabel} has been approved!

"${title}"

For: ${entityName}

Your contribution is now visible to the MycoLab community. Thank you for helping improve our library!`;

  if (adminMessage) {
    body += `

Note from our team:
${adminMessage}`;
  }

  body += `

Keep contributing - the community appreciates your knowledge!

Happy cultivating!
The MycoLab Team`;

  return sendEmail({
    to: userEmail,
    subject: `Your ${typeLabel} for ${entityName} was approved!`,
    body,
    category: 'contribution',
    priority: 'normal',
    entityName,
  });
}

/**
 * Send email when a contribution is rejected
 */
export async function sendContributionRejectedEmail(
  userEmail: string,
  contributionType: string,
  entityName: string,
  title: string,
  reason?: string
): Promise<EmailResult> {
  const typeLabels: Record<string, string> = {
    correction: 'correction suggestion',
    addition: 'information addition',
    photo: 'photo submission',
    tip: 'cultivation tip',
    source: 'source/reference',
    species: 'species suggestion',
    strain: 'strain suggestion',
  };

  const typeLabel = typeLabels[contributionType] || 'contribution';

  let body = `Thank you for your ${typeLabel} for ${entityName}.

Unfortunately, we weren't able to approve this submission:
"${title}"`;

  if (reason) {
    body += `

Reason:
${reason}`;
  } else {
    body += `

This could be due to:
• Duplicate information already in the library
• Information that couldn't be verified
• Content that doesn't meet our guidelines`;
  }

  body += `

Don't be discouraged! We appreciate your effort to contribute. Feel free to submit again with any corrections or additional supporting information.

If you have questions about this decision, please reach out.

Happy cultivating!
The MycoLab Team`;

  return sendEmail({
    to: userEmail,
    subject: `Update on your ${typeLabel} for ${entityName}`,
    body,
    category: 'contribution',
    priority: 'normal',
    entityName,
  });
}

/**
 * Send email when a contribution needs more information
 */
export async function sendContributionNeedsInfoEmail(
  userEmail: string,
  contributionType: string,
  entityName: string,
  title: string,
  requestedInfo: string
): Promise<EmailResult> {
  const typeLabels: Record<string, string> = {
    correction: 'correction suggestion',
    addition: 'information addition',
    photo: 'photo submission',
    tip: 'cultivation tip',
    source: 'source/reference',
    species: 'species suggestion',
    strain: 'strain suggestion',
  };

  const typeLabel = typeLabels[contributionType] || 'contribution';

  const body = `We're reviewing your ${typeLabel} for ${entityName} and need a bit more information.

Your submission:
"${title}"

What we need:
${requestedInfo}

Please log in to MycoLab to respond to this request. You can find your submission in your contribution history.

Thank you for helping us maintain high-quality information in the library!

Happy cultivating!
The MycoLab Team`;

  return sendEmail({
    to: userEmail,
    subject: `More information needed for your ${typeLabel}`,
    body,
    category: 'contribution',
    priority: 'normal',
    entityName,
  });
}

export default {
  sendEmail,
  sendContributionConfirmationEmail,
  sendContributionApprovedEmail,
  sendContributionRejectedEmail,
  sendContributionNeedsInfoEmail,
};
