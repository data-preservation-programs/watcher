import { SQSBatchResponse, SQSEvent } from 'aws-lambda/trigger/sqs'

export async function handler (event: SQSEvent): Promise<SQSBatchResponse> {
  for (const record of event.Records) {
    console.log(record.body)
    console.log(record.messageAttributes)
  }

  return { batchItemFailures: [] }
}
