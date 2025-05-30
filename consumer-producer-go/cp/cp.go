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

var (
	kafkaBootstrapServers = os.Getenv("KAFKA_BOOTSTRAP_SERVERS")
	// consumerTopics        = os.Getenv("CONSUMER_TOPICS")
	// producerTopic         = os.Getenv("PRODUCER_TOPIC")
	groupID               = os.Getenv("CONSUMER_GROUP")
)

var (
	MessageMap   = make(map[string][]string)
	messageMapMu sync.Mutex
	producers    = make(map[string]*kafka.Writer)
    producersMu  sync.Mutex
	consumers    = make(map[string]*kafka.Reader)
	consumersMu  sync.Mutex
    isError      bool
)

func main() {
	mux := http.NewServeMux()

	// Endpoint to start a producer
	mux.HandleFunc("/start-producer", StartProducerHandler)

	// Endpoint to start a consumer
	mux.HandleFunc("/start-consumer", StartConsumerHandler)

	// Endpoint to stop a consumer
	mux.HandleFunc("/stop-consumer", StopConsumerHandler)

    // Endpoint to ping the service
    mux.HandleFunc("/ping", PingHandler)

	// Endpoint to fetch messages
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		prefix := r.URL.Query().Get("prefix")
		if prefix == "" {
			http.Error(w, "Missing 'prefix' query parameter", http.StatusBadRequest)
			return
		}

		topic := r.URL.Query().Get("topic")
		if topic == "" {
			topic = "first-topic"
		}

		messageMapMu.Lock()
		currMessages := MessageMap[prefix+topic]
		if currMessages == nil {
			currMessages = make([]string, 0)
		}
        if topic == "new-user" {
            otherCurrMessages := MessageMap[prefix+"notified"]
            currMessages = append(currMessages, otherCurrMessages...)
            MessageMap[prefix+"notified"] = make([]string, 0)
        }
		MessageMap[prefix+topic] = make([]string, 0)
		messageMapMu.Unlock()

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(currMessages); err != nil {
			http.Error(w, "Failed to encode messages", http.StatusInternalServerError)
			return
		}
	})

	// CORS middleware
	handlerWithCORS := corsMiddleware(mux)

	// Start the HTTP server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	log.Printf("Consumer service is running on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, handlerWithCORS))
}

// StartProducerHandler starts a Kafka producer
func StartProducerHandler(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Topic string `json:"topic"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        log.Printf("Error decoding request body: %v\n", err)
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    log.Printf("Request to start producer for topic: %s\n", req.Topic)

    // Check if a producer already exists for the requested topic
    if _, exists := producers[req.Topic]; exists {
        http.Error(w, "Producer for this topic is already started", http.StatusConflict)
        return
    }

    brokers := strings.Split(kafkaBootstrapServers, ",")
    if len(brokers) == 0 {
        http.Error(w, "No Kafka bootstrap servers provided", http.StatusInternalServerError)
        return
    }

    // Create a new producer for the specified topic
    producer := kafka.NewWriter(kafka.WriterConfig{
        Brokers:  brokers,
        Topic:    req.Topic,
        Balancer: &kafka.LeastBytes{},
    })

    // Store the producer in the map
    producers[req.Topic] = producer

    log.Println("Kafka producer started for topic:", req.Topic)
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Producer started for topic: " + req.Topic))
}

// StartConsumerHandler starts a Kafka consumer for a given topic
func StartConsumerHandler(w http.ResponseWriter, r *http.Request) {
    isError = false
	var req struct {
        Topic string `json:"topic"`
        Error bool `json:"error"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        log.Printf("Error decoding request body: %v\n", err)
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    isError = req.Error
    log.Printf("Error flag set to: %v\n", isError)

    log.Printf("Request to start listener for topic: %s\n", req.Topic)

	brokers := strings.Split(kafkaBootstrapServers, ",")
	if len(brokers) == 0 {
		http.Error(w, "No Kafka bootstrap servers provided", http.StatusInternalServerError)
		return
	}

	consumersMu.Lock()
	if _, exists := consumers[req.Topic]; exists {
		consumersMu.Unlock()
		http.Error(w, "Consumer already exists for this topic", http.StatusConflict)
		return
	}

	consumer := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		GroupID:  groupID,
		Topic:    req.Topic,
		// MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
        // CommitInterval: time.Second, // Periodic commit interval
        // RetentionTime:  time.Hour,   // Message retention time
        MaxWait:  500 * time.Millisecond,
	})
	consumers[req.Topic] = consumer
	consumersMu.Unlock()

	go func() {
		for {
			m, err := consumer.ReadMessage(context.Background())
			if err != nil {
				log.Printf("Error reading message from topic %s: %v", req.Topic, err)

                // Retry logic for transient errors
                if strings.Contains(err.Error(), "Leader Not Available") {
                    time.Sleep(5 * time.Second) // Wait for leadership election
                    continue
                }
                // break // Exit loop for non-recoverable errors
			}

			messageMapMu.Lock()
			MessageMap[req.Topic] = append(MessageMap[req.Topic], string(m.Value))
			messageMapMu.Unlock()

            log.Printf("Here is the message we received: %+v", m)
			log.Printf("Message received from topic %s: %s", req.Topic, string(m.Value))

            if strings.Contains(req.Topic, "new-user") {
                prefix := strings.Split(req.Topic, "new")[0]
                var messageData map[string]interface{}
                    if err := json.Unmarshal(m.Value, &messageData); err != nil {
                        log.Printf("Failed to unmarshal message value: %v", err)
                        continue
                    }
                department := messageData["dept"]
                if isError && department == "Finance" {
                    errorProducer := producers[prefix+"dlq"]
                    var messageData map[string]interface{}
                    if err := json.Unmarshal(m.Value, &messageData); err != nil {
                        log.Printf("Failed to unmarshal message value: %v", err)
                        continue
                    }
                    userId := capitalizeFirstLetter(messageData["id"].(string))
                    err := errorProducer.WriteMessages(context.Background(),
                        kafka.Message{
                            Key:   []byte(prefix+"dlq"),
                            Value: []byte(fmt.Sprintf("Provisioner: user %s is invalid; could this be a security breach?", userId)),
                        },
                    )
                    if err != nil {
                        log.Printf("Failed to write error message to DLQ: %v", err)
                    }
                } else {
                    producerTopic := prefix + "authorize"
                    producerMessage := m.Value
                    producerMessage = []byte(strings.Replace(string(producerMessage), "new-user", "authorize", 1))
                    producersMu.Lock()
                    producer, exists := producers[producerTopic]
                    if !exists {
                        log.Printf("No producer found for topic: %s", req.Topic)
                        producersMu.Unlock()
                        continue
                    }
                    err = producer.WriteMessages(context.Background(),
                        kafka.Message{
                            Key:   []byte(producerTopic),
                            Value: producerMessage,
                        },
                    )
                    if err != nil { 
                        log.Printf("Failed to write message to %s topic: %v", producerTopic, err)
                    } else {
                        log.Printf("Message sent to %s topic: %s", producerTopic, string(producerMessage))
                    }
                    producersMu.Unlock()
                }
            }
            if strings.Contains(req.Topic, "authorize") {
                prefix := strings.Split(req.Topic, "authorize")[0]
                if isError && shouldRaiseError() {
                    errorProducer := producers[prefix+"dlq"]
                    var messageData map[string]interface{}
                    if err := json.Unmarshal(m.Value, &messageData); err != nil {
                        log.Printf("Failed to unmarshal message value: %v", err)
                        continue
                    }
                    deviceId, ok := messageData["device"].(string)
                    userId := capitalizeFirstLetter(messageData["id"].(string))
                    if !ok {
                        log.Printf("device not found or not a string in message: %v", messageData)
                        continue
                    }
                    err := errorProducer.WriteMessages(context.Background(),
                        kafka.Message{
                            Key:   []byte(prefix+"dlq"),
                            Value: []byte(fmt.Sprintf("Authorizer: device type %s for user %s requires security updates, cannot authorize", deviceId, userId)),
                        },
                    )
                    if err != nil {
                        log.Printf("Failed to write error message to DLQ: %v", err)
                    }
                } else {
                    producerTopic := prefix + "notify"
                    producerMessage := m.Value
                    producerMessage = []byte(strings.Replace(string(producerMessage), "authorize", "notify", 1))
                    producersMu.Lock()
                    producer, exists := producers[producerTopic]
                    if !exists {
                        log.Printf("No producer found for topic: %s", req.Topic)
                        producersMu.Unlock()
                        continue
                    }
                    err = producer.WriteMessages(context.Background(),
                        kafka.Message{
                            Key:   []byte(producerTopic),
                            Value: producerMessage,
                        },
                    )
                    if err != nil { 
                        log.Printf("Failed to write message to %s topic: %v", producerTopic, err)
                    } else {
                        log.Printf("Message sent to %s topic: %s", producerTopic, string(producerMessage))
                    }
                    producersMu.Unlock()
                }
            }
            if strings.Contains(req.Topic, "notify") {
                prefix := strings.Split(req.Topic, "notify")[0]
                if isError && shouldRaiseError() {
                    errorProducer := producers[prefix+"dlq"]
                    var messageData map[string]interface{}
                    if err := json.Unmarshal(m.Value, &messageData); err != nil {
                        log.Printf("Failed to unmarshal message value: %v", err)
                        continue
                    }
                    userId  := capitalizeFirstLetter(messageData["id"].(string))
                    err := errorProducer.WriteMessages(context.Background(),
                        kafka.Message{
                            Key:   []byte(prefix+"dlq"),
                            Value: []byte(fmt.Sprintf("Notifier: could not find LDAP account for user %s", userId)),
                        },
                    )
                    if err != nil {
                        log.Printf("Failed to write error message to DLQ: %v", err)
                    }
                } else {
                    producerTopic := prefix + "notified"
                    producerMessage := m.Value
                    producerMessage = []byte(strings.Replace(string(producerMessage), "notify", "notified", 1))
                    producersMu.Lock()
                    producer, exists := producers[producerTopic]
                    if !exists {
                        log.Printf("No producer found for topic: %s", req.Topic)
                        producersMu.Unlock()
                        continue
                    }
                    err = producer.WriteMessages(context.Background(),
                        kafka.Message{
                            Key:   []byte(producerTopic),
                            Value: producerMessage,
                        },
                    )
                    if err != nil { 
                        log.Printf("Failed to write message to %s topic: %v", producerTopic, err)
                    } else {
                        log.Printf("Message sent to %s topic: %s", producerTopic, string(producerMessage))
                    }
                    producersMu.Unlock()
                }
            }
		}
	}()

	log.Printf("Kafka consumer started for topic: %s", req.Topic)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("Consumer started for topic: %s", req.Topic)))
}

// StopConsumerHandler stops a Kafka consumer for a given topic
func StopConsumerHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
        Topic string `json:"topic"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        log.Printf("Error decoding request body: %v\n", err)
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    log.Printf("Request to start listener for topic: %s\n", req.Topic)

	consumersMu.Lock()
	consumer, exists := consumers[req.Topic]
	if !exists {
		consumersMu.Unlock()
		http.Error(w, "No consumer exists for this topic", http.StatusNotFound)
		return
	}
	delete(consumers, req.Topic)
	consumersMu.Unlock()

	consumer.Close()
	log.Printf("Kafka consumer stopped for topic: %s", req.Topic)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("Consumer stopped for topic: %s", req.Topic)))
}

// corsMiddleware adds CORS headers to the response
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "https://app.labdev1002.com")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func PingHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "pong:%s", os.Getenv("CONSUMER_GROUP"))
}

func shouldRaiseError() bool {
    // Simulate a 10% chance of an error occurring
    return randomFloat() < 0.1
}

// capitalizeFirstLetter capitalizes the first letter of a string
func capitalizeFirstLetter(s string) string {
    if len(s) == 0 {
        return s
    }
    return strings.ToUpper(string(s[0])) + s[1:]
}

func randomFloat() float64 {
    return float64(time.Now().UnixNano()%1000) / 1000.0
}