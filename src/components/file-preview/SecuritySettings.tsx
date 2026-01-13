import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Download, Copy, Printer, Activity, Droplets, X, Code2, MousePointer2, GripVertical, Keyboard } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { SecurityConfig, MAX_SECURITY_CONFIG } from '@/types/security';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SecuritySettingsProps {
  config: SecurityConfig;
  onChange: (config: SecurityConfig) => void;
  className?: string;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  config,
  onChange,
  className,
}) => {
  const updateConfig = (updates: Partial<SecurityConfig>) => {
    onChange({ ...config, ...updates });
  };

  const applyMaxSecurity = () => {
    onChange(MAX_SECURITY_CONFIG);
  };

  const securityFeatures = [
    { key: 'noCopy', enabled: config.noCopy, label: 'Copy Block' },
    { key: 'noDownload', enabled: config.noDownload, label: 'Download Block' },
    { key: 'screenshotResistant', enabled: config.screenshotResistant, label: 'Screenshot Resist' },
    { key: 'watermark', enabled: config.watermark, label: 'Watermark' },
    { key: 'activityLogging', enabled: config.activityLogging, label: 'Audit Log' },
  ];

  const enabledCount = securityFeatures.filter(f => f.enabled).length;
  const securityLevel = enabledCount;

  const getSecurityColor = () => {
    if (securityLevel >= 4) return 'text-success';
    if (securityLevel >= 2) return 'text-warning';
    return 'text-destructive';
  };

  const getSecurityBadge = () => {
    if (securityLevel >= 5) return { label: 'Maximum', variant: 'default' as const };
    if (securityLevel >= 3) return { label: 'High', variant: 'secondary' as const };
    if (securityLevel >= 1) return { label: 'Basic', variant: 'outline' as const };
    return { label: 'None', variant: 'destructive' as const };
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          title="Security Settings"
        >
          <Shield className={cn('h-4 w-4', getSecurityColor())} />
          {securityLevel > 0 && (
            <span className={cn(
              'absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center',
              securityLevel >= 4 ? 'bg-green-500' : securityLevel >= 2 ? 'bg-yellow-500' : 'bg-red-500',
              'text-white font-bold'
            )}>
              {securityLevel}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Security Settings</h4>
              <Badge variant={getSecurityBadge().variant} className="text-[10px]">
                {getSecurityBadge().label}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="default"
              onClick={applyMaxSecurity}
              className="text-xs"
            >
              🔒 Max Security
            </Button>
          </div>
          
          <Separator />
          
          {/* No Copy */}
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="no-copy" className="text-sm font-normal">
                Disable Copy
              </Label>
            </div>
            <Switch
              id="no-copy"
              checked={config.noCopy}
              onCheckedChange={(noCopy) => updateConfig({ noCopy })}
            />
          </motion.div>
          
          {/* No Download */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Download className="h-4 w-4 text-muted-foreground" />
                {config.noDownload && (
                  <X className="h-3 w-3 text-destructive absolute -top-1 -right-1" />
                )}
              </div>
              <Label htmlFor="no-download" className="text-sm font-normal">
                Disable Download
              </Label>
            </div>
            <Switch
              id="no-download"
              checked={config.noDownload}
              onCheckedChange={(noDownload) => updateConfig({ noDownload })}
            />
          </div>
          
          {/* Screenshot Resistant */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.screenshotResistant ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="screenshot" className="text-sm font-normal">
                Screenshot Resistant
              </Label>
            </div>
            <Switch
              id="screenshot"
              checked={config.screenshotResistant}
              onCheckedChange={(screenshotResistant) => updateConfig({ screenshotResistant })}
            />
          </div>
          
          {/* Watermark */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="watermark" className="text-sm font-normal">
                  Watermark
                </Label>
              </div>
              <Switch
                id="watermark"
                checked={config.watermark}
                onCheckedChange={(watermark) => updateConfig({ 
                  watermark,
                  watermarkConfig: watermark ? (config.watermarkConfig || MAX_SECURITY_CONFIG.watermarkConfig) : undefined
                })}
              />
            </div>
            
            {config.watermark && config.watermarkConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pl-6 space-y-2"
              >
                <Input
                  placeholder="Watermark text"
                  value={config.watermarkConfig.text}
                  onChange={(e) => updateConfig({
                    watermarkConfig: { ...config.watermarkConfig!, text: e.target.value }
                  })}
                  className="h-8 text-sm"
                />
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground w-16">Opacity</Label>
                  <Slider
                    value={[config.watermarkConfig.opacity * 100]}
                    onValueChange={([v]) => updateConfig({
                      watermarkConfig: { ...config.watermarkConfig!, opacity: v / 100 }
                    })}
                    max={50}
                    min={5}
                    step={5}
                    className="flex-1"
                  />
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Activity Logging */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="logging" className="text-sm font-normal">
                Activity Logging
              </Label>
            </div>
            <Switch
              id="logging"
              checked={config.activityLogging}
              onCheckedChange={(activityLogging) => updateConfig({ activityLogging })}
            />
          </div>
          
          {/* No Print */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal">
                Disable Print
              </Label>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded",
              config.screenshotResistant 
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            )}>
              {config.screenshotResistant ? '✓ Active' : 'Needs Screenshot Resist'}
            </span>
          </div>

          {/* DevTools Blocking */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal">
                Block DevTools
              </Label>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded",
              config.screenshotResistant 
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            )}>
              {config.screenshotResistant ? '✓ Active' : 'Needs Screenshot Resist'}
            </span>
          </div>

          {/* Right-Click Blocking */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer2 className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal">
                Block Right-Click
              </Label>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded",
              (config.noCopy || config.noDownload)
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            )}>
              {(config.noCopy || config.noDownload) ? '✓ Active' : 'Needs Copy/Download Block'}
            </span>
          </div>

          {/* Drag Prevention */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal">
                Prevent Drag
              </Label>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded",
              config.noDownload
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            )}>
              {config.noDownload ? '✓ Active' : 'Needs Download Block'}
            </span>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal">
                Block Shortcuts
              </Label>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded",
              (config.noCopy || config.noDownload || config.screenshotResistant)
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            )}>
              {(config.noCopy || config.noDownload || config.screenshotResistant) ? '✓ Active' : 'Enable any protection'}
            </span>
          </div>
          
          <Separator />
          
          <div className="text-xs space-y-2">
            <div className="flex flex-wrap gap-1">
              {securityFeatures.map(f => (
                <span 
                  key={f.key}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    f.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {f.enabled ? '✓' : '○'} {f.label}
                </span>
              ))}
            </div>
            <p className="text-muted-foreground">
              Protection Level: {securityLevel}/5 features enabled
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              ⚠️ Client-side protection. Enable all features and use server-side validation for complete security.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
