# Section 2: First Event Messages

## Running the Producer

If you look to the left, you'll notice there's an indicator showing that this lab guide is looking for a Producer and can't seem to find it, which indicates that it's not running.  Let's solve that problem right now.

The `producer.py` file requires some configuration before we can run it. Lines 13-16 show the configuration data points necessary for running the consumer; however those data points are empty.  If we were to run this code right now, we would get an error.

Let's populate those configuration values so that we can set up a Producer connection to our Kafka cluster:

<span class="copy"></span>
```python
producer = KafkaProducer(
    bootstrap_servers=[
        '127.0.0.1:9093', 
        '127.0.0.1:9094'
    ],
    value_serializer=lambda m:
        json.dumps(m).encode('utf-8'),
)
```

The first configuration, `bootstrap_servers`, tells our Python code where to look for Kafka brokers to connect to in order to *initialize* a connection.  Once the connection is made, the broker will tell the Producer all that it needs to know about the cluster, so that it can send events to any one of the brokers that are available.

The second configuration tells our code how to *serialize* the data it sends into a byte array - that is, how to convert it into a raw byte array.

With that configured, let's run the Producer by typing the following in a command line, in the local repo directory:

<span class="copy"></span>
```shell
python3 producer.py
```

If your configuration was correct, the panel to the left should indicate that the Producer is online.  Nicely done!

Click on the button to the left a few times to send some messages to the Kafka cluster. You can check in the [Kafka UI](http://localhost:8080/ui/clusters/local/all-topics/Topic1/messages?keySerde=String&valueSerde=String&limit=100) tab to see the message count on the `first-topic` topic increase each time you click the button.

## Running the Consumer

Configuring the consumer requires a little more input, and this time, instead of hard-coding our configuration values, we'll pass in environment variables to set up our Kafka connection.

In the `consumer.py` file, you'll notice lines 18 - 22 have constants set by environment variables:
```py
KAFKA_TOPIC = os.environ['KAFKA_TOPIC']
KAFKA_BOOTSTRAP_SERVERS = (
    os.environ["KAFKA_BOOTSTRAP_SERVERS"].split(",")
)
KAFKA_GROUP = os.environ["KAFKA_GROUP"]
```

When we run this file, we can pass in whatever values we want to ensure that this Consumer connects to the right Kafka cluster. To do that, we'll need to set those values when we run this file:

<span class="copy"></span>
```sh
KAFKA_TOPIC="first-topic" \
KAFKA_BOOTSTRAP_SERVERS="localhost:9093,localhost:9094" \
KAFKA_GROUP="first-group" \
python consumer.py
```

Once that's connected, you should see a log printed to the console saying, *"Starting consumer on topic first-topic, in group first-group"*.

Try clicking the **Send Event** button to the left a few times. Each time you do, the UI will send a POST request to the Producer, which will turn it into an Event that is sent to the `first-topic` topic in Kafka, and ultimately received by the Consumer. The UI, Producer, and Consumer will all each a time at which the event was handled.  

<hr>

## Additional Information

**Bootstrap Servers:** Even though we only need to connect to one broker to start that initial connection to the full cluster, it's always a good idea to give your Producers and Consumers more than one address to connect to.  If the first broker is down, the next address in the list will be used.

**Kafka Message Serialization:** Kafka will only send raw bytes, so both the Producer and Consumer have to have a common understanding of how to read and process those bytes.  Other message bus solutions, like Kinesis and RabbitMQ, will accept data of any format and serialize it behind the scenes.  There are performance and implementation considerations for both approaches to serialization that are beyond the scope of this workshop.

**Using Environment Variables for Connection Configuration:** We may be using this `consumer.py` file to connect to a local Kafka cluster; but because we're using environment variables to configure the connection, we can use this same file to connect to any Kafka cluster that is available and accessible.  This follows an approach known as **12-Factor**, which you can read more about here: [https://12factor.net/](https://12factor.net/).

### Troubleshooting the Producer

If the Producer does not show as connected, check your `KafkaProducer` configuration again, ensuring that it matches what's shown above. Also be sure to check that the RESTful endpoints in the Producer are correctly configured. There should be at least one `GET` endpoint listening at `http://localhost:5000/ping`, which the lab guide uses to determine if the Producer is available.