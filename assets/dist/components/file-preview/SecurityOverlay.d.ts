import React from 'react';
import { SecurityConfig } from '@/types/security';
interface SecurityOverlayProps {
    config: SecurityConfig;
    className?: string;
    children: React.ReactNode;
    devToolsBlocked?: boolean;
    isBlurred?: boolean;
    onViolationAlert?: (message: string) => void;
}
/**
 * Enhanced security overlay component with comprehensive protection
 * - Multi-layer watermarking
 * - Anti-selection CSS
 * - Screenshot-resistant overlays
 * - DevTools blocking screen
 * - Print protection
 * - Drag prevention
 */
export declare const SecurityOverlay: React.FC<SecurityOverlayProps>;
export {};
