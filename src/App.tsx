import "./App.scss";
import { BrowserRouter } from "react-router-dom";
import { Control } from "./parts/Control";
import { Content } from "./parts/Content";
import { useState } from "react";
import { AppContextProvider } from "./contexts/AppContext";
import { Button, Dialog } from "@mui/material";
import { Copyright } from "./parts/Copyrighe";

function App() {
    const [open, setOpen] = useState(false);
    return (
        <BrowserRouter>
            <AppContextProvider>
                <div className="app">
                    <div className="content">
                        <Content />
                    </div>
                    <div className="control-small">
                        <Button onClick={() => setOpen(true)}>
                            コントロールを開く
                        </Button>
                        <Copyright
                            sideStyle={true}
                            className="small-nav-copyright"
                        />
                    </div>
                    <div className="control-large">
                        <Control />
                    </div>
                    <Dialog open={open} onClose={() => setOpen(false)}>
                        <Control />
                    </Dialog>
                </div>
            </AppContextProvider>
        </BrowserRouter>
    );
}

export default App;
