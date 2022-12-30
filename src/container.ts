import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import dotenv from 'dotenv'
import { action } from './lib.js'
dotenv.config()

const url = process.env.QUEUE_URL!
const region = url.split('.')[1]
const sqsClient = new SQSClient({
  credentials: {
    accessKeyId: process.env.KEY!,
    secretAccessKey: process.env.SECRET!
  },
  region
})

while (true) {
  try {
    const receiveMessageCommand = new ReceiveMessageCommand({
      QueueUrl: url,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 60
    })
    const receiveMessageResponse = await sqsClient.send(receiveMessageCommand)
    for (const message of receiveMessageResponse.Messages ?? []) {
      console.log(message)
      try {
        await action(JSON.parse(message.Body!))
      } catch (e) {
        console.error(e)
      }
      const deleteMessageCommand = new DeleteMessageCommand({
        QueueUrl: url,
        ReceiptHandle: message.ReceiptHandle!
      })
      await sqsClient.send(deleteMessageCommand)
    }
  } catch (e) {
    console.error(e)
    await new Promise(resolve => setTimeout(resolve, 60_000))
  }
}
