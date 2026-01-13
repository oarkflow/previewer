# Universal File Viewer SDK

A powerful, flexible React SDK for viewing various file types including PDFs, images, spreadsheets, documents, audio, video, and more.

## Features

- 📄 **Multiple File Types**: Support for PDFs, images, spreadsheets (Excel, CSV, ODS), documents (Word, RTF), presentations (PowerPoint), audio, video, and text files
- 🔗 **URL Support**: Preview files directly from URLs without downloading
- 🎨 **Customizable UI**: Built with Tailwind CSS and Radix UI components
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔍 **Advanced Features**: Search, zoom, rotation, and file history
- 🎯 **TypeScript Support**: Full TypeScript definitions included
- 🪝 **React Hooks**: Custom hooks for file management

## Installation

```bash
npm install universal-file-viewer
```

or

```bash
yarn add universal-file-viewer
```

## Peer Dependencies

Make sure to install the required peer dependencies:

```bash
npm install react react-dom @tanstack/react-virtual framer-motion lucide-react prismjs xlsx mammoth react-pdf react-dropzone
```

## Quick Start

```tsx
import React, { useState } from 'react';
import { FileDropZone, FilePreviewer, FileMeta } from 'universal-file-viewer';
import 'universal-file-viewer/styles'; // Import styles

function App() {
  const [selectedFile, setSelectedFile] = useState<FileMeta | null>(null);

  const handleFileSelect = (file: File) => {
    const fileMeta: FileMeta = {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: file.name.split('.').pop() || '',
      lastModified: file.lastModified,
      data: file,
    };
    setSelectedFile(fileMeta);
  };

  return (
    <div className="w-full h-screen">
      {!selectedFile ? (
        <FileDropZone onFileSelect={handleFileSelect} />
      ) : (
        <FilePreviewer file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
}

export default App;
```

## Components

### FileDropZone

A drag-and-drop file input component with URL support.

```tsx
import { FileDropZone } from 'universal-file-viewer';

<FileDropZone
  onFileSelect={(file: File) => console.log('File selected:', file)}
  onUrlSelect={(url: string) => console.log('URL entered:', url)}
  acceptedTypes={['image/*', 'application/pdf']}
  maxSize={10 * 1024 * 1024} // 10MB
/>
```

### FilePreviewer

The main file preview component that renders different file types.

```tsx
import { FilePreviewer, FileMeta } from 'universal-file-viewer';

const fileMeta: FileMeta = {
  name: 'document.pdf',
  size: 1024000,
  type: 'application/pdf',
  extension: 'pdf',
  data: fileBlob,
};

<FilePreviewer
  file={fileMeta}
  onClose={() => console.log('Close preview')}
  initialZoom={1}
  showToolbar={true}
/>
```

### FileHistory

Component for managing and displaying file history.

```tsx
import { FileHistory, useFileHistory } from 'universal-file-viewer';

function FileHistoryComponent() {
  const { history, removeFromHistory, clearHistory } = useFileHistory();

  return (
    <FileHistory
      history={history}
      onSelectFile={(file) => console.log('Selected from history:', file)}
      onRemoveFile={(id) => removeFromHistory(id)}
      onClearHistory={clearHistory}
    />
  );
}
```

## URL Preview

Preview files directly from URLs:

```tsx
import { FileDropZone } from 'universal-file-viewer';

<FileDropZone
  onUrlSelect={async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const fileMeta: FileMeta = {
        name: url.split('/').pop() || 'file',
        size: blob.size,
        type: blob.type,
        extension: url.split('.').pop() || '',
        data: blob,
        url: url, // Optional: store the original URL
      };

      // Use fileMeta with FilePreviewer
    } catch (error) {
      console.error('Failed to fetch URL:', error);
    }
  }}
/>
```

## Supported File Types

| Category | Extensions | MIME Types |
|----------|------------|------------|
| PDF | pdf | application/pdf |
| Images | png, jpg, jpeg, gif, webp, svg, bmp, tiff, ico | image/* |
| Spreadsheets | xls, xlsx, ods, csv, tsv | application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv, etc. |
| Documents | doc, docx, odt, rtf | application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, etc. |
| Presentations | ppt, pptx, odp | application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, etc. |
| Audio | mp3, wav, ogg, aac, flac, m4a | audio/* |
| Video | mp4, webm, mkv, avi, mov | video/* |
| Text/Code | txt, json, xml, html, css, js, ts, py, java, etc. | text/*, application/json, etc. |

## API Reference

### Types

```typescript
interface FileMeta {
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified?: number;
  data: ArrayBuffer | Blob | File;
  url?: string; // For URL-based files
}

interface PreviewContext {
  file: FileMeta;
  zoom: number;
  rotation: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (total: number) => void;
}

type FileCategory =
  | 'pdf' | 'document' | 'spreadsheet' | 'presentation'
  | 'image' | 'audio' | 'video' | 'text' | 'code' | 'data' | 'binary';
```

### Utility Functions

```typescript
import { getFileCategory, getFileExtension, formatFileSize } from 'universal-file-viewer';

// Get file category from extension
const category = getFileCategory('pdf'); // 'pdf'

// Extract extension from filename
const ext = getFileExtension('document.pdf'); // 'pdf'

// Format file size
const size = formatFileSize(1024000); // '1.00 MB'
```

## Styling

The SDK uses Tailwind CSS for styling. Make sure your project has Tailwind CSS configured. The components use CSS custom properties for theming.

You can customize the appearance by overriding CSS variables:

```css
:root {
  --primary: 220 70% 50%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... other variables */
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Publishing

To publish the SDK to npm:

```bash
npm publish
```

Make sure you have:
- Updated the version in `package.json`
- Built the library with `npm run build`
- Logged in to npm (`npm login`)

## Development

### Building

```bash
npm run build
```

This will:
1. Build the library with Vite (ES + UMD formats)
2. Generate TypeScript declaration files
3. Output to the `dist/` directory

### Development Server

```bash
npm run dev
```

Starts the development server for testing the app version.

### Type Checking

```bash
npx tsc --noEmit
```

## Architecture

The SDK is built with:
- **Vite**: Fast build tool with library mode
- **React**: Component library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible UI primitives

### File Structure

```
src/
├── components/
│   ├── file-preview/     # Core file viewer components
│   └── ui/              # Reusable UI components
├── types/               # TypeScript definitions
├── hooks/               # Custom React hooks
└── index.ts             # Main SDK exports
```

### Build Output

```
dist/
├── universal-file-viewer.es.js    # ES module
├── universal-file-viewer.umd.js   # UMD module
├── index.d.ts                     # TypeScript declarations
└── style.css                      # Compiled styles
```
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
