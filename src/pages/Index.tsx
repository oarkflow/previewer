import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles, Shield, Zap, Globe, Code } from 'lucide-react';
import { FileDropZone, FilePreviewer } from '@/components/file-preview';
import { FileHistory } from '@/components/file-preview/FileHistory';
import { FileMeta, getFileExtension } from '@/types/file-preview';
import { useFileHistory } from '@/hooks/use-file-history';

const Index = () => {
	const [selectedFile, setSelectedFile] = useState<FileMeta | null>(null);
	const [securityConfig, setSecurityConfig] = useState<any>(null);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const autoLoadedOnce = useRef(false);

	const {
		history,
		addToHistory,
		removeFromHistory,
		clearHistory,
		getFileFromHistory,
		togglePin,
		reorderHistory
	} = useFileHistory();

	const handleFileSelect = useCallback((file: File) => {
		const extension = getFileExtension(file.name);
		const fileMeta: FileMeta = {
			name: file.name,
			size: file.size,
			type: file.type,
			extension,
			lastModified: file.lastModified,
			data: file,
		};
		setSelectedFile(fileMeta);
		addToHistory(fileMeta);
	}, [addToHistory]);

	// Auto-load embedded file from window.__EMBEDDED_FILE__
	useEffect(() => {
		if (autoLoadedOnce.current) return;

		// Check if file is embedded by the Go preview server
		const embeddedFile = (window as any).__EMBEDDED_FILE__;
		if (!embeddedFile) return;

		autoLoadedOnce.current = true;

		try {
			// Decode base64 data
			const binaryString = atob(embeddedFile.data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: embeddedFile.type });
			const file = new File([blob], embeddedFile.name, { type: embeddedFile.type });

			// Extract security config from embedded data
			const embedSecConfig = (window as any).__SECURITY_CONFIG__;
			if (embedSecConfig) {
				setSecurityConfig(embedSecConfig);
			}

			handleFileSelect(file);
		} catch (err) {
			console.error('Failed to load embedded file:', err);
		}
	}, [handleFileSelect]);

	const handleSelectFromHistory = useCallback((id: string) => {
		const file = getFileFromHistory(id);
		if (file) {
			setSelectedFile(file);
		}
	}, [getFileFromHistory]);

	const handleUrlSelect = useCallback(async (url: string) => {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
			}

			const contentLength = response.headers.get('content-length');
			const contentType = response.headers.get('content-type') || 'application/octet-stream';
			const contentDisposition = response.headers.get('content-disposition');

			// Get filename from various sources
			let filename = 'downloaded-file';

			// Try content-disposition header first
			if (contentDisposition) {
				const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
				if (filenameMatch && filenameMatch[1]) {
					filename = filenameMatch[1].replace(/['"]/g, '');
				}
			}

			// If no filename from headers, try URL
			if (filename === 'downloaded-file') {
				const urlObj = new URL(url);
				const pathname = urlObj.pathname;
				const urlFilename = pathname.split('/').pop();
				if (urlFilename && urlFilename.includes('.')) {
					filename = urlFilename;
				} else {
					// Infer extension from content-type
					const mimeToExt: Record<string, string> = {
						'application/json': 'json',
						'application/xml': 'xml',
						'text/xml': 'xml',
						'application/yaml': 'yaml',
						'text/yaml': 'yaml',
						'text/plain': 'txt',
						'text/html': 'html',
						'text/css': 'css',
						'application/javascript': 'js',
						'text/javascript': 'js',
						'application/pdf': 'pdf',
						'image/png': 'png',
						'image/jpeg': 'jpg',
						'image/gif': 'gif',
						'image/webp': 'webp',
						'image/svg+xml': 'svg',
						'audio/mpeg': 'mp3',
						'audio/wav': 'wav',
						'video/mp4': 'mp4',
						'video/webm': 'webm',
						// Spreadsheet MIME types
						'application/vnd.ms-excel': 'xls',
						'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
						'application/vnd.oasis.opendocument.spreadsheet': 'ods',
						'text/csv': 'csv',
						'text/tab-separated-values': 'tsv',
						'application/csv': 'csv',
						'application/tsv': 'tsv',
						// Document MIME types
						'application/msword': 'doc',
						'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
						'application/vnd.oasis.opendocument.text': 'odt',
						'application/rtf': 'rtf',
						'text/rtf': 'rtf',
						// Presentation MIME types
						'application/vnd.ms-powerpoint': 'ppt',
						'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
						'application/vnd.oasis.opendocument.presentation': 'odp',
						// Other text types
						'text/markdown': 'md',
						'application/x-yaml': 'yaml',
						'application/json5': 'json',
					};
					const ext = mimeToExt[contentType.split(';')[0]] || 'bin';
					filename = `file.${ext}`;
				}
			}

			const arrayBuffer = await response.arrayBuffer();

			// Try to detect if content is text
			let detectedExtension = getFileExtension(filename);
			if (!detectedExtension || detectedExtension === 'bin') {
				// Check if content looks like text
				const bytes = new Uint8Array(arrayBuffer.slice(0, 512));
				const isText = bytes.every(b => b === 9 || b === 10 || b === 13 || (b >= 32 && b <= 126));

				if (isText) {
					const text = new TextDecoder().decode(arrayBuffer.slice(0, 2048));

					// Try to detect JSON
					try {
						JSON.parse(text);
						detectedExtension = 'json';
					} catch {
						// Try XML/HTML
						if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
							detectedExtension = 'xml';
						}
						// Try YAML
						else if (text.includes('---') || /^\s*[\w-]+\s*:\s*/m.test(text)) {
							detectedExtension = 'yaml';
						}
						// Try CSV/TSV
						else if (text.includes(',') || text.includes('\t')) {
							const lines = text.split('\n').filter(line => line.trim());
							if (lines.length > 1) {
								const firstLine = lines[0];
								const secondLine = lines[1];
								// Check if both lines have similar structure (same number of delimiters)
								const commaCount1 = (firstLine.match(/,/g) || []).length;
								const commaCount2 = (secondLine.match(/,/g) || []).length;
								const tabCount1 = (firstLine.match(/\t/g) || []).length;
								const tabCount2 = (secondLine.match(/\t/g) || []).length;

								if (commaCount1 > 0 && commaCount1 === commaCount2) {
									detectedExtension = 'csv';
								} else if (tabCount1 > 0 && tabCount1 === tabCount2) {
									detectedExtension = 'tsv';
								} else {
									detectedExtension = 'txt';
								}
							} else {
								detectedExtension = 'txt';
							}
						}
						// Try Markdown
						else if (text.includes('# ') || text.includes('## ') || text.includes('```')) {
							detectedExtension = 'md';
						}
						// Default to plain text
						else {
							detectedExtension = 'txt';
						}
					}
				} else {
					// Check for binary file signatures
					const signature = bytes.slice(0, 8);

					// Excel XLSX (PK..)
					if (signature[0] === 0x50 && signature[1] === 0x4B && signature[2] === 0x03 && signature[3] === 0x04) {
						detectedExtension = 'xlsx';
					}
					// Excel XLS (old format)
					else if (signature[0] === 0xD0 && signature[1] === 0xCF && signature[2] === 0x11 && signature[3] === 0xE0) {
						detectedExtension = 'xls';
					}
					// PDF
					else if (signature[0] === 0x25 && signature[1] === 0x50 && signature[2] === 0x44 && signature[3] === 0x46) {
						detectedExtension = 'pdf';
					}
					// PNG
					else if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
						detectedExtension = 'png';
					}
					// JPEG
					else if (signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF) {
						detectedExtension = 'jpg';
					}
					// Default to binary
					else {
						detectedExtension = 'bin';
					}
				}
			}

			const extension = detectedExtension;

			const fileMeta: FileMeta = {
				name: filename,
				size: parseInt(contentLength || '0', 10) || arrayBuffer.byteLength,
				type: contentType,
				extension,
				data: arrayBuffer,
				url: url,
			};

			setSelectedFile(fileMeta);
			addToHistory(fileMeta);
		} catch (error) {
			console.error('Error fetching URL:', error);
		}
	}, [getFileFromHistory]);

	const handleClose = useCallback(() => {
		setSelectedFile(null);
	}, []);

	const features = [
		{
			icon: Shield,
			title: 'Secure & Private',
			description: 'All files are processed locally in your browser. Nothing is uploaded to any server.',
		},
		{
			icon: Zap,
			title: 'Lightning Fast',
			description: 'Instant previews with no waiting. Large files are streamed for optimal performance.',
		},
		{
			icon: Globe,
			title: 'Works Offline',
			description: 'Once loaded, previews work completely offline. No internet required.',
		},
		{
			icon: Code,
			title: 'Developer Friendly',
			description: 'Syntax highlighting for 20+ programming languages with line numbers.',
		},
	];

	return (
		<div className="min-h-screen bg-background">
			{/* File History Sidebar */}
			<FileHistory
				history={history}
				isOpen={isHistoryOpen}
				onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
				onSelectFile={handleSelectFromHistory}
				onRemoveFile={removeFromHistory}
				onClearHistory={clearHistory}
				onTogglePin={togglePin}
				onReorder={reorderHistory}
			/>

			<AnimatePresence>
				{selectedFile && (
					<FilePreviewer
						file={selectedFile}
						onClose={handleClose}
						onSelectHistoryFile={handleSelectFromHistory}
						initialSecurityConfig={securityConfig}
					/>
				)}
			</AnimatePresence>

			{!selectedFile && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="min-h-screen flex flex-col"
					style={{ marginLeft: isHistoryOpen ? 256 : 0, transition: 'margin-left 0.3s ease' }}
				>
					{/* Hero Section */}
					<header className="relative overflow-hidden">
						{/* Background gradient */}
						<div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
						<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-50" />

						<div className="relative container mx-auto px-4 py-16 md:py-24">


							{/* Dropzone */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
							>
								<FileDropZone onFileSelect={handleFileSelect} onUrlSelect={handleUrlSelect} />
							</motion.div>
						</div>
					</header>

					{/* Footer */}
					<footer className="mt-auto py-6 border-t border-border">
						<div className="container mx-auto px-4">
							<div className="flex flex-col md:flex-row items-center justify-between gap-4">
								<div className="flex items-center gap-2 text-muted-foreground">
									<Sparkles className="w-4 h-4 text-primary" />
									<span className="text-sm">Built with React, TypeScript & Tailwind</span>
								</div>
								<p className="text-sm text-muted-foreground">
									100% client-side • No data collection • WCAG 2.1 AA compliant
								</p>
							</div>
						</div>
					</footer>
				</motion.div>
			)}
		</div>
	);
};

export default Index;
