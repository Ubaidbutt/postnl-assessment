import { calculateDistanceAndSendAlerts } from '../../src/functions/VehicleLambda/handler';
import { DeviceLookupService } from '../../src/helpers/DeviceLookupService/deviceLookupService';
import { HandHeldDeviceService } from '../../src/helpers/HandHeldDeviceService/handHeldDeviceService';
import { SNSClient } from '../../src/helpers/SnsClient/snsClient';
import * as distanceCalculator from '../../src/helpers/DistanceCalculator/calculateDistanceBetweenTwoLocations';

jest.mock('../../src/helpers/DeviceLookupService/deviceLookupService', () => {
    return {
        DeviceLookupService: jest.fn().mockImplementation(() => {
            return {
                getHandHeldDeviceId: jest.fn()
            }
        })
    }
});

jest.mock('../../src/helpers/HandHeldDeviceService/handHeldDeviceService', () => {
    return {
        HandHeldDeviceService: jest.fn().mockImplementation(() => {
            return {
                getLocationById: jest.fn()
            }
        })
    }
});

jest.mock('../../src/helpers/SnsClient/snsClient', () => {
    return {
        SNSClient: jest.fn().mockImplementation(() => {
            return {
                publishEvent: jest.fn()
            }
        })
    }
});

const mockedSendErrorToDLQ = jest.fn();
jest.mock('../../src/helpers/DLQService/dlqService', () => {
    return {
        DLQService: jest.fn().mockImplementation(() => {
            return {
                sendErrorToDLQ: mockedSendErrorToDLQ
            }
        })
    }
});

describe('calculateDistanceAndSendAlerts', () => {
    it('should send the alert if the distance between the locations is more than 50 meters', async () => {
        const mockGetHandHeldDeviceId = jest.fn().mockReturnValue('2');
        //@ts-ignore
        DeviceLookupService.mockImplementation(() => {
            return {
                getHandHeldDeviceId: mockGetHandHeldDeviceId
            }
        });

        const mockGetLocationById = jest.fn().mockReturnValue({
            handheldId: '2',
            longitude: 30,
            latitude: 40,
            timestamp: ''
        });
        //@ts-ignore
        HandHeldDeviceService.mockImplementation(() => {
            return {
                getLocationById: mockGetLocationById
            }
        });

        const mockPublishEvent = jest.fn();
        //@ts-ignore
        SNSClient.mockImplementation(() => {
            return {
                publishEvent: mockPublishEvent
            }
        });

        const distanceMock = jest.spyOn(distanceCalculator, 'distanceInMeters');
        distanceMock.mockReturnValue(55);

        await calculateDistanceAndSendAlerts({
            //@ts-ignore
            Records: [{
                messageId: '1',
                body: JSON.stringify({
                    vehicleId: '1',
                    longitude: 10,
                    latitude: 20,
                    timestamp: ''
                })
            }]
        }, undefined, () => {});

        expect(mockGetHandHeldDeviceId).toHaveBeenCalledWith('1');
        expect(mockGetLocationById).toHaveBeenCalledWith('2');
        expect(mockPublishEvent).toHaveBeenCalledWith({
            vehicleLocation: {
                longitude: 10,
                latitude: 20
            },
            handheldDeviceLocation: {
                longitude: 30,
                latitude: 40
            }
        });
    });

    it('should not send the alert if the distance between the locations is less than 50 meters', async () => {
        const mockGetHandHeldDeviceId = jest.fn().mockReturnValue('2');
        //@ts-ignore
        DeviceLookupService.mockImplementation(() => {
            return {
                getHandHeldDeviceId: mockGetHandHeldDeviceId
            }
        });

        const mockGetLocationById = jest.fn().mockReturnValue({
            handheldId: '2',
            longitude: 30,
            latitude: 40,
            timestamp: ''
        });
        //@ts-ignore
        HandHeldDeviceService.mockImplementation(() => {
            return {
                getLocationById: mockGetLocationById
            }
        });

        const mockPublishEvent = jest.fn();
        //@ts-ignore
        SNSClient.mockImplementation(() => {
            return {
                publishEvent: mockPublishEvent
            }
        });

        const distanceMock = jest.spyOn(distanceCalculator, 'distanceInMeters');
        distanceMock.mockReturnValue(40);

        await calculateDistanceAndSendAlerts({
            //@ts-ignore
            Records: [{
                messageId: '1',
                body: JSON.stringify({
                    vehicleId: '1',
                    longitude: 10,
                    latitude: 20,
                    timestamp: ''
                })
            }]
        }, undefined, () => {});

        expect(mockGetHandHeldDeviceId).toHaveBeenCalledWith('1');
        expect(mockGetLocationById).toHaveBeenCalledWith('2');
        expect(mockPublishEvent).toBeCalledTimes(0);
    });

    it('should log the error and send it to DLQ if the paired handheld device is not found', async () => {
        const mockError = new Error('Unable to get hand held device');
        const mockGetHandHeldDeviceId = jest.fn().mockImplementation(() => {
            throw mockError;
        });
        //@ts-ignore
        DeviceLookupService.mockImplementation(() => {
            return {
                getHandHeldDeviceId: mockGetHandHeldDeviceId
            }
        });

        const consoleErrorSpy = jest.spyOn(console, 'error');
        consoleErrorSpy.mockImplementation(() => {});

        await calculateDistanceAndSendAlerts({
            //@ts-ignore
            Records: [{
                messageId: '1',
                body: JSON.stringify({
                    vehicleId: '1',
                    longitude: 10,
                    latitude: 20,
                    timestamp: ''
                })
            }]
        }, undefined, () => {});

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error occured while processing a vehicle message: ', mockError);
        expect(mockedSendErrorToDLQ).toBeCalledWith(mockError);
    });
});
