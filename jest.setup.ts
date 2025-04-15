// Set environment variables for tests
process.env.LOCALSTACK_ENDPOINT =
  process.env.LOCALSTACK_ENDPOINT || "http://localhost:4566";
process.env.AWS_REGION = process.env.AWS_REGION || "us-east-1";
