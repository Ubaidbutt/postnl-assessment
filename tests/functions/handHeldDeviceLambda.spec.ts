import { saveHandHeldDeviceLocation } from "../../src/functions/HandHeldDeviceLambda/handler";
import { HandHeldDeviceService } from "../../src/helpers/HandHeldDeviceService/handHeldDeviceService";
import { DLQService } from '../../src/helpers/DLQService/dlqService';

jest.mock('../../src/helpers/HandHeldDeviceService/handHeldDeviceService.ts', () => {
    return {
        HandHeldDeviceService: jest.fn().mockImplementation(() => {
            return {
                getLocationById: jest.fn(),
                updateLocation: jest.fn()
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

describe('saveHandHeldDeviceLocation', () => {
    it('saves the location of the handheld device to a dynamodb table', async () => {
        const updateLocationMock = jest.fn();
        //@ts-ignore
        HandHeldDeviceService.mockImplementation(() => {
            return {
                getLocationById: jest.fn(),
                updateLocation: updateLocationMock
            }
        });
        saveHandHeldDeviceLocation({
            //@ts-ignore
            Records: [{
                messageId: '1',
                body: JSON.stringify({
                    handheldId: '1234',
                    latitude: 10,
                    longitude: 20,
                    timestamp: ''
                })
            }]
        }, undefined, undefined);

        expect(updateLocationMock).toHaveBeenCalledWith({
            handheldId: '1234',
            latitude: 10,
            longitude: 20,
            timestamp: ''
        });
    });

    it('should log the error and send it to DLQ if updateLocation fails', async () => {
        const mockError = new Error('Unable to update location');
        const updateLocationMock = jest.fn().mockImplementation(() => {
            throw mockError;
        });
        //@ts-ignore
        HandHeldDeviceService.mockImplementation(() => {
            return {
                getLocationById: jest.fn(),
                updateLocation: updateLocationMock
            }
        });
        const consoleErrorSpy = jest.spyOn(console, 'error');
        consoleErrorSpy.mockImplementation(() => {});

        saveHandHeldDeviceLocation({
            //@ts-ignore
            Records: [{
                messageId: '1',
                body: JSON.stringify({
                    handheldId: '1234',
                    latitude: 10,
                    longitude: 20,
                    timestamp: ''
                })
            }]
        }, undefined, undefined);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error occured while processing a handheld device message: ', mockError);
        expect(mockedSendErrorToDLQ).toBeCalledWith(mockError);
    });
});
