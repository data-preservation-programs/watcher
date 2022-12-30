import { SQSBatchResponse, SQSEvent } from 'aws-lambda/trigger/sqs.js'
import dotenv from 'dotenv'
import { action } from './lib.js'
dotenv.config()

export async function handler (event: SQSEvent): Promise<SQSBatchResponse> {
  for (const record of event.Records) {
    console.log(record)
    try {
      await action(JSON.parse(record.body))
    } catch (e) {
      console.error(e)
    }
  }

  return { batchItemFailures: [] }
}
