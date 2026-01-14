/**
 * Sample Folder Data Structure
 * This file demonstrates how to create and use the FolderRenderer with the FilePreviewer
 */
import { FileMeta } from '@/types/file-preview';
/**
 * Example: Creating a secured folder structure
 * This demonstrates a project folder with nested directories and files
 */
export declare function createSampleSecuredFolder(): FileMeta;
/**
 * Example: Creating a simple folder structure
 */
export declare function createSimpleFolder(): FileMeta;
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
