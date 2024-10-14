# Section 4: The Saga Pattern

Now, we are going to look at a design pattern called the “Saga Pattern” which is a little more of a complex approach to event driven architecture than what we’ve already looked at.  

## Kafka and Friends

The three services in the `docker-compose.yaml` file relevant to this section are:
- `provisioner`, `authorizer`, and `notifier`: three consumer/producers that we'll use to illustrate the saga pattern.

Before we start, lets discuss two concepts that will be relevant to this section.

## Chained Events

The first concept is chained events, which is one of the most common approaches in event driven architecture.  As you can probably infer from the name, it is chaining events together.  This creates asynchronous workflows that allow the use of multiple single-responsibility services to create a more complex workflow.

Up to this point, we have viewed services as either a producer **OR** a consumer:

<a href="images/s4.4.jpg" class="glightbox">
    <img src="images/s4.4.jpg" alt="One producer, one consumer"/>
</a>

When we chain events together, we can think of services as being both consumers **AND** producers.  For example, this producer sends an event to the consumer, that then produces another event and sends it to another consumer:

<a href="images/s4.5.jpg" class="glightbox">
    <img src="images/s4.5.jpg" alt="A consumer producing an event to a downstream consumer"/>
</a>

## Consuming From Multiple Topics

The second concept we need to understand is consuming from multiple topics.  The key to the Saga Pattern is that the service that begins the “saga” is also the final service in the “saga”.  It raises the first event and is the destination for the workflow to be completed.  This means it will likely need to consume multiple topics in parallel.  This most simply looks like this:

<a href="images/s4.3.jpg" class="glightbox">
    <img src="images/s4.3.jpg" alt="A consumer watching two topics simultaneously"/>
</a>

The workflow we are simulating in this section is the onboarding of a user to a company.  A list of new users are joining the company, and we want to provision the appropriate device for them, provide necessary authorizations, and notify them once they have been granted access based on their department. 

The three services we will use are ones we haven’t discussed yet:
- **the Provisioner** listening on the `new-user` and `notified` topics
- **the Authorizer** listening on the `authorize` topic
- **the Notifier** listening on the `notify` topic

Here is a diagram of the architecture:

<a href="images/s4.1.jpg" class="glightbox">
    <img src="images/s4.1.jpg" alt="Saga Pattern with trace GET requests"/>
</a>

In more detail, these services create a mock workflow where:

1.  A device is provisioned for a new user.  This takes place in the Provisioner and is the start of the Saga.
2. A new event is raised which includes the user’s info and device ID
3. The Authorizer receives the event and issues the appropriate authorizations based on the user’s department.
4. It then raises an event to notify the new user of their authorizations.
5. The Notifier receives the event and sends the new user and email.
6. An event is raised indicating that the new user has been notified
7. The Provisioner receives the event indicating that the user has been notified and notes that the Saga is completed for that user.

Because this is a workshop, these steps are mocked, but the behavior mimics what would happen in real life in an event-driven architecture system.  This includes an unpredictable lag.  This is because there is nothing that guarantees our individual services will finish processing each event in order.
## Asynchronous Event Flows

To the left, you will see that under the “Onboard New User” button, there is a toggle for “Trace Mode” which is enabled to start for now.  While on, we will be able to trace exactly where each user’s saga is in the cycle, or where the data is in relation to the consumers as they receive events in their step in the workflow.

## Our Pre-Packaged Consumers

Now that we’ve learned about the two concepts behind this design pattern and looked at the architecture diagram of the design, lets experiment with demonstrating it!  

Open back up Docker Desktop and click the play button on the containers named `provisioner`, `authorizer`, and `notifier`.  These will help us illustrate the saga pattern.

Once we have those up and running, click the **Onboard New User** button several times to see how the data flows asynchronously across the services.

As you can see, different sets of data don’t complete in order.  This would likely happen in a production environment where multiple producers and consumer groups are handling hundreds or thousands of data points each second.  

## Lack of Visibility

In a production environment, we wouldn’t be able to monitor each step of an event-driven architecture system.  To be more realistic, let’s turn off **Trace Mode** to remove the visibility into the steps so that we only see the final result once the saga completes.

<a href="images/s4.2.jpg" class="glightbox">
    <img src="images/s4.2.jpg" alt="Saga Pattern with little visibility"/>
</a>

Go ahead and let’s click the **Onboard New User** button a few more times to see the Saga Pattern at work without insight into each step.  

Isn’t it a little nerve-wracking not knowing what’s happening?  Here is a question to ponder as we move into our next section: if something goes wrong at some point in the saga, how and when would we know?

## Moving on

For the next section, let’s leave the Producer and these services running.  We will build on these for Section 5.  When you’re ready, click the button to move onto the next section.

<hr>

## Additional Information

### Single-Responsibility Services

The benefit of single-responsibility services (e.g. services listening to generic topics such as `authorize` or `notify`) is that these services can be used for multiple, composable workflows.  Ideally your services should be *as reusable as possible* for simple tasks, and can consume from any producer that pushes data to the topics that they're listening to.

### Closed vs Open Loop Sagas

In this section, we looked at a *closed-loop* saga, meaning every event contributed to the completion of the saga in question.  Alternatively, an open-loop could spawn events with downstream consumers that are not part of the saga.  This makes for a more complex system, but also increases the potential for workflow automation as different patterns are merged for composable logic.

### Fully vs Partially Automated Systems

Usually we want our event-driven systems to automate as much of a workflow as possible.  However, it is entirely valid to create a partially-automated system, with a manual step being added to a certain part of the workflow.  Ticketing systems - e.g. helpdesk ticket tracking - are an example of a partially-automated workflow. A ticket ca be created, categorized, prioritized, and assigned using chained events, but the actual work on that ticket is manual.  Once the ticket is marked as complete, a notification can be sent to the stakeholder, analytics can be performed on the ticket time, and a new ticket can be assigned, all with downstream automation. 

## Troubleshooting the Docker Services

If you're having trouble getting events to show up in the trace table above, there may be a problem with your Docker containers.  Make sure that when you stand up the different containers, you run the command as it is shown above.  The services for this section are not meant to be spun up at the same time as the core Kafka services, as there is a delay in Kafka coming up vs being consumer-ready that causes the saga-focused services to crash.

Alternatively, (and this is repeated from Section 2) if the services aren't able to join their consumer groups, then it's likely a problem with the Kafka cluster itself - specifically the topics are assigned to brokers IDs that may not match the active broker IDs. This is usually because the Zookeeper container was run against multiple Kafka containers.  The best way to solve this is to kill all of the containers related to the Kafka cluster, and then start it all up again using the Docker command listed in Section 2.   