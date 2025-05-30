package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

type Message struct {
	ID       string   `json:"id"`
	DeviceID int64    `json:"device_id"`
	Notified bool     `json:"notified"`
	Errors   []string `json:"errors,omitempty"`
}

var MessageMap = make(map[string][]string)
var messageMapMu sync.Mutex

var (
	listeners   = make(map[string]context.CancelFunc)
	listenersMu sync.Mutex
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Extract the "prefix" query parameter
		fmt.Printf("Received request to consume messages\n")
		prefix := r.URL.Query().Get("prefix")
		if prefix == "" {
			http.Error(w, "Missing 'prefix' query parameter", http.StatusBadRequest)
			return
		}
		fmt.Println("Prefix:", prefix)
		fmt.Println("Full URL:", r.URL.String())
		fmt.Println("Query Parameters:", r.URL.Query())
		topic := r.URL.Query().Get("topic")
		if topic == "" {
			topic = "first-topic"
		}
		fmt.Println("Topic:", topic)
		// Log the consumed messages
		messageMapMu.Lock()
		currMessages := MessageMap[prefix+topic]
		if currMessages == nil {
			currMessages = make([]string, 0)
		}
		fmt.Println("Current messages:", currMessages)
		MessageMap[prefix+topic] = make([]string, 0)
		messageMapMu.Unlock()
		// Send the current messages as JSON response
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(currMessages); err != nil {
			http.Error(w, "Failed to encode messages", http.StatusInternalServerError)
			return
		}
		fmt.Println("Sent messages to client")
	})
	mux.HandleFunc("/start-listener", StartListener)
	mux.HandleFunc("/stop-listener", StopListener)
	mux.HandleFunc("/ping", PingHandler)

	handlerWithCORS := corsMiddleware(mux)

	port := os.Getenv("PORT")

	log.Println("Consumer service is running on port 8000...")
	log.Fatal(http.ListenAndServe(":"+port, handlerWithCORS))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "https://app.labdev1002.com")   // Allow requests from React app
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")          // Allow specific HTTP methods
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization") // Allow specific headers

		// Handle preflight (OPTIONS) request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Pass to the next handler
		next.ServeHTTP(w, r)
	})
}

func PingHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "pong:%s", os.Getenv("CONSUMER_GROUP"))
}

func splitKafkaServers(kafkaURL string) []string {
	var brokers []string
	for _, broker := range strings.Split(kafkaURL, ",") {
		broker = strings.TrimSpace(broker)
		if broker != "" {
			brokers = append(brokers, broker)
		}
	}
	return brokers
}

func StartListener(w http.ResponseWriter, r *http.Request) {
	log.Printf("StartListener handler invoked with method: %s\n", r.Method)
	var req struct {
		Topic string `json:"topic"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request body: %v\n", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	log.Printf("Request to start listener for topic: %s\n", req.Topic)

	listenersMu.Lock()
	if _, exists := listeners[req.Topic]; exists {
		log.Printf("Listener already exists for topic: %s\n", req.Topic)
		listenersMu.Unlock()
		http.Error(w, "Listener already exists for this topic", http.StatusConflict)
		return
	}
	listenersMu.Unlock()

	ctx, cancel := context.WithCancel(context.Background())
	listenersMu.Lock()
	listeners[req.Topic] = cancel
	listenersMu.Unlock()

	go func(topic string, ctx context.Context) {
		log.Printf("Starting Kafka listener goroutine for topic: %s\n", topic)
		kafkaURL := os.Getenv("KAFKA_BOOTSTRAP_SERVERS")
		groupID := os.Getenv("CONSUMER_GROUP")
		autoOffsetReset := os.Getenv("AUTO_OFFSET_RESET")
		startOffset := int64(0)
		if autoOffsetReset == "latest" {
			startOffset = kafka.LastOffset
			log.Printf("Starting from latest offset for topic: %s\n", topic)
		} else {
			startOffset = kafka.FirstOffset
			log.Printf("Starting from first offset for topic: %s\n", topic)
		}
		brokers := splitKafkaServers(kafkaURL)
		if len(brokers) == 0 {
			log.Printf("No valid Kafka brokers found in KAFKA_BOOTSTRAP_SERVERS: %s\n", kafkaURL)
			return
		}

		r := kafka.NewReader(kafka.ReaderConfig{
			Brokers: brokers,
			GroupID: groupID,
			Topic:   topic,
			//MinBytes: 10e3, // 10KB
			MaxBytes:    10e6, // 10MB
			StartOffset: startOffset,
			MaxWait:     500 * time.Millisecond,
		})
		if r == nil {
			log.Printf("Failed to create Kafka reader for topic: %s\n", topic)
			return
		}
		defer r.Close()

		for {
			select {
			case <-ctx.Done():
				log.Printf("Stopped listener for topic: %s\n", topic)
				return
			default:
				m, err := r.ReadMessage(ctx)
				if err != nil {
					log.Printf("Error reading message from topic %s: %v\n", topic, err)
					continue
				}
				log.Printf("Received message from topic %s: %s\n", topic, string(m.Value))

				// Update MessageMap with mutex
				messageMapMu.Lock()
				MessageMap[topic] = append(MessageMap[topic], string(m.Value))
				messageMapMu.Unlock()

				log.Printf("Updated MessageMap for topic %s: %+v\n", topic, MessageMap[topic])
			}
		}
	}(req.Topic, ctx)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Listener started"))
}

func StopListener(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Topic string `json:"topic"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	listenersMu.Lock()
	cancel, exists := listeners[req.Topic]
	if !exists {
		listenersMu.Unlock()
		http.Error(w, "No listener exists for this topic", http.StatusNotFound)
		return
	}
	delete(listeners, req.Topic)
	listenersMu.Unlock()

	cancel()
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Listener stopped"))
}
