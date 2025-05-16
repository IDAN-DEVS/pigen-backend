import { appConstants } from '../appConstant';

export function baseEmailTemplate({ title, content }: { title?: string; content: string }) {
  const appName = appConstants.appName;
  const accentColor = '#ef790d';
  const currentYear = new Date().getFullYear();

  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="background: #f6f7fa; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, 'Open Sans', sans-serif; color: #23272f;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f6f7fa">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin: 40px auto; background: rgba(255,255,255,0.85); border-radius: 18px; box-shadow: 0 8px 32px 0 rgba(31,38,135,0.10); backdrop-filter: blur(8px);">
            <!-- Header: App Name Only -->
            <tr>
              <td align="center" style="padding: 40px 0 10px 0;">
                <img src="https://cdn-icons-png.flaticon.com/512/2920/2920244.png" alt="PIGEN Logo" width="60" style="margin-bottom: 10px; filter: drop-shadow(0 0 8px ${accentColor}40);" />
                <h1 style="margin: 0; font-size: 2.2rem; font-weight: 700; letter-spacing: -0.03em; color: #23272f;">${appName}</h1>
              </td>
            </tr>
            <!-- Dynamic Content (CTA or custom content comes next) -->
            <tr>
              <td style="padding: 0 40px 32px 40px;">
                <div style="background: rgba(255,255,255,0.60); border-radius: 14px; padding: 28px; margin-bottom: 32px; font-size: 1rem; color: #23272f; box-shadow: 0 1px 6px rgba(0,0,0,0.04);">
                  ${content}
                </div>
              </td>
            </tr>
            <!-- Features Section -->
            <tr>
              <td align="center" style="padding: 0 40px 32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.40); border-radius: 12px;">
                  <tr>
                    <td align="center" width="33%" style="padding: 18px 0;">
                      <img src="https://cdn-icons-png.flaticon.com/512/3595/3595455.png" alt="Ideas" width="38" style="margin-bottom: 8px;" />
                      <div style="font-size: 1.2rem; font-weight: 700; color: ${accentColor};">600+</div>
                      <div style="font-size: 0.98rem; color: #6b7280;">Project Ideas</br> Generated</div>
                    </td>
                    <td align="center" width="33%" style="padding: 18px 0;">
                      <img src="https://cdn-icons-png.flaticon.com/512/1828/1828817.png" alt="Availability" width="38" style="margin-bottom: 8px;" />
                      <div style="font-size: 1.2rem; font-weight: 700; color: ${accentColor};">24/7</div>
                      <div style="font-size: 0.98rem; color: #6b7280;">Availability</div>
                    </td>
                    <td align="center" width="33%" style="padding: 18px 0;">
                      <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="AI Powered" width="38" style="margin-bottom: 8px;" />
                      <div style="font-size: 1.2rem; font-weight: 700; color: ${accentColor};">100%</div>
                      <div style="font-size: 0.98rem; color: #6b7280;">AI Powered</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background: rgba(255,255,255,0.70); border-bottom-left-radius: 18px; border-bottom-right-radius: 18px; padding: 32px 40px 24px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="font-size: 0.92rem; color: #bdbdbd; opacity: 0.8;">
                      &copy; ${currentYear} ${appName}. All rights reserved.
                    </td>
                  </tr>
                </table>
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
