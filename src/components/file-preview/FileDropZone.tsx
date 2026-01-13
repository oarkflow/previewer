import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, FileText, Image, Music, Video, Code, Table, Link, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
    onUrlSelect: (url: string) => void;
  className?: string;
}

const FileTypeIcon = ({ type, className }: { type: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    document: <FileText className={className} />,
    image: <Image className={className} />,
    audio: <Music className={className} />,
    video: <Video className={className} />,
    code: <Code className={className} />,
    spreadsheet: <Table className={className} />,
    default: <File className={className} />,
  };
  return icons[type] || icons.default;
};

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileSelect, onUrlSelect, className }) => {
    const [isUrlMode, setIsUrlMode] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    multiple: false,
      disabled: isUrlMode,
  });

    const handleUrlSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        setIsLoadingUrl(true);
        try {
            onUrlSelect(urlInput.trim());
        } catch (error) {
            console.error('Error handling URL:', error);
        } finally {
            setIsLoadingUrl(false);
        }
    }, [urlInput, onUrlSelect]);

  const supportedFormats = [
    { label: 'Documents', types: 'PDF, Word, Excel, PowerPoint', icon: 'document' },
    { label: 'Images', types: 'PNG, JPG, GIF, SVG, WebP', icon: 'image' },
    { label: 'Media', types: 'MP3, WAV, MP4, WebM', icon: 'audio' },
    { label: 'Code', types: 'JS, TS, Python, HTML, CSS', icon: 'code' },
    { label: 'Data', types: 'CSV, JSON, XML, YAML', icon: 'spreadsheet' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('w-full max-w-3xl mx-auto', className)}
    >
          {/* Mode Toggle */}
          <div className="flex justify-center mb-6">
              <div className="flex rounded-lg bg-secondary p-1">
                  <Button
                      variant={isUrlMode ? "ghost" : "default"}
                      size="sm"
                      onClick={() => setIsUrlMode(false)}
                      className="rounded-md"
                  >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                  </Button>
                  <Button
                      variant={isUrlMode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setIsUrlMode(true)}
                      className="rounded-md"
                  >
                      <Link className="w-4 h-4 mr-2" />
                      From URL
                  </Button>
              </div>
          </div>

          <AnimatePresence mode="wait">
              {isUrlMode ? (
                  <motion.div
                      key="url-mode"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                  >
                      <form onSubmit={handleUrlSubmit} className="space-y-4">
                          <div className="flex gap-2">
                              <Input
                                  type="url"
                                  placeholder="Enter file URL (e.g., https://example.com/file.pdf)"
                                  value={urlInput}
                                  onChange={(e) => setUrlInput(e.target.value)}
                                  className="flex-1"
                                  disabled={isLoadingUrl}
                              />
                              <Button type="submit" disabled={!urlInput.trim() || isLoadingUrl}>
                                  {isLoadingUrl ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                      <Link className="w-4 h-4" />
                                  )}
                              </Button>
                          </div>
                      </form>

                      <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                              Enter a direct link to a file. Some URLs may be blocked due to CORS policies.
                          </p>
                      </div>
                  </motion.div>
              ) : (
                  <motion.div
                      key="file-mode"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                  >
                          <div
                              {...getRootProps()}
                              className={cn(
                                  'file-drop-zone cursor-pointer group',
                                  isDragActive && 'active',
                                  isDragReject && 'border-destructive'
                              )}
                          >
                              <input {...getInputProps()} />

                              <AnimatePresence mode="wait">
                                  {isDragActive ? (
                                      <motion.div
                                          key="active"
                                          initial={{ scale: 0.8, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0.8, opacity: 0 }}
                                          className="flex flex-col items-center"
                                      >
                                          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse-glow">
                                              <Upload className="w-10 h-10 text-primary" />
                                          </div>
                                          <p className="text-xl font-semibold text-foreground">
                                              {isDragAccept ? 'Drop to preview' : 'Release to upload'}
                                          </p>
                                      </motion.div>
                                  ) : (
                                      <motion.div
                                          key="idle"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="flex flex-col items-center"
                                      >
                                          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                                              <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                          </div>

                                          <h3 className="text-2xl font-semibold text-foreground mb-2">
                                              Drop your file here
                                          </h3>
                                          <p className="text-muted-foreground mb-8">
                                              or <span className="text-primary hover:underline">browse</span> to choose a file
                                          </p>

                                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                                              {supportedFormats.map((format) => (
                                                  <motion.div
                                                      key={format.label}
                                                      whileHover={{ scale: 1.05 }}
                                                      className="flex flex-col items-center p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                                  >
                                                      <FileTypeIcon
                                                          type={format.icon}
                                                          className="w-6 h-6 text-primary mb-2"
                                                      />
                                                      <span className="text-xs font-medium text-foreground">{format.label}</span>
                                                      <span className="text-xs text-muted-foreground text-center mt-1">{format.types}</span>
                                                  </motion.div>
                                              ))}
                                          </div>
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </div>
                  </motion.div>
              )}
          </AnimatePresence>

      <p className="text-center text-sm text-muted-foreground mt-4">
        All previews are rendered client-side • No data leaves your browser
      </p>
    </motion.div>
  );
};
