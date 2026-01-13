import React from 'react';
import { SecurityEvent } from '@/types/security';
interface AuditTrailViewerProps {
    events: SecurityEvent[];
    className?: string;
    onClear?: () => void;
}
export declare const AuditTrailViewer: React.FC<AuditTrailViewerProps>;
export {};
