/* istanbul ignore file */
import {
  CreateTableCommand,
  DeleteTableCommand,
  ResourceInUseException,
  waitUntilTableNotExists,
  ResourceNotFoundException,
  waitUntilTableExists,
  type CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";
import { getDDBClient } from "../ddb-client.js";
import { chatsTableParams } from "./chats-table.js";

const ddbClient = getDDBClient();

const createTableWithErrorHandling = async (
  params: CreateTableCommandInput
): Promise<void> => {
  try {
    // Delete table first for a truly clean state (ignore if not found)
    try {
      await ddbClient.send(
        new DeleteTableCommand({ TableName: params.TableName })
      );
      console.log(`Waiting for table '${params.TableName}' to be deleted...`);
      await waitUntilTableNotExists(
        { client: ddbClient, maxWaitTime: 60 },
        { TableName: params.TableName }
      );
      await ddbClient.send(new CreateTableCommand(params));
    } catch (err) {
      if (!(err instanceof ResourceNotFoundException)) {
        console.error(
          `Error deleting existing table: ${(err as Error).message}`
        );
        throw err; // Rethrow unexpected errors during delete
      }
    }
    // Create the table
    const command = new CreateTableCommand(params);
    await ddbClient.send(command);

    // Wait for the table to become active
    await waitUntilTableExists(
      { client: ddbClient, maxWaitTime: 60 },
      { TableName: params.TableName }
    );
  } catch (err) {
    if (!(err instanceof ResourceInUseException)) {
      console.error(`Error creating table: ${(err as Error).message}`);
      throw err;
    }
  }
};

const deleteTables = async (tableNames: string[]): Promise<void> => {
  await Promise.all(
    tableNames.map(async (tableName) => {
      await ddbClient.send(new DeleteTableCommand({ TableName: tableName }));
      await waitUntilTableNotExists(
        { client: ddbClient, maxWaitTime: 60 },
        { TableName: tableName }
      );
    })
  );
};

export const createChatsTable = async (): Promise<void> => {
  await Promise.all([createTableWithErrorHandling(chatsTableParams)]);
};

export const deleteChatsTable = async (): Promise<void> => {
  if (!chatsTableParams.TableName) {
    throw new Error("Table names are undefined");
  }
  await deleteTables([chatsTableParams.TableName]);
};
