import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import { randomUUID } from 'crypto'
import * as definition from './deploy/deploy_lambda.json'
import { Payload } from './types'

export default async function handler (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
  if (event.queryStringParameters?.token !== process.env.TOKEN) {
    return {
      statusCode: 403,
      body: 'Forbidden'
    }
  }

  const ip = event.queryStringParameters?.ip
  if (!ip) {
    return {
      statusCode: 400,
      body: 'Missing ip'
    }
  }
  const client = new SQSClient({})
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
    tasks.push(client.send(command))
  }
  await Promise.all(tasks)
  return {
    statusCode: 200,
    body: correlationId
  }
}
