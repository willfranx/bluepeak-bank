export const otpEmailTemplate = (otp, email) => `
<!DOCTYPE html>
<html lang="en" style="margin:0; padding:0; background:#e6ebf1;">
  <body style="margin:0; padding:0; background:#e6ebf1; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0; background:#e6ebf1;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <tr>
              <td style="background:#0072ce; padding:20px; text-align:center; color:white;">
                <h2 style="margin:0; font-size:22px; font-weight:600;">
                  BluePeak Bank
                </h2>
              </td>
            </tr>
            <tr>
              <td style="padding:30px; color:#333;">
                <p style="font-size:16px; margin:0 0 20px;">Hello,</p>
                <p style="font-size:16px; margin:0 0 20px;">
                  Use the verification code below to complete your login:
                </p>
                <p style="font-size:32px; font-weight:bold; text-align:center; letter-spacing:6px; color:#0072ce; margin:20px 0;">
                  ${otp}
                </p>
                <p style="font-size:14px; color:#555; margin:20px 0;">
                  This code will expire in 10 minutes. If you did not request this code, please ignore this email or contact support.
                </p>
                <div style="text-align:center; margin-top:30px;">
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px; text-align:center; font-size:12px; color:#888; background:#f5f6f8;">
                This is an automated message from BluePeak Bank. Do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
