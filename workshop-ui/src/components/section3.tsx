import * as React from "react";
import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import {
  BLUE_CONSUMER_URL,
  POLLING_INTERVAL,
  PRODUCER_URL,
  ORANGE_CONSUMER_URL,
  FIRST_CONSUMER_URL,
} from "../config/constants";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { Button, Grid, List, ListItem, ListItemText } from "@mui/material";
import { ProducerService } from "../services/producer.srvc";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Section3() {
  const [isProducerActive, setProducerActive] = useState(false);
  const [isFirstConsumerActive, setFirstConsumerActive] = useState(false);
  const [firstConsumerList, setFirstConsumerList] = useState<any[]>([]);
  const [firstConsumerGroup, setFirstConsumerGroup] = useState<string>("");
  const [isSecondConsumerActive, setSecondConsumerActive] = useState(false);
  const [secondConsumerList, setSecondConsumerList] = useState<any[]>([]);
  const [secondConsumerGroup, setSecondConsumerGroup] = useState<string>("");
  const [currentEventId, setCurrentEventId] = useState<number>(1);
  const [isListenerOneActive, setListenerOneActive] = useState(false);
  const [isListenerTwoActive, setListenerTwoActive] = useState(false);
  const [isListenerOrangeActive, setListenerOrangeActive] = useState(false);
  const [disableButton, setDisableButton] = useState<boolean>(false);

  useEffect(() => {
    const producerInt = setInterval(() => {
      axios
        .get(`${PRODUCER_URL}/ping`)
        .then((res) => {
          if (res.status === 200) {
            setProducerActive(true);
            console.log("section 3 producer running");
          }
        })
        .catch(() => {
          setProducerActive(false);
          console.log("section 3 producer down");
        });
    }, POLLING_INTERVAL);

    const firstConsumerInt = setInterval(() => {
      axios
        .get(`${BLUE_CONSUMER_URL}/ping`)
        .then(async (res) => {
          if (res.status === 200 && isListenerOneActive) {
            setFirstConsumerActive(true);
            const data: string = res.data;
            setFirstConsumerGroup(data.substring(5));
            const cRes = await axios.get(
              `${BLUE_CONSUMER_URL}/?prefix=${sessionStorage.getItem(
                "UID"
              )}&topic=second-topic`
            );
            if (cRes.status === 200) {
              const items: string[] = cRes.data;
              setFirstConsumerList((prev: string[]): string[] => [
                ...items,
                ...prev,
              ]);
            }
          }
        })
        .catch(() => {
          setFirstConsumerActive(false);
          console.log("section 3 consumer 1 down");
        });
    }, POLLING_INTERVAL);

    const secondConsumerInt = setInterval(() => {
      axios
        .get(`${ORANGE_CONSUMER_URL}/ping`)
        .then(async (res) => {
          if (
            res.status === 200 &&
            (isListenerOrangeActive || isListenerTwoActive)
          ) {
            setSecondConsumerActive(true);
            if (isListenerOrangeActive) {
              setSecondConsumerGroup("orange-group");
            } else {
              setSecondConsumerGroup("blue-group");
            }
            let cRes: AxiosResponse<any, any>;
            if (isListenerOrangeActive) {
              cRes = await axios.get(
                `${ORANGE_CONSUMER_URL}/?prefix=${sessionStorage.getItem(
                  "UID"
                )}&topic=second-topic`
              );
            } else {
              cRes = await axios.get(
                `${FIRST_CONSUMER_URL}/?prefix=${sessionStorage.getItem(
                  "UID"
                )}&topic=second-topic`
              );
            }
            if (cRes.status === 200) {
              const items: string[] = cRes.data;
              setSecondConsumerList((prev: string[]): string[] => [
                ...items,
                ...prev,
              ]);
            }
          }
        })
        .catch(() => {
          setSecondConsumerActive(false);
          console.log("section 3 consumer 2 down");
        });
    }, POLLING_INTERVAL);

    return function () {
      clearInterval(producerInt);
      clearInterval(firstConsumerInt);
      clearInterval(secondConsumerInt);
      setFirstConsumerList([]);
      setSecondConsumerList([]);
      setFirstConsumerGroup("");
      setSecondConsumerGroup("");
    };
  }, [
    isProducerActive,
    isListenerOneActive,
    isListenerOrangeActive,
    isListenerTwoActive,
  ]);

  async function sendEvent() {
    setDisableButton(true);
    await ProducerService.postEvent({
      prefix: sessionStorage.getItem("UID"),
      topic: "second-topic",
      id: currentEventId,
      clicked: ProducerService.getPrettyTime(),
    });
    setCurrentEventId(currentEventId + 1);
    setDisableButton(false);
  }

  async function startListenerOne() {
    const topic = sessionStorage.getItem("UID") + "second-topic";
    await ProducerService.startListener(topic, BLUE_CONSUMER_URL);
    setListenerOneActive(true);
  }

  async function stopListenerOne() {
    const topic = sessionStorage.getItem("UID") + "second-topic";
    await ProducerService.stopListener(topic, BLUE_CONSUMER_URL);
    setListenerOneActive(false);
  }

  async function startListenerTwo() {
    const topic = sessionStorage.getItem("UID") + "second-topic";
    await ProducerService.startListener(topic, FIRST_CONSUMER_URL);
    setListenerTwoActive(true);
  }

  async function stopListenerTwo() {
    const topic = sessionStorage.getItem("UID") + "second-topic";
    await ProducerService.stopListener(topic, FIRST_CONSUMER_URL);
    setListenerTwoActive(false);
  }

  async function startListenerOrange() {
    const topic = sessionStorage.getItem("UID") + "second-topic";
    await ProducerService.startListener(topic, ORANGE_CONSUMER_URL);
    setListenerOrangeActive(true);
  }

  async function stopListenerOrange() {
    const topic = sessionStorage.getItem("UID") + "second-topic";
    await ProducerService.stopListener(topic, ORANGE_CONSUMER_URL);
    setListenerOrangeActive(false);
  }

  function clearConsumerData(whichConsumer: string) {
    if (whichConsumer === "first") {
      setFirstConsumerList([]);
    } else if (whichConsumer === "second") {
      setSecondConsumerList([]);
    } else {
      return;
    }
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
          disabled={!isProducerActive || disableButton}
          onClick={sendEvent}
        >
          Send Event
        </Button>
      </Paper>

      <Grid
        container
        direction="row"
        spacing={2}
        marginBottom={"1.5em"}
        alignItems="center"
      >
        <Grid item sm={6}>
          <Paper
            variant={"outlined"}
            square={false}
            style={{ padding: "1rem", marginTop: "2rem" }}
            className={"consumer"}
          >
            <Typography variant="h4" gutterBottom>
              Consumer 1: {!isFirstConsumerActive && "Offline"}
            </Typography>

            <Typography
              variant="h5"
              gutterBottom
              fontWeight={"bold"}
              color={
                !isFirstConsumerActive
                  ? "lightgray"
                  : firstConsumerGroup === "blue-group"
                  ? "info.main"
                  : "warning.main"
              }
            >
              <span>Group: {firstConsumerGroup}</span>
            </Typography>

            <Button
              variant={"contained"}
              color={"primary"}
              disabled={isListenerOneActive}
              onClick={startListenerOne}
              style={{ marginRight: "1rem", marginBottom: "0.5rem" }}
            >
              Start Listener
            </Button>
            <Button
              variant={"contained"}
              color={"error"}
              disabled={!isListenerOneActive}
              onClick={stopListenerOne}
              style={{ marginBottom: "0.5rem" }}
            >
              Stop Listener
            </Button>

            <List>
              {firstConsumerList.length !== 0 &&
                firstConsumerList.map((event: string, ind: number) => (
                  <ListItem key={ind}>
                    <ListItemText primary={event} />
                  </ListItem>
                ))}
              {firstConsumerList.length === 0 && (
                <ListItem>
                  <ListItemText primary="No events received yet" />
                </ListItem>
              )}
            </List>
            <Button
              variant={"outlined"}
              color={"info"}
              startIcon={<DeleteIcon />}
              disabled={firstConsumerList.length === 0}
              onClick={() => clearConsumerData("first")}
              sx={{ marginTop: "1rem" }}
            >
              Clear
            </Button>
          </Paper>
        </Grid>

        <Grid item sm={6}>
          <Paper
            variant={"outlined"}
            square={false}
            style={{ padding: "1rem", marginTop: "2rem" }}
            className={"consumer"}
          >
            <Typography variant="h4" gutterBottom>
              Consumer 2: {!isSecondConsumerActive && "Offline"}
            </Typography>

            <Typography
              variant="h5"
              gutterBottom
              fontWeight={"bold"}
              color={
                !isSecondConsumerActive
                  ? "lightgray"
                  : secondConsumerGroup === "blue-group"
                  ? "info.main"
                  : "warning.main"
              }
            >
              Group: {secondConsumerGroup}
            </Typography>
            <Button
              variant={"contained"}
              color={"primary"}
              disabled={isListenerTwoActive || isListenerOrangeActive}
              onClick={startListenerTwo}
              style={{ marginRight: "1rem", marginBottom: "0.5rem" }}
            >
              Start Blue
            </Button>
            <Button
              variant={"contained"}
              color={"error"}
              disabled={!isListenerTwoActive}
              onClick={stopListenerTwo}
              style={{ marginBottom: "0.5rem" }}
            >
              Stop Blue
            </Button>
            <Button
              variant={"contained"}
              color={"primary"}
              style={{
                backgroundColor: "#FFA500",
                marginRight: "1rem",
                marginBottom: "0.5rem",
              }}
              disabled={isListenerOrangeActive || isListenerTwoActive}
              onClick={startListenerOrange}
            >
              Start Orange
            </Button>
            <Button
              variant={"contained"}
              color={"error"}
              disabled={!isListenerOrangeActive}
              onClick={stopListenerOrange}
              style={{ marginBottom: "0.5rem" }}
            >
              Stop Orange
            </Button>

            <List>
              {secondConsumerList.length !== 0 &&
                secondConsumerList.map((event: string, ind: number) => (
                  <ListItem key={ind}>
                    <ListItemText primary={event} />
                  </ListItem>
                ))}
              {secondConsumerList.length === 0 && (
                <ListItem>
                  <ListItemText primary="No events received yet" />
                </ListItem>
              )}
            </List>
            <Button
              variant={"outlined"}
              color={"info"}
              startIcon={<DeleteIcon />}
              disabled={secondConsumerList.length === 0}
              onClick={() => clearConsumerData("second")}
              sx={{ marginTop: "1rem" }}
            >
              Clear
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
