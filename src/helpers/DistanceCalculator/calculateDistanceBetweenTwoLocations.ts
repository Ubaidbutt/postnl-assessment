interface Location {
    longitude: number;
    latitude: number;
}
  
function toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

export function distanceInMeters(location1: Location, location2: Location): number {
    const R = 6371e3; // earth radius in meters
    const lat1 = toRadians(location1.latitude);
    const lat2 = toRadians(location2.latitude);
    const deltaLat = toRadians(location2.latitude - location1.latitude);
    const deltaLon = toRadians(location2.longitude - location1.longitude);
  
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
      + Math.cos(lat1) * Math.cos(lat2)
      * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c;
}
