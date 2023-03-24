type LocationEvent = {
    longitude: number;
    latitude: number;
    timestamp: string;
}

export type VehicleLocationEvent = LocationEvent & {
    vehicleId: string;
}

export type HandHeldDeviceLocationEvent = LocationEvent & {
    handheldId: string;
}
