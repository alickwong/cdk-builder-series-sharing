import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {HitCounterConstruct} from "./HitCounterConstruct";
import {TableViewer} from "cdk-dynamo-table-viewer";
import {aws_ec2, aws_iam, CfnOutput} from "aws-cdk-lib";
import {Construct} from "constructs";

export class HitCounterStack extends cdk.Stack {
  public readonly tableViewEndpoint: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    let vpc = new aws_ec2.Vpc(this, 'hit-coutner-vpc', {
      enableDnsSupport: true,
      enableDnsHostnames: true
    });
    let vpcEndpoint = vpc.addInterfaceEndpoint('lambda-interface-endpoint', {
      subnets: {
        subnets: vpc.privateSubnets
      },
      service: aws_ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      privateDnsEnabled: true
    });
    // vpcEndpoint.addToPolicy(
    //   new aws_iam.PolicyStatement({
    //     principals: [new aws_iam.AnyPrincipal()],
    //     actions: ['s3:*'],
    //     resources: ['*'],
    //   }));

    let downstreamLambda = new NodejsFunction(this, 'Lambda' + id, {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, './Lambda/DownstreamLambda.ts'),
      // vpc,
      // vpcSubnets: {
      //   subnets: vpc.privateSubnets
      // },
      // timeout: cdk.Duration.minutes(1)
    });

    let hitCounterConstruct = new HitCounterConstruct(this, 'HitCounterConstruct', {
      downstreamLambda,
      readCapacity: 10,
      vpc
    });

    let tableViewEndpoint = new TableViewer(this, 'TableView', {
      table: hitCounterConstruct.table,
      title: 'hello table'
    });

    this.tableViewEndpoint = new CfnOutput(this, 'tableViewEndpoint', {value: tableViewEndpoint.endpoint});
  }
}