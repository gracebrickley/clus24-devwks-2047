# Section 1: Welcome and Setting Up

Thanks so much for joining today! During this lab, you will learn about event driven architecture and be shown examples of different design patterns. The goal of today is to demonstrate how event-driven systems behave in different scenarios.

## Goals

This lab is meant to introduce you to different design patterns in event-driven architecture. Each section implements a different pattern, building on previous sections.

To start, we will dig into our lab environment and discuss what has been provided for us!

## Lab Guide and Conventions

### Layout

There will be five total sections of the lab, the first being this one for set up. Each section will focus on one or two aspects of event-driven architecture. There will be some interactive content on the left-hand side and text, images, or code snippets on the right. The text on the right-hand side will walk you through the interactive content on the left.

### Navigation

Each of the five sections in this workshop has its own page. To navigate between sections, you can either use the buttons at the top and bottom right of each section, or the hamburger menu in the top left.

### Images

All of the images in the provided text are viewable in a pop-out window, which will show those images at their full size. Some of the images that you'll come across are no bigger than what is displayed in the guide, while others are much bigger, and are better when viewed in their expanded display.

### Troubleshooting and Additional Info

If at any point during the lab, you run into any technical issues, please raise your hand and we will try to assist you. There is also additional information at the bottom of each section if you'd like to learn more.

### Our Environment

All of the services that you will interact with today are running inside Docker containers that are deployed using Kubernetes. You will not have to start or stop them using any tool other than this UI. The Dockerfiles to create these Docker containers can be found in the github page [linked here](https://github.com/gracebrickley/clus24-devwks-2047) if you want to dig deeper.

### A Few Things to Know

- Kafka is a distributed messaging system that allows applications to publish and subscribe to streams of data called "topics."
- A producer is an application that sends data (messages) to a specific topic (or data stream) in Kafka and a consumer is an application that reads messages from a specific topic in Kafka.
- A broker is a single server within a Kafka cluster responsible for receiving messages from producers, storing them in partitions within a topic, and delivering them to consumers.
- Lastly, Docker is a containerization platform used to run applications like Kafka.

## Exploring the Lab Repo

This workshop leverages the code found in [this repo](https://github.com/gracebrickley/clus24-devwks-2047).

### Kafka and Friends

Inside of the `docker-compose.yaml` file that has been provided to you in the github linked above, there are twelve services defined that we will use throughout the lab. I will introduce each relevant service at the beginning of each section. To start, lets talk about the first 4:

- `zookeeper`: this is a management/orchestration service that configures our Kafka brokers to work together. It is necessary to run Kafka, but we won't go into detail or interact with it at all during this workshop.
- `kafka1` and `kafka2`: these are our two Kafka brokers (configured by zookeeper) that our Producers and Consumers will connect to so that they can pass messages.
- `kafka-ui`: this tool will help us visualize what is happening inside our Kafka cluster when messages are sent/received.

### The Go Files

The golang code running in the background to help our services run is available to view at this repo: [this repo](https://github.com/gracebrickley/clus24-devwks-2047/tree/main/consumer-producer-go). We won’t be diving into the specifics of the code, but it is included in case you want to take a look at how the sandbox services work under the hood after the workshop.

## Looking at the Kafka Cluster

Let's now checkout what’s happening by jumping into the [Kafka UI](https://kafka-ui.labdev1002.com/). The first page that pops up is the Dashboard with a single cluster listed called “kafka”. We can also see this cluster listed in the navigation menu to the left.

<a href="images/s1.1.png" class="glightbox">
    <img src="images/s1.1.png" alt="Kafka UI Dashboard"/>
</a>

Now, click on the cluster’s **Topics** to explore. You may see several topics listed such as `first-topic`, `second-topic`, `new-user`, etc. As we send messages, topics will be automatically created for us that producers will send messages to, and consumers will consume messages from. All of the topics have a unique identifier prefixed to them so that you are able to filter for only your messages. You can find your identifier in the next section and can apply the filter by pasting this into the search bar in the Kafka UI Topics tab.

There is a way to preconfigure topics as well, but for the purposes of this lab, we have auto-create enabled in the `docker-compose.yaml` file.
