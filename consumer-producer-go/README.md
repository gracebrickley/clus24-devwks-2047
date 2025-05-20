# Consumer-Producer Go Project

This project implements a Kafka consumer and producer in Go, along with a combined functionality that integrates both. The project is structured into three main components: the consumer, the producer, and the combined consumer-producer functionality.

## Project Structure

```
consumer-producer-go
├── consumer
│   ├── consumer.go        # Implementation of the Kafka consumer
│   ├── go.mod             # Go module file for the consumer
│   └── go.sum             # Dependency checksums for the consumer
├── producer
│   ├── producer.go        # Implementation of the Kafka producer
│   ├── go.mod             # Go module file for the producer
│   └── go.sum             # Dependency checksums for the producer
├── cp
│   ├── cp.go              # Combined consumer and producer functionality
│   ├── go.mod             # Go module file for the combined functionality
│   └── go.sum             # Dependency checksums for the combined functionality
├── Dockerfile_consumer     # Dockerfile for the consumer application
├── Dockerfile_cp           # Dockerfile for the combined consumer and producer application
├── Dockerfile_producer      # Dockerfile for the producer application
└── README.md               # Project documentation
```

## Setup Instructions

1. **Clone the Repository**
   ```
   git clone <repository-url>
   cd consumer-producer-go
   ```

2. **Build the Docker Images**
   - For the consumer:
     ```
     docker build -t consumer -f Dockerfile_consumer .
     ```
   - For the producer:
     ```
     docker build -t producer -f Dockerfile_producer .
     ```
   - For the combined functionality:
     ```
     docker build -t cp -f Dockerfile_cp .
     ```

3. **Run the Docker Containers**
   - To run the consumer:
     ```
     docker run -d --name consumer consumer
     ```
   - To run the producer:
     ```
     docker run -d --name producer producer
     ```
   - To run the combined functionality:
     ```
     docker run -d --name cp cp
     ```

## Usage

- The producer listens for incoming events and sends them to the specified Kafka topic.
- The consumer listens for messages on specified topics and processes them accordingly.
- The combined functionality manages both the consumer and producer, allowing for seamless interaction between the two.

## Dependencies

This project uses the following dependencies:
- Kafka client for Go
- HTTP framework for handling requests

Make sure to check the `go.mod` files in each component for specific dependency versions.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.