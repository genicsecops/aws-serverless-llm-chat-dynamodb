/**
 * DynamoDB client singleton
 *
 * Read more on:
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/dax-config-dax-client.html
 *
 */
import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";

let clientInstance: DynamoDBClient | null = null;

function getConfig(): DynamoDBClientConfig {
  const config: DynamoDBClientConfig = {
    region: process.env.AWS_REGION || "us-east-1",
  };

  if (process.env.LOCALSTACK_ENDPOINT) {
    config.endpoint = process.env.LOCALSTACK_ENDPOINT;
  }

  return config;
}

export function getDDBClient(): DynamoDBClient {
  if (!clientInstance) {
    clientInstance = new DynamoDBClient(getConfig());
  }
  return clientInstance;
}
