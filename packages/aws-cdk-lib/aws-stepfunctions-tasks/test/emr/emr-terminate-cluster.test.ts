import { Template } from '../../../assertions';
import * as sfn from '../../../aws-stepfunctions';
import * as cdk from '../../../core';
import * as tasks from '../../lib';

let stack: cdk.Stack;

beforeEach(() => {
  // GIVEN
  stack = new cdk.Stack();
});

test('Terminate cluster with static ClusterId', () => {
  // WHEN
  const task = new tasks.EmrTerminateCluster(stack, 'Task', {
    clusterId: 'ClusterId',
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
  });

  // THEN
  expect(stack.resolve(task.toStateJson())).toEqual({
    Type: 'Task',
    Resource: {
      'Fn::Join': [
        '',
        [
          'arn:',
          {
            Ref: 'AWS::Partition',
          },
          ':states:::elasticmapreduce:terminateCluster.sync',
        ],
      ],
    },
    End: true,
    Parameters: {
      ClusterId: 'ClusterId',
    },
  });
});

test('Terminate cluster with static ClusterId - using JSONata', () => {
  // WHEN
  const task = tasks.EmrTerminateCluster.jsonata(stack, 'Task', {
    clusterId: 'ClusterId',
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
  });

  // THEN
  expect(stack.resolve(task.toStateJson())).toEqual({
    Type: 'Task',
    QueryLanguage: 'JSONata',
    Resource: {
      'Fn::Join': [
        '',
        [
          'arn:',
          {
            Ref: 'AWS::Partition',
          },
          ':states:::elasticmapreduce:terminateCluster.sync',
        ],
      ],
    },
    End: true,
    Arguments: {
      ClusterId: 'ClusterId',
    },
  });
});

test('task policies are generated', () => {
  // WHEN
  const task = new tasks.EmrTerminateCluster(stack, 'Task', {
    clusterId: 'ClusterId',
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
  });
  new sfn.StateMachine(stack, 'SM', {
    definitionBody: sfn.DefinitionBody.fromChainable(task),
  });

  // THEN
  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            'elasticmapreduce:DescribeCluster',
            'elasticmapreduce:TerminateJobFlows',
          ],
          Effect: 'Allow',
          Resource: {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':elasticmapreduce:',
                {
                  Ref: 'AWS::Region',
                },
                ':',
                {
                  Ref: 'AWS::AccountId',
                },
                ':cluster/*',
              ],
            ],
          },
        },
        {
          Action: [
            'events:PutTargets',
            'events:PutRule',
            'events:DescribeRule',
          ],
          Effect: 'Allow',
          Resource: {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':events:',
                {
                  Ref: 'AWS::Region',
                },
                ':',
                {
                  Ref: 'AWS::AccountId',
                },
                ':rule/StepFunctionsGetEventForEMRTerminateJobFlowsRule',
              ],
            ],
          },
        },
      ],
    },
  });
});

test('Terminate cluster with ClusterId from payload', () => {
  // WHEN
  const task = new tasks.EmrTerminateCluster(stack, 'Task', {
    clusterId: sfn.TaskInput.fromJsonPathAt('$.ClusterId').value,
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
  });

  // THEN
  expect(stack.resolve(task.toStateJson())).toEqual({
    Type: 'Task',
    Resource: {
      'Fn::Join': [
        '',
        [
          'arn:',
          {
            Ref: 'AWS::Partition',
          },
          ':states:::elasticmapreduce:terminateCluster.sync',
        ],
      ],
    },
    End: true,
    Parameters: {
      'ClusterId.$': '$.ClusterId',
    },
  });
});

test('Terminate cluster with static ClusterId and SYNC integrationPattern', () => {
  // WHEN
  const task = new tasks.EmrTerminateCluster(stack, 'Task', {
    clusterId: 'ClusterId',
    integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
  });

  // THEN
  expect(stack.resolve(task.toStateJson())).toEqual({
    Type: 'Task',
    Resource: {
      'Fn::Join': [
        '',
        [
          'arn:',
          {
            Ref: 'AWS::Partition',
          },
          ':states:::elasticmapreduce:terminateCluster',
        ],
      ],
    },
    End: true,
    Parameters: {
      ClusterId: 'ClusterId',
    },
  });
});

test('Task throws if WAIT_FOR_TASK_TOKEN is supplied as service integration pattern', () => {
  expect(() => {
    new tasks.EmrTerminateCluster(stack, 'Task', {
      clusterId: 'ClusterId',
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    });
  }).toThrow(/Unsupported service integration pattern. Supported Patterns: REQUEST_RESPONSE,RUN_JOB. Received: WAIT_FOR_TASK_TOKEN/);
});
