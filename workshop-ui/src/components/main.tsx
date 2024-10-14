import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import {IconButton} from "@mui/material";
import {Link, Outlet, useLocation} from "react-router-dom";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import ChevronLeftIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import * as React from "react";
import Typography from "@mui/material/Typography";
import {styled} from "@mui/material/styles";
import {useEffect} from "react";

const drawerWidth = 240;

const navItems = [
    {path: '/', label: 'Section 1'},
    {path: '/section-2', label: 'Section 2'},
    {path: '/section-3', label: 'Section 3'},
    {path: '/section-4', label: 'Section 4'},
    {path: '/section-5', label: 'Section 5'},
]

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const DrawerHeader = styled('div')(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
    fontSize: "1.25rem"
}));

export function Main() {
    const location = useLocation();


    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(location.pathname);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    useEffect(() => {
        setValue(location.pathname)
    }, [location.pathname]);

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
        setOpen(false)
    };

    return (
        <header className="App-header">
            <Box sx={{width: '100%', display: "flex"}} className={"App-header"}>
                <CssBaseline/>
                <AppBar position="fixed" color="info" enableColorOnDark
                        sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={toggleDrawer(!open)}
                            edge="start"
                            sx={{mr: 2, ...(open && {display: 'none'})}}
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                            Hands-on with Event-Driven Architecture
                        </Typography>
                    </Toolbar>
                </AppBar>

                <Drawer open={open} onClose={toggleDrawer(false)}
                        sx={{
                            width: drawerWidth,
                            flexShrink: 0,
                            [`& .MuiDrawer-paper`]: {width: drawerWidth, boxSizing: 'border-box'},
                            zIndex: (theme) => theme.zIndex.drawer + 2
                        }}>
                    <DrawerHeader>
                        <IconButton onClick={toggleDrawer(false)}>
                            <ChevronLeftIcon/>
                        </IconButton>
                    </DrawerHeader>
                    <Box sx={{overflow: 'auto', textAlign: "center", paddingTop: "1rem"}}>
                        <Typography variant={"h5"} sx={{fontWeight: "bold", color: "#163754"}}>Navigation</Typography>
                        <Tabs
                            orientation="vertical"
                            variant="scrollable"
                            value={value}
                            onChange={handleChange}
                            aria-label="Vertical tabs example"
                            sx={{borderRight: 1, borderColor: 'divider', fontSize: "18pt"}}
                        >
                            <Tab label="Section 1" value={"/"} to={"/"} component={Link}/>
                            <Tab label="Section 2" value={"/section-2"} to={"/section-2"} component={Link}/>
                            <Tab label="Section 3" value={"/section-3"} to={"/section-3"} component={Link}/>
                            <Tab label="Section 4" value={"/section-4"} to={"/section-4"} component={Link}/>
                            <Tab label="Section 5" value={"/section-5"} to={"/section-5"} component={Link}/>
                        </Tabs>
                    </Box>
                </Drawer>
                <Box component="main" sx={{flexGrow: 1, paddingTop: "4rem"}}>
                    <Outlet/>
                </Box>
            </Box>
        </header>
    );
}
