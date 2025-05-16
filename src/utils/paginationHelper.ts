import { Document, Model, SortOrder, PipelineStage } from 'mongoose';
import {
  IPaginatedResponse,
  IPaginationAggregatePayload,
  IPaginationCursorPayload,
  IPaginationCursorResponse,
  IPaginationFindPayload,
  IPaginationQuery,
} from '../types/baseType';

/**
 * Deep clones a value (for pipeline copying).
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Paginate using Mongoose's find.
 */
async function find<T>(options: IPaginationFindPayload<T>): Promise<IPaginatedResponse<T>> {
  let { model, query, paginationOptions, projection, populate } = options;

  const page = paginationOptions?.page || 1;
  const limit = paginationOptions?.limit || 20;
  const skip = (page - 1) * limit;

  // Create sort object
  const sort: Record<string, 1 | -1> = {};
  if (paginationOptions?.sortField) {
    sort[paginationOptions.sortField] = paginationOptions.sortOrder === 'desc' ? -1 : 1;
  } else {
    // Default sort by createdAt if not specified
    sort.createdAt = -1;
  }

  // Run queries in parallel for better performance
  const [data, total] = await Promise.all([
    model
      .find(query || {}, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate || [])
      .lean<T[]>(), // Use lean() for better performance when you don't need Mongoose documents

    model.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

/**
 * Paginate using Mongoose's aggregate.
 */
async function aggregate<T>(
  options: IPaginationAggregatePayload<T>,
): Promise<IPaginatedResponse<T>> {
  let { model, pipeline, paginationOptions } = options;

  const page = paginationOptions?.page || 1;
  const limit = paginationOptions?.limit || 20;
  const skip = (page - 1) * limit;

  // Deep clone pipeline to avoid mutation
  const basePipeline = deepClone(pipeline)?.filter(
    stage => !('$skip' in stage) && !('$limit' in stage),
  );

  // Handle sorting
  let sortStage: Record<string, any> = {};
  if (paginationOptions?.sortField) {
    sortStage = {
      [paginationOptions.sortField]: paginationOptions.sortOrder === 'desc' ? -1 : 1,
    };
  } else {
    // Default to createdAt sorting if not specified
    sortStage = { createdAt: -1 };
  }

  // Check if pipeline already includes a sort stage
  const existingSortIndex = basePipeline?.findIndex(stage => '$sort' in stage);
  if (existingSortIndex !== undefined && existingSortIndex >= 0) {
    sortStage = (basePipeline?.[existingSortIndex] as any).$sort;
    basePipeline?.splice(existingSortIndex, 1);
  }

  // Use $facet to run data and metadata queries in a single database call
  const facetPipeline = [
    ...(basePipeline || []),
    {
      $facet: {
        // Data facet - includes sort, skip, limit
        data: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
        // Metadata facet - just count the documents
        metadata: [{ $count: 'total' }],
      },
    },
  ];

  const [result] = await model.aggregate(facetPipeline);

  const total = result?.metadata?.length > 0 ? result?.metadata[0]?.total : 0;

  return {
    data: result?.data || [],
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

/**
 * Cursor-based pagination for find queries.
 */
async function cursorPaginate<T extends Document>(
  options: IPaginationCursorPayload<T>,
): Promise<IPaginationCursorResponse<T>> {
  const defaultPaginationOptions: IPaginationQuery = {
    limit: 20,
    cursor: null,
    sortField: '_id' as unknown as string,
    sortOrder: 'desc',
  };
  let {
    model,
    query,
    paginationOptions = defaultPaginationOptions,
    projection,
    populate,
  } = options;

  // Build cursor query
  let cursorQuery: any = { ...query };
  const sortDirection = paginationOptions.sortOrder === 'desc' ? -1 : 1;

  if (paginationOptions.cursor) {
    try {
      // If cursor is provided, add a condition to get documents after the cursor
      const decodedCursor = JSON.parse(Buffer.from(paginationOptions.cursor, 'base64').toString());
      const operator = sortDirection === 1 ? '$gt' : '$lt';
      cursorQuery = {
        ...query,
        $or: [
          {
            [String(paginationOptions.sortField)]: {
              [operator]: decodedCursor.value,
            },
          },
          // Compound cursor for stability
          {
            [String(paginationOptions.sortField)]: decodedCursor.value,
            _id: { [operator]: decodedCursor._id },
          },
        ],
      };
    } catch (error) {
      throw new Error('Invalid cursor: ' + (error as Error).message);
    }
  }

  // Add an extra element to check if there's a next page
  const extendedLimit = Number(paginationOptions.limit) + 1;

  // Execute query
  const data = await model
    .find(cursorQuery)
    .select(projection || {})
    .sort({
      [String(paginationOptions.sortField)]: sortDirection as SortOrder,
      _id: sortDirection as SortOrder,
    })
    .limit(extendedLimit)
    .populate(populate || [])
    .lean<T[]>();

  // Check if there's a next page
  const hasNextPage = data.length > Number(paginationOptions.limit);

  // Remove the extra element
  if (hasNextPage) {
    data.pop();
  }

  // Generate next cursor
  let nextCursor = null;
  if (hasNextPage && data.length > 0) {
    const lastDoc = data[data.length - 1];
    const cursorValue = lastDoc[paginationOptions.sortField as keyof T];
    const cursorId = lastDoc._id;
    nextCursor = Buffer.from(
      JSON.stringify({
        field: String(paginationOptions.sortField),
        value: cursorValue,
        _id: cursorId,
      }),
    ).toString('base64');
  }

  return {
    data,
    hasNextPage,
    nextCursor,
  };
}

/**
 * Cursor-based pagination for aggregation pipelines.
 */
async function cursorAggregation<T>(options: IPaginationCursorPayload<T>): Promise<{
  data: T[];
  hasNextPage: boolean;
  nextCursor: string | null;
}> {
  const defaultPaginationOptions: IPaginationQuery = {
    limit: 20,
    cursor: null,
    sortField: '_id' as unknown as string,
    sortOrder: 'desc',
  };
  let { model, pipeline, paginationOptions = defaultPaginationOptions } = options;

  // Deep copy pipeline
  const pipelineCopy: PipelineStage[] = deepClone(pipeline || []);

  // Sort direction
  const sortDirection = paginationOptions.sortOrder === 'desc' ? -1 : 1;

  // Add cursor condition if provided
  if (paginationOptions.cursor) {
    try {
      const decodedCursor = JSON.parse(Buffer.from(paginationOptions.cursor, 'base64').toString());
      const operator = sortDirection === 1 ? '$gt' : '$lt';

      // Add match stage for cursor-based pagination
      pipelineCopy.push({
        $match: {
          $or: [
            {
              [String(paginationOptions.sortField)]: {
                [operator]: decodedCursor.value,
              },
            },
            {
              [String(paginationOptions.sortField)]: decodedCursor.value,
              _id: { [operator]: decodedCursor._id },
            },
          ],
        },
      });
    } catch (error) {
      throw new Error('Invalid cursor: ' + (error as Error).message);
    }
  }

  // Add sort stage
  pipelineCopy.push({
    $sort: {
      [String(paginationOptions.sortField)]: sortDirection,
      _id: sortDirection,
    },
  });

  // Add limit (get one extra to determine if there's a next page)
  pipelineCopy.push({ $limit: Number(paginationOptions.limit) + 1 });

  // Execute the query
  const data = await model.aggregate(pipelineCopy);

  // Check if there's a next page
  const hasNextPage = data.length > Number(paginationOptions.limit);

  // Remove the extra document
  if (hasNextPage) {
    data.pop();
  }

  // Generate next cursor
  let nextCursor = null;
  if (hasNextPage && data.length > 0) {
    const lastDoc = data[data.length - 1];
    const cursorValue = lastDoc[String(paginationOptions.sortField)];
    const cursorId = lastDoc._id;
    nextCursor = Buffer.from(
      JSON.stringify({
        field: String(paginationOptions.sortField),
        value: cursorValue,
        _id: cursorId,
      }),
    ).toString('base64');
  }

  return {
    data,
    hasNextPage,
    nextCursor,
  };
}

// Get count for pagination without fetching the data
async function getCount(model: Model<any>, query: Record<string, any> = {}): Promise<number> {
  return model.countDocuments(query);
}

// Calculate pagination metadata
function getPaginationMeta(
  total: number,
  paginationOptions: IPaginationQuery = {},
): IPaginatedResponse<any>['meta'] {
  const page = paginationOptions.page || 1;
  const limit = paginationOptions.limit || 20;

  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

export const paginationHelper = {
  find,
  aggregate,
  cursorPaginate,
  cursorAggregation,
  getCount,
  getPaginationMeta,
};
