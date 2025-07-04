import json, os
from datetime import datetime

from flask import Flask, request
from flask_cors import CORS, cross_origin
from kafka import KafkaProducer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": ["https://app.labdev1002.com"]}})

producer = KafkaProducer(
    bootstrap_servers=os.environ.get('KAFKA_BOOTSTRAP_SERVERS').split(","),
    # bootstrap_servers=[
    #     "localhost:9093",
    #     "localhost:9094"
    # ],
    value_serializer=lambda m:
        json.dumps(m).encode('utf-8'),
)

@app.post('/')
@cross_origin()
def receive_event():  # put application's code here
    logger.info("Received request to produce message")
    request_data = request.get_json()
    logger.info("here is the request: %s", request)
    logger.info("here is the request data: %s", request_data)
    request_data["produced"] = get_pretty_time_with_milliseconds()
    prefix = request_data["prefix"]
    topic = prefix + "-first-topic"
    if "topic" in request_data:
        topic = prefix + "-" + request_data["topic"]
    logger.info(f"Sending request data to topic: {topic} | request_data: {request_data}")
    producer.send(topic, request_data)
    producer.flush(timeout=5)
    logger.info("Produced message to topic %s at %s", topic, request_data['produced'])
    return request_data


@app.route('/ping')
@cross_origin()
def ping():  # put application's code here
    return 'pong'


def get_pretty_time_with_milliseconds():
    """Returns the current time in a pretty format with milliseconds."""
    now = datetime.now()
    formatted = now.strftime("%H:%M:%S:%f")
    return formatted[:-3]


if __name__ == '__main__':
    app.run(port=os.environ.get("PORT", 8888), host=os.environ.get("HOST", "0.0.0.0"))


