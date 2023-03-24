import { DynamoDB } from 'aws-sdk';
import { HandHeldDeviceLocationEvent } from '../types';

export class HandHeldDeviceService {
  private readonly tableName: string;
  private readonly db: DynamoDB.DocumentClient;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = new DynamoDB.DocumentClient({
      region: 'eu-central-1'
    });
  }

  async updateLocation(record: HandHeldDeviceLocationEvent): Promise<void> {
    const params: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: {
        id: record.handheldId,
      },
      UpdateExpression: 'SET #longitude = :longitude, #latitude = :latitude, #timestamp = :timestamp',
      ExpressionAttributeNames: {
        '#longitude': 'longitude',
        '#latitude': 'latitude',
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':longitude': record.longitude,
        ':latitude': record.latitude,
        ':timestamp': record.timestamp,
      },
    };
  
    await this.db.update(params).promise();
  }
  

  async getLocationById(handheldId: string): Promise<HandHeldDeviceLocationEvent | null> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.tableName,
      KeyConditionExpression: 'handheldId = :handheldId',
      ExpressionAttributeValues: {
        ':handheldId': handheldId,
      }
    };

    const result = await this.db.query(params).promise();

    if (result.Count === 0 || !result.Items || result.Items.length === 0) {
        return null;
    }

    return result.Items[0] as HandHeldDeviceLocationEvent;
  }
}

