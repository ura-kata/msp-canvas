import "./Control.scss";
import { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import { ExportDataV1, useAppContext } from "../contexts/AppContext";
import {
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    TextField,
} from "@mui/material";
import { useBackgroundImage } from "../hooks/useBackgroundImage";
import { base64ToFile, fileToBase64 } from "../libs/utils";

interface InputDialogProps {
    open: boolean;
    onClose: () => void;
}
function InputDialog(props: InputDialogProps) {
    const { data, setData } = useAppContext();
    const [pultText, setPultText] = useState(data.plutText ?? "");

    const handleSavePlut = () => {
        setData((d) => ({ ...d, plutText: pultText }));
        props.onClose();
    };

    const handleCalcelPult = () => {
        setPultText(data.plutText ?? "");
        props.onClose();
    };

    useEffect(() => {
        setPultText(data.plutText ?? "");
    }, [data.plutText]);

    return (
        <Dialog open={props.open} onClose={handleCalcelPult} fullWidth>
            <DialogTitle>プルト入力</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    multiline
                    rows={20}
                    value={pultText}
                    onChange={(e) => setPultText(e.target.value)}
                ></TextField>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleSavePlut}>保存</Button>
                <Button onClick={handleCalcelPult}>キャンセル</Button>
            </DialogActions>
        </Dialog>
    );
}

interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
}
function ExportDialog(props: ExportDialogProps) {
    const { data } = useAppContext();
    const backgroundImage = useBackgroundImage();

    const [exportJsonText, setExportJsonText] = useState<string>();

    const handleExportText = async () => {
        const url = backgroundImage?.url;
        if (!url) return;

        const blob = await fetch(url).then((r) => r.blob());

        const { base64, mimeType } = await fileToBase64(blob);

        const exportData: ExportDataV1 = {
            version: "1",
            pultText: data.plutText ?? "",
            pults: data.pults,
            backgroundImage: base64,
            backgroundImageMimeType: mimeType,
        };

        const exportDataJson = JSON.stringify(exportData);
        setExportJsonText(exportDataJson);
    };
    const handleExportSvg = () => {};
    const handleExportPng = () => {};

    const Content = exportJsonText ? (
        <>
            <TextField
                fullWidth
                value={exportJsonText}
                rows={15}
                multiline
            ></TextField>
        </>
    ) : (
        <>
            <Button onClick={handleExportText}>Text</Button>
            <Button onClick={handleExportSvg}>SVG</Button>
            <Button onClick={handleExportPng}>PNG</Button>
        </>
    );

    return (
        <Dialog open={props.open} onClose={props.onClose} fullWidth>
            <DialogTitle>Export</DialogTitle>
            <DialogContent>{Content}</DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>閉じる</Button>
            </DialogActions>
        </Dialog>
    );
}

interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
}
function ImportDialog(props: ImportDialogProps) {
    const { loadExportData } = useAppContext();
    const [importJsonOpen, setImportJsonOpen] = useState(false);
    const [importJsonText, setImportJsonText] = useState<string>();
    const [isError, setIsError] = useState(false);

    const handleImportTextClick = () => {
        setImportJsonOpen(true);
    };
    const handleImportSvg = async () => {};
    const handleImportPng = async () => {};

    const handleImportText = () => {
        if (!importJsonText) {
            return;
        }
        try {
            const exportData: ExportDataV1 = JSON.parse(importJsonText);

            loadExportData(exportData);
            setImportJsonText(undefined);
            props.onClose();
            setIsError(false);
        } catch {
            console.log("JSON のインポートに失敗しました");
            setIsError(true);
        }
    };

    const Content = importJsonOpen ? (
        <>
            <TextField
                onChange={(e) => {
                    setImportJsonText(e.target.value);
                }}
                value={importJsonText}
                multiline
                rows={15}
                fullWidth
                error={isError}
            />
            <Button onClick={handleImportText}>Import</Button>
        </>
    ) : (
        <>
            <Button onClick={handleImportTextClick}>Text</Button>
            <Button onClick={handleImportSvg}>SVG</Button>
            <Button onClick={handleImportPng}>PNG</Button>
        </>
    );

    return (
        <Dialog open={props.open} onClose={props.onClose} fullWidth>
            <DialogTitle>Import</DialogTitle>
            <DialogContent>
                {Content}
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>閉じる</Button>
            </DialogActions>
        </Dialog>
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
