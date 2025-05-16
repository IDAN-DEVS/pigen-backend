import { Model, Schema, SchemaDefinition, model } from 'mongoose';
import { IBaseDocument, IBaseModel } from '../types/baseType';

// function to create a base schema
export function getBaseSchema<T extends IBaseDocument>(fields: SchemaDefinition<T>): Schema<T> {
  const baseSchema = new Schema<T>(
    {
      ...fields,
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true },
  );

  // Add query helper methods with proper typing for the IBaseQuery interface
  baseSchema.query = {
    withDeleted: function () {
      this.setOptions({ includeDeleted: true });
      return this;
    },

    onlyDeleted: function () {
      this.setOptions({ includeDeleted: true });
      this.where({ isDeleted: true });
      return this;
    },
  } as Record<string, any>;

  baseSchema.pre('find', function (next) {
    const includeDeleted = this.getOptions()?.includeDeleted === true;
    if (includeDeleted) {
      return next();
    }

    this.where({ isDeleted: { $ne: true } });
    next();
  });

  baseSchema.pre('findOne', function (next) {
    const includeDeleted = this.getOptions()?.includeDeleted === true;
    if (includeDeleted) {
      return next();
    }

    this.where({ isDeleted: { $ne: true } });
    next();
  });

  baseSchema.pre('findOneAndUpdate', function (next) {
    const includeDeleted = this.getOptions()?.includeDeleted === true;
    if (includeDeleted) {
      return next();
    }

    this.where({ isDeleted: { $ne: true } });
    next();
  });

  baseSchema.pre('countDocuments', function (next) {
    const includeDeleted = this.getOptions()?.includeDeleted === true;
    if (includeDeleted) {
      return next();
    }

    this.where({ isDeleted: { $ne: true } });
    next();
  });

  // Add statics with proper typing for the IBaseModel interface
  baseSchema.statics = {
    softDelete: function (id: string) {
      return this.updateOne({ _id: id }, { isDeleted: true }) as Promise<T>;
    },

    restore: function (id: string) {
      return this.updateOne({ _id: id }, { isDeleted: false }) as Promise<T>;
    },
  };

  return baseSchema;
}

// function to create a base model
export function getBaseModel<T extends IBaseDocument>(
  name: string,
  schema: Schema<T>,
): Model<T> & IBaseModel<T> {
  return model<T>(name, schema) as Model<T> & IBaseModel<T>;
}
