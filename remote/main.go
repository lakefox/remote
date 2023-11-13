package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"

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

func main() {
	connections := make(map[float64]map[float64]interface{})

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	go func() {
		socket := flowlayer.Connect("ws://localhost:2134/wss")

		socket.On("open", func(a any) {

			ident := Ident{
				Org:      "automated",
				ID:       44324,
				SocketID: socket.ID,
			}

			socket.Emit("ident", ident)

			socket.On("channel", func(c any) {
				fmt.Println("channel")
				channel := c.(flowlayer.Channel)
				channel.On("session", func(a any) {
					fmt.Println("Session", channel.ID)
					inter := terminal.Terminal()

					inter.In <- `setopt PROMPT_CR && setopt PROMPT_SP && export PROMPT_EOL_MARK=""`
					inter.In <- "\n"
					inter.In <- "clear\n"

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

				channel.On("operation", func(a any) {
					raw := a.(map[string]interface{})
					data := raw["data"].(map[string]interface{})
					fmt.Println(data)
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
