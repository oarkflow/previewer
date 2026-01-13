export interface FileMeta {
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified?: number;
  data: ArrayBuffer | Blob | File;
    url?: string; // Optional URL for remote files
}

export interface SearchMatch {
  pageIndex: number;
  matchIndex: number;
  text: string;
}

export interface PreviewContext {
  file: FileMeta;
  zoom: number;
  rotation: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  searchMatches: SearchMatch[];
  currentMatchIndex: number;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
  onSearchMatchesChange: (matches: SearchMatch[]) => void;
  onCurrentMatchChange: (index: number) => void;
}

export type FileCategory =
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'audio'
  | 'video'
  | 'text'
  | 'code'
  | 'data'
  | 'binary';

export interface FileRenderer {
  category: FileCategory;
  extensions: string[];
  mimeTypes: string[];
  canHandle: (file: FileMeta) => boolean;
  render: (ctx: PreviewContext) => React.ReactNode;
}

export const FILE_CATEGORIES: Record<FileCategory, { label: string; icon: string; color: string }> = {
  pdf: { label: 'PDF Document', icon: 'FileText', color: 'destructive' },
  document: { label: 'Document', icon: 'FileText', color: 'primary' },
  spreadsheet: { label: 'Spreadsheet', icon: 'Table', color: 'success' },
  presentation: { label: 'Presentation', icon: 'Presentation', color: 'warning' },
  image: { label: 'Image', icon: 'Image', color: 'accent' },
  audio: { label: 'Audio', icon: 'Music', color: 'primary' },
  video: { label: 'Video', icon: 'Video', color: 'accent' },
  text: { label: 'Text File', icon: 'FileText', color: 'muted' },
  code: { label: 'Source Code', icon: 'Code', color: 'primary' },
  data: { label: 'Data File', icon: 'Database', color: 'success' },
  binary: { label: 'Binary File', icon: 'File', color: 'muted' },
};

export const EXTENSION_MAP: Record<string, FileCategory> = {
  // PDF
  pdf: 'pdf',

  // Documents
  doc: 'document',
  docx: 'document',
  odt: 'document',
  rtf: 'document',

  // Spreadsheets
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  ods: 'spreadsheet',
  csv: 'spreadsheet',
  tsv: 'spreadsheet',

  // Presentations
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',

  // Images
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  tiff: 'image',
  ico: 'image',

  // Audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  aac: 'audio',
  flac: 'audio',
  m4a: 'audio',

  // Video
  mp4: 'video',
  webm: 'video',
  mkv: 'video',
  avi: 'video',
  mov: 'video',

  // Text
  txt: 'text',
  log: 'text',

  // Code
  js: 'code',
  jsx: 'code',
  ts: 'code',
  tsx: 'code',
  html: 'code',
  css: 'code',
  scss: 'code',
  less: 'code',
  json: 'code',
  xml: 'code',
  yaml: 'code',
  yml: 'code',
  md: 'code',
  py: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  h: 'code',
  go: 'code',
  rs: 'code',
  rb: 'code',
  php: 'code',
  sql: 'code',
  sh: 'code',
  bash: 'code',

  // Data
  // json, xml, yaml already in code
};

export function getFileCategory(extension: string, mimeType?: string): FileCategory {
  const ext = extension.toLowerCase().replace('.', '');
  return EXTENSION_MAP[ext] || 'binary';
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
