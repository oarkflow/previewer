package main

import (
	"flag"
	"log"

	"github.com/oarkflow/previewer/pkg/file"
	"github.com/oarkflow/previewer/pkg/vfs"
)

var (
	fileFlag        = flag.String("file", "", "Absolute or relative path to the file to preview")
	folderFlag      = flag.String("folder", "", "Absolute or relative path to the folder to preview")
	maxFileSize     = flag.Int("max-file-size", 100, "Maximum file size in MB (default: 100)")
	maxTotalSize    = flag.Int("max-total-size", 500, "Maximum total folder size in MB (default: 500)")
	enableCompress  = flag.Bool("compress", true, "Enable compression for text files (default: true)")
	maxAccessPerFile = flag.Int("max-access", 1000, "Maximum access attempts per file per minute (default: 1000)")
	anomalyScore    = flag.Int("anomaly-threshold", 75, "Anomaly detection threshold 0-100 (default: 75)")
	mlockMemory     = flag.Bool("mlock", false, "Lock memory to prevent swapping (requires privileges)")
)

func main() {
	flag.Parse()

	// Check if both flags are provided (not allowed)
	if *fileFlag != "" && *folderFlag != "" {
		log.Fatal("Cannot specify both --file and --folder flags")
	}

	// Check if neither flag is provided
	if *fileFlag == "" && *folderFlag == "" {
		log.Fatal("Either --file or --folder is required")
	}

	// Handle folder preview
	if *folderFlag != "" {
		// Configure VFS options
		opts := vfs.Options{
			MaxFileSize:       int64(*maxFileSize) * 1024 * 1024,
			MaxTotalSize:      int64(*maxTotalSize) * 1024 * 1024,
			EnableCompression: *enableCompress,
			MaxAccessPerFile:  *maxAccessPerFile,
			AnomalyThreshold:  *anomalyScore,
			MLockMemory:       *mlockMemory,
		}
		if err := file.PreviewFolderWithOptions(*folderFlag, opts); err != nil {
			log.Fatalf("preview folder: %v", err)
		}
		return
	}

	// Handle file preview (original functionality)
	if err := file.PreviewFile(*fileFlag); err != nil {
		log.Fatalf("preview file: %v", err)
	}
}
