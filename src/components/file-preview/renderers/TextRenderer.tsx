import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, WrapText, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PreviewContext } from '@/types/file-preview';
import { cn } from '@/lib/utils';

interface TextRendererProps {
  ctx: PreviewContext;
  isCode?: boolean;
}

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  cs: 'csharp',
  php: 'php',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  json: 'json',
  xml: 'markup',
  html: 'markup',
  css: 'css',
  scss: 'css',
  less: 'css',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
};

export const TextRenderer: React.FC<TextRendererProps> = ({ ctx, isCode = false }) => {
  const [content, setContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const parentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const blob = ctx.file.data instanceof Blob 
          ? ctx.file.data 
          : new Blob([ctx.file.data]);
        const text = await blob.text();
        setContent(text);
      } catch (error) {
        console.error('Failed to load text content:', error);
        setContent('Error loading file content');
      }
      setIsLoading(false);
    };
    loadContent();
  }, [ctx.file.data]);

  const lines = useMemo(() => content.split('\n'), [content]);
  
  const language = useMemo(() => {
    const ext = ctx.file.extension.toLowerCase();
    return LANGUAGE_MAP[ext] || 'plain';
  }, [ctx.file.extension]);

  const highlightedLines = useMemo(() => {
    if (!isCode || language === 'plain') {
      return lines;
    }
    try {
      const grammar = Prism.languages[language];
      if (!grammar) return lines;
      return lines.map(line => {
        if (!line.trim()) return '';
        return Prism.highlight(line, grammar, language);
      });
    } catch {
      return lines;
    }
  }, [lines, language, isCode]);

  const filteredLineIndices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.toLowerCase().includes(query))
      .map(({ index }) => index);
  }, [lines, searchQuery]);

  const rowVirtualizer = useVirtualizer({
    count: filteredLineIndices?.length ?? lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  const getLineIndex = useCallback((virtualIndex: number) => {
    return filteredLineIndices ? filteredLineIndices[virtualIndex] : virtualIndex;
  }, [filteredLineIndices]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-code-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-code-bg overflow-hidden"
    >
      {/* Secondary toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/30">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-background/50"
          />
        </div>
        
        {searchQuery && filteredLineIndices && (
          <span className="text-xs text-muted-foreground">
            {filteredLineIndices.length} matches
          </span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={cn('h-8 w-8', showLineNumbers && 'bg-secondary')}
          >
            <Hash className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWordWrap(!wordWrap)}
            className={cn('h-8 w-8', wordWrap && 'bg-secondary')}
          >
            <WrapText className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground border-l border-border pl-3 ml-2">
          {lines.length} lines • {language.toUpperCase()}
        </div>
      </div>

      {/* Code content */}
      <div 
        ref={parentRef} 
        className="flex-1 overflow-auto scrollbar-thin font-mono text-sm"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const lineIndex = getLineIndex(virtualRow.index);
            const line = highlightedLines[lineIndex];
            const isMatch = searchQuery && filteredLineIndices?.includes(lineIndex);

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  'flex hover:bg-white/5 transition-colors',
                  isMatch && 'bg-primary/10'
                )}
              >
                {showLineNumbers && (
                  <span className="w-12 flex-shrink-0 px-3 text-right text-code-line-number select-none border-r border-border/50">
                    {lineIndex + 1}
                  </span>
                )}
                <code
                  className={cn(
                    'flex-1 px-4 text-foreground',
                    wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                  )}
                  dangerouslySetInnerHTML={
                    isCode && language !== 'plain' 
                      ? { __html: line || '&nbsp;' }
                      : undefined
                  }
                >
                  {isCode && language !== 'plain' ? undefined : (line || '\u00A0')}
                </code>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
