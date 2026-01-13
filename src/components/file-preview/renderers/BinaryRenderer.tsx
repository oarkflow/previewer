import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { File, Download, Hash, Clock, HardDrive, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewContext, formatFileSize } from '@/types/file-preview';

interface BinaryRendererProps {
    ctx: PreviewContext;
}

export const BinaryRenderer: React.FC<BinaryRendererProps> = ({ ctx }) => {
    const [hexPreview, setHexPreview] = useState<string[]>([]);
    const [asciiPreview, setAsciiPreview] = useState<string[]>([]);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadBinaryPreview = async () => {
            setIsLoading(true);
            setTextContent(null); // Reset text content
            try {
                const blob = ctx.file.data instanceof Blob
                    ? ctx.file.data
                    : new Blob([ctx.file.data]);
                const arrayBuffer = await blob.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);

                // Check if content is likely text
                const sampleSize = Math.min(1024, bytes.length);
                const isText = Array.from(bytes.slice(0, sampleSize)).every(b =>
                    b === 9 || b === 10 || b === 13 || b === 32 || (b >= 33 && b <= 126) || b >= 128
                );

                if (isText && bytes.length < 1024 * 1024) { // Only for reasonably sized files
                    try {
                        const text = new TextDecoder('utf-8').decode(arrayBuffer);
                        setTextContent(text);
                        setIsLoading(false);
                        return; // Exit early if text was detected
                    } catch (error) {
                        console.warn('Failed to decode as text:', error);
                        // Fall back to hex view
                    }
                }

                // Generate hex preview if not text
                const hexLines: string[] = [];
                const asciiLines: string[] = [];

                for (let i = 0; i < Math.min(bytes.length, 512); i += 16) {
                    const chunk = bytes.slice(i, i + 16);
                    const hex = Array.from(chunk)
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join(' ');
                    const ascii = Array.from(chunk)
                        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
                        .join('');

                    hexLines.push(hex);
                    asciiLines.push(ascii);
                }

                setHexPreview(hexLines);
                setAsciiPreview(asciiLines);
            } catch (error) {
                console.error('Failed to load binary preview:', error);
            }
            setIsLoading(false);
        };

        loadBinaryPreview();
    }, [ctx.file.data]);

    const fileInfo = [
        { icon: File, label: 'Filename', value: ctx.file.name },
        { icon: HardDrive, label: 'Size', value: formatFileSize(ctx.file.size) },
        { icon: Hash, label: 'Type', value: ctx.file.type || 'Unknown' },
        {
            icon: Clock, label: 'Modified', value: ctx.file.lastModified
                ? new Date(ctx.file.lastModified).toLocaleDateString()
                : 'Unknown'
        },
    ];

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-preview-bg">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">Analyzing file...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center bg-preview-bg p-6"
        >
            <div className="w-full max-w-4xl space-y-6">
                {/* Content display */}
                {textContent ? (
                    <div className="glass rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">Text Content</h3>
                            <span className="text-xs text-muted-foreground">Detected as text</span>
                        </div>
                        <div className="bg-code-bg rounded-lg p-4 overflow-auto max-h-96">
                            <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                                {textContent}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Warning banner */}
                        <div className="glass rounded-lg p-4 flex items-start gap-3 border-warning/30 border">
                            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-foreground">Binary File</h4>
                                <p className="text-sm text-muted-foreground">
                                    This file type cannot be previewed directly. You can view the hex dump below or download the file.
                                </p>
                            </div>
                        </div>

                        {/* Hex preview */}
                        <div className="glass rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Hex Preview</h3>
                                <span className="text-xs text-muted-foreground">First 512 bytes</span>
                            </div>
                            <div className="bg-code-bg rounded-lg p-4 overflow-x-auto font-mono text-xs">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-muted-foreground">
                                            <th className="text-left pr-4 pb-2">Offset</th>
                                            <th className="text-left pr-4 pb-2">Hex</th>
                                            <th className="text-left pb-2">ASCII</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hexPreview.map((hex, i) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="text-code-line-number pr-4 py-0.5">
                                                    {(i * 16).toString(16).padStart(8, '0')}
                                                </td>
                                                <td className="text-foreground pr-4 py-0.5 whitespace-nowrap">
                                                    {hex}
                                                </td>
                                                <td className="text-code-string py-0.5">
                                                    {asciiPreview[i]}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* File metadata */}
                <div className="glass rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">File Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {fileInfo.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-sm font-medium text-foreground truncate max-w-[150px]">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
