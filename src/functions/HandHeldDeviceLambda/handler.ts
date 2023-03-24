import { SQSHandler, SQSEvent } from 'aws-lambda';
import { HandHeldDeviceService } from '../../helpers/HandHeldDeviceService/handHeldDeviceService';
import { HandHeldDeviceLocationEvent } from '../../helpers/types/index';
import { DLQService } from '../../helpers/DLQService/dlqService';
import config from '../../config/config';

const { devicePairLookupTableName, deadLetterQueueUrl } = config;

// TODO: Implement retry logic in the handler
export const saveHandHeldDeviceLocation: SQSHandler = async (event: SQSEvent) => {
  const handHeldDeviceService = new HandHeldDeviceService(devicePairLookupTableName);
  const dlqService = new DLQService(deadLetterQueueUrl);
  try {
    const records = event.Records;
    for (const record of records) {
      const body = record.body;
      const message = JSON.parse(body) as HandHeldDeviceLocationEvent;
      console.log(`Processing handheld device message with ID ${message.handheldId}`);
      
      await handHeldDeviceService.updateLocation(message);
    }
  } catch (error) {
    console.error('Error occured while processing a handheld device message: ', error);
    await dlqService.sendErrorToDLQ(error as Error);
  }
};
