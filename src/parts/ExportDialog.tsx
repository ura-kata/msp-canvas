import { useEffect, useRef, useState } from "react";
import { AppContextData, ExportDataV1, PultD3Data, useAppContext } from "../contexts/AppContext";
import { useBackgroundImage } from "../hooks/useBackgroundImage";
import { usePults } from "../hooks/usePults";
import { createSvg, drawBackgroundImage, drawPult, initRootSvg } from "../libs/canvas";
import { format } from "date-fns";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { fileToBase64 } from "../libs/utils";


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

    const handleDownloadClick = () => {
        if (!imgSrc) return;
        const a = document.createElement("a");
        a.href = imgSrc;
        a.download = format(new Date(), "yyyy-MM-dd_HH-mm-ss") + ".msp.svg";
        a.target = "_blank";
        a.click();
    };
    
    return <><div id="export-svg-data" style={{display:"none"}}></div><div id="export-svg-previwe">{imgSrc ? <><img src={ imgSrc}></img><Button onClick={handleDownloadClick}>ダウンロード</Button></> : <></>}</div></>
}


interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
}
export function ExportDialog(props: ExportDialogProps) {
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