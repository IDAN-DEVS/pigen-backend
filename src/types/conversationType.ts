import { IBaseDocument, IPaginationQuery } from './baseType';
import { IUser } from './userType';

export interface IConversation extends IBaseDocument {
  user: IUser | string;
  title: string;
}

export interface IMessage extends IBaseDocument {
  user: IUser | string;
  conversation: IConversation | string;
  content: string;
  sender: SenderEnum;
  containsIdea: boolean;
  idea?: IIdea | string;
}

export enum SenderEnum {
  USER = 'user',
  SYSTEM = 'system',
}

export interface ICreateConversationPayload {
  title?: string;
  message?: string;
}

export interface ISendMessagePayload {
  conversationId: string;
  content: string;
  sender?: SenderEnum;
}

export interface IGetConversationMessagesPayload extends IPaginationQuery {
  conversationId: string;
}

export interface IIdea extends IBaseDocument {
  user: IUser | string;
  conversation: IConversation | string;
  message: IMessage | string;
  title: string;
  summary: string;
  category: IdeaCategoryEnum;
  icon: IdeaIconEnum;
  problemSolved: string;
  targetAudience: string;
  coreFeatures: string[];
  benefits: string[];
  techStack?: string[];
  monetization?: string[];
  challenges: string[];
  nextSteps: string[];
}

export enum IdeaCategoryEnum {
  LEARNING = 'Learning',
  STARTUP = 'Startup',
  ALL = 'All',
}

export enum IdeaIconEnum {
  CODE = 'code',
  LIGHTNING = 'lightning',
  BOOK = 'book',
}
