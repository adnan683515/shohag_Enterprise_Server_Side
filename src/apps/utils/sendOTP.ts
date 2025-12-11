// sendOtpEmail.ts
import nodemailer from "nodemailer";
import env from "../config/env";

type SendOtpResult = { ok: boolean; info?: any; error?: any };

let transporter: nodemailer.Transporter | null = null;

// Reusable Gmail transporter using your env
function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  return transporter;
}

// Build HTML email template
function buildOtpHtml(otp: string) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>OTP Verification</title>
    </head>

    <body style="background:#f6f9fc; padding:24px; font-family:Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">

            <table width="600" style="background:#ffffff; padding:24px; border-radius:10px;">
              <tr>
                <td style="text-align:center;">
                  <h2 style="margin-bottom:5px;">
                    ${env.ADMIN_NAME ?? "Your App"}
                  </h2>
                  <p style="color:#6b7280; margin-top:0;">Your verification code</p>
                </td>
              </tr>

              <tr>
                <td style="text-align:center; padding-top:10px;">
                  <div style="
                    display:inline-block;
                    background:#f3f4f6;
                    padding:16px 24px;
                    border-radius:8px;
                    font-size:28px;
                    font-weight:bold;
                    letter-spacing:4px;
                  ">
                    ${otp}
                  </div>
                  <p style="color:#6b7280; margin-top:12px;">
                    This code expires in <b>30 seconds</b>.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding-top:20px; text-align:center; color:#6b7280; font-size:14px;">
                  <p>If you did not request this, ignore this email.</p>
                </td>
              </tr>

              <tr>
                <td style="text-align:center; padding-top:18px; color:#9ca3af; font-size:12px;">
                  © ${new Date().getFullYear()} ${env.ADMIN_NAME}
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

// Main send email function
export default async function sendOtpEmail(
  toEmail: string,
  otp: string
): Promise<SendOtpResult> {
  try {
    const transporter = getTransporter();

    const html = buildOtpHtml(otp);
    const text = `Your OTP Code: ${otp} (Valid for 30 seconds)`;

    const mailOptions = {
      from: `"${env.ADMIN_NAME}" <${env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${env.ADMIN_NAME} — OTP Verification`,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    return { ok: true, info };
  } catch (error) {
    console.error("sendOtpEmail error:", error);
    return { ok: false, error };
  }
}
