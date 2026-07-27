import { useState, useEffect, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (permission?.granted) {
      setIsReady(true);
    }
  }, [permission]);

  const ask = useCallback(async () => {
    const result = await requestPermission();
    return result.granted;
  }, [requestPermission]);

  const status: PermissionStatus = !permission
    ? 'undetermined'
    : permission.granted
    ? 'granted'
    : 'denied';

  return {
    status,
    isReady,
    canAsk: permission?.canAskAgain ?? true,
    ask,
  };
}
