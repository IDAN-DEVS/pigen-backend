import { IBaseDocument } from './baseType';
import { IdeaCategoryEnum } from './conversationType';
import { IUser } from './userType';

export interface IUserPreference extends IBaseDocument {
  user: IUser | string;
  theme: ThemeEnum;
  notificationsEnabled: boolean;
  defaultCategory: IdeaCategoryEnum;
  saveChatHistory: boolean;
  displayCreditWarning: boolean;
}

export enum ThemeEnum {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface IUsageStatistic extends IBaseDocument {
  user: IUser | string;
  date: Date;
  ideasGenerated: number;
  conversationsStarted: number;
  messagesExchanged: number;
}
