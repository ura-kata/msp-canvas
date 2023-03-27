import "./Control.scss";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { AppContextData, ExportDataV1, PultD3Data, useAppContext } from "../contexts/AppContext";
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
import { createSvg, drawBackgroundImage, drawPult, initRootSvg } from "../libs/canvas";
import { usePults } from "../hooks/usePults";


async function createExportDataV1(backgroundUrl: string, data: AppContextData) {
    const blob = await fetch(backgroundUrl).then((r) => r.blob());

    const { base64, mimeType } = await fileToBase64(blob);

    const exportData: ExportDataV1 = {
        version: "1",
        pultText: data.plutText ?? "",
        pults: data.pults,
        backgroundImage: base64,
        backgroundImageMimeType: mimeType,
    };

    const exportDataJson = JSON.stringify(exportData);
    return exportDataJson;
}

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

function SvgContent() {
    const { data } = useAppContext();
    const svg = useRef(
        null as d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null
    );
    const backgroundImageData = useBackgroundImage();
    const pults = usePults();
    const [drawImage, setDrawImage] = useState<boolean>();
    const [imgSrc, setImgSrc] = useState("");
    const [exportData, setExportData] = useState<string>();

    useEffect(() => { 
        if (svg.current) return;
        const s = createSvg("#export-svg-data");
        svg.current = s;
        initRootSvg(s);
    }, [svg.current]);
    
    useEffect(() => {
        const s = svg.current;
        if (!s) return;

        if (!backgroundImageData) return;

        drawBackgroundImage(s, backgroundImageData, true);
        
        // TODO: ハンドラを設定しなくても描画できるように設定と動作は分けて実装する
        const handleTargetContextMenu = (clientX: number, clientY: number, d: PultD3Data) => {
        };
        drawPult(s, pults, handleTargetContextMenu);
        setDrawImage(true);
    }, [svg.current, backgroundImageData, pults]);

    useEffect(() => {
        const url = backgroundImageData?.url;
        if (!url) return;
        const f = async () => {
            const exportData = await createExportDataV1(url, data);
            setExportData(exportData);
        };

        f();
        
    }, [backgroundImageData]);

    useEffect(() => { 
        if (!drawImage) return;
        if (!exportData) return;

        const svgElement = document.querySelector("#export-svg-data > svg");
        if (!svgElement) return;

        const dataComment = exportData;
        const dataCommentNode = document.createComment(dataComment);
        svgElement.appendChild(dataCommentNode);

        // https://stackoverflow.com/questions/28450471/convert-inline-svg-to-base64-string
        // TODO : 中身の理解をする
        const svgText = new XMLSerializer().serializeToString(svgElement);

        const decoded = unescape(encodeURIComponent(svgText));

        const base64 = btoa(decoded);

        const imgSource = `data:image/svg+xml;base64,${base64}`;
        setImgSrc(imgSource);
    }, [drawImage, exportData]);
    
    return <><div id="export-svg-data" style={{display:"none"}}></div><div id="export-svg-previwe">{imgSrc ? <img src={ imgSrc}></img> : <></>}</div></>
}


interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
}
function ExportDialog(props: ExportDialogProps) {
    const { data } = useAppContext();
    const backgroundImage = useBackgroundImage();

    const [exportJsonText, setExportJsonText] = useState<string>();
    const [isSvg, setIsSvg] = useState<boolean>();

    const handleExportText = async () => {
        const url = backgroundImage?.url;
        if (!url) return;

        const exportDataJson = await createExportDataV1(url, data);
        setExportJsonText(exportDataJson);
    };
    const handleExportSvg = () => {
        setIsSvg(true);
    };
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
    ) : isSvg ? <SvgContent /> :(
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

interface ImportSvgContentProps{
    svgFile: File;
    onClose?: () => void;
}

function ImportSvgContent(props: ImportSvgContentProps) {
    const { loadExportData } = useAppContext();
    const [loadedSvg, setLoadedSvg] = useState<boolean>();
    const [errMsg, setErrMsg] = useState("");
    const [exportData, setExportData] = useState<ExportDataV1>();
    
    const imageUrl = useMemo(() => {
        if (!exportData) return null;
        return window.URL.createObjectURL(props.svgFile);
    }, [props.svgFile, exportData]);

    
    useEffect(() => { 
        // SVG をタグとして読み込む
        const fr = new FileReader();

        fr.onload = (ev) => { 
            const svgText = fr.result as string;
            const rootDiv = document.getElementById("import-svg-data") as HTMLDivElement;

            rootDiv.innerHTML = svgText;
            setLoadedSvg(true);
        };
        fr.readAsText(props.svgFile);
    }, [props.svgFile]);

    useEffect(() => { 
        if (!loadedSvg) return;

        
        const svgElement = document.querySelector("#import-svg-data > svg");
        if (!svgElement) return;

        function findCommentNode(elem: Element): Comment | null{
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
                const exportData: ExportDataV1 = JSON.parse(importData);
                setExportData(exportData);

                setErrMsg("");
            }
            else {
                setErrMsg("Import 用のデータがない SVG ファイルです");
            }
        }
        catch {
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
    return <>
        <div id="import-svg-data" style={{ display: "none" }}></div>
        <div id="import-svg-previwe">
            {errMsg ? <p>{ errMsg}</p> : <></>}
            {imageUrl ? <><img src={imageUrl}></img><Button onClick={handleOnLoad}>読み込む</Button></> : <></>}
        </div>
    </>
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
    const [loadedSvgFile, setLoadedSvgFile] = useState<File>();

    const init = () => { 
        setImportJsonOpen(false);
        setImportJsonText(undefined);
        setIsError(false);
        setLoadedSvgFile(undefined);
    }

    const handleImportTextClick = () => {
        setImportJsonOpen(true);
    };
    const handleImportPng = async () => { };
    
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
    ) : loadedSvgFile ? <ImportSvgContent svgFile={loadedSvgFile} onClose={ handleOnClose} /> : (
        <>
            <Button onClick={handleImportTextClick}>Text</Button>
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
            <Button onClick={handleImportPng}>PNG</Button>
        </>
    );

    return (
        <Dialog open={props.open} onClose={handleOnClose} fullWidth>
            <DialogTitle>Import</DialogTitle>
            <DialogContent>
                {Content}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleOnClose}>閉じる</Button>
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
