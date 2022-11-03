import * as cdk from 'aws-cdk-lib';
import * as aws_codecommit from 'aws-cdk-lib/aws-codecommit';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import {WorkshopPipelineStage} from "./WorkshopPipelineStage";
import {pipelines} from "aws-cdk-lib";

interface PipelineStackProp extends cdk.StackProps{
  readCapacity: string;
}

export class PipelineStack extends cdk.Stack{
  constructor(scope: Construct, id: string, props: PipelineStackProp) {
    super(scope, id, props);

    let repo = new aws_codecommit.Repository(this, 'WorkshopRepo', {
      repositoryName: 'WorkshopRepo'
    });

    let pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'WorkshopPipeline',
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.codeCommit(repo, 'builder-series-branch'),
        installCommands: [
          'npm install -g aws-cdk',
          'npm install -g typescript',
          'npm install -g esbuild',
        ],
        commands: [
          'cd hit-counter',
          'npm ci',
          'npx cdk synth'
        ],
        primaryOutputDirectory: 'hit-counter/cdk.out'
      })
    });

    let deploy = new WorkshopPipelineStage(this, 'Deploy');
    let stage = pipeline.addStage(deploy);

    stage.addPost(
      new CodeBuildStep('TestViewerEndpoint', {
        projectName:'TestViewerEndpoint' ,
        commands: [
          'curl -Ssf $ENDPOINT'
        ],
        envFromCfnOutputs: {
          ENDPOINT: deploy.tableViewEndpoint
        }
      })
    )
  }
}