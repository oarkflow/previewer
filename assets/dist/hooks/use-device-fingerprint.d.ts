interface DeviceInfo {
    screenResolution: string;
    colorDepth: number;
    timezone: string;
    language: string;
    platform: string;
    cookiesEnabled: boolean;
    doNotTrack: string | null;
    hardwareConcurrency: number;
    deviceMemory: number | undefined;
    touchSupport: boolean;
    webglVendor: string;
    webglRenderer: string;
    canvasFingerprint: string;
}
/**
 * Generate a stable device fingerprint based on browser/device characteristics
 * This is used to detect session hijacking or unauthorized device access
 */
export declare function useDeviceFingerprint(): {
    fingerprint: string;
    deviceInfo: DeviceInfo;
    isReady: boolean;
    regenerate: () => Promise<{
        fingerprint: string;
        deviceInfo: DeviceInfo;
    }>;
};
/**
 * Compare two fingerprints with tolerance for minor changes
 * Returns a similarity score from 0 to 1
 */
export declare function compareFingerprints(fp1: DeviceInfo | null, fp2: DeviceInfo | null): number;
export {};
