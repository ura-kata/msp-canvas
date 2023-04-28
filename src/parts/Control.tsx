import "./Control.scss";
import { useState } from "react";
import Button from "@mui/material/Button";
import { useAppContext } from "../contexts/AppContext";
import { ImportDialog } from "./ImportDialog";
import { ExportDialog } from "./ExportDialog";
import { InputDialog } from "./InputDialog";
import { Slider, Stack, TextField, Typography } from "@mui/material";
import { InputPartsDialog } from "./InputPartsDialog";
import { InputMemberDialog } from "./InputMemberDialog";
import { Copyright } from "./Copyrighe";
import EditIcon from "@mui/icons-material/Edit";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ImageIcon from "@mui/icons-material/Image";

function ScaleSlider() {
    const { data, setData } = useAppContext();

    const handleOnChangeScale = (
        event: Event,
        value: number | number[],
        activeThumb: number
    ) => {
        const newValue = (() => {
            if (Array.isArray(value)) {
                return value[0];
            }
            return value;
        })();

        setData({ ...data, scale: newValue });
    };
    const handleOnChangeScaleText: React.ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    > = (e) => {
        const value = parseInt(e.target.value);

        const scale = Math.min(Math.max(1, value), 1000);
        setData({ ...data, scale: scale });
    };
    return (
        <div className="nav-slider-container">
            <div className="text">
                <TextField
                    label="スケール [pixel/m]"
                    variant="standard"
                    type="number"
                    onChange={handleOnChangeScaleText}
                    value={data.scale}
                ></TextField>
            </div>

            <Slider
                value={data.scale}
                onChange={handleOnChangeScale}
                min={1}
                max={1000}
            ></Slider>
        </div>
    );
}

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
    const [inputPartsOpen, setInputPartsOpen] = useState(false);
    const [inputMemberOpen, setInputMemberOpen] = useState(false);

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
            <div className="nav-button-container">
                <Button variant="contained" component="label">
                    <ImageIcon />
                    背景画像
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
                    onClick={() => setInputPartsOpen(true)}
                >
                    <EditIcon />
                    パート入力
                </Button>
                <Button
                    variant="contained"
                    component="label"
                    onClick={() => setInputMemberOpen(true)}
                >
                    <EditIcon />
                    出演者入力
                </Button>
                <Button
                    variant="contained"
                    component="label"
                    onClick={() => setExportOpen(true)}
                >
                    <FileDownloadIcon />
                    書き出し
                </Button>
                <Button
                    variant="contained"
                    component="label"
                    onClick={() => setImportOpen(true)}
                >
                    <FileUploadIcon />
                    読み込み
                </Button>
                <ScaleSlider />
            </div>
            <Copyright className="nav-version" />
            <InputDialog open={inputOpen} onClose={handleInputClose} />
            <ExportDialog open={exportOpen} onClose={handleExportClose} />
            <ImportDialog open={importOpen} onClose={handleImportClose} />
            <InputPartsDialog
                open={inputPartsOpen}
                onClose={() => setInputPartsOpen(false)}
            />
            <InputMemberDialog
                open={inputMemberOpen}
                onClose={() => setInputMemberOpen(false)}
            />
        </div>
    );
}
