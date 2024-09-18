import * as React from "react";
import {useEffect, useState} from "react";
import axios from "axios";
import {
    FIRST_CONSUMER_URL,
    FIRST_GROUP,
    POLLING_INTERVAL,
    PRODUCER_URL,
    SECOND_CONSUMER_URL
} from "../config/constants";
import Typography from "@mui/material/Typography";
import Paper from '@mui/material/Paper';
import {Button, Grid, List, ListItem, ListItemText} from "@mui/material";
import {ProducerService} from "../services/producer.srvc";
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

    useEffect(() => {
        const producerInt = setInterval(() => {
            axios.get(`${PRODUCER_URL}/ping`).then(res => {
                if (res.status === 200) {
                    setProducerActive(true)
                    console.log("section 3 producer running")
                }
            }).catch(() => {
                setProducerActive(false)
                console.log("section 3 producer down")
            });
        }, POLLING_INTERVAL)
        const firstConsumerInt = setInterval(() => {
            axios.get(`${FIRST_CONSUMER_URL}/ping`).then(async res => {
                if (res.status === 200) {
                    setFirstConsumerActive(true)
                    const data: string = res.data
                    setFirstConsumerGroup(data.substring(5))
                    const cRes = await axios.get(`${FIRST_CONSUMER_URL}`)
                    if (cRes.status === 200) {
                        const items: string[] = []
                        cRes.data.forEach((item: {[key: string]: string}) => {
                            let str = ""
                            Object.keys(item).forEach((key: string) => {
                                if (str.length !== 0) str += "; "
                                str += `${key}: ${item[key]}`
                            })
                            items.unshift(str)
                        })
                        setFirstConsumerList((prev: any[]): any[] => [...items, ...prev])
                    }
                }
            }).catch(() => {
                setFirstConsumerActive(false)
                console.log("section 3 consumer 1 down")
            });
        }, POLLING_INTERVAL)
        const secondConsumerInt = setInterval(() => {
            axios.get(`${SECOND_CONSUMER_URL}/ping`).then(async res => {
                if (res.status === 200) {
                    setSecondConsumerActive(true)
                    const data: string = res.data
                    setSecondConsumerGroup(data.substring(5))
                    const cRes = await axios.get(`${SECOND_CONSUMER_URL}`)
                    if (cRes.status === 200) {
                        const items: string[] = []
                        cRes.data.forEach((item: {[key: string]: string}) => {
                            let str = ""
                            Object.keys(item).forEach((key: string) => {
                                if (str.length !== 0) str += "; "
                                str += `${key}: ${item[key]}`
                            })
                            items.unshift(str)
                        })
                        setSecondConsumerList((prev: any[]): any[] => [...items, ...prev])
                    }
                }
            }).catch(() => {
                setSecondConsumerActive(false)
                console.log("section 3 consumer 2 down")
            });
        }, POLLING_INTERVAL)
        return function () {
            clearInterval(producerInt);
            clearInterval(firstConsumerInt);
            clearInterval(secondConsumerInt);
            setFirstConsumerList([])
            setSecondConsumerList([])
            setFirstConsumerGroup("")
            setSecondConsumerGroup("")
        }
    }, [isProducerActive]);

    async function sendEvent() {
        await ProducerService.postEvent({
            id: currentEventId,
            clicked: ProducerService.getPrettyTime()
        })
        setCurrentEventId(currentEventId + 1)
    }

    function clearConsumerData(whichConsumer: string) {
        if (whichConsumer === "first") {
            setFirstConsumerList([])
        } else if (whichConsumer === "second") {
            setSecondConsumerList([])
        } else {
            return
        }
    }

    return (
        <>
            <Paper variant={"outlined"} square={false} style={{padding: "1rem"}}>

                <Typography variant="h4" gutterBottom>
                    Producer: {!isProducerActive && "Offline"}
                </Typography>

                <Typography paragraph>
                    Click the button below to send a POST request that will be converted to an Event by the Producer.
                </Typography>

                <Typography paragraph style={{fontWeight: "bold"}}>
                    Events sent: {currentEventId - 1}
                </Typography>

                <Button variant={"contained"} color={"secondary"} disabled={!isProducerActive} onClick={sendEvent}>
                    Send Event
                </Button>
            </Paper>

            <Grid
                container
                direction="row"
                spacing={2}
                marginBottom={"1.5em"}
                alignItems="center">

                <Grid item sm={6}>
                    <Paper variant={"outlined"} square={false} style={{padding: "1rem", marginTop: "2rem"}} className={"consumer"}>

                        <Typography variant="h4" gutterBottom>
                            First Consumer: {!isFirstConsumerActive && "Offline"}
                        </Typography>

                        <Typography variant="h5" gutterBottom fontWeight={"bold"} color={!isFirstConsumerActive ? "lightgray" : firstConsumerGroup === "blue-group" ? "info.main" : "warning.main"}>
                            <span>Group: {firstConsumerGroup}</span>
                        </Typography>

                        <List>
                            {
                                firstConsumerList.length !== 0 && firstConsumerList.map((event: string, ind: number) => (
                                    <ListItem key={ind}>
                                        <ListItemText
                                            primary={event}
                                        />
                                    </ListItem>
                                ))
                            }
                            {
                                firstConsumerList.length === 0 && <ListItem>
                                    <ListItemText
                                        primary="No events received yet"
                                    />
                                </ListItem>
                            }
                        </List>
                        <Button variant={"outlined"} color={"info"} startIcon={<DeleteIcon />} disabled={firstConsumerList.length === 0} onClick={() => clearConsumerData("first")} sx={{marginTop: "1rem"}}>
                            Clear
                        </Button>

                    </Paper>

                </Grid>

                <Grid item sm={6}>
                    <Paper variant={"outlined"} square={false} style={{padding: "1rem", marginTop: "2rem"}} className={"consumer"}>

                        <Typography variant="h4" gutterBottom>
                            Second Consumer: {!isSecondConsumerActive && "Offline"}
                        </Typography>

                        <Typography variant="h5" gutterBottom fontWeight={"bold"} color={!isSecondConsumerActive ? "lightgray" : secondConsumerGroup === "blue-group" ? "info.main" : "warning.main"}>
                            Group: {secondConsumerGroup}
                        </Typography>

                        <List>
                            {
                                secondConsumerList.length !== 0 && secondConsumerList.map((event: string, ind: number) => (
                                    <ListItem key={ind}>
                                        <ListItemText
                                            primary={event}
                                        />
                                    </ListItem>
                                ))
                            }
                            {
                                secondConsumerList.length === 0 && <ListItem>
                                    <ListItemText
                                        primary="No events received yet"
                                    />
                                </ListItem>
                            }
                        </List>
                        <Button variant={"outlined"} color={"info"} startIcon={<DeleteIcon />} disabled={secondConsumerList.length === 0} onClick={() => clearConsumerData("second")} sx={{marginTop: "1rem"}}>
                            Clear
                        </Button>

                    </Paper>

                </Grid>

            </Grid>
        </>
    )
}