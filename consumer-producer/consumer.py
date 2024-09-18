import os
from asyncio import Task
from datetime import datetime
from typing import Optional, Set

from aiokafka import AIOKafkaConsumer, errors, TopicPartition
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
import asyncio
import json
import logging


# KAFKA CONSUMER CONFIGURATION
##############################
KAFKA_TOPIC = os.environ.get('KAFKA_TOPIC')
KAFKA_BOOTSTRAP_SERVERS = (
    os.environ.get('KAFKA_BOOTSTRAP_SERVERS').split(",")
)
CONSUMER_GROUP = os.environ.get('CONSUMER_GROUP')


# GLOBAL VARIABLES
##################
consumer: Optional[AIOKafkaConsumer] = None
consumer_task: Optional[Task] = None
messages = []
user_statuses = {}


# INITIALIZING LOGGER
#####################
logging.basicConfig(format='%(asctime)s - %(levelname)s - %(message)s',
                    level=logging.INFO)
log = logging.getLogger(__name__)


# KAFKA CONSUMER FUNCTIONALITY
##############################
async def initialize():
    global consumer
    log.debug(f'Initializing KafkaConsumer for topic {KAFKA_TOPIC}, group_id {CONSUMER_GROUP}'
              f' and using bootstrap servers {KAFKA_BOOTSTRAP_SERVERS}')

    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        group_id=CONSUMER_GROUP
    )
    await consumer.start()

    partitions: Set[TopicPartition] = consumer.assignment()
    for tp in partitions:
        await consumer.seek_to_committed(tp)
        return


async def read_incoming_messages(kafka_consumer):
    try:
        async for msg in kafka_consumer:
            log.info(f"Consumed msg: {msg}")
            event = msg.value
            event["consumed"] = get_pretty_time_with_milliseconds()
            messages.append(event)
    except errors.KafkaError:
        log.exception(f'Kafka error {errors.KafkaError}')
    except Exception:
        log.exception(f'General error {Exception}')
    finally:
        log.warning('Stopping consumer')
        await kafka_consumer.stop()


async def consume():
    global consumer_task
    consumer_task = asyncio.create_task(read_incoming_messages(consumer))


def get_pretty_time_with_milliseconds():
    """Returns the current time in a pretty format with milliseconds."""
    now = datetime.now()
    formatted = now.strftime("%H:%M:%S:%f")
    return formatted[:-3]


# API FUNCTIONALITY
###################
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    log.info('Initializing API ...')
    await initialize()
    await consume()


@app.on_event("shutdown")
async def shutdown_event():
    log.info('Shutting down API')
    consumer_task.cancel()
    await consumer.stop()


@app.get("/")
async def list_messages():
    data = []
    for m in messages:
        data.append(m)

    messages.clear()
    return data


@app.get("/statuses")
async def list_messages():
    return user_statuses


@app.get("/ping")
async def ping():
    return "pong:{}".format(CONSUMER_GROUP)


# APPLICATION STARTUP
#####################
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=os.environ.get("PORT", 8000))


