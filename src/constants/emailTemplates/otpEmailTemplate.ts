import { baseEmailTemplate } from './baseEmailTemplate';

export function forgotPasswordEmailTemplate(payload: { code: number }) {
  const content = `
   <p>This is the code to reset your password. This code
      <b>expires</b>
      in 5 minutes</p>
    <h2
      style='background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;'
    >${payload.code}</h2>
  `;

  return baseEmailTemplate({ title: 'Forgot Password', content });
}

export function verifyEmailTemplate(payload: { code: number }) {
  const content = `
  <p style='font-size:1.1em'>Hi,</p>
    <p>Verify your email with the code below. This code
      <b>expires</b>
      in 5 minutes</p>
    <h2> ${payload.code}</h2>
    `;

  return baseEmailTemplate({ content, title: 'Verify your email' });
}
