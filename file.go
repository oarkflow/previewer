package previewer

import (
	"errors"
	"io"

	"github.com/oarkflow/previewer/pkg/file"
	"github.com/oarkflow/previewer/pkg/vfs"
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

func PreviewFolder(folderPath string, opts ...vfs.Options) error {
	if len(opts) > 0 {
		return file.PreviewFolderWithOptions(folderPath, opts[0])
	}
	return file.PreviewFolder(folderPath)
}
