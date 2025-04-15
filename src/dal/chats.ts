import ChatService, {
  type ChatItem,
  type MessageItem,
} from "../models/chat-model.js";

export class Chats {
  private readonly chatEntity = ChatService.entities.chat;
  private readonly messageEntity = ChatService.entities.chatMessage;

  /**
   * Creates a new chat for a user
   * @param userId - ID of the user creating the chat
   * @param name - Name of the chat
   * @returns The created chat
   */
  public async createChat(userId: string, name: string): Promise<ChatItem> {
    try {
      if (!userId) throw new Error("userId is required");

      const chat = await this.chatEntity
        .create({
          userId,
          name,
        })
        .go();

      return chat.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates a new message in a chat
   * @param chatId - ID of the chat
   * @param userId - ID of the user creating the message
   * @param content - Message content
   * @param role - Role (user or assistant)
   * @param reasoningContent - Optional reasoning content
   * @returns The created message
   */
  public async createMessage(
    chatId: string,
    userId: string,
    content: string,
    role: "user" | "assistant",
    reasoningContent?: string
  ): Promise<MessageItem> {
    try {
      if (!userId) throw new Error("userId is required");

      // First check if the chat exists and belongs to the user
      const chat = await this.getChatForUser(chatId, userId);
      if (!chat)
        throw new Error(`Chat with ID ${chatId} not found or access denied`);

      // Create the message
      const { data: message } = await this.messageEntity
        .create({
          chatId,
          userId,
          content,
          role,
          reasoningContent,
        })
        .go();

      // Update the chat's updatedAt timestamp
      await this.chatEntity.update({ chatId }).set({}).go();

      return message;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets a chat by ID for a specific user
   * @param chatId - ID of the chat
   * @param userId - ID of the user
   * @returns The chat or null if not found or doesn't belong to user
   */
  public async getChatForUser(
    chatId: string,
    userId: string
  ): Promise<ChatItem | null> {
    try {
      if (!userId) throw new Error("userId is required");

      const { data: chat } = await this.chatEntity
        .get({
          chatId,
        })
        .go();

      // Return the chat only if it belongs to the user
      return chat?.userId === userId ? chat : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets all chats for a user
   * @param userId - ID of the user
   * @returns Array of chats belonging to the user
   */
  public async getAllChatsForUser(userId: string): Promise<ChatItem[]> {
    try {
      if (!userId) throw new Error("userId is required");

      const { data: chats } = await this.chatEntity.query
        .byUser({
          userId,
        })
        .go();

      return chats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets all messages for a chat (with user verification)
   * @param chatId - ID of the chat
   * @param userId - ID of the user requesting messages
   * @returns Array of messages in the chat
   */
  public async getMessagesForChat(
    chatId: string,
    userId: string
  ): Promise<MessageItem[]> {
    try {
      if (!userId) throw new Error("userId is required");

      // First verify the user has access to this chat
      const chat = await this.getChatForUser(chatId, userId);
      if (!chat) return [];

      // Fetch all messages for the chat
      const { data: messages } = await this.messageEntity.query
        .primary({
          chatId,
        })
        .go();

      return messages;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a chat's name
   * @param chatId - ID of the chat
   * @param userId - ID of the user
   * @param name - New name for the chat
   * @returns The updated chat
   */
  public async updateChatName(
    chatId: string,
    userId: string,
    name: string
  ): Promise<ChatItem> {
    try {
      if (!userId) throw new Error("userId is required");

      // First verify the user has access to this chat
      const chat = await this.getChatForUser(chatId, userId);
      if (!chat)
        throw new Error(`Chat with ID ${chatId} not found or access denied`);

      // Update the chat name
      const { data: updatedChat } = await this.chatEntity
        .patch({ chatId })
        .set({ name })
        .go({ response: "all_new" });

      return updatedChat;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a message's content and reasoning content
   * @param chatId - ID of the chat
   * @param messageId - ID of the message
   * @param userId - ID of the user
   * @param content - New content
   * @param reasoningContent - New reasoning content (optional)
   * @returns The updated message
   */
  public async updateMessage(
    chatId: string,
    messageId: string,
    userId: string,
    content: string,
    reasoningContent?: string
  ): Promise<MessageItem> {
    try {
      if (!userId) throw new Error("userId is required");

      // First verify the user has access to this chat
      const chat = await this.getChatForUser(chatId, userId);
      if (!chat)
        throw new Error(`Chat with ID ${chatId} not found or access denied`);

      // Get the message to check ownership and get createdAt for the composite key
      const messages = await this.messageEntity.query.primary({ chatId }).go();
      const message = messages.data.find((m) => m.messageId === messageId);

      if (!message) throw new Error(`Message with ID ${messageId} not found`);

      // Update the message
      const { data: updatedMessage } = await this.messageEntity
        .patch({
          chatId,
          createdAt: message.createdAt,
          messageId,
        })
        .set({
          content,
          ...(reasoningContent !== undefined && { reasoningContent }),
        })
        .go({ response: "all_new" });

      // Update the chat's updatedAt timestamp
      await this.chatEntity
        .update({
          chatId,
        })
        .set({})
        .go();

      return updatedMessage;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a chat and all its messages
   * @param chatId - ID of the chat
   * @param userId - ID of the user
   * @returns Success flag
   */
  public async deleteChat(chatId: string, userId: string) {
    try {
      if (!userId) throw new Error("userId is required");

      // First verify the user has access to this chat
      const chat = await this.getChatForUser(chatId, userId);
      if (!chat) return false;

      // Get all messages to delete them
      const { data: messages } = await this.messageEntity.query
        .primary({
          chatId,
        })
        .go();

      // Delete all messages
      for (const message of messages) {
        await this.messageEntity
          .delete({
            chatId,
            createdAt: message.createdAt,
            messageId: message.messageId,
          })
          .go();
      }

      // Delete the chat itself
      await this.chatEntity
        .delete({
          chatId,
        })
        .go();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a specific message
   * @param chatId - ID of the chat
   * @param messageId - ID of the message
   * @param userId - ID of the user
   * @returns Success flag
   */
  public async deleteMessage(
    chatId: string,
    messageId: string,
    userId: string
  ) {
    try {
      if (!userId) throw new Error("userId is required");

      // Get the message to find its createdAt timestamp (needed for the composite key)
      const messages = await this.messageEntity.query.primary({ chatId }).go();
      const message = messages.data.find((m) => m.messageId === messageId);

      if (!message || message.userId !== userId)
        throw new Error(
          `Message with ID ${messageId} not found or access denied`
        );

      // Delete the message
      await this.messageEntity
        .delete({
          chatId,
          createdAt: message.createdAt,
          messageId,
        })
        .go();

      // Update the chat's updatedAt timestamp
      await this.chatEntity
        .patch({
          chatId,
        })
        .set({})
        .go();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /* istanbul ignore next */
  public async clearData(userId: string) {
    if (!process.env.LOCALSTACK_ENDPOINT) {
      throw new Error("LOCALSTACK_ENDPOINT is not set");
    }
    if (!userId) throw new Error("userId is required");

    const allChats = await ChatService.entities.chat.scan.go();

    if (allChats.data.length === 0) {
      return; // Nothing to delete
    }

    const chatDeleteBatch = allChats.data.map((chat) =>
      this.chatEntity
        .delete({
          chatId: chat.chatId,
        })
        .go()
    );

    const messageBatchPromises = allChats.data.map(async (chat) => {
      const messages = await ChatService.entities.chatMessage.query
        .primary({
          chatId: chat.chatId,
        })
        .go();

      if (messages.data.length === 0) {
        return Promise.resolve(); // No messages to delete
      }

      // Batch delete all messages for this chat
      messages.data.map(async (message) => {
        await this.messageEntity
          .delete({
            chatId: message.chatId,
            createdAt: message.createdAt,
            messageId: message.messageId,
          })
          .go();
      });
    });

    // 4. Wait for all message deletions to complete
    await Promise.all(messageBatchPromises);
    await Promise.all(chatDeleteBatch);
  }
}
