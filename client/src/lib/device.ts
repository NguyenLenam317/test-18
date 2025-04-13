// Device ID management utilities
export function getOrCreateDeviceId(): string {
  const storageKey = 'ecosense_device_id';
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

export function clearDeviceId(): void {
  localStorage.removeItem('ecosense_device_id');
}
