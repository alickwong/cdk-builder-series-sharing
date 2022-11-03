import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import {IVpc} from "aws-cdk-lib/aws-ec2";

export interface HitCounterProp {
  downstreamLambda: lambda.IFunction,
  readCapacity: number,
  vpc: IVpc
}

export class HitCounterConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: HitCounterProp) {
    super(scope, id);

    if(props.readCapacity !== undefined, (props.readCapacity < 5 || props.readCapacity > 20)) {
      throw new Error("Read Capacity Error");
    }

    this.table = new dynamodb.Table(this, 'DynamodbTable' + id, {
      partitionKey: {
        name: 'path',
        type: dynamodb.AttributeType.STRING
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      readCapacity: props.readCapacity
    });

    let lambdaHandler = new NodejsFunction(this, 'Lambda' + id, {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, './Lambda/HitCounterLambda.ts'),
      bundling: {
        minify: true,
        sourceMap: true
      },
      environment: {
        DDB_TABLE_NAME: this.table.tableName,
        DOWNSTREAM_LAMBDA_NAME: props.downstreamLambda.functionName,
        NODE_OPTIONS: '--enable-source-maps'
      },
      vpc: props.vpc,
      vpcSubnets: {
        subnets: props.vpc.privateSubnets
      },
      timeout: cdk.Duration.minutes(1)
    });

    this.table.grantReadWriteData(lambdaHandler);
    props.downstreamLambda.grantInvoke(lambdaHandler);

    let gateway = new apigateway.LambdaRestApi(this, 'APIGateway' + id, {
      handler: lambdaHandler
    });

    console.log(gateway.url);
  }
}