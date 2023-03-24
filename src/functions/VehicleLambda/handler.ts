import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DeviceLookupService } from '../../helpers/DeviceLookupService/deviceLookupService';
import { HandHeldDeviceService } from '../../helpers/HandHeldDeviceService/handHeldDeviceService';
import { DLQService } from '../../helpers/DLQService/dlqService';
import { SNSClient } from '../../helpers/SnsClient/snsClient';
import { VehicleLocationEvent } from '../../helpers/types/index';
import { distanceInMeters } from '../../helpers/DistanceCalculator/calculateDistanceBetweenTwoLocations';

import config from '../../config/config';

const { devicePairLookupTableName, handHeldDeviceLocationTableName, snsAlertTopicName, deadLetterQueueUrl } = config;

// TODO: Implement retry logic in the handler
export const calculateDistanceAndSendAlerts: SQSHandler = async (event: SQSEvent) => {
  const handHeldDeviceService = new HandHeldDeviceService(handHeldDeviceLocationTableName);
  const deviceLookupService = new DeviceLookupService(devicePairLookupTableName);
  const dlqService = new DLQService(deadLetterQueueUrl);
  const snsClient = new SNSClient(snsAlertTopicName);
  try {
    const records = event.Records;
    for (const record of records) {
      const vehicleLocationEvent = JSON.parse(record.body) as VehicleLocationEvent;
      console.log(`Processing vehicle message with ID ${vehicleLocationEvent.vehicleId}`);

      const handheldDeviceId = await deviceLookupService.getHandHeldDeviceId(vehicleLocationEvent.vehicleId);

      if (!handheldDeviceId) {
        throw new Error(`No handheld device found for vehicle id ${vehicleLocationEvent.vehicleId}`);
      }

      const handHeldDeviceLocationEvent = await handHeldDeviceService.getLocationById(handheldDeviceId);

      if (!handHeldDeviceLocationEvent) {
        throw new Error(`No handheld device found with id ${handheldDeviceId}`);
      }

      const vehicleLocation = {
        longitude: vehicleLocationEvent.longitude,
        latitude: vehicleLocationEvent.latitude
      };

      const handheldDeviceLocation = {
        longitude: handHeldDeviceLocationEvent.longitude,
        latitude: handHeldDeviceLocationEvent.latitude
      };

      const distance = distanceInMeters(vehicleLocation, handheldDeviceLocation);

      if(distance > 50) {
        await snsClient.publishEvent({
            vehicleLocation,
            handheldDeviceLocation
        });
      }
    }
  } catch (error) {
    console.error('Error occured while processing a vehicle message: ', error);
    await dlqService.sendErrorToDLQ(error as Error);
  }
};
