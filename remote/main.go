package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"

	"server/src/flowlayer"
	"server/src/terminal"
)

type Ident struct {
	Org      string  `json:"org"`
	ID       int     `json:"id"`
	SocketID float64 `json:"ioID"`
}

type File struct {
	Read bool   `json:"read"`
	Name string `json:"name"`
	Data string `json:"data"`
}

type File2 struct {
	Data string `json:"data"`
	Path string `json:"path"`
}

func main() {
	var org string
	var mount string
	var id int
	cwd, _ := os.Getwd()

	flag.StringVar(&org, "org", "automated", "Enter Your Organization")
	flag.IntVar(&id, "id", 44324, "Enter a unique ID for this device (used to login)")
	flag.StringVar(&mount, "mount", cwd, "Enter directory to mount to")
	flag.Parse()
	fmt.Println(org, id)

	connections := make(map[float64]map[float64]interface{})

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	go func() {
		socket := flowlayer.Connect("ws://localhost:2134/wss")

		socket.Route("files", func(a any) any {
			return listFilesInDirectory(mount)
		})

		socket.Route("dir", func(a any) any {
			return listFilesInDirectory(a.(string))
		})

		socket.Route("read", func(data any) any {
			dat, err := os.ReadFile(data.(string))
			check(err)

			file := File2{
				Data: string(dat),
				Path: data.(string),
			}

			return file
		})

		socket.Route("write", func(a any) any {
			raw := a.(map[string]interface{})
			data := raw["data"].(map[string]interface{})
			err := os.WriteFile(data["name"].(string), data["data"].([]byte), 0777)
			// handle this error
			if err != nil {
				// print it out
				fmt.Println(err)
			}
			return nil
		})

		socket.On("open", func(a any) {

			ident := Ident{
				Org:      org,
				ID:       id,
				SocketID: socket.ID,
			}

			socket.Emit("ident", ident)

			socket.On("channel", func(c any) {
				fmt.Println("channel")
				channel := c.(flowlayer.Channel)

				// terminal

				channel.On("session", func(a any) {
					fmt.Println("Session", channel.ID)
					inter := terminal.Terminal(mount)

					go func() {
						// Receive and print output from the terminal
						for output := range inter.Out {
							channel.Emit("response", output)
						}
					}()
					// Store the terminal
					_, e := connections[socket.ID]
					if !e {
						connections[socket.ID] = make(map[float64]interface{})
					}

					connections[socket.ID][channel.ID] = inter
				})

				channel.On("command", func(a any) {
					data := a.(map[string]interface{})
					text := data["data"].(map[string]interface{})
					term := connections[socket.ID][channel.ID].(terminal.Output)
					term.In <- text["data"].(string)
				})

				channel.On("resize", func(a any) {
					raw := a.(map[string]interface{})
					data := raw["data"].(map[string]interface{})
					term := connections[socket.ID][channel.ID].(terminal.Output)
					term.Resize(data["cols"].(float64), data["rows"].(float64))
				})

				// Editor

				channel.On("operation", func(a any) {
					raw := a.(map[string]interface{})
					data := raw["data"].(map[string]interface{})
					_, write := data["write"]
					_, read := data["read"]
					if write {
						err := os.WriteFile(data["name"].(string), data["data"].([]byte), 0777)
						// handle this error
						if err != nil {
							// print it out
							fmt.Println(err)
						}
					} else if read {
						fil, err := os.ReadFile(data["data"].(string))
						if err != nil {
							fmt.Println(err)
						}
						f := File{
							Read: true,
							Name: data["data"].(string),
							Data: string(fil),
						}
						channel.Emit("operation", f)

					}
				})
			})

		})

	}()
	// Keep Alive
	log.Println("WebSocket client started. Press Ctrl+C to exit.")
	<-interrupt

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
