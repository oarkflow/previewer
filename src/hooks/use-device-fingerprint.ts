import { useEffect, useState, useCallback } from 'react';

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
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isReady, setIsReady] = useState(false);

  const generateFingerprint = useCallback(async (): Promise<{ fingerprint: string; deviceInfo: DeviceInfo }> => {
    // Collect device characteristics
    const info: DeviceInfo = {
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      touchSupport: 'ontouchstart' in window,
      webglVendor: '',
      webglRenderer: '',
      canvasFingerprint: '',
    };

    // WebGL fingerprint
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          info.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
          info.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        }
      }
    } catch (e) {
      // WebGL not available
    }

    // Canvas fingerprint
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 100, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('Device Fingerprint', 2, 15);
        ctx.strokeStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.strokeText('Device Fingerprint', 4, 17);
        info.canvasFingerprint = canvas.toDataURL().slice(-50);
      }
    } catch (e) {
      // Canvas not available
    }

    // Create hash from all characteristics
    const dataString = JSON.stringify(info);
    const hash = await hashString(dataString);

    return { fingerprint: hash, deviceInfo: info };
  }, []);

  useEffect(() => {
    generateFingerprint().then(({ fingerprint: fp, deviceInfo: di }) => {
      setFingerprint(fp);
      setDeviceInfo(di);
      setIsReady(true);
    });
  }, [generateFingerprint]);

  return {
    fingerprint,
    deviceInfo,
    isReady,
    regenerate: generateFingerprint,
  };
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare two fingerprints with tolerance for minor changes
 * Returns a similarity score from 0 to 1
 */
export function compareFingerprints(fp1: DeviceInfo | null, fp2: DeviceInfo | null): number {
  if (!fp1 || !fp2) return 0;

  const weights = {
    screenResolution: 0.1,
    colorDepth: 0.05,
    timezone: 0.15,
    language: 0.1,
    platform: 0.15,
    hardwareConcurrency: 0.1,
    webglVendor: 0.15,
    webglRenderer: 0.15,
    canvasFingerprint: 0.05,
  };

  let score = 0;

  if (fp1.screenResolution === fp2.screenResolution) score += weights.screenResolution;
  if (fp1.colorDepth === fp2.colorDepth) score += weights.colorDepth;
  if (fp1.timezone === fp2.timezone) score += weights.timezone;
  if (fp1.language === fp2.language) score += weights.language;
  if (fp1.platform === fp2.platform) score += weights.platform;
  if (fp1.hardwareConcurrency === fp2.hardwareConcurrency) score += weights.hardwareConcurrency;
  if (fp1.webglVendor === fp2.webglVendor) score += weights.webglVendor;
  if (fp1.webglRenderer === fp2.webglRenderer) score += weights.webglRenderer;
  if (fp1.canvasFingerprint === fp2.canvasFingerprint) score += weights.canvasFingerprint;

  return score;
}
