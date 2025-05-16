import { appConstants } from '../appConstant';
import { baseEmailTemplate } from './baseEmailTemplate';

export function welcomeEmailTemplate(payload: { name?: string }) {
  const appName = appConstants.appName;
  const greeting = payload.name ? `Hi ${payload.name},` : 'Hi,';
  const content = `
    <p style='font-size:1.1em'>${greeting}</p>
    <p>Welcome to <b>${appName}</b>! 🎉</p>
    <p>
      ${appName} helps you discover <b>tailored project and startup ideas</b> through a friendly chat interface. Whether you want to practice your skills or explore new business opportunities, ${appName} guides you from inspiration to a clear, actionable concept.
    </p>
    <ul style='margin: 18px 0 18px 18px; padding: 0; color: #23272f;'>
      <li>Conversational idea generation</li>
      <li>Personalized suggestions based on your skills and interests</li>
      <li>Structured "Mini-PRD" outputs for every idea</li>
      <li>Save and revisit your favorite ideas</li>
      <li>Daily idea generation limit to keep things fresh</li>
    </ul>
    <p>Get started by logging in and telling us what you want to build or explore. We can't wait to see what you create!</p>
    <p style='margin-top: 32px;'>Happy building,<br/><b>The ${appName} Team</b></p>
  `;
  return baseEmailTemplate({ title: `Welcome to ${appName}!`, content });
}
