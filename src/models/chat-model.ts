// Import the crypto module for generating UUIDs, to support nodejs < v20
import * as crypto from "node:crypto";
import { Entity, Service, type EntityItem } from "electrodb";
// Import utility to get a configured DynamoDB client singleton.
import { getDDBClient } from "../ddb-client.js";

// TypeScript types derived from ElectroDB entities for strong typing.
export type ChatEntityType = typeof ChatService.entities.chat;
export type ChatItem = EntityItem<ChatEntityType>;
export type MessageEntityType = typeof ChatService.entities.chatMessage;
export type MessageItem = EntityItem<MessageEntityType>;

const client = getDDBClient();

// Define the DynamoDB table name.
export const TABLE_NAME = "ChatsTable";

// Define the 'Chat' entity (represents chat metadata).
const ChatEntity = new Entity(
  {
    model: {
      entity: "chat", // Internal identifier for this entity type.
      version: "1", // Schema version.
      service: "chatservice", // Groups related entities.
    },
    attributes: {
      chatId: {
        type: "string",
        required: true,
        // default: Auto-generate a UUID for chatId if not provided on creation.
        default: () => crypto.randomUUID(),
      },
      userId: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
        // validate: Ensures name length is within bounds.
        validate: (value) => value.length > 0 && value.length <= 100,
      },
      createdAt: {
        type: "string", // ISO 8601 format.
        readOnly: true, // Prevents modification after creation.
        required: true,
        // default: Sets the creation timestamp automatically.
        default: () => new Date().toISOString(),
      },
      updatedAt: {
        type: "string",
        required: true,
        // default: Sets the initial update timestamp.
        default: () => new Date().toISOString(),
        // set: Automatically updates this timestamp on every modification to the item.
        set: () => new Date().toISOString(),
      },
    },
    indexes: {
      // Primary key definition (PK/SK).
      primary: {
        pk: {
          field: "pk", // Maps to the 'pk' attribute in DynamoDB.
          composite: ["chatId"], // Uses the 'chatId' attribute.
          // template: Defines the PK format. 'CHAT#' prefix helps distinguish chat items.
          template: "CHAT#${chatId}",
        },
        sk: {
          field: "sk", // Maps to the 'sk' attribute in DynamoDB.
          composite: [], // No entity attributes used directly.
          // template: Uses a fixed string "METADATA". This ensures the chat metadata item
          // has a predictable SK, making it easy to fetch just the chat details using the PK (CHAT#<chatId>).
          template: "METADATA",
        },
        // collection: Groups 'chat' and 'chatMessage' items under the same PK for related data querying.
        collection: "chatAndMessages",
      },
      // Global Secondary Index (GSI) definition for querying by user.
      byUser: {
        index: "gsi1", // Must match the GSI name defined in DynamoDB/CloudFormation.
        pk: {
          field: "gsi1pk", // Maps to the GSI's partition key attribute.
          composite: ["userId"],
          // template: Defines the GSI PK format. 'USER#' prefix helps distinguish user-based queries.
          template: "USER#${userId}",
        },
        sk: {
          field: "gsi1sk", // Maps to the GSI's sort key attribute.
          composite: ["updatedAt"],
          // template: Defines the GSI SK format. 'CHAT#' prefix + timestamp allows sorting user's chats by update time.
          template: "CHAT#${updatedAt}",
        },
      },
    },
  },
  // Link entity definition to the DynamoDB table and client.
  { table: TABLE_NAME, client }
);

// Define the 'ChatMessage' entity.
const ChatMessageEntity = new Entity(
  {
    model: {
      entity: "chatmessage",
      version: "1",
      service: "chatservice",
    },
    attributes: {
      chatId: {
        type: "string",
        required: true, // Links message to a Chat item.
      },
      messageId: {
        type: "string",
        required: true,
        // default: Auto-generates a unique ID for the message.
        default: () => crypto.randomUUID(),
      },
      userId: {
        // Could be user ID or 'assistant'.
        type: "string",
        required: true,
      },
      createdAt: {
        type: "string",
        readOnly: true,
        required: true,
        // default: Sets the creation timestamp.
        default: () => new Date().toISOString(),
      },
      updatedAt: {
        type: "string",
        required: true,
        // default: Sets the initial update timestamp.
        default: () => new Date().toISOString(),
        // set: Automatically updates timestamp on item modification.
        set: () => new Date().toISOString(),
      },
      content: {
        type: "string",
        required: true,
      },
      reasoningContent: {
        // Optional field for AI reasoning, etc.
        type: "string",
        required: false,
      },
      role: {
        // Identifies sender type.
        type: ["user", "assistant"] as const, // Enforces specific values.
        required: true,
      },
    },
    indexes: {
      // Primary key for messages.
      primary: {
        pk: {
          field: "pk",
          composite: ["chatId"],
          // template: Same PK as ChatEntity. This places messages in the same partition
          // as their corresponding chat metadata, enabling efficient retrieval of a chat and its messages.
          template: "CHAT#${chatId}",
        },
        sk: {
          field: "sk",
          composite: ["createdAt", "messageId"], // Ensures uniqueness and chronological order.
          // template: Defines the SK format for messages. 'MSG#' prefix + timestamp + messageId
          // allows efficient chronological sorting/filtering within a chat partition (e.g., using begins_with).
          template: "MSG#${createdAt}#${messageId}",
        },
        // collection: Allows querying messages alongside chat metadata within the same 'chatAndMessages' group.
        collection: "chatAndMessages",
      },
    },
  },
  { table: TABLE_NAME, client }
);

// Create a Service to bundle related entities (Chat, ChatMessage).
// Provides a unified API for operations involving these entities.
const ChatService = new Service(
  {
    chat: ChatEntity,
    chatMessage: ChatMessageEntity,
  },
  // Configure the service with the client and table name.
  { client, table: TABLE_NAME }
);

// Export the service for use in application logic (CRUD operations).
export default ChatService;
