import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  configureDeviceIdentityStorage,
  getDeviceRateLimitId,
  resetDeviceRateLimitIdCache,
  setDeviceRateLimitIdForTests,
} from '@briefly/validation';

configureDeviceIdentityStorage({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
});

export {
  getDeviceRateLimitId,
  resetDeviceRateLimitIdCache,
  setDeviceRateLimitIdForTests,
};
