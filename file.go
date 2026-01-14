package previewer

import (
	"errors"
	"io"

	"github.com/oarkflow/previewer/pkg/file"
)

func PreviewFile(filePath string) error {
	return file.PreviewFile(filePath)
}

func Preview(r io.Reader) error {
	if r == nil {
		return errors.New("reader is nil")
	}
	return file.Preview(r)
}

func PreviewFolder(folderPath string) error {
	return file.PreviewFolder(folderPath)
}
