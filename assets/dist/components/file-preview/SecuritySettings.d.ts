import React from 'react';
import { SecurityConfig } from '@/types/security';
interface SecuritySettingsProps {
    config: SecurityConfig;
    onChange: (config: SecurityConfig) => void;
    className?: string;
}
export declare const SecuritySettings: React.FC<SecuritySettingsProps>;
export {};
