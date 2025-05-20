import * as React from "react";
import {useEffect, useState} from "react";
import axios from "axios";
import {POLLING_INTERVAL, PRODUCER_URL} from "../config/constants";
import Typography from "@mui/material/Typography";
import Paper from '@mui/material/Paper';
import {Button} from "@mui/material";
import {ProducerService} from "../services/producer.srvc";

async function sendEvent() {
    await ProducerService.postEvent({
        prefix: sessionStorage.getItem('UUID'),
        this: "that",
        those: "them"
    })
}

export default function Section1(props: {active: boolean}) {
    const [isProducerActive, setProducerActive] = useState(false);
    useEffect(() => {
        if (!props.active) return
        const int = setInterval(() => {
            if (!props.active) return
            axios.get(`${PRODUCER_URL}/ping`).then(res => {
                if (res.status === 200) {
                    setProducerActive(true)
                    console.log("producer running")
                }
            }).catch(() => {
                setProducerActive(false)
                console.log("producer down")
            });
        }, POLLING_INTERVAL)
        return function () {
            clearInterval(int);
        }
    }, [props.active]);

    return (
        <>
            <Paper elevation={3} variant={"outlined"} square={false} style={{padding: "1rem"}}>

                {/*<Typography variant="h4" gutterBottom>*/}
                {/*    Producer: {!isProducerActive && "Offline"}*/}
                {/*</Typography>*/}

                {/*<Typography paragraph>*/}
                {/*    Click the button below to send a POST request that will be converted to an Event by the Producer.*/}
                {/*</Typography>*/}

                {/*<Button variant={"contained"} color={"secondary"} disabled={!isProducerActive} onClick={sendEvent}>*/}
                {/*    BUTTON!*/}
                {/*</Button>*/}
            </Paper>
        </>
    )
}