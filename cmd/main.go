package main

import (
	"flag"
	"log"

	"github.com/oarkflow/previewer/pkg/file"
)

var fileFlag = flag.String("file", "", "Absolute or relative path to the file to preview")

func main() {
	flag.Parse()
	if *fileFlag == "" {
		log.Fatal("--file is required")
	}
	if err := file.PreviewFile(*fileFlag); err != nil {
		log.Fatalf("preview: %v", err)
	}
}
