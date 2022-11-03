import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {HitCounterStack} from "./HitCounterStack";
import {Stage} from "aws-cdk-lib";

export interface SampleProp{
  /** the function for which we want to count url hits **/
}

export class WorkshopPipelineStage extends Stage {
  public readonly tableViewEndpoint: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: SampleProp) {
    super(scope, id);

    let hitCounterStack = new HitCounterStack(this, 'WebService');
    this.tableViewEndpoint = hitCounterStack.tableViewEndpoint;
  }
}