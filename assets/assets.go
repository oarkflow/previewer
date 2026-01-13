package assets

import "embed"

//go:embed dist/* dist/**/*

var DistFS embed.FS
