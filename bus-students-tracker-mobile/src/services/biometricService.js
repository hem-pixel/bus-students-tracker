// FILE: src/services/biometricService.js
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export const checkBiometricAvailability = async () => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return {
      available,
      biometryType:
        biometryType === BiometryTypes.FaceID
          ? 'FaceID'
          : biometryType === BiometryTypes.TouchID
          ? 'TouchID'
          : biometryType === BiometryTypes.Biometrics
          ? 'Fingerprint'
          : 'None',
    };
  } catch (err) {
    console.warn('Biometrics sensor check error:', err);
    return { available: false, biometryType: 'None' };
  }
};

export const promptBiometricAuth = async (promptMessage = 'Authenticate to access Bus Tracker') => {
  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Use Password',
    });
    return success;
  } catch (err) {
    console.warn('Biometric prompt cancelled or failed:', err);
    return false;
  }
};
