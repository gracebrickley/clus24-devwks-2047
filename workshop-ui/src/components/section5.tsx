import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  Alert,
  AlertTitle,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  AUTHORIZER_URL,
  DLQ_URL,
  NOTIFIER_URL,
  POLLING_INTERVAL,
  PRODUCER_URL,
  PROVISIONER_URL,
} from "../config/constants";
import { ProducerService } from "../services/producer.srvc";
import { AccessTime, TaskAlt } from "@mui/icons-material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";

const userEntries = Object.entries(ProducerService.fetchUsers());
const topicToPropertyMap: { [key: string]: string } = {
  "new-user": "provisioned",
  authorize: "authorized",
  notify: "notified",
  notified: "complete",
};

export default function Section5() {
  const [isProducerActive, setProducerActive] = useState(false);
  const [isProvisionerActive, setProvisionerActive] = useState(true);
  const [isAuthorizerActive, setAuthorizerActive] = useState(true);
  const [isNotifierActive, setNotifierActive] = useState(true);
  const [isConsumerActive, setConsumerActive] = useState(true);
  const [errorList, setErrorList] = useState<string[]>([]);
  const [nextUserIndex, setNextUserIndex] = useState<number>(0);
  const [sagaTraces, setSagaTraces] = useState<{ [key: string]: any }[]>([]);
  const [selectedTab, setSelectedTab] = React.useState("1");
  const [disableButton, setDisableButton] = useState<boolean>(false);

  useEffect(() => {
    const uid = sessionStorage.getItem("UID");
    axios
      .post(`${PROVISIONER_URL}/start-consumer`, {
        topic: uid + "new-user",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 provisioner consuming from topic new-user");
        }
      })
      .catch(() => {
        console.log(
          "section 5 provisioner failed to consume from topic new-user"
        );
      });
    axios
      .post(`${PROVISIONER_URL}/start-consumer`, {
        topic: uid + "notified",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 provisioner consuming from topic notified");
        }
      })
      .catch(() => {
        console.log(
          "section 5 provisioner failed to consume from topic notified"
        );
      });
    axios
      .post(`${PROVISIONER_URL}/start-producer`, {
        topic: uid + "authorize",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 provisioner producing to topic authorize");
        }
      })
      .catch(() => {
        console.log(
          "section 5 provisioner failed to produce to topic authorize"
        );
      });
    axios
      .post(`${PROVISIONER_URL}/start-producer`, {
        topic: uid + "dlq",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 provisioner producing to topic dlq");
        }
      })
      .catch(() => {
        console.log("section 5 provisioner failed to produce to topic dlq");
      });

    axios
      .post(`${AUTHORIZER_URL}/start-consumer`, {
        topic: uid + "authorize",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 authorizer consuming from topic authorize");
        }
      })
      .catch(() => {
        console.log(
          "section 5 authorizer failed to consume from topic authorize"
        );
      });
    axios
      .post(`${AUTHORIZER_URL}/start-producer`, {
        topic: uid + "notify",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 authorizer producing to topic notify");
        }
      })
      .catch(() => {
        console.log("section 5 authorizer failed to produce to topic notify");
      });
    axios
      .post(`${AUTHORIZER_URL}/start-producer`, {
        topic: uid + "dlq",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 authorizer producing to topic dlq");
        }
      })
      .catch(() => {
        console.log("section 5 authorizer failed to produce to topic dlq");
      });

    axios
      .post(`${NOTIFIER_URL}/start-consumer`, {
        topic: uid + "notify",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 notifier consuming from topic notify");
        }
      })
      .catch(() => {
        console.log("section 5 notifier failed to consume from topic notify");
      });
    axios
      .post(`${NOTIFIER_URL}/start-producer`, {
        topic: uid + "notified",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 notifier producing to topic notified");
        }
      })
      .catch(() => {
        console.log("section 5 notifier failed to produce to topic notified");
      });
    axios
      .post(`${NOTIFIER_URL}/start-producer`, {
        topic: uid + "dlq",
        error: true,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 notifier producing to topic dlq");
        }
      })
      .catch(() => {
        console.log("section 5 notifier failed to produce to topic dlq");
      });

    axios
      .post(`${DLQ_URL}/start-listener`, { topic: uid + "dlq" })
      .then((res) => {
        if (res.status === 200) {
          console.log("section 5 dlq consuming from topic dlq");
        }
      })
      .catch(() => {
        console.log("section 5 dlq failed to consume from topic dlq");
      });
  }, []);

  useEffect(() => {
    const producerInt = setInterval(() => {
      axios
        .get(`${PRODUCER_URL}/ping`)
        .then((res) => {
          if (res.status === 200) {
            setProducerActive(true);
          }
        })
        .catch(() => {
          setProducerActive(false);
          console.log("section 5 producer down");
        });
    }, POLLING_INTERVAL);
    const sagaInt = setInterval(async () => {
      const activeServiceTrackers = [
        setProvisionerActive,
        setAuthorizerActive,
        setNotifierActive,
      ];
      const provisionerQueryParams = `?prefix=${sessionStorage.getItem(
        "UID"
      )}&topic=new-user`;
      const authorizerQueryParams = `?prefix=${sessionStorage.getItem(
        "UID"
      )}&topic=authorize`;
      const notifierQueryParams = `?prefix=${sessionStorage.getItem(
        "UID"
      )}&topic=notify`;
      const responses = await Promise.allSettled([
        axios.get(`${PROVISIONER_URL}${provisionerQueryParams}`),
        axios.get(`${AUTHORIZER_URL}${authorizerQueryParams}`),
        axios.get(`${NOTIFIER_URL}${notifierQueryParams}`),
      ]);
      let traces: { [key: string]: any }[] = [...sagaTraces];
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].status === "rejected") {
          activeServiceTrackers[i](false);
          return;
        } else {
          activeServiceTrackers[i](true);
        }
        if (i === 0) {
          //@ts-ignore
          const val = responses[i].value;
          if (val?.data?.length !== 0) {
            let updatedTraces = [...traces]; // Safely capture the current state of traces
            val.data.forEach((userString: string) => {
              const user = JSON.parse(userString); // { [key: string]: any }
              const prop: string = topicToPropertyMap[user.topic];
              updatedTraces = updatedTraces.map((trace) => {
                if (trace.id === user.id) {
                  return Object.assign({}, { [prop]: true }, trace);
                }
                return trace;
              });
            });
            traces = updatedTraces; // Update traces after processing
          }
        }
      }
      // @ts-ignore
      setSagaTraces([...traces]);
    }, POLLING_INTERVAL);
    const consumerInt = setInterval(() => {
      axios
        .get(`${DLQ_URL}/ping`)
        .then(async (res) => {
          if (res.status === 200) {
            setConsumerActive(true);
            const dlqQueryParams = `?prefix=${sessionStorage.getItem(
              "UID"
            )}&topic=dlq`;
            const cRes = await axios.get(`${DLQ_URL}${dlqQueryParams}`);
            if (cRes.status === 200) {
              const items: string[] = cRes.data;
              console.log("HERE ARE ITEMS: ", items);
              /*
                        cRes.data.forEach((item: { [key: string]: string }) => {
                            let str = `Service: ${item.service} | Error: ${item.error}`
                            items.unshift(str)
                        })*/
              setErrorList((prev: any[]): any[] => [...items, ...prev]);
            }
          }
        })
        .catch(() => {
          setConsumerActive(false);
          console.log("Section 5 DLQ consumer down");
        });
    }, POLLING_INTERVAL);
    return function () {
      clearInterval(producerInt);
      clearInterval(sagaInt);
      clearInterval(consumerInt);
    };
  }, [sagaTraces]);

  async function sendEvent() {
    setDisableButton(true);
    await ProducerService.postEvent({
      prefix: sessionStorage.getItem("UID"),
      topic: "new-user",
      errors: true,
      id: nextUserIndex,
      ...userEntries[nextUserIndex][1],
    });
    setSagaTraces([userEntries[nextUserIndex][1], ...sagaTraces]);
    setNextUserIndex(nextUserIndex + 1);
    setDisableButton(false);
  }

  function clearTraces() {
    setSagaTraces([]);
    setNextUserIndex(0);
  }

  function clearErrors() {
    setErrorList([]);
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      {(!isProvisionerActive || !isAuthorizerActive || !isNotifierActive) && (
        <Alert
          variant="filled"
          severity="warning"
          style={{ marginBottom: "2rem" }}
        >
          <AlertTitle>Warning</AlertTitle>
          Check the Provisioner, Authorizer, and Notifier docker containers; one
          or more of them is not active.
        </Alert>
      )}

      <Paper variant={"outlined"} square={false} style={{ padding: "1rem" }}>
        <Typography variant="h4" gutterBottom>
          Producer: {!isProducerActive && "Offline"}
        </Typography>
        <Typography paragraph>
          Click the button below to send a POST request that will be converted
          to an Event by the Producer.
        </Typography>

        <Button
          variant={"contained"}
          color={"secondary"}
          disabled={
            !isProducerActive ||
            nextUserIndex >= userEntries.length ||
            disableButton
          }
          onClick={sendEvent}
        >
          Onboard New User
        </Button>
        {nextUserIndex >= userEntries.length && (
          <Alert severity="warning" style={{ marginTop: "1rem" }}>
            No more new users to onboard.
          </Alert>
        )}
      </Paper>

      <Paper
        variant={"outlined"}
        square={false}
        style={{ padding: "1rem", marginTop: "2rem" }}
        className={"consumer"}
      >
        <TabContext value={selectedTab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleTabChange}
              aria-label="lab API tabs example"
            >
              <Tab label="Users" value="1" />
              <Tab label="Errors" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1" style={{ padding: "0" }}>
            <List>
              {sagaTraces.length !== 0 &&
                sagaTraces.map((trace: { [key: string]: any }, ind: number) => (
                  <ListItem
                    key={ind}
                    className={trace.complete ? "dlq-complete" : ""}
                  >
                    <ListItemIcon>
                      {trace.complete ? (
                        <TaskAlt color={"success"} />
                      ) : (
                        <AccessTime color={"disabled"} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={trace.name} />
                  </ListItem>
                ))}
              {sagaTraces.length === 0 && (
                <ListItem>
                  <ListItemText primary="No users onboarded yet" />
                </ListItem>
              )}
            </List>
            <Button
              variant={"outlined"}
              color={"info"}
              startIcon={<DeleteIcon />}
              disabled={Object.keys(sagaTraces).length === 0}
              onClick={clearTraces}
              sx={{ marginTop: "1rem" }}
            >
              Clear Users
            </Button>
          </TabPanel>
          <TabPanel value="2" style={{ padding: "0" }}>
            {!isConsumerActive && (
              <Alert
                variant="filled"
                severity="warning"
                style={{ margin: "1rem 0" }}
              >
                <AlertTitle>Warning</AlertTitle>
                The DLQ Consumer is not active. Please run the command listed to
                the right to activate the DLQ Consumer.
              </Alert>
            )}
            <List>
              {errorList.length !== 0 &&
                errorList.map((err: string, ind: number) => (
                  <ListItem key={ind} className={"dlq-error"}>
                    <ListItemText primary={err} />
                  </ListItem>
                ))}
              {errorList.length === 0 && (
                <ListItem>
                  <ListItemText primary="No errors yet" />
                </ListItem>
              )}
            </List>

            <Button
              variant={"outlined"}
              color={"info"}
              startIcon={<DeleteIcon />}
              disabled={errorList.length === 0}
              onClick={clearErrors}
              sx={{ marginTop: "1rem" }}
            >
              Clear Errors
            </Button>
          </TabPanel>
        </TabContext>
      </Paper>
    </>
  );
}
