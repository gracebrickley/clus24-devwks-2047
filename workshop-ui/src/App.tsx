import React from 'react';
import './App.css';
import BasicTabs from "./layouts/navigation";
import {createBrowserRouter, RouterProvider,} from "react-router-dom";
import {Main} from "./components/main";
import Section1 from "./components/section1";
import section1 from './lab-guide/section1.md'
import Section2 from "./components/section2";
import section2 from './lab-guide/section2.md'
import Section3 from "./components/section3";
import section3 from './lab-guide/section3.md'
import Section4 from "./components/section4";
import section4 from './lab-guide/section4.md'
import Section5 from "./components/section5";
import section5 from './lab-guide/section5.md'
import ReaderLayout from "./layouts/reader-layout";
import SectionLayout from "./layouts/section-layout";
import { v4 as uuidv4 } from 'uuid';

const router = createBrowserRouter([
    {
        path: "/",
        element: <Main></Main>,
        children: [
            {
                index: true,
                element: <ReaderLayout mdPath={section1}></ReaderLayout>
            },
            {
                path: "section-2",
                element: <SectionLayout component={<Section2 />} mdPath={section2}></SectionLayout>
            },
            {
                path: "section-3",
                element: <SectionLayout component={<Section3 />} mdPath={section3}></SectionLayout>,
            },
            {
                path: "section-4",
                element: <SectionLayout component={<Section4 />} mdPath={section4}></SectionLayout>,
            },
            {
                path: "section-5",
                element: <SectionLayout component={<Section5 />} mdPath={section5}></SectionLayout>,
            }
        ]
    },
], {basename: "/"});

function App() {

    const uniqueId = uuidv4();
    const user = {'UID': uniqueId};
    sessionStorage.setItem('UID', uniqueId);
    process.env.UID_PREFIX = uniqueId;
    // var obj = sessionStorage.user; // obj='[object Object]' Not an object
    console.log("UUID: ", user);

    return (
    <div className="App">  
      {/*<header className="App-header">*/}
      {/*  <Main></Main>*/}
      {/*</header>*/}
        <RouterProvider router={router}/>
    </div>
  );
}

export default App;
