import { sqliteSchema } from "./schema.js";

export interface SqliteDatabaseOptions {
  databasePath: string;
}

export interface ChatHistoryDatabase {
  readonly databasePath: string;
  readonly schema: string;
  initialize(): Promise<void>;
  close(): Promise<void>;
}

export class SqliteChatHistoryDatabase implements ChatHistoryDatabase {
  readonly databasePath: string;
  readonly schema = sqliteSchema;

  constructor(options: SqliteDatabaseOptions) {
    this.databasePath = options.databasePath;
  }

  async initialize(): Promise<void> {
    // Placeholder until the SQLite driver is selected and chat persistence is implemented.
  }

  async close(): Promise<void> {
    // Placeholder for future database connection cleanup.
  }
}

