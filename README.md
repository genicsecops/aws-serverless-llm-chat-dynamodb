# DynamoDB Single-Table Design: Practical Example with TypeScript & ElectroDB

**This repository contains the companion code for our blog post:** **[AWS: DynamoDB vs RDS in Serverless Environments]([LINK_TO_YOUR_BLOG_POST](https://genicsecops.com/blog/aws-dynamodb-vs-rds-in-serverless-environments))**

It provides a practical demonstration of how to effectively use Amazon DynamoDB with the **Single-Table Design (STD)** pattern. We leverage **TypeScript** for type safety and **ElectroDB** as a powerful object mapper to reduce complexity and enhance the developer experience. The entire setup is locally testable using **LocalStack** and **Jest**.

## Context & Motivation

In our [blog post](https://genicsecops.com/blog/aws-dynamodb-vs-rds-in-serverless-environments), we discuss the pros and cons of DynamoDB compared to RDS/Aurora, especially within a serverless context using AWS Lambda, including a detailed cost analysis. We argue why DynamoDB can often be the better choice for startups and scaling applications, provided you embrace the Single-Table Design paradigm.

This repository provides the **practical code** to implement the concepts described in the blog post:

* **Implementation:** Shows how to model entities (e.g., `Chat`, `ChatMessage`) within a single table.
* **Efficient Queries:** Demonstrates how to map common access patterns using primary keys (PK/SK) and Global Secondary Indexes (GSI).
* **Developer Friendliness:** Utilizes ElectroDB to abstract the creation of complex key structures and ensures type safety via TypeScript.
* **Testability:** Integrates LocalStack and Jest for reliable local testing without requiring actual AWS resources.

## Core Concepts & Features

* ✅ **Single-Table Design (STD):** All data in one table for optimal performance and scalability without relational JOINs.
* ⚡ **Efficient Access Patterns:** Modeled for typical use cases (loading a chat, loading messages for a chat, loading a user's chats).
* 🔒 **TypeScript:** Strong typing for entities, the data access layer (DAL), and tests.
* ✨ **ElectroDB:** Significantly simplifies DynamoDB interactions through:
  * Schema definition and validation.
  * Automatic generation of PK/SK/GSI keys.
  * Type-safe query API.
  * Collections for querying related entities together.
* 🧪 **Local Testing:** Comprehensive test suite using Jest against a local DynamoDB instance via LocalStack.
* 🏗️ **Structured Code:** Clear separation of models (`src/models`), data access (`src/dal`), and tests (`src/test`).

## Prerequisites

* Node.js (v18 or later recommended)
* npm or yarn
* Docker (for LocalStack)

## Getting Started

1. **Clone the repository:**

    ```bash
    git clone https://github.com/genicsecops/aws-serverless-llm-chat-dynamodb.git
    cd aws-serverless-llm-chat-dynamodb
    ```

2. **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

## Local Development & Testing with LocalStack

We use LocalStack to simulate a local AWS environment (specifically DynamoDB). This allows for rapid development and testing without incurring AWS costs or needing an AWS account.

1. **Start LocalStack:**
    Ensure Docker is running and start LocalStack (e.g., using the LocalStack CLI or Docker Compose):

    ```bash
    # Example using Docker CLI
    docker run --rm -d -p 4566:4566 localstack/localstack
    ```

    *Note: For more complex setups or specific versions, refer to the [official LocalStack documentation](https://docs.localstack.cloud/getting-started/installation/).*

2. **Run Tests:**
    The tests are configured to automatically run against the running LocalStack instance. The necessary DynamoDB table is created before the tests run and deleted afterward (see `src/test/setup.ts` & `jest.setup.ts`).

    ```bash
    npm test
    # or
    yarn test
    ```

## Contributing

Contributions are welcome! Please open an issue first to discuss improvements or potential changes.

## License

[MIT](LICENSE)
