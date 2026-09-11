import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@yourdomain.com';

/**
 * Sends a password reset email to the given address.
 * @param {string} to - recipient email address
 * @param {string} resetUrl - the full reset link including token
 * @param {string} storeName - seller's store name for personalisation
 */
export async function sendResetEmail(to, resetUrl, storeName = 'Seller') {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your password — Social Media Sellers',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset your password</title>
      </head>
      <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;min-height:100vh;">
          <tr>
            <td align="center" style="padding:40px 16px;">
              <table width="100%" style="max-width:520px;background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                      🔐 Password Reset
                    </h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                      Social Media Sellers Platform
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 12px;color:#94a3b8;font-size:14px;">Hi <strong style="color:#e2e8f0;">${storeName}</strong>,</p>
                    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">
                      We received a request to reset your password. Click the button below to set a new password.
                      This link expires in <strong style="color:#e2e8f0;">15 minutes</strong>.
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 28px;">
                          <a href="${resetUrl}"
                            style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                            Reset My Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;color:#64748b;font-size:12px;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 24px;word-break:break-all;">
                      <a href="${resetUrl}" style="color:#818cf8;font-size:12px;">${resetUrl}</a>
                    </p>

                    <hr style="border:none;border-top:1px solid #334155;margin:0 0 24px;" />

                    <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
                      If you didn't request a password reset, you can safely ignore this email.
                      Your password will not be changed.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#0f172a;padding:20px 40px;text-align:center;">
                    <p style="margin:0;color:#334155;font-size:11px;">
                      © ${new Date().getFullYear()} Social Media Sellers SaaS. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }
}
