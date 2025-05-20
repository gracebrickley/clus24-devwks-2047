# Section 5: DLQ and the Fan-In Pattern

In our last section, we'll look at two patterns:
- The Dead-Letter Queue (aka the DLQ)
- Fan-In (of which the DLQ is an implementation)

## Kafka and Friends

Finally, let's introduce the last service in the `docker-compose.yaml` file:
- `error-consumer`: this service will help demonstrate a way to handle errors in an event-driven system.

## Dead-Letter Queue

As we saw in the last section, in an event-driven system, there is typically no one watching the events flow through different services and steps to make sure each part is succeeding, and that the saga is proceeding as expected.  This means that if an error were to occur, there is no one watching to fix it.

That's where a **Dead-Letter Queue** (or DLQ for short) comes in. This pattern is where system designers have one dedicated topic added to the Message Bus which allows any number of services to send their error events to so that they can be aggregated and tracked. 

Most event-driven systems will have more than one DLQ, but to handle errors, a minimum of one is required.

### Dead-Letter Queue in Action

To demonstrate a DLQ, we are going to take our system from the last section and add a topic for errors.  Each of the three services from last time have the same purpose, but this time they will each potentially raise errors in their workflow. This will happen automatically, in order to simulate real-life errors that can arise in your event-driven architecture.

Here is a diagram of what that will look like:

<a href="images/s5.1.jpg" class="glightbox">
    <img src="images/s5.1.jpg" alt="Dead-letter queue integrated into the saga pattern"/>
</a>

Although this doesn’t seem too different from the last section, it is important to notice that error handling is one of the most important parts of an event-driven system.  The Dead Letter Queue is arguably the most common pattern of any event-driven architecture.

The **Users** display is a simplified version of what we used in Section 4, simply meant to show users in either the *pending* or *complete* state.

Let’s click the **Onboard New User** button to send a few users to be onboarded.  Feel free to send all 10 users!

Because they are the same services from last section, there is the same built-in delay in how the users are onboarded.  Some users will take longer than others to complete, but some will never complete.  

Take a look at the **Errors** tab to see if any users that are stuck in the *pending* state are actually in an error state.

> ### Note
> In this example, we end our workflow at the error consumer.  There are other things we could possibly do with that information as well.  For example, we could trigger an email to alert admin that an error occurred and inform them at what step in the process that it happened.
> It could also be beneficial to have multiple error topics in some situations because depending on the error that is thrown, the action that should be taken may be vary.  If we have more than one error topic, that allows flexibility in how we respond to each error topic.

## Fan-In

The DLQ is a common implementation of a more generic pattern we mentioned earlier called the **Fan-In Pattern**. This is when multiple producers push events to a single topic, with one consumer-group receiving and aggregating the events.

<a href="images/s5.2.jpg" class="glightbox">
    <img src="images/s5.2.jpg" alt="Fan-in pattern"/>
</a>

In our implementation, we're using a single instance of a consumer, and aggregating the events in-memory.  In production, however, the aggregation will likely happen in a data persistence layer such as a database.

<a href="images/s5.3.jpg" class="glightbox">
    <img src="images/s5.3.jpg" alt="Fan-in pattern with persistence layer"/>
</a>

You may notice that this builds on system design that was shared in the **Additional Information** part of Section 2.

## Closing Up

At this point, we are wrapping up the workshop.  Thank you so much for joining this workshop and learning about event-driven architecture with me!

## Additional Information

### DLQ Segmentation

A common way to segment DLQs is to separate certain errors according to who (that is, which teams, or which stakeholders) are interested in those errors.  That likely means which teams will be responsible for triaging and remediating those errors.  

Another approach is to segment based on possible downstream action.  That is, if it's a manual remediation, or if there are possible downstream consumers and additional automation.  