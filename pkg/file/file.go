package file

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/oarkflow/previewer/assets"

	"github.com/gorilla/websocket"
)

const shutdownTimeout = 5 * time.Second


// Security configuration structures (same shape as previous implementation)
type securityConfig struct {
	NoCopy              bool             `json:"noCopy"`
	NoDownload          bool             `json:"noDownload"`
	ScreenshotResistant bool             `json:"screenshotResistant"`
	Watermark           bool             `json:"watermark"`
	WatermarkConfig     *watermarkConfig `json:"watermarkConfig,omitempty"`
	SessionTimeout      *int             `json:"sessionTimeout,omitempty"`
	ActivityLogging     bool             `json:"activityLogging"`
}

type watermarkConfig struct {
	Text     string  `json:"text"`
	FontSize int     `json:"fontSize"`
	Opacity  float64 `json:"opacity"`
	Rotation int     `json:"rotation"`
	Color    string  `json:"color"`
	Spacing  int     `json:"spacing"`
}

type previewServer struct {
	filePath       string
	fileName       string
	fileData       []byte
	mimeType       string
	securityConfig securityConfig
	indexHTML      []byte
	cspNonce       string
	upgrader       websocket.Upgrader
	closeCh        chan struct{}
	httpServer     *http.Server
}

func PreviewFile(filePath string) error {
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		log.Fatalf("resolve file: %v", err)
	}
	f, err := os.Open(absPath)
	if err != nil {
		log.Fatalf("open file: %v", err)
	}
	defer f.Close()
	return Preview(f)
}

// Preview reads the file from the provided reader and serves the preview UI until the user closes it.
// If the reader implements Name() string (e.g. *os.File), the base name will be used in the UI and URL.
func Preview(r io.Reader) error {
	if r == nil {
		return errors.New("reader is nil")
	}

	data, err := io.ReadAll(r)
	if err != nil {
		return fmt.Errorf("read data: %w", err)
	}

	name := "file"
	if n, ok := r.(interface{ Name() string }); ok {
		if bn := filepath.Base(n.Name()); bn != "" {
			name = bn
		}
	}

	srv, err := newPreviewServerFromBytes(name, data)
	if err != nil {
		return fmt.Errorf("create preview server: %w", err)
	}

	listener, port := pickListener()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", srv.handleWS)
	mux.Handle("/", srv.spaHandler())

	httpServer := &http.Server{Handler: withLogging(mux)}
	srv.httpServer = httpServer

	go func() {
		log.Printf("serving preview on http://localhost:%d (file: %s)", port, srv.fileName)
		if err := httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	previewURL := fmt.Sprintf("http://localhost:%d/?file=%s", port, url.QueryEscape(srv.fileName))
	if err := openBrowser(previewURL); err != nil {
		log.Printf("open browser: %v", err)
	}

	srv.waitForClose()

	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	_ = httpServer.Shutdown(ctx)
	log.Println("server shutdown")
	return nil
}

func randomNonceBase64(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawStdEncoding.EncodeToString(b), nil
}

func newPreviewServerFromBytes(name string, fileData []byte) (*previewServer, error) {
	mimeType := mime.TypeByExtension(strings.ToLower(filepath.Ext(name)))
	if mimeType == "" {
		// fallback to detection from content
		if len(fileData) > 0 {
			mimeType = http.DetectContentType(fileData)
		} else {
			mimeType = "application/octet-stream"
		}
	}

	// Read embedded index.html
	dist, err := fs.Sub(assets.DistFS, "dist")
	if err != nil {
		return nil, fmt.Errorf("embed dist: %w", err)
	}
	indexBytes, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return nil, fmt.Errorf("read index.html: %w", err)
	}

	// Maximum security configuration for secure preview
	sessionTimeout := 30 * 60 * 1000 // 30 minutes in milliseconds
	secConfig := securityConfig{
		NoCopy:              true,
		NoDownload:          true,
		ScreenshotResistant: true,
		Watermark:           true,
		WatermarkConfig: &watermarkConfig{
			Text:     "CONFIDENTIAL",
			FontSize: 48,
			Opacity:  0.15,
			Rotation: -30,
			Color:    "#888888",
			Spacing:  200,
		},
		SessionTimeout:  &sessionTimeout,
		ActivityLogging: true,
	}

	embeddedFile := map[string]interface{}{
		"name":     name,
		"size":     len(fileData),
		"type":     mimeType,
		"data":     base64.StdEncoding.EncodeToString(fileData),
		"embedded": true,
	}
	fileJSON, err := json.Marshal(embeddedFile)
	if err != nil {
		return nil, fmt.Errorf("marshal file data: %w", err)
	}

	securityJSON, err := json.Marshal(secConfig)
	if err != nil {
		return nil, fmt.Errorf("marshal security config: %w", err)
	}

	nonce, err := randomNonceBase64(16)
	if err != nil {
		return nil, fmt.Errorf("nonce: %w", err)
	}

	injectionScript := fmt.Sprintf(
		`<script nonce="%s">window.__EMBEDDED_FILE__=%s;window.__SECURITY_CONFIG__=%s;</script>`,
		nonce,
		fileJSON,
		securityJSON,
	)
	modifiedIndex := bytes.Replace(indexBytes, []byte("</head>"), []byte(injectionScript+"</head>"), 1)

	return &previewServer{
		filePath:       "",
		fileName:       name,
		fileData:       fileData,
		mimeType:       mimeType,
		securityConfig: secConfig,
		indexHTML:      modifiedIndex,
		cspNonce:       nonce,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				host := strings.ToLower(r.Host)
				return strings.HasPrefix(host, "localhost") || strings.HasPrefix(host, "127.0.0.1")
			},
		},
		closeCh: make(chan struct{}),
	}, nil
}

func (s *previewServer) spaHandler() http.Handler {
	dist, err := fs.Sub(assets.DistFS, "dist")
	if err != nil {
		log.Fatalf("embed dist: %v", err)
	}
	fileServer := http.FileServer(http.FS(dist))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// WS is handled elsewhere
		if r.URL.Path == "/ws" {
			http.NotFound(w, r)
			return
		}

		if r.URL.Path == "/" {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(s.indexHTML)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		if f, err := dist.Open(path); err == nil {
			_ = f.Close()
			w.Header().Set("Cache-Control", "no-store")
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/" + path
			fileServer.ServeHTTP(w, r2)
			return
		}

		// SPA fallback: serve modified index.html
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(s.indexHTML)
	})
}

func (s *previewServer) handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade: %v", err)
		return
	}
	defer func() {
		conn.Close()
		log.Println("websocket closed, shutting down server")
		s.signalClose()
	}()

	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if mt != websocket.TextMessage {
			continue
		}
		m := strings.ToLower(strings.TrimSpace(string(msg)))
		if m == "ping" {
			continue
		}
		if m == "close" || m == "closing" {
			return
		}
		if strings.HasPrefix(m, "violation") || strings.Contains(m, "security_violation") {
			log.Printf("security violation reported by client: %s", m)
			return
		}
	}
}

func (s *previewServer) waitForClose() {
	sigCh := make(chan os.Signal, 1)
	signalNotify(sigCh)
	select {
	case <-s.closeCh:
	case <-sigCh:
	}
}

// signalNotify is a small wrapper to allow easier unit testing of signal handling.
func signalNotify(ch chan os.Signal) {
	signal.Notify(ch, os.Interrupt)
}

func (s *previewServer) signalClose() {
	select {
	case s.closeCh <- struct{}{}:
	default:
	}
}

func pickListener() (net.Listener, int) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	addr := l.Addr().(*net.TCPAddr)
	return l, addr.Port
}

func openBrowser(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "darwin":
		cmd = "open"
		args = []string{url}
	case "windows":
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler", url}
	default:
		cmd = "xdg-open"
		args = []string{url}
	}

	return execCommand(cmd, args...)
}

func execCommand(cmd string, args ...string) error {
	c := exec.Command(cmd, args...)
	return c.Start()
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}
