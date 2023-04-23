import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext, PultD3Data } from "../contexts/AppContext";
import { useBackgroundImage } from "../hooks/useBackgroundImage";
import { usePults } from "../hooks/usePults";
import { Menu, MenuItem } from "@mui/material";
import {
    createRootSvg,
    createSvg,
    drawBackgroundImage,
    drawPult,
    initSvg,
    setPlutShapeParam,
} from "../libs/canvas";

export interface ContentProps {}

/** layer に zoom 機能を設定するための関数 */
function setZoom(
    rootSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null,
    viewBoxWidth: number,
    viewBoxHeight: number
) {
    // 呼び出すたびに zoom を再定義する
    const s = rootSvg;
    if (!s) return;

    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        s.select<SVGGElement>(".svg-canvas-control-group").attr(
            "transform",
            event.transform.toString()
        );
    };
    const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 50])
        .translateExtent([
            [0, 0],
            [viewBoxWidth, viewBoxHeight],
        ])
        .on("zoom", zoomed);

    s.call(zoom);
}

/** ベースとなる SVG をリサイズする */
function resizeRootSvg(
    rootSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null,
    divClientWidth: number,
    divClientHeight: number
) {
    const s = rootSvg;
    if (!s) return;
    const clientWidth = Math.floor(divClientWidth - 10);
    const clientHeight = Math.floor(divClientHeight - 10);
    const width = clientWidth;
    const height = clientHeight;

    s.attr("width", width).attr("height", height);

    setZoom(s, clientWidth, clientHeight);
}

interface RootSvgData {
    svgCanvas: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null;
    svgRoot: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null;
    contentRootRef: React.RefObject<HTMLDivElement>;
}

function useRootSvg(): RootSvgData {
    const svgRoot = useRef(
        null as d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null
    );
    const svgCanvas = useRef(
        null as d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null
    );
    const contentRootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // svg を初期化する
        const div = contentRootRef.current as HTMLDivElement;

        if (!svgRoot.current) {
            const rootSvg = createRootSvg(".content-root");
            svgRoot.current = rootSvg;

            resizeRootSvg(rootSvg, div.clientWidth, div.clientHeight);
        }

        if (!svgCanvas.current && svgRoot.current) {
            const s = createSvg(svgRoot.current);
            svgCanvas.current = s;

            initSvg(s);

            // resizeRootSvg(
            //     svgCanvas.current,
            //     div.clientWidth,
            //     div.clientHeight,
            //     0,
            //     0
            // );

            s.on("click", (d) => {
                console.log("root svg click");
            });
        }
    }, []);

    return {
        svgCanvas: svgCanvas.current,
        svgRoot: svgRoot.current,
        contentRootRef: contentRootRef,
    };
}

const DEBUG_SHAPE_RELOAD = 9;

export function Content(props: ContentProps) {
    const { data, setData } = useAppContext();
    const backgroundImageData = useBackgroundImage();

    const { svgCanvas, svgRoot, contentRootRef } = useRootSvg();

    const pults = usePults();
    const scale = data.scale;

    useEffect(() => {
        const div = contentRootRef.current as HTMLDivElement;
        const s = svgRoot;
        if (!s) return;

        resizeRootSvg(s, div.clientWidth, div.clientHeight);

        const resizeObserver = new ResizeObserver((e) => {
            resizeRootSvg(s, div.clientWidth, div.clientHeight);
        });

        resizeObserver.observe(div);

        return () => {
            resizeObserver.unobserve(div);
        };
    }, []);

    const [targetMenuData, setTargetMenuData] = useState<{
        mouseX: number;
        mouseY: number;
        id: string;
    } | null>(null);
    const handleContextMenu = (e: React.MouseEvent) => {
        // キャンバス全体のコンテキストメニューを設定する
        // e.preventDefault();
    };

    const handleTargetContextMenu = useCallback(
        (clientX: number, clientY: number, d: PultD3Data) => {
            setTargetMenuData({ mouseX: clientX, mouseY: clientY, id: d.id });
        },
        []
    );

    useEffect(() => {
        // d3 の描画処理など
        const s = svgCanvas;
        if (!s) return;

        drawBackgroundImage(svgCanvas, backgroundImageData);
        drawPult(svgCanvas, pults, handleTargetContextMenu, scale);
    }, [svgCanvas, backgroundImageData, pults, handleTargetContextMenu, scale]);

    useEffect(() => {
        // DEBUG
        const s = svgCanvas;
        if (!s) return;

        const layer = svgCanvas.select(".draw-layer");
        const circle = layer
            .selectAll<SVGCircleElement, unknown>(".plut-g > circle")
            .data(pults);
        const text = layer
            .selectAll<SVGTextElement, unknown>(".plut-g > text")
            .data(pults);

        setPlutShapeParam(circle, text);
    }, [DEBUG_SHAPE_RELOAD]);

    const handleDeleteTarget = () => {
        console.log(targetMenuData?.id);
        console.log(data.pults.filter((p) => p.id !== targetMenuData?.id));
        setData((d) => {
            return {
                ...d,
                pults: d.pults.filter((p) => p.id !== targetMenuData?.id),
            };
        });
        setTargetMenuData(null);
    };
    const handleOnMenuClose = () => {
        setTargetMenuData(null);
    };

    return (
        <div
            className="content-root"
            ref={contentRootRef}
            onContextMenu={handleContextMenu}
        >
            <Menu
                open={targetMenuData !== null}
                anchorReference="anchorPosition"
                onClose={handleOnMenuClose}
                anchorPosition={
                    targetMenuData
                        ? {
                              top: targetMenuData.mouseY,
                              left: targetMenuData.mouseX,
                          }
                        : undefined
                }
            >
                <MenuItem onClick={handleDeleteTarget}>削除</MenuItem>
            </Menu>
        </div>
    );
}
