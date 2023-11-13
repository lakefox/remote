package auth

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"

	"github.com/gorilla/websocket"
)

// <----------------------------------------------------------------------------------------------> //

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Event struct {
	ID     float64
	Conn   *websocket.Conn
	Data   map[string]interface{}
	ConnId int
}

// <----------------------------------------------------------------------------------------------> //

func WebSocket(w http.ResponseWriter, r *http.Request, handler func(*Event), master bool) {
	conn, _ := upgrader.Upgrade(w, r, nil) // error ignored for sake of simplicity
	defer conn.Close()
	connId := rand.Intn(10000000)

	if master {
		send(conn, `{"type": "connect"}`)
	}

	for {
		// Read message from browser
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println(err)
			return
		}

		var data map[string]interface{}
		if err := json.Unmarshal(msg, &data); err != nil {
			// Error decoding JSON
			fmt.Println(err, string(msg))
		} else {
			handleMessage(conn, connId, data, handler)
		}
	}
}

func send(conn *websocket.Conn, msg string) {
	// Write message back to browser
	conn.WriteMessage(1, []byte(msg))
}

func handleMessage(conn *websocket.Conn, connId int, data map[string]interface{}, handler func(*Event)) {
	id := data["id"]

	if id == nil || (id != nil && data["type"] == "id") {
		fmt.Println("Creating Connection")
		if data["type"] == "connect" {
			if data["ident"] == true {
				// After you initiated the handshake they are asking you assign them an ID
				println(connId)
				msg := fmt.Sprintf(`{"type": "id", "id": %d}`, connId)
				send(conn, msg)
			} else {
				// Someone else initiated the handshake
				// Assign them an ID
				println(connId)
				msg := fmt.Sprintf(`{"type": "id", "id": %d}`, connId)
				send(conn, msg)

				// Ask them to connect
				req := `{"type": "id", "ident": true}`
				send(conn, req)
			}
		}
	} else {
		if data["type"] == "data" {
			e := &Event{
				ID:     id.(float64),
				Conn:   conn,
				Data:   data,
				ConnId: connId,
			}
			handler(e)
		}
	}

}

// <----------------------------------------------------------------------------------------------> //

type DATA struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type JSON struct {
	Type    string  `json:"type"`
	ID      int     `json:"id"`
	Channel float64 `json:"channel"`
	Data    DATA    `json:"data"`
}

func (e *Event) Emit(event string, id int, channel float64, message any) {
	d := DATA{
		Type: event,
		Data: message,
	}

	msg := JSON{
		Type: "data",
		ID:   id,
		Data: d,
	}

	if channel > 0 {
		msg.Channel = channel
	}

	jsonData, err := json.Marshal(msg)
	if err != nil {
		fmt.Println("JSON marshaling error:", err)
		return
	}
	send(e.Conn, string(jsonData))
}

func (e *Event) OnChannel(event string, callback func(float64, float64, any)) {
	data := e.Data
	if _, ok := data["channel"]; ok {
		chData := data["data"].(map[string]interface{})
		if chData["type"].(string) == event && data["channel"] != nil {
			callback(data["id"].(float64), data["channel"].(float64), chData["data"])
		}
	}
}

func (e *Event) OnSocket(event string, callback func(float64, any)) {
	data := e.Data
	if _, ok := data["channel"]; !ok {
		skData := data["data"].(map[string]interface{})
		if skData["type"].(string) == event && data["channel"] == nil {
			callback(data["id"].(float64), skData)
		}
	}
}

// <----------------------------------------------------------------------------------------------> //
