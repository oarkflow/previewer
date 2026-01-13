import React, { useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { SecurityConfig, WatermarkConfig } from '@/types/security';
import { ShieldAlert, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
export const SecurityOverlay: React.FC<SecurityOverlayProps> = ({
  config,
  className,
  children,
  devToolsBlocked = false,
  isBlurred = false,
  onViolationAlert,
}) => {
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');

  // Generate watermark pattern
  const watermarkStyle = useMemo(() => {
    if (!config.watermark || !config.watermarkConfig) return undefined;
    
    const { text, fontSize, opacity, rotation, color, spacing } = config.watermarkConfig;
    
    // Create a canvas-based watermark pattern
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return undefined;
    
    canvas.width = spacing * 2;
    canvas.height = spacing;
    
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.save();
    ctx.translate(spacing, spacing / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    
    return {
      backgroundImage: `url(${canvas.toDataURL()})`,
      backgroundRepeat: 'repeat',
    };
  }, [config.watermark, config.watermarkConfig]);

  // Show violation alert
  useEffect(() => {
    if (onViolationAlert) {
      const handler = (message: string) => {
        setViolationMessage(message);
        setShowViolationAlert(true);
        setTimeout(() => setShowViolationAlert(false), 3000);
      };
      // This would be called from parent
    }
  }, [onViolationAlert]);

  // Inject global security styles
  useEffect(() => {
    const styleId = 'security-styles-enhanced';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
      /* ============ SECURITY BLUR EFFECT ============ */
      .security-blur .security-content {
        filter: blur(30px) !important;
        opacity: 0.1 !important;
        transition: filter 0.05s, opacity 0.05s;
        pointer-events: none !important;
      }
      
      .security-blur .security-content * {
        visibility: hidden !important;
      }
      
      /* ============ DEVTOOLS BLOCKED OVERLAY ============ */
      .devtools-blocked::after {
        content: '⚠️ Developer Tools Detected - Content Protected';
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: hsl(var(--background));
        font-size: 1.5rem;
        color: hsl(var(--destructive));
        z-index: 99999;
        font-weight: bold;
      }
      
      /* ============ ANTI-SELECTION ============ */
      .no-select,
      .no-select * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      .no-select::selection,
      .no-select *::selection {
        background: transparent !important;
        color: inherit !important;
      }
      
      .no-select::-moz-selection,
      .no-select *::-moz-selection {
        background: transparent !important;
        color: inherit !important;
      }
      
      /* ============ DRAG PREVENTION ============ */
      .no-drag,
      .no-drag * {
        -webkit-user-drag: none !important;
        user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
      }
      
      .no-drag img,
      .no-drag video,
      .no-drag canvas,
      .no-drag svg,
      .no-drag a {
        pointer-events: none !important;
        draggable: false !important;
      }
      
      /* ============ PRINT PROTECTION ============ */
      @media print {
        .print-protected,
        .print-protected * {
          display: none !important;
          visibility: hidden !important;
        }
        
        body::before {
          content: '🔒 This document is protected and cannot be printed.';
          display: block !important;
          position: fixed;
          inset: 0;
          background: white;
          color: black;
          font-size: 2rem;
          text-align: center;
          padding: 100px;
          z-index: 999999;
        }
        
        body.print-blocked * {
          display: none !important;
        }
      }
      
      /* ============ SCREENSHOT FLASH ============ */
      .security-flash {
        animation: security-flash-anim 0.1s ease-in-out;
      }
      
      @keyframes security-flash-anim {
        0% { filter: invert(0); }
        50% { filter: invert(1) brightness(10); }
        100% { filter: invert(0); }
      }
      
      /* ============ CAPTURE DISRUPTION OVERLAY ============ */
      .capture-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 9998;
        background: transparent;
        mix-blend-mode: difference;
      }
      
      .capture-overlay::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 1px,
          rgba(255,255,255,0.003) 1px,
          rgba(255,255,255,0.003) 2px
        );
        animation: capture-shift 0.05s linear infinite;
      }
      
      .capture-overlay::after {
        content: '';
        position: absolute;
        inset: 0;
        background: 
          radial-gradient(circle at 20% 20%, rgba(255,0,0,0.002) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(0,255,0,0.002) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(0,0,255,0.002) 0%, transparent 50%);
        animation: capture-color-shift 0.1s linear infinite alternate;
      }
      
      @keyframes capture-shift {
        0% { transform: translateY(0); }
        100% { transform: translateY(2px); }
      }
      
      @keyframes capture-color-shift {
        0% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      /* ============ CONTEXT MENU DISABLED INDICATOR ============ */
      .context-disabled {
        cursor: default !important;
      }
      
      /* ============ INVISIBLE TEXT SCRAMBLE ============ */
      .text-scramble::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(128,128,128,0.001) 10px,
          rgba(128,128,128,0.001) 20px
        );
        pointer-events: none;
        mix-blend-mode: overlay;
      }
    `;
    
    return () => {
      // Don't remove on unmount as other components may use it
    };
  }, []);

  const isProtected = config.noCopy || config.noDownload || config.screenshotResistant;

  return (
    <div
      className={cn(
        'security-content relative',
        config.noCopy && 'no-select no-drag context-disabled',
        config.noDownload && 'no-drag',
        config.screenshotResistant && 'screenshot-resistant print-protected text-scramble',
        className
      )}
      onContextMenu={(e) => {
        if (config.noCopy || config.noDownload) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDragStart={(e) => {
        if (config.noDownload) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onCopy={(e) => {
        if (config.noCopy) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
      
      {/* Watermark overlay */}
      {config.watermark && watermarkStyle && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={watermarkStyle}
          aria-hidden="true"
        />
      )}
      
      {/* Screenshot capture disruption overlay */}
      {config.screenshotResistant && (
        <div className="capture-overlay" aria-hidden="true" />
      )}

      {/* Protection status indicator */}
      {isProtected && (
        <div className="absolute top-2 left-2 z-[60] flex items-center gap-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-border text-xs"
          >
            <Lock className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">Protected</span>
          </motion.div>
        </div>
      )}

      {/* DevTools blocked overlay */}
      <AnimatePresence>
        {devToolsBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          >
            <ShieldAlert className="w-24 h-24 text-destructive mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-destructive mb-2">Developer Tools Detected</h2>
            <p className="text-muted-foreground text-center max-w-md">
              This content is protected. Please close Developer Tools to continue viewing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blur overlay when window loses focus */}
      <AnimatePresence>
        {isBlurred && !devToolsBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9998] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
          >
            <EyeOff className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">Content Hidden</h3>
            <p className="text-muted-foreground/70 text-sm">
              Click this window to resume viewing
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Violation alert toast */}
      <AnimatePresence>
        {showViolationAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground shadow-lg"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="font-medium">{violationMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
