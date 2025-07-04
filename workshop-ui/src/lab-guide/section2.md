# Section 2: First Event Messages

## Kafka and Friends

Let's introduce two new services in the `docker-compose.yaml` file:
- `producer`: this service will help us to send messages to the Message Bus and ultimately our consumers.
- `primary-consumer`: this service will demonstrate consuming a message from the Message Bus.

## Setup

If you look to the left, you will see two boxes representing the producer and the consumer.  The producer should be online and the consumer should be offline to start.  Do not press the start listener button until you are told to do so.

## About the Producer

In this section, we're working with the topic called `first-topic`, which will be automatically created as messages are sent to it.  As a reminder, a topic is a stream of data that applications can publish to and subscribe to.  

You should be able to see the unique identifier prefixed to `first-topic` in the consumer box to the left.  Go ahead and copy that value and paste it into the search bar in the Topics tab of the Kafka UI to filter only your topics.

Let’s try and send some messages now! Click on the “Send Event” button a few times to send messages to the Kafka cluster. To verify everything is working as expected, open the <a href="https://kafka-ui.labdev1002.com/ui/clusters/kafka/all-topics/" target="_blank">Kafka UI</a> tab to see that `first-topic` was created (prefixed with your identifier), and the message count on the topic should increase each time you click the button.

## Running the Consumer

Now, let’s go ahead and start up the consumer.  Click the `Start Listener` button found in the consumer panel.  After a few seconds, the workshop UI should now reflect that the Consumer is online.

Let’s try clicking **Send Event** again now that the Consumer is running.  As we click the button, the UI sends a POST request to the Producer, which will turn into an Event that is sent to the `first-topic` topic in Kafka and is then received by the Consumer.  Last, the UI runs the GET request.

> ### Note
> If you look at the time stamps, you may notice that when the event is consumed is several seconds after the event is produced.  There is a bit of lag between the two, but there’s a tradeoff for this that we will now demonstrate.  

### Compensating for Downtime

Let’s see what happens if the Consumer were to crash.  Let's mimic this by pressing the `Stop Listener` button in the consumer panel.  Then go ahead and send a few more events.  The events are not being registered by the consumer because it is offline.

If we restart the consumer by pressing the `Start Listener` button again, you should notice in the workshop UI that all of the events sent while the Consumer was down, now appear to be registered by the Consumer.

If the Consumer goes offline and messages are sent, they are still sent to the Message Bus and stored in the topic.  Then, when the Consumer comes back online, all the messages that occurred in the downtime are waiting for it.  This is different than other designs like service-to-service REST requests because events are never missed or lost if anything is offline or goes wrong.

## Moving on

Press the `Stop Listener` button in the consumer panel, and click the button at the top or bottom of the page to move on to the next section.

<hr>

## Additional Information

### Bootstrap Servers

Even though we only need to connect to one broker to start that initial connection to the full cluster, it's always a good idea to give your Producers and Consumers more than one address to connect to.  If the first broker is down, the next address in the list will be used.

### Kafka Message Serialization

Kafka will only send raw bytes, so both the Producer and Consumer have to have a common understanding of how to read and process those bytes.  Other message bus solutions, like Kinesis and RabbitMQ, will accept data of any format and serialize it behind the scenes.  There are performance and implementation considerations for both approaches to serialization that are beyond the scope of this workshop.

### Using Environment Variables

We may be using this `consumer.go` file to connect to a local Kafka cluster; but because we're using environment variables to configure the connection, we can use this same file to connect to any Kafka cluster that is available and accessible.  This follows an approach known as **12-Factor**, which you can read more about here: [https://12factor.net/](https://12factor.net/).