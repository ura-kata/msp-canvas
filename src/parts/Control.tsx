import "./Control.scss";
import { useState } from "react";
import Button from "@mui/material/Button";
import { useAppContext } from "../contexts/AppContext";
import { ImportDialog } from "./ImportDialog";
import { ExportDialog } from "./ExportDialog";
import { InputDialog } from "./InputDialog";


export class NavProps {
    className?: string;
}

export function Control(props: NavProps) {
    const { setData } = useAppContext();
    const handleLoadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const img = e.target.files[0];
        setData((d) => ({ ...d, file: img }));
    };

    const [inputOpen, setInputOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    const handleInputClose = () => {
        setInputOpen(false);
    };

    const handleImportClose = () => {
        setImportOpen(false);
    };

    const handleExportClose = () => {
        setExportOpen(false);
    };

    return (
        <div className={"nav-root " + props.className}>
            <Button variant="contained" component="label">
                背景画像をアップロード
                {/*
                materila ui の Button に input を仕込む方法
                https://stackoverflow.com/questions/40589302/how-to-enable-file-upload-on-reacts-material-ui-simple-input */}
                <input
                    hidden
                    id="img"
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handleLoadImage}
                />
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => setInputOpen(true)}
            >
                プルト入力
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => setExportOpen(true)}
            >
                Export
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => setImportOpen(true)}
            >
                Import
            </Button>
            <InputDialog open={inputOpen} onClose={handleInputClose} />
            <ExportDialog open={exportOpen} onClose={handleExportClose} />
            <ImportDialog open={importOpen} onClose={handleImportClose} />
        </div>
    );
}
