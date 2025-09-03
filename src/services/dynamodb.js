const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.IS_OFFLINE && {
    endpoint: 'http://localhost:8000',
  }),
});

const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.DYNAMODB_TABLE;

const put = async (item) => {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  return await docClient.send(command);
};

const get = async (key) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  const result = await docClient.send(command);
  return result.Item;
};

const update = async (key, updateExpression, expressionAttributeValues, expressionAttributeNames = {}) => {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ...(Object.keys(expressionAttributeNames).length > 0 && {
      ExpressionAttributeNames: expressionAttributeNames,
    }),
    ReturnValues: 'ALL_NEW',
  });
  const result = await docClient.send(command);
  return result.Attributes;
};

const remove = async (key) => {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });
  return await docClient.send(command);
};

const scan = async (filterExpression = null, expressionAttributeValues = {}) => {
  const command = new ScanCommand({
    TableName: tableName,
    ...(filterExpression && {
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    }),
  });
  const result = await docClient.send(command);
  return result.Items;
};

const query = async (keyConditionExpression, expressionAttributeValues) => {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  });
  const result = await docClient.send(command);
  return result.Items;
};

module.exports = {
  put,
  get,
  update,
  remove,
  scan,
  query,
};