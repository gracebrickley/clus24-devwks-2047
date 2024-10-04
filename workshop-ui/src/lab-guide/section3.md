# Section 3: Consumer Groups

In this section we'll experiment with Consumer Groups to see how multiple consumers handle events on the same topic.

The page should look similar to the last, but with an extra, “Second Consumer.”  The Producer and existing, “First Consumer” should still be running from the last section.  

## What is a Consumer Group?

First, let’s talk about what a consumer group is.  Kafka keeps track of which consumers are subscribed to specific topics to ensure that each consumer only receives a message once.  In most cloud-based systems, we generally want to ensure high availability.  High availability is a design approach that allows a system to continue operating without failure, even when individual components fail.  This often means running more than one instance of a microservice.

Knowing that, we can arrange multiple consumers into **Consumer Groups**.  Kafka keeps track of which consumer groups are subscribed to a topic, as well as which consumers are a part of which group.  Now, let’s experiment to see how Consumer Groups behave!

## Multiple Consumers in the Same Group

First, let’s start up the second Consumer.  We need to go into Docker Desktop and click the play button for the container that’s named `blue-consumer`.  Once this consumer is up and running, the workshop UI should show the group for the second Consumer as `blue-group` in blue text.  

The system now looks like this:

<a href="images/s3.1.jpg" class="glightbox">
    <img src="images/s3.1.jpg" alt="Multiple consumers in the same consumer group"/>
</a>

It’s very similar to before, but with both consumers in the same consumer group.  Let’s try it out and see what happens!

Click the **Send Event** button a few times and watch what happens.  

As you can see, the events are split between the two Consumers!  This happens because Kafka knows that both Consumers are in the same Consumer Group and splits events between them.  There is an option to configure how events are distributed among Consumers in a Consumer Group but we are using the default which is a *roughly* even distribution.

> ### Discussion
> What is the benefit of having multiple consumer instances in the same group?

### Downscaling (or Crashing) an Instance

Now, let’s mimic what would happen if one of our instances were to crash.  Go ahead and go into Docker Desktop and press the stop button on the container named `blue-consumer`.  Then, go back to the workshop UI and send a few more events.  

We can see that Kafka sends all events to the First Consumer because it knows that the Second Consumer is offline.  This is good in terms of high availability because no events/messages are lost in the case of component failure.

## Different Groups, the Fan-Out Pattern

Next, we are going to start the second consumer again, but this time it will be a part of a **different Consumer Group**.  Go into Docker Desktop and start the container named `orange-consumer`.  Once you see that the Second Consumer is online again, it should also say it is a part of the `orange-group`.  Now, the system looks like this:

<a href="images/s3.2.jpg" class="glightbox">
    <img src="images/s3.2.jpg" alt="Two consumers in different consumer groups"/>
</a>

It is very similar to the last diagram, but each Consumer is in its own Consumer Group.

Now click the **Send Event** button again.

Each Consumer Group will receive the events on the `first-topic` once. This is a very basic implementation of what's known as the **Fan-Out Pattern**.

Notice that each Consumer Group receives each event once.  This is an implementation of the **Fan-Out Pattern**. Notice that each Consumer receives and processes the same event in parallel, meaning that each Consumer displays its own “consumed time” to the event before it is read back by the UI. 

> ### Note
>This pattern is helpful when there are multiple services that need information from a producer.

## Moving on

We are going to move onto the next section now.  Leave the Producer running, but press the stop button on both Consumers in Docker Desktop and lets click the button to move on to Section 4.

<hr>

## Additional Information

### Data Unification Within a Consumer Group

If each consumer in a group is tracking its own list of events, we'll have to figure out a mechanism to unify the sum of both consumers' data into a single list.  This is usually done with a data store that both consumers are pushing data into:

<a href="images/s3.5.jpg" class="glightbox">
    <img src="images/s3.5.jpg" alt="Both consumers push data into a database"/>
</a>

### Scaling Concerns

The following architecture depicts a significantly scaled-out fan-out pattern:

<a href="images/s3.3.jpg" class="glightbox">
    <img src="images/s3.3.jpg" alt="Scaled-out fan-out"/>
</a>

Each consumer group has to be tracked by the brokers, which means more work is being done on this topic.  This is a valid approach, *if each consumer will really use each event coming through*.

### Segmented Fan-Out

It's more likely that there are going to be ways to segment the fan-out, meaning that slight differences in what each consumer from the events they receive will allow you to break up a large fan-out into smaller segments:

<a href="images/s3.4.jpg" class="glightbox">
    <img src="images/s3.4.jpg" alt="Segmented fan-out"/>
</a>

## Troubleshooting the Consumers

If you notice that only one consumer is receiving messages when both consumers are running in the same consumer group, here are some things to look out for:
- First check that both Kafka brokers are running.  Run `docker ps -f "name=kafka"` in a Terminal window to see the status of the Kafka containers.
- Check to ensure that `first-topic` is configured to have **2 Partitions** and a **Replication Factor of 2**.  You can edit this in the [Kafka-UI](http://localhost:8080) by clicking into the Topics panel, selecting `first-topic`, and clicking *Edit Settings* under the three-dot menu in the top-right.