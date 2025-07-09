import { createTransport } from "nodemailer";
import { Resend } from "resend";

const resend = new Resend("re_ctqLuDBq_GVZSAKymuEirFZGewTEUbGeg");

export const sendPasswordResetEmail = async (email, username, link) => {
  const { data, error } = await resend.emails.send({
    from: "Haven <no-reply@voxa.buzz>",
    to: email,
    subject: "Reset your Heaven password",
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Your Heaven Password</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0; padding:0; background-color:#f6f8fa; font-family:'Inter',sans-serif;">
    <center>
      <table width="100%" bgcolor="#f6f8fa" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 24px 0;">
            <table width="450" cellpadding="0" cellspacing="0" border="0" style="background:#fff; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <tr>
                <td align="center" style="padding:32px 24px 0 24px;">
                  <img src="https://res.cloudinary.com/duowocved/image/upload/v1745845721/Frame_1000007866_fdncm0.png" alt="Heaven Logo" style="height:48px; width:48px;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 24px 0 24px;">
                  <h2 style="margin:0 0 12px 0; color:#222;">Reset Your Password</h2>
                  <p style="margin:0 0 16px 0; color:#444;">
                    Hi ${username},<br>
                    We received a request to reset your Heaven password. If you made this request, click the button below to set a new password:
                  </p>
                  <div style="text-align:center; margin:24px 0;">
                    <a href="${link}" style="display:inline-block; background:#f65200; color:#fff; text-decoration:none; padding:14px 0; border-radius:6px; font-weight:600; width:220px; font-size:16px;">
                      Reset Password
                    </a>
                  </div>
                  <p style="margin:0 0 12px 0; color:#666; font-size:14px;">
                    If the button above doesn't work, copy and paste this link into your browser:<br>
                    <a href="${link}" style="color:#f65200;">${link}</a>
                  </p>
                  <p style="margin:0 0 12px 0; color:#888; font-size:13px;">
                    This link will expire in 10 minutes for your security.
                  </p>
                  <p style="margin:0 0 12px 0; color:#888; font-size:13px;">
                    If you did not request a password reset, you can safely ignore this email.
                  </p>
                  <p style="margin:0 0 0 0; color:#222;">
                    Stay safe!<br>
                    <strong>The Heaven Team</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 32px 0 16px 0; color:#bbb; font-size:13px;">
                  Heaven &copy; 2025 &mdash; All Rights Reserved
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
    `,
  });
  if (error) {
    throw new Error("Email not sent");
  }
  console.log(link);
};

export const sendAccountActivationMail = async (email, username, link) => {
  const { data, error } = resend.emails.send({
    from: "Haven <no-reply@voxa.buzz>",
    to: email,
    subject: "Activate your Heaven account",
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Activate Your Heaven Account</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0; padding:0; background-color:#f6f8fa; font-family:'Inter',sans-serif;">
    <center>
      <table width="100%" bgcolor="#f6f8fa" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 24px 0;">
            <table width="450" cellpadding="0" cellspacing="0" border="0" style="background:#fff; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <tr>
                <td align="center" style="padding:32px 24px 0 24px;">
                  <img src="https://res.cloudinary.com/duowocved/image/upload/v1745845721/Frame_1000007866_fdncm0.png" alt="Heaven Logo" style="height:48px; width:48px;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 24px 0 24px;">
                  <h2 style="margin:0 0 12px 0; color:#222;">Welcome to Heaven, ${username}!</h2>
                  <p style="margin:0 0 16px 0; color:#444;">
                    Thank you for signing up. Please confirm your email address to activate your Heaven account and start your journey.
                  </p>
                  <div style="text-align:center; margin:24px 0;">
                    <a href="${link}" style="display:inline-block; background:#f65200; color:#fff; text-decoration:none; padding:14px 0; border-radius:6px; font-weight:600; width:220px; font-size:16px;">
                      Activate Account
                    </a>
                  </div>
                  <p style="margin:0 0 12px 0; color:#666; font-size:14px;">
                    If the button above doesn't work, copy and paste this link into your browser:<br>
                    <a href="${link}" style="color:#f65200;">${link}</a>
                  </p>
                  <p style="margin:0 0 12px 0; color:#888; font-size:13px;">
                    This link will expire in 10 minutes for your security.
                  </p>
                  <p style="margin:0 0 12px 0; color:#888; font-size:13px;">
                    If you did not create a Heaven account, you can safely ignore this email.
                  </p>
                  <p style="margin:0 0 0 0; color:#222;">
                    See you inside!<br>
                    <strong>The Heaven Team</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 32px 0 16px 0; color:#bbb; font-size:13px;">
                  Heaven &copy; 2025 &mdash; All Rights Reserved
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
    `,
  });
  if (error) {
    throw new Error("Email not sent");
  }
};

export const sendLeaseFormEmail = async (
  email,
  username,
  link,
  propertyName
) => {
  const { data, error } = resend.emails.send({
    from: "Haven <no-reply@voxa.buzz>",
    to: email,
    subject: `Lease Form for ${propertyName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lease Form for ${propertyName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0; padding:0; background-color:#f6f8fa; font-family:'Inter',sans-serif;">
    <center>
      <table width="100%" bgcolor="#f6f8fa" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 24px 0;">
            <table width="450" cellpadding="0" cellspacing="0" border="0" style="background:#fff; border-radius:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <tr>
                <td align="center" style="padding:32px 24px 0 24px;">
                  <img src="https://res.cloudinary.com/duowocved/image/upload/v1745845721/Frame_1000007866_fdncm0.png" alt="Heaven Logo" style="height:48px; width:48px;" />
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 24px 0 24px;">
                  <h2 style="margin:0 0 12px 0; color:#222;">Lease Form for ${propertyName}</h2>
                  <p style="margin:0 0 16px 0; color:#444;">
                    Hi ${username},<br> 
                    Please fill out the lease form for ${propertyName} by clicking the button below:
                  </p>
                  <div style="text-align:center; margin:24px 0;">
                    <a href="${link}" style="display:inline-block; background:#f65200; color:#fff; text-decoration:none; padding:14px 0; border-radius:6px; font-weight:600; width:220px; font-size:16px;">
                      Fill Out Lease Form
                    </a>  
                  </div>
                  <p style="margin:0 0 12px 0; color:#666; font-size:14px;">
                    If the button above doesn't work, copy and paste this link into your browser:<br>
                    <a href="${link}" style="color:#f65200;">${link}</a>
                  </p>
                  <p style="margin:0 0 12px 0; color:#888; font-size:13px;">  
                    This link will expire in 12 hours for your security.
                  </p>
                  <p style="margin:0 0 12px 0; color:#888; font-size:13px;">
                    If you did not request a lease form, you can safely ignore this email.
                  </p>
                  <p style="margin:0 0 0 0; color:#222;"> 
                    Stay safe!<br>
                    <strong>The Heaven Team</strong>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
    `,
  });
  if (error) {
    throw new Error("Email not sent");
  }
};

export const sendFlwWebhookEmail = async (email, username, payload) => {
  const { data, error } = await resend.emails.send({
    from: "Haven <no-reply@voxa.buzz>",
    to: email,
    subject: "Flutterwave Webhook",
    html: `
      <h1>Flutterwave Webhook</h1>
      <p>Hello ${username},</p>
      <p>The Flutterwave webhook was called.</p>
      <p>Payload: ${JSON.stringify(payload)}</p>
    `,
  });
};
