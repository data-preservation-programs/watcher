import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import { randomUUID } from 'crypto'
import definition from './deploy/deploy_lambda.json' assert { type: 'json' }
import { Payload } from './types.js'
import dotenv from 'dotenv'
dotenv.config()

export async function handler (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.queryStringParameters?.token !== process.env.TOKEN) {
    return {
      statusCode: 403,
      body: 'Forbidden'
    }
  }

  const ip = event.queryStringParameters?.ip
  if (ip == null) {
    return {
      statusCode: 400,
      body: 'Missing ip'
    }
  }
  const correlationId = randomUUID()
  const payload: Payload = {
    ip, correlationId
  }
  const tasks = []
  for (const url of definition.queue_urls) {
    const command = new SendMessageCommand({
      QueueUrl: url,
      MessageBody: JSON.stringify(payload)
    })
    const region = url.split('.')[1]
    tasks.push(new SQSClient(
      {
        credentials: {
          accessKeyId: process.env.KEY!,
          secretAccessKey: process.env.SECRET!
        },
        region
      }
    ).send(command))
  }
  await Promise.all(tasks)
  return {
    statusCode: 200,
    body: correlationId
  }
}
