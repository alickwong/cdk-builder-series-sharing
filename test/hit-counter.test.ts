import * as cdk from 'aws-cdk-lib';
import {Template, Match, Capture} from 'aws-cdk-lib/assertions';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {HitCounterConstruct} from "../lib/HitCounterConstruct";
import * as path from "path";
import {App, aws_ec2, Stack, Tags} from "aws-cdk-lib";
import {Lambda} from "@aws-sdk/client-lambda";
import axios from "axios";

describe('DynamoDB test', () => {
  let stack: cdk.Stack;
  let template: Template;

  beforeAll(() => {
    stack = new cdk.Stack();

    let downstreamLambda = new NodejsFunction(stack, 'Lambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, '../lib/Lambda/DownstreamLambda.ts'),
    });

    let hitCounterConstruct = new HitCounterConstruct(stack, 'HitCounterConstruct', {
      downstreamLambda,
      readCapacity: 10
    });

    template = Template.fromStack(stack);
    console.log(12312);
  });

  test('test dynamodb count', () => {
    // expect(template.toJSON()).toMatchSnapshot();
    template.resourceCountIs("AWS::DynamoDB::Table", 1);
  });


  test('SSE test', () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      SSESpecification: {
        SSEEnabled: true
      }
    });
    // expect(template.toJSON()).toMatchSnapshot();
  });
});

test('lambda invoke', async () => {
  let lambda = new Lambda({});
  const response = await lambda.invoke({
    FunctionName: 'Prod-LambdaProd06CE50D5-PLtTBmUh8Ql1',
    Payload: Buffer.from(JSON.stringify({message: 'hi!!'}))
  });

  console.log(response);

  // let result = await axios.get('https://ifconfig.me')
  // console.log(result.data);
});


test('ddb read capacity check', () => {
  const stack = new cdk.Stack();
  let downstreamLambda = new NodejsFunction(stack, 'Lambda', {
    runtime: lambda.Runtime.NODEJS_14_X,
    handler: 'main',
    entry: path.join(__dirname, '../lib/Lambda/DownstreamLambda.ts'),
  });

  expect(() => {
    let hitCounterConstruct = new HitCounterConstruct(stack, 'HitCounterConstruct', {
      downstreamLambda,
      readCapacity: 1000
    });
  }).toThrowError(/Read Capacity Error/);
});


test('Lambda ENV test', () => {
  const stack = new cdk.Stack();
  let lambdaHandler = new NodejsFunction(stack, 'Lambda', {
    runtime: lambda.Runtime.NODEJS_14_X,
    handler: 'main',
    entry: path.join(__dirname, '../lib/Lambda/HitCounterLambda.ts'),
    environment: {
      TEST_ENV: 'hello'
    }
  });
  const template = Template.fromStack(stack);
  const envCapture = new Capture();
  template.hasResourceProperties("AWS::Lambda::Function", {
    Environment: envCapture
  });

  expect(envCapture.asObject()).toMatchObject({
    Variables: {
      TEST_ENV: 'hello'
    }
  });
});


test('Tag Test', () => {
  const app = new App();
  const theBestStack = new Stack(app, 'MarketingSystem');
  new aws_ec2.Vpc(theBestStack, 'VPC');
  new NodejsFunction(theBestStack, 'Lambda', {
    runtime: lambda.Runtime.NODEJS_14_X,
    handler: 'main',
    entry: path.join(__dirname, '../lib/Lambda/DownstreamLambda.ts'),
  });

  // Add a tag to all constructs in the stack
  Tags.of(theBestStack).add('StackType', 'TheBest');

  // Remove the tag from all resources except subnet resources
  // Tags.of(theBestStack).remove('StackType', {
  //   excludeResourceTypes: ['AWS::EC2::Subnet']
  // });

  let template = Template.fromStack(theBestStack);
  expect(template.toJSON()).toMatchSnapshot();
});