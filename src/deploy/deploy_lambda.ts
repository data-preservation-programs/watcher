import { CreateQueueCommand, GetQueueAttributesCommand, ListQueuesCommand, SQS } from '@aws-sdk/client-sqs'
import dotenv from 'dotenv'
import definition from './deploy_lambda.json' assert { type: 'json' }
import {
  CreateEventSourceMappingCommand,
  CreateFunctionCommand,
  Lambda, ListEventSourceMappingsCommand,
  ListFunctionsCommand, UpdateFunctionCodeCommand
} from '@aws-sdk/client-lambda'
import * as fs from 'fs'
dotenv.config()

async function createFunction (region: string, name: string): Promise<string> {
  const client = new Lambda({ region })
  const listCommand = new ListFunctionsCommand({ MaxItems: 1000 })
  const listResponse = await client.send(listCommand)
  const code = fs.readFileSync('release.zip')
  for (const func of listResponse.Functions ?? []) {
    const existing = func.FunctionName
    if (name === existing) {
      console.log(`Function ${name} already exists in ${region}: ${func.FunctionArn!}`)
      const updateCommand = new UpdateFunctionCodeCommand({
        FunctionName: name,
        ZipFile: code
      })
      await client.send(updateCommand)
      console.log(`Updated function code for ${name} in ${region}`)
      return func.FunctionArn!
    }
  }
  console.log(`Creating function ${name} in ${region}`)
  const createCommand = new CreateFunctionCommand({
    Role: 'arn:aws:iam::258998852000:role/watcher-role',
    FunctionName: name,
    Runtime: 'nodejs16.x',
    Tags: {
      project: 'watcher'
    },
    MemorySize: 128,
    Timeout: 600,
    Handler: 'aws_lambda.handler',
    Code: {
      ZipFile: code
    }
  })
  const createResponse = await client.send(createCommand)
  const functionArn = createResponse.FunctionArn!
  console.log(`Created function ${name} in ${region}: ${functionArn}`)
  return functionArn
}

async function createTrigger (region: string, functionArn: string, queueArn: string): Promise<void> {
  const client = new Lambda({ region })
  const listEventCommand = new ListEventSourceMappingsCommand({ FunctionName: functionArn })
  const listEventResponse = await client.send(listEventCommand)
  for (const mapping of listEventResponse.EventSourceMappings ?? []) {
    if (mapping.EventSourceArn === queueArn) {
      console.log(`Mapping already exists for ${functionArn} and ${queueArn}`)
      return
    }
  }
  console.log(`Adding ${queueArn} to ${functionArn} as trigger`)
  const triggerCommand = new CreateEventSourceMappingCommand({
    FunctionName: functionArn,
    BatchSize: 1,
    Enabled: true,
    EventSourceArn: queueArn,
    MaximumBatchingWindowInSeconds: 0
  })
  await client.send(triggerCommand)
  console.log(`Added ${queueArn} to ${functionArn} as trigger`)
}

async function createQueue (region: string, name: string): Promise<string> {
  const client = new SQS({ region })
  const listCommand = new ListQueuesCommand({ MaxResults: 1000 })
  const listResponse = await client.send(listCommand)
  for (const queue of listResponse.QueueUrls ?? []) {
    const existing = queue.split('/').pop()
    if (name === existing) {
      console.log(`Queue ${name} already exists in ${region}: ${queue}`)
      return queue
    }
  }
  console.log(`Creating queue ${name} in ${region}`)
  const createCommand = new CreateQueueCommand({
    QueueName: name,
    tags: {
      project: 'watcher'
    },
    Attributes: {
      VisibilityTimeout: '3600',
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Id: 'sqs-policy',
        Statement: [
          {
            Sid: 'sqs-statement',
            Effect: 'Allow',
            Principal: '*',
            Action: 'sqs:*',
            Resource: `arn:aws:sqs:${region}:258998852000:`
          }
        ]
      })
    }
  })
  const response = await client.send(createCommand)
  console.log(`Created queue ${name} in ${region}: ${response.QueueUrl!}`)
  return response.QueueUrl!
}

async function getQueueArn (region: string, queueUrl: string): Promise<string> {
  const client = new SQS({ region })
  const command = new GetQueueAttributesCommand({
    QueueUrl: queueUrl,
    AttributeNames: ['QueueArn']
  })
  const response = await client.send(command)
  return response.Attributes!.QueueArn!
}

async function deploy (): Promise<void> {
  const queues = []
  for (const region of definition.regions) {
    const name = definition.queue_prefix + '-' + region
    const queueUrl = await createQueue(region, name)
    const queueArn = await getQueueArn(region, queueUrl)
    const functionArn = await createFunction(region, name)
    await createTrigger(region, functionArn, queueArn)
    queues.push(queueUrl)
  }

  console.log('Queues:')
  for (const queue of queues) {
    console.log(queue)
  }
}
await deploy()
