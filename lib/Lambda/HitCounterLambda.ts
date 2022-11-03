import {DynamoDBClient, GetItemCommand, UpdateItemCommand} from "@aws-sdk/client-dynamodb";
import {Lambda} from "@aws-sdk/client-lambda";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import axios from "axios";
import {Logger} from "@aws-sdk/types/dist-types/ts3.4/logger";

export async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

  console.log('hello started');

  let result = await axios.get('https://ifconfig.me')
  console.log('done ip:', result.data);


  let dynamodb = new DynamoDBClient({});
  let updateItemCommand = new UpdateItemCommand({
    Key: {path: {S: event.path}},
    TableName: process.env.DDB_TABLE_NAME,
    UpdateExpression: 'ADD hits :incr',
    ExpressionAttributeValues: {':incr': {N: '1'}}
  });
  let result2 = await dynamodb.send(updateItemCommand);

  // let getCommand = new GetItemCommand({
  //   Key: {path: {S: event.path}},
  //  TableName: process.env.DDB_TABLE_NAME
  // });
  // let getResult = await dynamodb.send(getCommand);
  //

  console.log('lambda name', process.env.DOWNSTREAM_LAMBDA_NAME);
  let lambda = new Lambda({
    // logger: Lambda.Logger.debug;
  });
  const response = await lambda.invoke({
    FunctionName: process.env.DOWNSTREAM_LAMBDA_NAME,
    Payload: Buffer.from(JSON.stringify(event))
  });

  console.log('downstream response:', response);

  return {
    statusCode: 200,
    body: JSON.stringify({
      ip: result.data,
      DDB: result2
    })
  }
}