package wss

import (
	"fmt"
	"os"
	"path/filepath"
	"server/src/auth"
)

type File struct {
	Data string `json:"data"`
	Path string `json:"path"`
}

var state = make(map[string]any)

func Handler(e *auth.Event) {
	// edat := e.Data

	e.OnChannel("files", func(id, channel float64, data any) {
		currentDir, _ := os.Getwd()
		dir := filepath.Join(currentDir)
		files := listFilesInDirectory(dir)
		e.Emit("files", e.ConnId, channel, files)
	})

	e.OnChannel("mim", func(id, channel float64, data any) {
		if data != nil {
			state["mim"] = data
		} else {
			e.Emit("mim", e.ConnId, channel, state["mim"])
		}
	})

	e.OnChannel("read", func(id, channel float64, data any) {
		fmt.Println(data)
		dat, err := os.ReadFile(data.(string))
		check(err)

		file := File{
			Data: string(dat),
			Path: data.(string),
		}

		e.Emit("read", e.ConnId, channel, file)
	})
}

func listFilesInDirectory(dirPath string) []string {
	var files = []string{}
	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		check(err)

		if !info.IsDir() {
			files = append(files, path)
		}

		return nil
	})

	if err != nil {
		fmt.Println("Error walking the directory:", err)
	}

	return files
}

func check(e error) {
	if e != nil {
		fmt.Println(e)
		panic(e)
	}
}
