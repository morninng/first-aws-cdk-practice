import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { Construct } from 'constructs';

import { GitHubSourceAction, CodeBuildAction, CloudFormationCreateUpdateStackAction } from "aws-cdk-lib/aws-codepipeline-actions";

import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";

export class PipelineMyTestStack extends Stack {

  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: "Pipeline",
      crossAccountKeys: false,
      // restartExecutionOnUpdate: true,
    });

    const cdkSourceOutput = new Artifact("CDKSourceOutput");
    this.pipeline.addStage({
      stageName: "Source",
      actions: [
        new GitHubSourceAction({
          owner: "morninng",
          repo: "first-aws-cdk-practice",
          branch: "master",
          actionName: "Pipeline_Source",
          oauthToken: SecretValue.secretsManager("aws-code-pipeline-test2"),
          output: cdkSourceOutput,
        })
      ],
    });


    this.cdkBuildOutput = new Artifact("CdkBuildOutput");
    this.pipeline.addStage({
      stageName: "Build",
      actions: [
        new CodeBuildAction({
          actionName: "CDK_Build",
          input: cdkSourceOutput,
          outputs: [this.cdkBuildOutput],
          project: new PipelineProject(this, "CdkBuildProject", {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0,
            },
            buildSpec: BuildSpec.fromSourceFilename(
              "build-specs/cdk-build-spec.yml"
            ),
          }),
        })
      ],
    });


    this.pipeline.addStage({
      stageName: "Pipeline_Update",
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: "Pipeline_Update",
          stackName: "PipelineMyTestStack",
          templatePath: this.cdkBuildOutput.atPath(
            "PipelineMyTestStack.template.json"
          ),
          adminPermissions: true,
        }),
      ],
    });


  }



}
