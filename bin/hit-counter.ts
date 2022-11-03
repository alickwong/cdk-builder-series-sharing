#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {PipelineStack} from "../lib/PipelineStack";
import {HitCounterStack} from "../lib/HitCounterStack";

const app = new cdk.App();
new HitCounterStack(app, 'HitCounter', {});
