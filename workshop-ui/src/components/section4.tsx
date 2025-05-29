import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
    Alert,
    AlertTitle,
    Button,
    FormControlLabel,
    FormGroup,
    Grid,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import {useEffect, useState} from "react";
import axios from "axios";
import {AUTHORIZER_URL, NOTIFIER_URL, POLLING_INTERVAL, PRODUCER_URL, PROVISIONER_URL} from "../config/constants";
import {ProducerService} from "../services/producer.srvc";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {CheckCircleOutline} from "@mui/icons-material";

const userEntries = Object.entries(ProducerService.fetchUsers())
const topicToPropertyMap: { [key: string]: string } = {
    "new-user": "provisioned",
    "authorize": "authorized",
    "notify": "notified",
    "notified": "complete"
}

export default function Section4() {
    const [isProducerActive, setProducerActive] = useState(false);
    const [isDebugMode, setDebugMode] = useState(true);
    const [isProvisionerActive, setProvisionerActive] = useState(true);
    const [isAuthorizerActive, setAuthorizerActive] = useState(true);
    const [isNotifierActive, setNotifierActive] = useState(true);
    const [nextUserIndex, setNextUserIndex] = useState<number>(0);
    const [sagaTraces, setSagaTraces] = useState<{ [key: string]: any }[]>([])

    useEffect(() => {
        const uid = sessionStorage.getItem('UID')
        axios.post(`${PROVISIONER_URL}/start-consumer`, { topic: uid + "new-user", error: false }).then(res => {
            if (res.status === 200) {
                console.log("section 4 provisioner consuming from topic new-user")
            }
        }).catch(() => {
            console.log("section 4 provisioner failed to consume from topic new-user")
        })
        axios.post(`${PROVISIONER_URL}/start-consumer`, { topic: uid + "notified", error: false }).then(res => {
            if (res.status === 200) {
                console.log("section 4 provisioner consuming from topic notified")
            }
        }).catch(() => {
            console.log("section 4 provisioner failed to consume from topic notified")
        })
        axios.post(`${PROVISIONER_URL}/start-producer`, { topic: uid + "authorize", error: false }).then(res => {
            if (res.status === 200) {
                console.log("section 4 provisioner producing to topic authorize")
            }
        }).catch(() => {
            console.log("section 4 provisioner failed to produce to topic authorize")
        })

        axios.post(`${AUTHORIZER_URL}/start-consumer`, { topic: uid + "authorize", error: false }).then(res => {
            if (res.status === 200) {
                console.log("section 4 authorizer consuming from topic authorize")
            }
        }).catch(() => {
            console.log("section 4 authorizer failed to consume from topic authorize")
        })
        axios.post(`${AUTHORIZER_URL}/start-producer`, { topic: uid + "notify", error: false }).then(res => {
            if (res.status === 200) {
                console.log("section 4 authorizer producing to topic notify")
            }
        }).catch(() => {
            console.log("section 4 authorizer failed to produce to topic notify")
        })

        axios.post(`${NOTIFIER_URL}/start-consumer`, { topic: uid + "notify", error: false }).then(res => {
            if (res.status === 200) {
                console.log("section 4 notifier consuming from topic notify")
            }
        }).catch(() => {
            console.log("section 4 notifier failed to consume from topic notify")
        })
        axios.post(`${NOTIFIER_URL}/start-producer`, { topic: uid + "notified", error: false }).then(res => {
            if (res.status === 200) {
                console.log("section 4 notifier producing to topic notified")
            }
        }).catch(() => {
            console.log("section 4 notifier failed to produce to topic notified")
        });
    }, [])
    useEffect(() => {
        const producerInt = setInterval(() => {
            axios.get(`${PRODUCER_URL}/ping`).then(res => {
                if (res.status === 200) {
                    setProducerActive(true)
                }
            }).catch(() => {
                setProducerActive(false)
                console.log("section 4 producer down")
            });
        }, POLLING_INTERVAL)
        const sagaInt = setInterval(async () => {
            const activeServiceTrackers = [setProvisionerActive, setAuthorizerActive, setNotifierActive]
            const provisionerQueryParams = `?prefix=${sessionStorage.getItem('UID')}&topic=new-user`
            const authorizerQueryParams = `?prefix=${sessionStorage.getItem('UID')}&topic=authorize`
            const notifierQueryParams = `?prefix=${sessionStorage.getItem('UID')}&topic=notify`
            const responses = await Promise.allSettled([
                axios.get(`${PROVISIONER_URL}${provisionerQueryParams}`), axios.get(`${AUTHORIZER_URL}${authorizerQueryParams}`), axios.get(`${NOTIFIER_URL}${notifierQueryParams}`)
            ]);
            let traces = [...sagaTraces]
            for (let i = 0; i < responses.length; i++) {
                if (responses[i].status === "rejected") {
                    activeServiceTrackers[i](false)
                    return
                } else {
                    activeServiceTrackers[i](true)
                }
                //@ts-ignore
                const val = responses[i]?.value
                if (val?.data?.length !== 0) {
                    console.log("HERE IS THE DATA when val?.data?.length !== 0: ", val.data)
                    let updatedTraces = [...traces]; // Safely capture the current state of traces
                    val.data.forEach((userString: string) => {
                        const user = JSON.parse(userString) // { [key: string]: any }
                        const prop: string = topicToPropertyMap[user.topic]
                        updatedTraces = updatedTraces.map((trace) => {
                            if (trace.id === user.id) {
                                return Object.assign({}, {[prop]: true}, trace);
                            }
                            return trace;
                        });
                    });
                    traces = updatedTraces; // Update traces after processing
                }
            }

            setSagaTraces(traces)
        }, POLLING_INTERVAL)
        return function () {
            clearInterval(producerInt);
            clearInterval(sagaInt);
        }
    }, [sagaTraces]);

    async function sendEvent() {
        await ProducerService.postEvent({
            prefix: sessionStorage.getItem('UID'),
            topic: "new-user",
            id: nextUserIndex,
            ...userEntries[nextUserIndex][1]
        })
        setSagaTraces([userEntries[nextUserIndex][1], ...sagaTraces])
        setNextUserIndex(nextUserIndex + 1)
    }

    async function clearTraces() {
        setSagaTraces([])
        setNextUserIndex(0)
    }

    const toggleTraceMode = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDebugMode(event.target.checked);
    };


    return (
        <>
            {(!isProvisionerActive || !isAuthorizerActive || !isNotifierActive) &&
                <Alert variant="filled" severity="warning" style={{marginBottom: "2rem"}}>
                    <AlertTitle>Warning</AlertTitle>
                    Check the Provisioner, Authorizer, and Notifier docker containers; one or more of them is not
                    active.
                </Alert>
            }

            <Paper variant={"outlined"} square={false} style={{padding: "1rem"}}>

                <Typography variant="h4" gutterBottom>
                    Producer: {!isProducerActive && "Offline"}
                </Typography>

                <Typography paragraph>
                    Click the button below to send a POST request that will be converted to an Event by the Producer.
                </Typography>

                <Grid
                    container
                    direction="row"
                    spacing={2}
                    alignItems="center">

                    <Grid item sm={8}>
                        <Button variant={"contained"} color={"secondary"}
                                disabled={!isProducerActive || nextUserIndex >= userEntries.length}
                                onClick={sendEvent}>
                            Onboard New User
                        </Button>
                    </Grid>

                    <Grid item sm={4}>
                        <FormGroup>
                            <FormControlLabel control={<Switch defaultChecked onChange={toggleTraceMode}/>}
                                              label="Trace Mode"/>
                        </FormGroup>
                    </Grid>

                </Grid>
                {
                    nextUserIndex >= userEntries.length && <Alert severity="warning" style={{marginTop: "1rem"}}>
                        No more new users to onboard.
                    </Alert>
                }


            </Paper>
            <Paper variant={"outlined"} square={false} style={{padding: "1rem", marginTop: "2rem"}}
                   className={"consumer"}>

                <TableContainer>
                    <Table sx={{minWidth: 650}} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>User Name</TableCell>
                                {isDebugMode &&
                                    <>
                                        <TableCell align="right">Provisioned</TableCell>
                                        <TableCell align="right">Authorized</TableCell>
                                        <TableCell align="right">Notified</TableCell>
                                    </>
                                }
                                <TableCell align="right">Complete</TableCell>
                            </TableRow>
                        </TableHead>
                        {/* eslint-disable-next-line react/jsx-no-undef */}
                        <TableBody>
                            {sagaTraces.length > 0 && sagaTraces.map((row) => (
                                <TableRow
                                    key={row.name}
                                    sx={{'&:last-child td, &:last-child th': {border: 0}}}

                                >
                                    <TableCell component="th" scope="row">
                                        {row.name}
                                    </TableCell>
                                    {isDebugMode &&
                                        <>
                                            <TableCell align="right">{row.provisioned ?
                                                <CheckCircleOutline color="success"/> :
                                                <RadioButtonUncheckedIcon color="disabled"/>}</TableCell>
                                            <TableCell align="right">{row.authorized ?
                                                <CheckCircleOutline color="success"/> :
                                                <RadioButtonUncheckedIcon color="disabled"/>}</TableCell>
                                            <TableCell align="right">{row.notified ?
                                                <CheckCircleOutline color="success"/> :
                                                <RadioButtonUncheckedIcon color="disabled"/>}</TableCell>
                                        </>
                                    }
                                    <TableCell align="right">{row.complete ? <CheckCircleOutline color="success"/> :
                                        <RadioButtonUncheckedIcon color="disabled"/>}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sagaTraces.length === 0 &&
                                <TableRow>
                                    <TableCell component="th" scope="row">
                                        <em>No new users onboarded yet</em>
                                    </TableCell>
                                    {isDebugMode &&
                                        <>
                                            <TableCell align="right"></TableCell>
                                            <TableCell align="right"></TableCell>
                                            <TableCell align="right"></TableCell>
                                        </>
                                    }
                                    <TableCell align="right"></TableCell>
                                </TableRow>
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
                <Button variant={"outlined"} color={"info"} startIcon={<DeleteIcon/>}
                        disabled={Object.keys(sagaTraces).length === 0} onClick={clearTraces} sx={{marginTop: "1rem"}}>
                    Clear
                </Button>

            </Paper>
        </>
    )
}