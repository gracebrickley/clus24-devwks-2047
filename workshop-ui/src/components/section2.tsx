import * as React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  PRODUCER_URL,
  FIRST_CONSUMER_URL,
  POLLING_INTERVAL,
} from "../config/constants";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { Button, List, ListItem, ListItemText } from "@mui/material";
import { ProducerService } from "../services/producer.srvc";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Section2() {
  const [isProducerActive, setProducerActive] = useState(false);
  const [isConsumerActive, setConsumerActive] = useState(false);
  const [consumerList, setConsumerList] = useState<any[]>([]);
  const [currentEventId, setCurrentEventId] = useState<number>(1);
  const [isListenerActive, setListenerActive] = useState(false);

  useEffect(() => {
    const producerInt = setInterval(() => {
      axios
        .get(`${PRODUCER_URL}/ping`)
        .then((res) => {
          if (res.status === 200) {
            setProducerActive(true);
            console.log("section 2 producer running");
          }
        })
        .catch(() => {
          setProducerActive(false);
          console.log("section 2 producer down");
        });
    }, POLLING_INTERVAL);
    const consumerInt = setInterval(() => {
      axios
        .get(`${FIRST_CONSUMER_URL}/ping`)
        .then(async (res) => {
          console.log("IS LISTENER ACTIVE: ", isListenerActive);
          if (res.status === 200 && isListenerActive) {
            setConsumerActive(true);
            const cRes = await axios.get(
              `${FIRST_CONSUMER_URL}/?prefix=${sessionStorage.getItem(
                "UID"
              )}&topic=first-topic`
            );
            if (cRes.status === 200) {
              const items: string[] = cRes.data;
              setConsumerList((prev: string[]): string[] => [
                ...items,
                ...prev,
              ]);
            }
          }
        })
        .catch((e) => {
          console.log("HERE IS THE ERROR: ", e);
          setConsumerActive(false);
          console.log("section 2 consumer down");
        });
    }, POLLING_INTERVAL);
    return function () {
      clearInterval(producerInt);
      clearInterval(consumerInt);
      setConsumerList([]);
    };
  }, [isProducerActive, isListenerActive]);

  async function sendEvent() {
    setCurrentEventId(currentEventId + 1);
    await ProducerService.postEvent({
      prefix: sessionStorage.getItem("UID"),
      topic: "first-topic",
      id: currentEventId - 1,
      clicked: ProducerService.getPrettyTime(),
    });
  }

  async function startListener() {
    const topic = sessionStorage.getItem("UID") + "first-topic";
    await ProducerService.startListener(topic, FIRST_CONSUMER_URL);
    setListenerActive(true);
  }

  async function stopListener() {
    const topic = sessionStorage.getItem("UID") + "first-topic";
    await ProducerService.stopListener(topic, FIRST_CONSUMER_URL);
    setListenerActive(false);
  }

  function clearConsumerData() {
    setConsumerList([]);
  }

  return (
    <>
      <Paper variant={"outlined"} square={false} style={{ padding: "1rem" }}>
        <Typography variant="h4" gutterBottom>
          Producer: {!isProducerActive && "Offline"}
        </Typography>

        <Typography paragraph>
          Click the button below to send a POST request that will be converted
          to an Event by the Producer.
        </Typography>

        <Typography paragraph style={{ fontWeight: "bold" }}>
          Events sent: {currentEventId - 1}
        </Typography>

        <Button
          variant={"contained"}
          color={"secondary"}
          disabled={!isProducerActive}
          onClick={sendEvent}
        >
          Send Event
        </Button>
      </Paper>
      <Paper
        variant={"outlined"}
        square={false}
        style={{ padding: "1rem", marginTop: "2rem" }}
        className={"consumer"}
      >
        <Typography variant="h4" gutterBottom>
          Consumer: {!isConsumerActive && "Offline"}
        </Typography>

        <Typography paragraph>
          Use the buttons below to start or stop a listener for the topic:{" "}
          <strong>{sessionStorage.getItem("UID") + "first-topic"}</strong>.
        </Typography>

        <Button
          variant={"contained"}
          color={"primary"}
          disabled={isListenerActive}
          onClick={startListener}
          style={{ marginRight: "1rem" }}
        >
          Start Listener
        </Button>
        <Button
          variant={"contained"}
          color={"error"}
          disabled={!isListenerActive}
          onClick={stopListener}
        >
          Stop Listener
        </Button>

        <Typography paragraph style={{ marginTop: "2rem" }}>
          The following events were received by the Consumer.
        </Typography>
        <List>
          {consumerList.length !== 0 &&
            consumerList.map((event: string, ind: number) => (
              <ListItem key={ind}>
                <ListItemText primary={event} />
              </ListItem>
            ))}
          {consumerList.length === 0 && (
            <ListItem>
              <ListItemText primary="No events received yet" />
            </ListItem>
          )}
        </List>
        <Button
          variant={"outlined"}
          color={"info"}
          startIcon={<DeleteIcon />}
          disabled={consumerList.length === 0}
          onClick={clearConsumerData}
          sx={{ marginTop: "1rem" }}
        >
          Clear
        </Button>
      </Paper>
    </>
  );
}
