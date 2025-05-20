package main

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/confluentinc/confluent-kafka-go/kafka"
)

var producer *kafka.Producer

func init() {
    var err error
    producer, err = kafka.NewProducer(&kafka.ConfigMap{
        "bootstrap.servers": os.Getenv("KAFKA_BOOTSTRAP_SERVERS"),
    })
    if err != nil {
        panic(err)
    }
}

func receiveEvent(w http.ResponseWriter, r *http.Request) {
    var requestData map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    requestData["produced"] = getPrettyTimeWithMilliseconds()
    prefix := requestData["prefix"].(string)
    topic := prefix + "first-topic"
    if t, ok := requestData["topic"]; ok {
        topic = prefix + t.(string)
    }

    value, err := json.Marshal(requestData)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    producer.Produce(&kafka.Message{
        TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
        Value:          value,
    }, nil)

    producer.Flush(15 * 1000)
    w.WriteHeader(http.StatusOK)
}

func getPrettyTimeWithMilliseconds() string {
    now := time.Now()
    return now.Format("15:04:05.000")
}

func main() {
    http.HandleFunc("/", receiveEvent)
    http.ListenAndServe(":8080", nil)
}