import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import {
  Alias,
  CfnParametersCode,
  Code,
  Function,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { HttpApi } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

import { Construct } from "constructs";

interface ServiceStackProps extends StackProps {
  stageName: string;
}

export class ServiceStack extends Stack {
  public readonly serviceCode: CfnParametersCode;
  public readonly serviceEndpointOutput: CfnOutput;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    this.serviceCode = Code.fromCfnParameters();

    const lambda = new Function(this, "ServiceLambda", {
      runtime: Runtime.NODEJS_14_X,
      handler: "src/lambda.handler",
      code: this.serviceCode,
      functionName: `ServiceLambda`,
    });


    const httpApi = new HttpApi(this, "ServiceAPI", {
      defaultIntegration: new HttpLambdaIntegration("LambdaIntegration", lambda)
    })
  }
}