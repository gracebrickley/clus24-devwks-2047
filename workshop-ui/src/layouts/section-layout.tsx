import * as React from "react";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import { Remarkable } from "remarkable";
import hljs from "highlight.js";
import GLightbox from "glightbox";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Grid } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { ProducerService } from "../services/producer.srvc";
import {
  FIRST_CONSUMER_URL,
  BLUE_CONSUMER_URL,
  ORANGE_CONSUMER_URL,
  PROVISIONER_URL,
  AUTHORIZER_URL,
  NOTIFIER_URL,
  DLQ_URL,
} from "../config/constants";
import axios from "axios";

const md = new Remarkable("full", {
  html: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
    try {
      return hljs.highlightAuto(str).value;
    } catch (__) {}
    return ""; // use external default escaping
  },
});

export default function SectionLayout(props: {
  component: React.ReactElement;
  mdPath: string;
}) {
  const [markdown, setMarkdown] = useState("");
  const [sectionNumber, setSectionNumber] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const reader = document.getElementById("markdown-renderer");
    //@ts-ignore
    reader.scrollTop = 0;
    if (location.pathname.startsWith("/section-")) {
      const char = location.pathname[location.pathname.length - 1];
      const int = parseInt(char);
      if (!Number.isNaN(int)) {
        setSectionNumber(int);
      }
    }
    // fetching markdown based on the path that was
    // passed in via component props
    fetch(props.mdPath)
      .then((res) => res.text())
      .then((text) => {
        setMarkdown(md.render(text));
      });
  }, [location.pathname, props.mdPath]);

  useEffect(() => {
    const pres = document.getElementsByTagName("pre");
    // @ts-ignore
    for (const p of pres) {
      if (p.previousElementSibling?.children[0]?.classList[0] !== "copy") {
        continue;
      }
      const handler = function (e: MouseEvent) {
        const t = p.innerText;
        navigator.clipboard.writeText(t).then(
          function () {
            console.log("Async: Copying to clipboard was successful!");
          },
          function (err) {
            console.error("Async: Could not copy text: ", err);
          }
        );
      };
      const i = document.createElement("img");
      i.setAttribute("src", "images/copy-icon.svg");
      i.setAttribute("title", "Copy to clipboard");
      i.setAttribute("class", "copy-icon");
      i.addEventListener("click", handler);
      const b = document.createElement("button");
      b.setAttribute("class", "hidden-button");
      b.setAttribute("aria-label", "Copy to clipboard");
      b.addEventListener("click", handler);
      p.prepend(i);
      p.append(b);
    }
    const lightbox = GLightbox({
      width: "70%",
      zoomable: false,
    });
  }, [markdown]);

  const stopListenerLogic = async () => {
    async function stopListener(topicPostfix: string, url: string) {
      const topic = sessionStorage.getItem("UID") + topicPostfix;
      await ProducerService.stopListener(topic, url);
    }
    if (sectionNumber === 2) {
      stopListener("first-topic", FIRST_CONSUMER_URL);
    }
    if (sectionNumber === 3) {
      stopListener("second-topic", BLUE_CONSUMER_URL);
      stopListener("second-topic", ORANGE_CONSUMER_URL);
    }
    if (sectionNumber === 4) {
      // Stop listener logic for section 4
      stopListener("new-user", PROVISIONER_URL);
      stopListener("notified", PROVISIONER_URL);
      stopListener("authorize", AUTHORIZER_URL);
      stopListener("notify", NOTIFIER_URL);
      await axios.post(`${PROVISIONER_URL}/stop-producer`, {
        topic: sessionStorage.getItem("UID") + "authorize",
      });
      await axios.post(`${AUTHORIZER_URL}/stop-producer`, {
        topic: sessionStorage.getItem("UID") + "notify",
      });
      await axios.post(`${NOTIFIER_URL}/stop-producer`, {
        topic: sessionStorage.getItem("UID") + "notified",
      });
    }
    if (sectionNumber === 5) {
      // Stop listener logic for section 5
      stopListener("new-user", PROVISIONER_URL);
      stopListener("notified", PROVISIONER_URL);
      stopListener("authorize", AUTHORIZER_URL);
      stopListener("notify", NOTIFIER_URL);
      stopListener("dlq", DLQ_URL);
      await axios.post(`${PROVISIONER_URL}/stop-producer`, {
        topic: sessionStorage.getItem("UID") + "authorize",
      });
      await axios.post(`${AUTHORIZER_URL}/stop-producer`, {
        topic: sessionStorage.getItem("UID") + "notify",
      });
      await axios.post(`${NOTIFIER_URL}/stop-producer`, {
        topic: sessionStorage.getItem("UID") + "notified",
      });
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Box component="main" sx={{ width: "57%", p: 3 }}>
        {/*INJECTING THE CHILD COMPONENT*/}
        {props.component}
        {/*******************************/}
      </Box>
      <Drawer
        PaperProps={{
          sx: {
            width: "43%",
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { boxSizing: "border-box" },
          },
        }}
        variant="permanent"
        anchor="right"
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", p: 2 }} id={"markdown-renderer"}>
          <Grid container direction="row" spacing={2} alignItems="stretch">
            <Grid item sm={6}>
              {sectionNumber !== 1 && (
                <Button
                  color={"primary"}
                  startIcon={<ChevronLeft />}
                  size={"large"}
                  sx={{ float: "left" }}
                  onClick={() => {
                    stopListenerLogic().then(() => {
                      navigate(
                        sectionNumber === 2
                          ? "/"
                          : `/section-${sectionNumber - 1}`
                      );
                    });
                  }}
                >
                  Section {sectionNumber - 1}
                </Button>
              )}
            </Grid>
            <Grid item sm={6}>
              {sectionNumber !== 5 && (
                <Button
                  color={"primary"}
                  endIcon={<ChevronRight />}
                  size={"large"}
                  sx={{ float: "right" }}
                  onClick={() => {
                    stopListenerLogic().then(() => {
                      navigate(`/section-${sectionNumber + 1}`);
                    });
                  }}
                >
                  Section {sectionNumber + 1}
                </Button>
              )}
            </Grid>
          </Grid>
          <hr />
          <div dangerouslySetInnerHTML={{ __html: markdown }}></div>
          <hr />
          <Button
            component={Link}
            color={"primary"}
            to={sectionNumber === 2 ? "/" : `/section-${sectionNumber - 1}`}
            startIcon={<ChevronLeft />}
            size={"large"}
            sx={{ float: "left" }}
          >
            Section {sectionNumber - 1}
          </Button>
          {sectionNumber !== 5 && (
            <Button
              component={Link}
              color={"primary"}
              to={`/section-${sectionNumber + 1}`}
              endIcon={<ChevronRight />}
              size={"large"}
              sx={{ float: "right" }}
            >
              Section {sectionNumber + 1}
            </Button>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
