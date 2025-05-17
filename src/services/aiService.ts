import { generateText, CoreMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AppError } from '../core/errors/appError';
import { logger } from '../utils/logger';
import { conversationService } from './conversationService';
import { sendMessageToUser, sendTypingToUser } from '../core/socket/socketServer';
import { baseHelper } from '../utils/baseHelper';
import { IMessage, SenderEnum } from '../types/conversationType';
import { IUser } from '../types/userType';
import { StatusCodesEnum } from '../core/http/statusCodes';
import { appConstants } from '../constants/appConstant';

const MODEL_NAME = 'gemini-1.5-flash';
const MAX_MESSAGES_FOR_CONTEXT = 10;

// Keep the same system prompt text
const SYSTEM_PROMPT_TEXT = `You are "${appConstants.appName}", an advanced AI assistant embedded in a chat application. Your primary purpose is to help users brainstorm, develop, and flesh out their project ideas. Engage in a detailed, natural conversation.

Based on the ongoing conversation and the user's messages, your goal is to:
1.  Understand the user's core problem, interest, or nascent idea.
2.  Ask clarifying questions to help them elaborate on key aspects.
3.  Guide them to think about:
    *   The problem they are trying to solve.
    *   The target audience for their idea.
    *   Potential core features and their benefits.
    *   Possible challenges they might face.
    *   Actionable next steps to move the idea forward.
4.  If the user mentions technologies they know or want to use (e.g., "I just finished learning Python, what project can I build?"), incorporate that into your suggestions.
5.  Once you have a good understanding and enough details have been discussed, provide a comprehensive textual summary of the idea. This summary should be detailed and cover the aspects discussed (problem, audience, features, etc.). It should be presented as a coherent narrative or a structured text block.

Remember:
- Use the provided conversation history to maintain context and avoid repetition.
- Your tone should be supportive, encouraging, and inquisitive.
- Do not explicitly ask "What is the problem solved?" or "Who is the target audience?". Instead, weave these explorations into the natural flow of conversation. For example, if a user says "I want to build an app for students", you might ask "That's interesting! What specific challenges do students face that this app could help with?"
- Conclude your response with the detailed idea summary when appropriate.`;

const geminiApiKey = process.env.GEMINI_API_KEY;
const validateApiKey = (): void => {
  if (!geminiApiKey) {
    logger.error('GEMINI_API_KEY is not set in environment variables.');
    throw new AppError(
      'AI service is not configured: Missing API key.',
      StatusCodesEnum.INTERNAL_SERVER_ERROR,
    );
  }
};

const google = createGoogleGenerativeAI({
  apiKey: geminiApiKey,
});

/**
 * Generates an AI reply to a user message and saves it to the conversation.
 * Uses the Vercel AI SDK with Google's Gemini model.
 */
const generateAndSaveAiReply = async (
  conversationId: string,
  invokingUser: IUser,
  latestUserMessageContent: string,
): Promise<void> => {
  try {
    // Validate API key
    validateApiKey();

    // Notify client that AI is typing
    await sendTypingToUser(baseHelper.getMongoDbResourceId(invokingUser), {
      conversationId,
      isTyping: true,
      message: 'Thinking...',
    });

    // Get conversation history
    let history: IMessage[] = [];
    try {
      const paginatedMessages = await conversationService.getConversationMessages(
        {
          conversationId,
          limit: MAX_MESSAGES_FOR_CONTEXT,
          sortField: 'createdAt',
          sortOrder: 'desc',
        },
        invokingUser,
      );
      history = paginatedMessages.data.reverse();
    } catch (error) {
      logger.error(`Failed to fetch conversation history for ${conversationId}:`, error);
    }

    // Format conversation history as messages for the AI
    const messages: CoreMessage[] = history.map(msg => ({
      role: msg.sender === SenderEnum.USER ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Add the latest user message
    messages.push({
      role: 'user',
      content: latestUserMessageContent,
    });

    // Configure safety settings via provider options
    const safetySettings = {
      google: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      },
    };

    // Generate text using Vercel AI SDK
    const result = await generateText({
      model: google(MODEL_NAME),
      system: SYSTEM_PROMPT_TEXT,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      topK: 1,
      providerOptions: safetySettings,
    });

    // Stop typing indicator regardless of response success/failure
    await sendTypingToUser(baseHelper.getMongoDbResourceId(invokingUser), {
      conversationId,
      isTyping: false,
      message: '',
    });

    if (result.text) {
      // Save the AI response to the conversation
      const aiResponseText = result.text.trim();
      const aiMessage = await conversationService.addNewMessage({
        conversationId,
        content: aiResponseText,
        sender: SenderEnum.SYSTEM,
      });

      // Notify the client about the new AI message
      await sendMessageToUser(baseHelper.getMongoDbResourceId(invokingUser), {
        ...aiMessage?.toJSON(),
      });
    } else {
      logger.error('AI did not return a valid response.', { result });
      const errorMessage = await conversationService.addNewMessage({
        conversationId,
        content: 'Sorry, I could not generate a response at this moment. Please try again.',
        sender: SenderEnum.SYSTEM,
      });

      // Notify the client about the error message
      await sendMessageToUser(baseHelper.getMongoDbResourceId(invokingUser), {
        ...errorMessage?.toJSON(),
      });
    }
  } catch (error) {
    logger.error('Error generating AI reply:', error);
    try {
      // Stop typing indicator if it was still active
      await sendTypingToUser(baseHelper.getMongoDbResourceId(invokingUser), {
        conversationId,
        isTyping: false,
        message: '',
      });

      const errorMessage = await conversationService.addNewMessage({
        conversationId,
        content:
          'Sorry, an error occurred while I was thinking. Please try rephrasing your message.',
        sender: SenderEnum.SYSTEM,
      });

      // Notify the client about the error message
      await sendMessageToUser(baseHelper.getMongoDbResourceId(invokingUser), {
        ...errorMessage?.toJSON(),
      });
    } catch (saveError) {
      logger.error('Failed to save error message to conversation:', saveError);
    }
  }
};

export const aiService = {
  generateAndSaveAiReply,
};
