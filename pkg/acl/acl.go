package acl

// ItemPermissions represents access permissions for a file or folder
type ItemPermissions struct {
	CanRead   bool `json:"canRead"`
	CanWrite  bool `json:"canWrite"`
	CanDelete bool `json:"canDelete"`
}
