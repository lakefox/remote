package main

import (
	"encoding/json"
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

type EnvVar struct {
	Name  string `json:"name"`
	Value string `json:"value"`
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
		// socket := flowlayer.Connect("wss://ws.lakefox.net/wss")
		socket := flowlayer.Connect("ws://localhost:2134/wss")

		socket.Route("files", func(a any) any {
			return listFilesInDirectory(mount)
		})

		socket.Route("dir", func(a any) any {
			return listFilesInDirectory(mount)
			// return listFilesInDirectory(a.(string))
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
			data := a.(map[string]interface{})
			fmt.Println(data)
			err := os.WriteFile(data["name"].(string), []byte(data["data"].(string)), 0777)
			// handle this error
			if err != nil {
				// print it out
				fmt.Println(err)
			}
			return nil
		})

		socket.Route("addAction", func(a any) any {
			socket.Fetch("getPackage", a, func(b any) {
				data := b.([]interface{})
				rows := data[0].([]interface{})
				dirName := rows[1].(string) + "-" + rows[2].(string) + fmt.Sprint(rows[0].(float64))
				folder := filepath.Join(mount, "Actions", dirName)
				fmt.Println(dirName, folder)
				check(createDirectoryIfNotExists(filepath.Join(mount, "Actions")))
				check(createOrReplaceDirectory(folder))
				jsonToEnvFile(rows[5].(string), folder)

				check(os.WriteFile(filepath.Join(folder, "Actions.yml"), []byte(rows[9].(string)), 0644))
			})
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
	log.Println("Remote session started. Press Ctrl+C to exit.")
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

func createOrReplaceDirectory(dirPath string) error {
	// Remove the existing directory
	err := os.RemoveAll(dirPath)
	if err != nil {
		return err
	}

	// Create the new directory
	err = os.Mkdir(dirPath, 0755)
	if err != nil {
		return err
	}

	return nil
}

func jsonToEnvFile(jsonString, folderPath string) error {
	// Unmarshal JSON into a slice of EnvVar
	var envVars []EnvVar
	err := json.Unmarshal([]byte(jsonString), &envVars)
	if err != nil {
		return fmt.Errorf("error decoding JSON: %v", err)
	}

	// Create the full path for the .env file
	envFilePath := filepath.Join(folderPath, ".env")

	// Open or create the .env file for writing
	file, err := os.OpenFile(envFilePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		return fmt.Errorf("error opening .env file: %v", err)
	}
	defer file.Close()

	// Write the name-value pairs to the .env file
	for _, envVar := range envVars {
		line := fmt.Sprintf("%s=%s\n", envVar.Name, envVar.Value)
		_, err := file.WriteString(line)
		if err != nil {
			return fmt.Errorf("error writing to .env file: %v", err)
		}
	}

	fmt.Printf(".env file created successfully at: %s\n", envFilePath)
	return nil
}

func createDirectoryIfNotExists(dirPath string) error {
	// Check if the directory already exists
	_, err := os.Stat(dirPath)
	if os.IsNotExist(err) {
		// Directory does not exist, create it
		err := os.Mkdir(dirPath, 0755) // 0755 is the permission mode for the directory
		if err != nil {
			return fmt.Errorf("error creating directory: %v", err)
		}
		fmt.Printf("Directory created: %s\n", dirPath)
	} else if err != nil {
		// Some other error occurred
		return fmt.Errorf("error checking directory existence: %v", err)
	} else {
		// Directory already exists
		fmt.Printf("Directory already exists: %s\n", dirPath)
	}

	return nil
}

func check(e error) {
	if e != nil {
		fmt.Println(e)
		panic(e)
	}
}
