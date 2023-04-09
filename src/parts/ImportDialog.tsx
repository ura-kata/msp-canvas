import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
    ExportDataV1,
    ExportDataV2,
    useAppContext,
} from "../contexts/AppContext";

interface ImportSvgContentProps {
    svgFile: File;
    onClose?: () => void;
}

function ImportSvgContent(props: ImportSvgContentProps) {
    const { loadExportData } = useAppContext();
    const [loadedSvg, setLoadedSvg] = useState<boolean>();
    const [errMsg, setErrMsg] = useState("");
    const [exportData, setExportData] = useState<ExportDataV2>();

    const imageUrl = useMemo(() => {
        if (!exportData) return null;
        return window.URL.createObjectURL(props.svgFile);
    }, [props.svgFile, exportData]);

    useEffect(() => {
        // SVG をタグとして読み込む
        const fr = new FileReader();

        fr.onload = (ev) => {
            const svgText = fr.result as string;
            const rootDiv = document.getElementById(
                "import-svg-data"
            ) as HTMLDivElement;

            rootDiv.innerHTML = svgText;
            setLoadedSvg(true);
        };
        fr.readAsText(props.svgFile);
    }, [props.svgFile]);

    useEffect(() => {
        if (!loadedSvg) return;

        const svgElement = document.querySelector("#import-svg-data > svg");
        if (!svgElement) return;

        function findCommentNode(elem: Element): Comment | null {
            for (const child of elem.childNodes) {
                if (child.nodeType === Node.COMMENT_NODE) {
                    return child as Comment;
                }
            }
            return null;
        }

        try {
            const comment = findCommentNode(svgElement);

            if (comment) {
                const importData = comment.data;
                const exportData: ExportDataV1 | ExportDataV2 =
                    JSON.parse(importData);

                if (exportData.version !== "2") {
                    setErrMsg(
                        "Import 用のデータの version が 2 ではないファイルです"
                    );
                } else {
                    setExportData(exportData);
                    setErrMsg("");
                }
            } else {
                setErrMsg("Import 用のデータがない SVG ファイルです");
            }
        } catch {
            setErrMsg("Import に失敗しました");
        }
    }, [loadedSvg]);

    const handleOnLoad = () => {
        if (!exportData) return;
        loadExportData(exportData);
        if (props.onClose) {
            props.onClose();
        }
    };
    return (
        <>
            <div id="import-svg-data" style={{ display: "none" }}></div>
            <div id="import-svg-previwe">
                {errMsg ? <p>{errMsg}</p> : <></>}
                {imageUrl ? (
                    <>
                        <img src={imageUrl}></img>
                        <Button onClick={handleOnLoad}>読み込む</Button>
                    </>
                ) : (
                    <></>
                )}
            </div>
        </>
    );
}

interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
}
export function ImportDialog(props: ImportDialogProps) {
    const { loadExportData } = useAppContext();
    const [importJsonOpen, setImportJsonOpen] = useState(false);
    const [importJsonText, setImportJsonText] = useState<string>();
    const [isError, setIsError] = useState(false);
    const [loadedSvgFile, setLoadedSvgFile] = useState<File>();

    const init = () => {
        setImportJsonOpen(false);
        setImportJsonText(undefined);
        setIsError(false);
        setLoadedSvgFile(undefined);
    };

    const handleImportTextClick = () => {
        setImportJsonOpen(true);
    };
    const handleImportPng = async () => {};

    const handleLoadSvg = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const img = e.target.files[0];
        setLoadedSvgFile(img);
    };

    const handleImportText = () => {
        if (!importJsonText) {
            return;
        }
        try {
            const exportData: ExportDataV1 | ExportDataV2 =
                JSON.parse(importJsonText);

            if (exportData.version !== "2") {
                throw new Error(
                    "インポートしたデータの version が '2' ではありませんでした"
                );
            }

            loadExportData(exportData);
            setImportJsonText(undefined);
            props.onClose();
            setIsError(false);
        } catch {
            console.log("JSON のインポートに失敗しました");
            setIsError(true);
        }
    };

    const handleOnClose = () => {
        props.onClose();
        init();
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
    ) : loadedSvgFile ? (
        <ImportSvgContent svgFile={loadedSvgFile} onClose={handleOnClose} />
    ) : (
        <>
            <Button onClick={handleImportTextClick}>Json</Button>
            <Button component="label">
                SVG
                <input
                    hidden
                    id="import-svg-img"
                    type="file"
                    accept=".svg"
                    onChange={handleLoadSvg}
                />
            </Button>
            {/* TODO: PNGのインポート機能を実装する */}
            {/* <Button onClick={handleImportPng}>PNG</Button> */}
        </>
    );

    return (
        <Dialog open={props.open} onClose={handleOnClose} fullWidth>
            <DialogTitle>Import</DialogTitle>
            <DialogContent>{Content}</DialogContent>
            <DialogActions>
                <Button onClick={handleOnClose}>閉じる</Button>
            </DialogActions>
        </Dialog>
    );
}
