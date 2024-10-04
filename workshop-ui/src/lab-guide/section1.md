# Section 1: Welcome and Setting Up

Hi everyone, thanks so much for joining today!  During this presentation, we will be discussing event driven architecture and showing examples of different design patterns.   The goal of today is to demonstrate how event-driven systems behave in different scenarios.

## Goals

This lab is meant to introduce you to different design patterns in event-driven architecture. Each section implements a different pattern, building on previous sections.

To start, we will set up our lab environment and look at what has been provided for us!  Also, if you have not already done so, go ahead and prepare for the workshop by downloading Docker Desktop [here](https://www.docker.com/products/docker-desktop/).

## Lab Guide and Conventions

### Layout

There will be five total sections of the lab, the first being this one for set up.  Each section will focus on one or two aspects of event-driven architecture.  There will be some interactive content on the left-hand side and text, images, or code snippets on the right.  Feel free to read as we go or follow along!

### Navigation

Each of the five sections in this workshop has its own page.  To navigate between sections, you can either use the buttons at the top and bottom right of each section, or the hamburger menu in the top left.

### Images

All of the images in the provided text are viewable in a pop-out window, which will show those images at their full size.  Some of the images that you'll come across are no bigger than what is displayed in the guide, while others are much bigger, and are better when viewed in their expanded display.

### Copying Code Snippets

For the most part, we will be using Docker Desktop to help us demonstrate in each section, but the code to run each example is included in a code snippet box that can be copied if you want to experiment.  Clicking on the copy icon in the right side of the box will copy the code to your clipboard, so you can paste wherever you need.

Here's an example:

#### Snippet 1.1
<span class="copy"></span>
```sh
echo "Cisco Live"
```

### Troubleshooting and Additional Info

If at any point during the lab, you run into any technical issues, there are troubleshooting pointers at the bottom of each page for each section.  If you are unable to solve the problem using those pointers, please raise your hand and we will try to assist you.  There is also additional information at the bottom of each section if you'd like to learn more.

### Our Environment

There is only one terminal command we should need to run, and we will do that together at the root of this repository.  This command will prepare our services in Docker Desktop so that we can just use that tool to stop and start them as we go.  While we will have to run one command in the terminal, most of the work will be done in Docker Desktop and this UI. 

Kafka is a distributed messaging system that allows applications to publish and subscribe to streams of data called "topics."  A producer is an application that sends data (messages) to a specific topic (or data stream) in Kafka and a consumer is an application that reads messages from a specific topic in Kafka.  A broker is a single server within a Kafka cluster responsible for receiving messages from producers, storing them in partitions within a topic, and delivering them to consumers.  Lastly, Docker is a containerization platform used to run applications like Kafka.

## Exploring the Lab Repo

This workshop leverages the code found in [this repo](https://github.com/gracebrickley/clus24-devwks-2047).  

### Kafka and Friends

Let’s now take a look at the `docker-compose.yaml` file that has been provided to you.  There are twelve services defined in the file that we will use throughout the lab:
- `zookeeper`: this is a management/orchestration service that configures our Kafka brokers to work together. It is necessary to run Kafka, but we won't go into detail or interact with it at all during this workshop.
- `kafka1` and `kafka2`: these are our two Kafka brokers (configured by zookeeper) that our Producers and Consumers will connect to so that they can pass messages.
- `kafka-ui`: this tool will help us visualize what is happening inside our Kafka cluster when messages are sent/received.
- `producer`: this service will help us to send messages to the Message Bus and ultimately our consumers.
- `primary-consumer`, `blue-consumer`, and `orange-consumer`: these three services will demonstrate how consumers behave and interact with one another given different configurations. 
- `provisioner`, `authorizer`, and `notifier`: three consumer/producers that we'll use to illustrate the saga pattern in Section 4.
- `error-consumer`: this service will mimic a way to handle errors in an event-driven system in Section 5.

### The Python Files

The python code running in the background to help our services run is available to view at this repo: [this repo](https://github.com/gracebrickley/clus24-devwks-2047). We won’t be diving into the specifics of the code, but it is included in case you want to take a look at how the sandbox services work under the hood after the workshop.

## Running the Kafka Cluster

If we are all ready to go, we are now going to run our Kafka Cluster.  Let’s copy this code snippet to our clipboard:  

#### Snippet 1.2
<span class="copy"></span>
```sh
curl -O https://raw.githubusercontent.com/gracebrickley/clus24-devwks-2047/main/docker-compose.yml
```

#### Snippet 1.3
<span class="copy"></span>
```sh
docker compose up
```

Now, paste the code snippets into the terminal in a folder one at a time and click “enter.”  This may take a few seconds to run.

Please open Docker Desktop and look at all our services.  There should be 4 out of 12 running (`zookeeper`, `kafka-ui`, `kafka1`, and `kafka2`).

Now that we have verified that everything is up and running, lets checkout what’s happening by jumping into the [Kafka UI](http://localhost:8080).  The first page that pops up is the Dashboard with a single cluster listed called “local”.  We can also see this cluster listed in the navigation menu to the left.

<a href="images/s1.1.png" class="glightbox">
    <img src="images/s1.1.png" alt="Kafka UI Dashboard"/>
</a>

Now, click on the local cluster’s **Topics** to explore.  As you can see, there are no topics listed yet.  As we send messages, topics will be automatically created for us that producers will send messages to, and consumers will consume messages from.

There is a way to preconfigure topics as well, but for the purposes of this lab, we have auto-create enabled in the `docker-compose.yaml` file.

## Troubleshooting the Kafka Services

If either of the Kafka brokers are not running, or if the topics are showing error statuses for their partitions, the best way to solve this problem is to stop the Kafka services by pressing the "stop" button in Docker Desktop. Then, select the checkbox and press the trash button to remove the existing containers.

This will remove the containers *and remove their temporary storage space on disk,* which is likely the cause of any services crashing due to stale data from a previous run.

Now run the `docker compose up` command again:

#### Snippet 1.5
<span class="copy"></span>
```sh
docker compose up
```
