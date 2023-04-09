import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext, PultD3Data } from "../contexts/AppContext";
import { BackgroundImageData, useBackgroundImage } from "../hooks/useBackgroundImage";
import { usePults } from "../hooks/usePults";
import { Menu, MenuItem } from "@mui/material";
import { createSvg, drawBackgroundImage, drawPult, initRootSvg, setPlutShapeParam } from "../libs/canvas";

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
        s.selectAll<SVGGElement, unknown>(".background-layer,.draw-layer").attr(
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
    divClientHeight: number,
    backgroundImageWidth?: number,
    backgroundImageHeight?: number
) {
    const s = rootSvg;
    if (!s) return;
    const imageWidth = backgroundImageWidth ?? 0;
    const imageHeight = backgroundImageHeight ?? 0;
    const clientWidth = Math.floor(divClientWidth - 10);
    const clientHeight = Math.floor(divClientHeight - 10);
    const scale = Math.min(
        clientWidth / imageWidth,
        clientHeight / imageHeight
    );
    const width = imageWidth === 0 ? 0 : imageWidth * scale;
    const height = imageHeight === 0 ? 0 : imageHeight * scale;

    s.attr("width", width).attr("height", height);

    setZoom(s, imageWidth, imageHeight);
}

interface RootSvgData {
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null;
    contentRootRef: React.RefObject<HTMLDivElement>;
}

function useRootSvg(): RootSvgData {
    const svg = useRef(
        null as d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null
    );
    const contentRootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // svg を初期化する
        const div = contentRootRef.current as HTMLDivElement;

        if (!svg.current) {
            const s = createSvg(".content-root");
            svg.current = s;
            
            initRootSvg(s);

            resizeRootSvg(svg.current, div.clientWidth, div.clientHeight, 0, 0);

            s.on("click", (d) => {
                console.log("root svg click");
            });
        }
    }, []);

    return {
        svg: svg.current,
        contentRootRef: contentRootRef,
    };
}

const DEBUG_SHAPE_RELOAD = 9;


export function Content(props: ContentProps) {
    const { data, setData } = useAppContext();
    const backgroundImageData = useBackgroundImage();

    const { svg, contentRootRef } = useRootSvg();

    const pults = usePults();
    const scale = data.scale;

    useEffect(() => {
        const div = contentRootRef.current as HTMLDivElement;
        const s = svg;
        if (!s) return;

        resizeRootSvg(
            s,
            div.clientWidth,
            div.clientHeight,
            backgroundImageData?.width,
            backgroundImageData?.height
        );

        const resizeObserver = new ResizeObserver((e) => {
            resizeRootSvg(
                s,
                div.clientWidth,
                div.clientHeight,
                backgroundImageData?.width,
                backgroundImageData?.height
            );
        });

        resizeObserver.observe(div);

        return () => {
            resizeObserver.unobserve(div);
        };
    }, [backgroundImageData]);

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
        const s = svg;
        if (!s) return;

        drawBackgroundImage(svg, backgroundImageData);
        drawPult(svg, pults, handleTargetContextMenu, scale);
    }, [svg, backgroundImageData, pults, handleTargetContextMenu, scale]);

    useEffect(() => {
        // DEBUG
        const s = svg;
        if (!s) return;

        const layer = svg.select(".draw-layer");
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