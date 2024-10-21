# Section 2: First Event Messages

## Kafka and Friends

Let's introduce two new services in the `docker-compose.yaml` file:
- `producer`: this service will help us to send messages to the Message Bus and ultimately our consumers.
- `primary-consumer`: this service will demonstrate consuming a message from the Message Bus.

## Setup

If you look to the left, you will see two boxes representing the producer and the consumer.  The lab is looking for both and can’t find them, which means that they aren’t running.  Let’s solve that right now.

## Running the Producer

First, let’s get the Producer up and running.  Go into Docker Desktop, find the service titled `producer`, and click the play button.

If that is working as expected (i.e. not crashing with an error), the panel to the left should indicate that the Producer is online.  Nicely done!  The system should currently look like this:

<a href="images/s2.1.jpg" class="glightbox">
    <img src="images/s2.1.jpg" alt="A producer pushing data to a message bus"/>
</a>

In this section, we're working with the topic called `first-topic`, which will be automatically created as messages are sent to it.  As a reminder, a topic is a stream of data that applications can publish to and subscribe to.

Let’s try and send some messages now! Click on the “Send Event” button a few times to send messages to the Kafka cluster. To verify everything is working as expected, open the <a href="http://localhost:8080/ui/clusters/local/all-topics/first-topic/messages?keySerde=String&valueSerde=String&limit=100" target="_blank">Kafka UI</a> tab to see that `first-topic` was created, and the message count on the topic should increase each time you click the button.

## Running the Consumer

Now, let’s get the consumer up and running.  Go into Docker Desktop, find the service titled `primary-consumer`, and click the play button.  The workshop UI should now reflect that the Consumer is online.

Let’s try clicking **Send Event** again now that the Consumer is running.  As we click the button, the UI sends a POST request to the Producer, which will turn into an Event that is sent to the `first-topic` topic in Kafka and is then received by the Consumer.  Last, the UI runs the GET request.

> ### Note
> If you look at the time stamps, you may notice that when the event is consumed is several seconds after the event is produced.  There is a bit of lag between the two, but there’s a tradeoff for this that we will now demonstrate.  

### Compensating for Downtime

Let’s see what happens if the Consumer were to crash.  Open Docker Desktop and click the stop button for the `primary-consumer`.  Then go back into the workshop UI and send a few events.  The events are not being registered by the consumer because it is offline.  

Now, go back to Docker Desktop and restart the `primary-consumer` again.  Notice in the workshop UI that all of the events sent while the Consumer was down, now appear to be registered by the Consumer.

If the Consumer goes offline and messages are sent, they are still sent to the Message Bus and stored in the topic.  Then, when the Consumer comes back online, all the messages that occurred in the downtime are waiting for it.  This is different than other designs like service-to-service REST requests because events are never missed or lost if anything is offline or goes wrong.

## Moving on

Leave the Producer and Consumer running, and click the button at the top or bottom of the page to move on to the next section.

<hr>

## Additional Information

### Bootstrap Servers

Even though we only need to connect to one broker to start that initial connection to the full cluster, it's always a good idea to give your Producers and Consumers more than one address to connect to.  If the first broker is down, the next address in the list will be used.

### Kafka Message Serialization

Kafka will only send raw bytes, so both the Producer and Consumer have to have a common understanding of how to read and process those bytes.  Other message bus solutions, like Kinesis and RabbitMQ, will accept data of any format and serialize it behind the scenes.  There are performance and implementation considerations for both approaches to serialization that are beyond the scope of this workshop.

### Using Environment Variables

We may be using this `consumer.py` file to connect to a local Kafka cluster; but because we're using environment variables to configure the connection, we can use this same file to connect to any Kafka cluster that is available and accessible.  This follows an approach known as **12-Factor**, which you can read more about here: [https://12factor.net/](https://12factor.net/).

### Asynchronous I/O

The `consumer.py` and `consumer-producer/cp.py` files both use a Kafka library called [aiokafka](https://github.com/aio-libs/aiokafka), which uses [asyncio](https://docs.python.org/3/library/asyncio.html) to consume events from Kafka. The reason this is so important, and the reason we're not using the long-standing [kafka-python](https://kafka-python.readthedocs.io/en/master/) library that is used in `producer.py`, is that topic consumption is a blocking process. That means the consumer function itself blocks anything else from happening (e.g. a RESTful API).      

## Troubleshooting the Producer and the Consumer

If either the Producer or Consumer do not show as connected, check to ensure that the `producer` and `primary-consumer` services in Docker Desktop are running.

Additionally, if the services aren't able to join their consumer groups, then it's likely a problem with the Kafka cluster itself - specifically the topics are assigned to brokers IDs that may not match the active broker IDs. This is usually because the Zookeeper container was run against multiple Kafka containers.  The best way to solve this is to kill *and delete* all of the containers related to the Kafka cluster, and then start it all up again using the Docker command listed above.