import { Types } from 'mongoose';

export interface MongooseResourceDocument {
  _id: Types.ObjectId;
  toObject?: () => any;
}
