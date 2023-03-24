import { SQS } from 'aws-sdk';

export class DLQService {
  private sqs: SQS;
  private queueUrl: string;

  constructor(queueUrl: string) {
    this.queueUrl = queueUrl;
    this.sqs = new SQS({
        region: 'eu-central-1'
    });
  }

  async sendErrorToDLQ(error: Error): Promise<void> {
    try {
      const params: SQS.SendMessageRequest = {
        MessageBody: JSON.stringify(event),
        MessageAttributes: {
          'error-name': {
            DataType: 'String',
            StringValue: error.name,
          },
          'error-message': {
            DataType: 'String',
            StringValue: error.message,
          },
          'error-stack': {
            DataType: 'String',
            StringValue: error.stack!,
          },
        },
        QueueUrl: this.queueUrl,
      };

      await this.sqs.sendMessage(params).promise();
    } catch (err) {
      console.error('Error sending error to DLQ:', err);
    }
  }
}
