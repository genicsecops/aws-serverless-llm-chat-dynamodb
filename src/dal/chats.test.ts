import * as crypto from "node:crypto";
import { createChatsTable, deleteChatsTable } from "../test/setup.js";
import { Chats } from "./chats.js";

beforeAll(async () => {
  await createChatsTable();
});

afterAll(async () => {
  await deleteChatsTable();
});

describe("Chats", () => {
  const userId = crypto.randomUUID();
  const chats = new Chats();

  afterEach(async () => {
    try {
      await chats.clearData(userId);
    } catch (error) {
      console.error("Error cleaning up database:", error);
    }
  });

  describe("createChat", () => {
    it("should create a chat", async () => {
      const chat = await chats.createChat(userId, "test-chat");

      expect(chat).toEqual({
        chatId: expect.any(String),
        userId,
        name: "test-chat",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should throw an error if userId is not provided", async () => {
      await expect(chats.createChat("", "test-chat")).rejects.toThrow(
        "userId is required"
      );
    });
  });

  describe("createMessage", () => {
    it("should create a message", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      const message = await chats.createMessage(
        chat.chatId,
        userId,
        "test-message",
        "user"
      );

      expect(message).toEqual({
        chatId: chat.chatId,
        messageId: expect.any(String),
        userId,
        content: "test-message",
        role: "user",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should throw an error if userId is not provided", async () => {
      const chat = await chats.createChat(userId, "test-chat");

      await expect(
        chats.createMessage(chat.chatId, "", "test-message", "user")
      ).rejects.toThrow("userId is required");
    });

    it("should throw NotFoundError if chat does not exist", async () => {
      await expect(
        chats.createMessage(crypto.randomUUID(), userId, "test-message", "user")
      ).rejects.toThrow(/Chat with ID .* not found or access denied/);
    });
  });

  describe("getChatForUser", () => {
    it("should get a chat for a user", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      const result = await chats.getChatForUser(chat.chatId, userId);

      expect(result).toEqual(chat);
    });

    it("should throw InvalidArgumentError if userId is not provided", async () => {
      await expect(
        chats.getChatForUser(crypto.randomUUID(), "")
      ).rejects.toThrow("userId is required");
    });

    it("should return null if chat does not exist", async () => {
      const result = await chats.getChatForUser(crypto.randomUUID(), userId);

      expect(result).toBeNull();
    });
  });

  describe("getAllChatsForUser", () => {
    it("should get all chats for a user", async () => {
      const chat1 = await chats.createChat(userId, "test-chat");
      const chat2 = await chats.createChat(userId, "test-chat");
      const result = await chats.getAllChatsForUser(userId);

      expect(result).toEqual(expect.arrayContaining([chat1, chat2]));
    });

    it("should throw InvalidArgumentError if userId is not provided", async () => {
      await expect(chats.getAllChatsForUser("")).rejects.toThrow(
        "userId is required"
      );
    });
  });

  describe("getMessagesForChat", () => {
    it("should get all messages for a chat", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      const message1 = await chats.createMessage(
        chat.chatId,
        userId,
        "test-message",
        "user"
      );
      const message2 = await chats.createMessage(
        chat.chatId,
        userId,
        "test-message",
        "user"
      );
      const result = await chats.getMessagesForChat(chat.chatId, userId);

      expect(result).toEqual(expect.arrayContaining([message1, message2]));
    });

    it("should throw InvalidArgumentError if userId is not provided", async () => {
      await expect(
        chats.getMessagesForChat(crypto.randomUUID(), "")
      ).rejects.toThrow("userId is required");
    });

    it("should return an empty array if chat does not exist", async () => {
      const result = await chats.getMessagesForChat(
        crypto.randomUUID(),
        userId
      );
      expect(result).toEqual([]);
    });
  });

  describe("updateChatName", () => {
    it("should update the name of a chat", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      const updatedChat = await chats.updateChatName(
        chat.chatId,
        userId,
        "new-name"
      );

      expect(updatedChat).toEqual({
        ...chat,
        name: "new-name",
      });
    });

    it("should throw InvalidArgumentError if userId is not provided", async () => {
      await expect(
        chats.updateChatName(crypto.randomUUID(), "", "new-name")
      ).rejects.toThrow("userId is required");
    });

    it("should throw NotFoundError if chat does not exist", async () => {
      await expect(
        chats.updateChatName(crypto.randomUUID(), userId, "new-name")
      ).rejects.toThrow(/Chat with ID .* not found or access denied/);
    });
  });

  describe("updateMessage", () => {
    it("should update a message", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      const message = await chats.createMessage(
        chat.chatId,
        userId,
        "test-message",
        "user"
      );

      const updatedMessage = await chats.updateMessage(
        chat.chatId,
        message.messageId,
        userId,
        "updated-message"
      );
      const updatedChat = await chats.getChatForUser(chat.chatId, userId);

      expect(updatedMessage).toEqual({
        ...message,
        content: "updated-message",
      });
      // chat updatedAt should be updated
      expect(updatedChat).toEqual({
        ...chat,
        updatedAt: expect.any(String),
      });
    });

    it("should throw InvalidArgumentError if userId is not provided", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      const message = await chats.createMessage(
        chat.chatId,
        userId,
        "test",
        "user"
      );
      await expect(
        chats.updateMessage(
          chat.chatId,
          message.messageId,
          "",
          "updated-message"
        )
      ).rejects.toThrow("userId is required");
    });

    it("should throw NotFoundError if chat does not exist", async () => {
      await expect(
        chats.updateMessage(
          crypto.randomUUID(),
          crypto.randomUUID(),
          userId,
          "updated-message"
        )
      ).rejects.toThrow(/Chat with ID .* not found or access denied/);
    });

    it("should throw NotFoundError if message does not exist", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      await expect(
        chats.updateMessage(
          chat.chatId,
          crypto.randomUUID(),
          userId,
          "updated-message"
        )
      ).rejects.toThrow(/Message with ID .* not found/);
    });
  });

  describe("deleteChat", () => {
    it("should delete a chat", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      await chats.createMessage(chat.chatId, userId, "test-message", "user");
      await chats.createMessage(chat.chatId, userId, "test-message", "user");
      const result = await chats.deleteChat(chat.chatId, userId);
      expect(result).toBe(true);

      const messages = await chats.getMessagesForChat(chat.chatId, userId);
      expect(messages).toEqual([]);

      const chatResult = await chats.getChatForUser(chat.chatId, userId);
      expect(chatResult).toBeNull();
    });

    it("should throw InvalidArgumentError if userId is not provided", async () => {
      await expect(chats.deleteChat(crypto.randomUUID(), "")).rejects.toThrow(
        "userId is required"
      );
    });
  });

  describe("deleteMessage", () => {
    it("should delete a message", async () => {
      const chat = await chats.createChat(userId, "test-chat");
      const message = await chats.createMessage(
        chat.chatId,
        userId,
        "test-message",
        "user"
      );
      const result = await chats.deleteMessage(
        chat.chatId,
        message.messageId,
        userId
      );
      expect(result).toBe(true);
    });

    it("should throw InvalidArgumentError if userId is not provided", async () => {
      await expect(
        chats.deleteMessage(crypto.randomUUID(), crypto.randomUUID(), "")
      ).rejects.toThrow("userId is required");
    });

    it("should throw NotFoundError if message does not exist", async () => {
      await expect(
        chats.deleteMessage(crypto.randomUUID(), crypto.randomUUID(), userId)
      ).rejects.toThrow(/Message with ID .* not found or access denied/);
    });
  });
});
