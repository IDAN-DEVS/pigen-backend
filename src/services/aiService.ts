import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AppError } from '../core/errors/appError';
import { logger } from '../utils/logger';
import { conversationService } from './conversationService';
import { SenderEnum } from '../types/conversationType';

const MODEL_NAME = 'gemini-1.5-flash';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error('GEMINI_API_KEY is not set in environment variables.');
    throw new AppError('AI service is not configured: Missing API key.', 500);
  }
  return new GoogleGenerativeAI(apiKey);
};

const generateAndSaveAiReply = async (
  conversationId: string,
  userMessageContent: string,
): Promise<void> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // For simplicity, using only the last user message as the prompt.
    // TODO: Enhance with conversation history for better context.
    const parts = [{ text: `User: ${userMessageContent}\nAI:` }];

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig,
      safetySettings,
    });

    console.log('result', result.response);

    if (
      result.response &&
      result.response.candidates &&
      result.response.candidates.length > 0 &&
      result.response.candidates[0].content &&
      result.response.candidates[0].content.parts &&
      result.response.candidates[0].content.parts.length > 0 &&
      result.response.candidates[0].content.parts[0].text
    ) {
      const aiResponseText = result.response.candidates[0].content.parts[0].text.trim();

      // Save AI's response as a system message
      // Note: The `user` param for sendMessage here refers to the owner of the conversation,
      // not the sender of this specific message (which is SYSTEM).
      await conversationService.addNewMessage({
        conversationId,
        content: aiResponseText,
        sender: SenderEnum.SYSTEM,
      });
    } else {
      logger.error('Gemini AI did not return a valid response.', { result });
      // Optionally, save a generic error message as AI response or throw an error
      await conversationService.addNewMessage({
        conversationId,
        content: 'Sorry, I could not generate a response at this moment.',
        sender: SenderEnum.SYSTEM,
      });
    }
  } catch (error) {
    logger.error('Error generating AI reply:', error);
    // Save a generic error message if AI processing fails
    try {
      await conversationService.addNewMessage({
        conversationId,
        content: 'Sorry, an error occurred while I was thinking.',
        sender: SenderEnum.SYSTEM,
      });
    } catch (saveError) {
      logger.error('Failed to save error message to conversation:', saveError);
    }
    // Depending on desired behavior, you might re-throw or handle differently
    // For now, we've saved an error message to the chat, so we might not need to throw AppError here
    // throw new AppError('Failed to generate AI response.', 500);
  }
};

export const aiService = {
  generateAndSaveAiReply,
};
