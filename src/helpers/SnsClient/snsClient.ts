import { SNS } from 'aws-sdk';

export class SNSClient {
  private readonly sns: SNS;
  private readonly topicArn: string;

  constructor(topicArn: string) {
    this.topicArn = topicArn;
    this.sns = new SNS({ region: 'eu-central-1' });
  }

  async publishEvent(event: any): Promise<void> {
    const params: SNS.Types.PublishInput = {
      Message: JSON.stringify(event),
      TopicArn: this.topicArn,
    };

    await this.sns.publish(params).promise();
  }
}
