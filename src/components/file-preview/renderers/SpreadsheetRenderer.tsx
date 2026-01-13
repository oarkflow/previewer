import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  ChevronDown, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { PreviewContext } from '@/types/file-preview';
import { cn } from '@/lib/utils';

interface SpreadsheetRendererProps {
  ctx: PreviewContext;
}

interface SheetData {
  name: string;
  data: (string | number | null)[][];
  headers: string[];
}

type SortDirection = 'asc' | 'desc' | null;

export const SpreadsheetRenderer: React.FC<SpreadsheetRendererProps> = ({ ctx }) => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSpreadsheet = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const blob = ctx.file.data instanceof Blob 
          ? ctx.file.data 
          : new Blob([ctx.file.data]);
        
        const arrayBuffer = await blob.arrayBuffer();
        
        // Check if it's a CSV/TSV file
        const ext = ctx.file.extension.toLowerCase();
        if (ext === 'csv' || ext === 'tsv') {
          const text = await blob.text();
          const delimiter = ext === 'tsv' ? '\t' : ',';
          const lines = text.split('\n').filter(line => line.trim());
          const data = lines.map(line => {
            // Simple CSV parsing (handles basic cases)
            const result: (string | number | null)[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          });
          
          const headers = data[0]?.map(h => String(h)) || [];
          setSheets([{ name: 'Sheet1', data: data.slice(1), headers }]);
        } else {
          // Excel file
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          const loadedSheets: SheetData[] = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { 
              header: 1,
              defval: null
            });
            
            const headers = (jsonData[0] || []).map(h => String(h ?? ''));
            const data = jsonData.slice(1);
            
            return { name: sheetName, data, headers };
          });
          
          setSheets(loadedSheets);
        }
      } catch (err) {
        console.error('Failed to load spreadsheet:', err);
        setError('Failed to parse spreadsheet file');
      }
      setIsLoading(false);
    };
    
    loadSpreadsheet();
  }, [ctx.file.data, ctx.file.extension]);

  const currentSheet = sheets[activeSheet];
  
  const filteredAndSortedData = useMemo(() => {
    if (!currentSheet) return [];
    
    let data = [...currentSheet.data];
    
    // Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(row => 
        row.some(cell => String(cell ?? '').toLowerCase().includes(query))
      );
    }
    
    // Sort
    if (sortColumn !== null && sortDirection) {
      data.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return data;
  }, [currentSheet, searchQuery, sortColumn, sortDirection]);

  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-preview-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-preview-bg">
        <div className="text-center">
          <FileSpreadsheet className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentSheet) {
    return (
      <div className="flex-1 flex items-center justify-center bg-preview-bg">
        <p className="text-muted-foreground">No data to display</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-preview-bg overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-secondary/30 flex-wrap">
        {sheets.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                {currentSheet.name}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {sheets.map((sheet, index) => (
                <DropdownMenuItem 
                  key={sheet.name}
                  onClick={() => setActiveSheet(index)}
                  className={cn(index === activeSheet && 'bg-secondary')}
                >
                  {sheet.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-background/50"
          />
        </div>

        <div className="text-xs text-muted-foreground ml-auto">
          {filteredAndSortedData.length} rows × {currentSheet.headers.length} columns
        </div>
      </div>

      {/* Table */}
      <div ref={parentRef} className="flex-1 overflow-auto scrollbar-thin">
        <table className="data-table min-w-full">
          <thead>
            <tr>
              <th className="w-12 text-center text-muted-foreground font-normal">#</th>
              {currentSheet.headers.map((header, index) => (
                <th 
                  key={index}
                  onClick={() => handleSort(index)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate">{header || `Column ${index + 1}`}</span>
                    {sortColumn === index ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-primary flex-shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              <td colSpan={currentSheet.headers.length + 1} className="p-0 relative">
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = filteredAndSortedData[virtualRow.index];
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
                      className="flex hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-12 flex-shrink-0 px-3 flex items-center justify-center text-muted-foreground text-sm border-r border-border/50">
                        {virtualRow.index + 1}
                      </div>
                      {currentSheet.headers.map((_, colIndex) => (
                        <div
                          key={colIndex}
                          className="flex-1 min-w-[100px] px-4 flex items-center border-r border-border/30 text-sm truncate"
                        >
                          {row[colIndex] ?? ''}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
