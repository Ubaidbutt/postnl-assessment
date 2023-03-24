import { DynamoDB } from 'aws-sdk';

export class DeviceLookupService {
    private readonly db: DynamoDB.DocumentClient;
    private readonly tableName: string;
    
    constructor(tableName: string) {
        this.db = new DynamoDB.DocumentClient({
            region: 'eu-central-1'
        });
        this.tableName = tableName;
    }

    async getHandHeldDeviceId(vehicleMacAddress: string): Promise<string | null> {
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: 'vehicleMacAddress = :vehicleMacAddress',
            ExpressionAttributeValues: {
                ':vehicleMacAddress': vehicleMacAddress,
            }
        };
        const result = await this.db.query(params).promise();
        if (result.Count === 0 || !result.Items || result.Items.length === 0) {
            return null;
        }
        return result.Items[0].handheldMacAddress;
    }
}
