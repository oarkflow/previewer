/**
 * Sample Folder Data Structure
 * This file demonstrates how to create and use the FolderRenderer with the FilePreviewer
 */

import { FileMeta, FolderItem, FolderMeta } from '@/types/file-preview';

/**
 * Example: Creating a secured folder structure
 * This demonstrates a project folder with nested directories and files
 */
export function createSampleSecuredFolder(): FileMeta {
    // Define the folder structure with nested items
    const folderItems: FolderItem[] = [
        {
            id: 'folder-1',
            name: 'Documents',
            type: 'folder',
            size: 0,
            path: '/Documents',
            lastModified: Date.now() - 86400000, // 1 day ago
            isSecure: true,
            permissions: {
                canRead: true,
                canWrite: false,
                canDelete: false,
            },
            children: [
                {
                    id: 'file-1',
                    name: 'Project_Proposal.pdf',
                    type: 'file',
                    size: 1024 * 512, // 512 KB
                    extension: 'pdf',
                    path: '/Documents/Project_Proposal.pdf',
                    lastModified: Date.now() - 43200000, // 12 hours ago
                    mimeType: 'application/pdf',
                    isSecure: true,
                    permissions: {
                        canRead: true,
                        canWrite: false,
                        canDelete: false,
                    },
                },
                {
                    id: 'file-2',
                    name: 'Meeting_Notes.docx',
                    type: 'file',
                    size: 1024 * 256, // 256 KB
                    extension: 'docx',
                    path: '/Documents/Meeting_Notes.docx',
                    lastModified: Date.now() - 7200000, // 2 hours ago
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    isSecure: false,
                    permissions: {
                        canRead: true,
                        canWrite: true,
                        canDelete: false,
                    },
                },
                {
                    id: 'folder-2',
                    name: 'Confidential',
                    type: 'folder',
                    size: 0,
                    path: '/Documents/Confidential',
                    lastModified: Date.now() - 172800000, // 2 days ago
                    isSecure: true,
                    permissions: {
                        canRead: true,
                        canWrite: false,
                        canDelete: false,
                    },
                    children: [
                        {
                            id: 'file-3',
                            name: 'Financial_Report_Q4.xlsx',
                            type: 'file',
                            size: 1024 * 1024 * 2, // 2 MB
                            extension: 'xlsx',
                            path: '/Documents/Confidential/Financial_Report_Q4.xlsx',
                            lastModified: Date.now() - 259200000, // 3 days ago
                            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            isSecure: true,
                            permissions: {
                                canRead: true,
                                canWrite: false,
                                canDelete: false,
                            },
                        },
                    ],
                },
            ],
        },
        {
            id: 'folder-3',
            name: 'Media',
            type: 'folder',
            size: 0,
            path: '/Media',
            lastModified: Date.now() - 604800000, // 7 days ago
            isSecure: false,
            children: [
                {
                    id: 'folder-4',
                    name: 'Images',
                    type: 'folder',
                    size: 0,
                    path: '/Media/Images',
                    lastModified: Date.now() - 432000000, // 5 days ago
                    children: [
                        {
                            id: 'file-4',
                            name: 'company_logo.png',
                            type: 'file',
                            size: 1024 * 128, // 128 KB
                            extension: 'png',
                            path: '/Media/Images/company_logo.png',
                            lastModified: Date.now() - 518400000, // 6 days ago
                            mimeType: 'image/png',
                            permissions: {
                                canRead: true,
                                canWrite: true,
                                canDelete: true,
                            },
                        },
                        {
                            id: 'file-5',
                            name: 'team_photo.jpg',
                            type: 'file',
                            size: 1024 * 1024 * 3, // 3 MB
                            extension: 'jpg',
                            path: '/Media/Images/team_photo.jpg',
                            lastModified: Date.now() - 345600000, // 4 days ago
                            mimeType: 'image/jpeg',
                            permissions: {
                                canRead: true,
                                canWrite: true,
                                canDelete: true,
                            },
                        },
                    ],
                },
                {
                    id: 'folder-5',
                    name: 'Videos',
                    type: 'folder',
                    size: 0,
                    path: '/Media/Videos',
                    lastModified: Date.now() - 1209600000, // 14 days ago
                    children: [
                        {
                            id: 'file-6',
                            name: 'product_demo.mp4',
                            type: 'file',
                            size: 1024 * 1024 * 25, // 25 MB
                            extension: 'mp4',
                            path: '/Media/Videos/product_demo.mp4',
                            lastModified: Date.now() - 1296000000, // 15 days ago
                            mimeType: 'video/mp4',
                            permissions: {
                                canRead: true,
                                canWrite: false,
                                canDelete: false,
                            },
                        },
                    ],
                },
            ],
        },
        {
            id: 'folder-6',
            name: 'Source Code',
            type: 'folder',
            size: 0,
            path: '/Source Code',
            lastModified: Date.now() - 3600000, // 1 hour ago
            isSecure: true,
            permissions: {
                canRead: true,
                canWrite: true,
                canDelete: false,
            },
            children: [
                {
                    id: 'file-7',
                    name: 'App.tsx',
                    type: 'file',
                    size: 1024 * 24, // 24 KB
                    extension: 'tsx',
                    path: '/Source Code/App.tsx',
                    lastModified: Date.now() - 1800000, // 30 minutes ago
                    mimeType: 'text/typescript',
                    isSecure: true,
                    permissions: {
                        canRead: true,
                        canWrite: true,
                        canDelete: false,
                    },
                },
                {
                    id: 'file-8',
                    name: 'api.ts',
                    type: 'file',
                    size: 1024 * 18, // 18 KB
                    extension: 'ts',
                    path: '/Source Code/api.ts',
                    lastModified: Date.now() - 7200000, // 2 hours ago
                    mimeType: 'text/typescript',
                    isSecure: true,
                    permissions: {
                        canRead: true,
                        canWrite: true,
                        canDelete: false,
                    },
                },
                {
                    id: 'file-9',
                    name: 'package.json',
                    type: 'file',
                    size: 1024 * 4, // 4 KB
                    extension: 'json',
                    path: '/Source Code/package.json',
                    lastModified: Date.now() - 86400000, // 1 day ago
                    mimeType: 'application/json',
                    permissions: {
                        canRead: true,
                        canWrite: true,
                        canDelete: false,
                    },
                },
            ],
        },
        {
            id: 'file-10',
            name: 'README.md',
            type: 'file',
            size: 1024 * 8, // 8 KB
            extension: 'md',
            path: '/README.md',
            lastModified: Date.now() - 172800000, // 2 days ago
            mimeType: 'text/markdown',
            permissions: {
                canRead: true,
                canWrite: true,
                canDelete: false,
            },
        },
        {
            id: 'file-11',
            name: '.gitignore',
            type: 'file',
            size: 512, // 512 bytes
            extension: 'gitignore',
            path: '/.gitignore',
            lastModified: Date.now() - 604800000, // 7 days ago
            mimeType: 'text/plain',
            permissions: {
                canRead: true,
                canWrite: true,
                canDelete: false,
            },
        },
    ];

    // Calculate folder statistics
    const calculateStats = (items: FolderItem[]): { totalFiles: number; totalFolders: number; totalSize: number } => {
        let totalFiles = 0;
        let totalFolders = 0;
        let totalSize = 0;

        items.forEach(item => {
            if (item.type === 'folder') {
                totalFolders++;
                if (item.children) {
                    const childStats = calculateStats(item.children);
                    totalFiles += childStats.totalFiles;
                    totalFolders += childStats.totalFolders;
                    totalSize += childStats.totalSize;
                }
            } else {
                totalFiles++;
                totalSize += item.size;
            }
        });

        return { totalFiles, totalFolders, totalSize };
    };

    const stats = calculateStats(folderItems);

    // Create folder metadata
    const folderMeta: FolderMeta = {
        path: '/',
        name: 'Project Root',
        items: folderItems,
        totalSize: stats.totalSize,
        totalFiles: stats.totalFiles,
        totalFolders: stats.totalFolders,
        lastModified: Date.now(),
        isSecure: true,
    };

    // Create FileMeta for the folder
    const folderFileMeta: FileMeta = {
        name: 'Secured Project Folder',
        size: stats.totalSize,
        type: 'folder',
        extension: '',
        lastModified: Date.now(),
        data: new Blob([]), // Empty blob for folder
        isFolder: true,
        folderData: folderMeta,
    };

    return folderFileMeta;
}

/**
 * Example: Creating a simple folder structure
 */
export function createSimpleFolder(): FileMeta {
    const folderItems: FolderItem[] = [
        {
            id: 'file-1',
            name: 'document.pdf',
            type: 'file',
            size: 1024 * 256,
            extension: 'pdf',
            path: '/document.pdf',
            lastModified: Date.now(),
            mimeType: 'application/pdf',
            permissions: {
                canRead: true,
                canWrite: true,
                canDelete: true,
            },
        },
        {
            id: 'file-2',
            name: 'photo.jpg',
            type: 'file',
            size: 1024 * 1024,
            extension: 'jpg',
            path: '/photo.jpg',
            lastModified: Date.now(),
            mimeType: 'image/jpeg',
            permissions: {
                canRead: true,
                canWrite: true,
                canDelete: true,
            },
        },
        {
            id: 'folder-1',
            name: 'Subfolder',
            type: 'folder',
            size: 0,
            path: '/Subfolder',
            lastModified: Date.now(),
            children: [
                {
                    id: 'file-3',
                    name: 'notes.txt',
                    type: 'file',
                    size: 1024 * 4,
                    extension: 'txt',
                    path: '/Subfolder/notes.txt',
                    lastModified: Date.now(),
                    mimeType: 'text/plain',
                    permissions: {
                        canRead: true,
                        canWrite: true,
                        canDelete: true,
                    },
                },
            ],
        },
    ];

    const folderMeta: FolderMeta = {
        path: '/',
        name: 'My Files',
        items: folderItems,
        totalSize: 1024 * 1024 + 1024 * 256 + 1024 * 4,
        totalFiles: 3,
        totalFolders: 1,
        lastModified: Date.now(),
        isSecure: false,
    };

    const folderFileMeta: FileMeta = {
        name: 'My Files',
        size: folderMeta.totalSize,
        type: 'folder',
        extension: '',
        lastModified: Date.now(),
        data: new Blob([]),
        isFolder: true,
        folderData: folderMeta,
    };

    return folderFileMeta;
}

/**
 * Example usage in a component:
 *
 * import { createSampleSecuredFolder } from '@/lib/sample-folder-data';
 *
 * const folderData = createSampleSecuredFolder();
 * <FilePreviewer
 *   file={folderData}
 *   onClose={() => {}}
 * />
 */
