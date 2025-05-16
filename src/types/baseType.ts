import { Document, FilterQuery, Model, PipelineStage, PopulateOptions } from 'mongoose';

declare module 'mongoose' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Query<ResultType, DocType extends Document, THelpers = {}> {
    withDeleted(): this;
    onlyDeleted(): this;
  }
}

export interface IBaseDocument extends Document {
  _id: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBaseModel<T extends IBaseDocument> extends Model<T> {
  softDelete(id: string): Promise<T | null>;
  restore(id: string): Promise<T | null>;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  cursor?: string | null;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IPaginationCursorResponse<T> {
  data: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export interface IPaginationFindPayload<T> {
  model: Model<T>;
  query?: FilterQuery<T>;
  paginationOptions?: IPaginationQuery;
  projection?: Record<string, any>;
  populate?: PopulateOptions | (string | PopulateOptions)[];
}

export interface IPaginationAggregatePayload<T> {
  model: Model<T>;
  pipeline?: PipelineStage[];
  paginationOptions?: IPaginationQuery;
}

export interface IPaginationCursorPayload<T> {
  model: Model<T>;
  query?: FilterQuery<T>;
  paginationOptions?: IPaginationQuery;
  projection?: Record<string, any>;
  populate?: PopulateOptions | (string | PopulateOptions)[];
  pipeline?: PipelineStage[];
}

export interface IIdQuery {
  id: string;
}
