import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext, PultD3Data } from "../contexts/AppContext";
import { BackgroundImageData, useBackgroundImage } from "../hooks/useBackgroundImage";
import { usePults } from "../hooks/usePults";
import { Menu, MenuItem } from "@mui/material";

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

function createSvg(parentTagSelector: string):d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
    const s = d3
            .select(parentTagSelector)
            .append("svg")
        .attr("class", "svg-canvas");
    return s;
}

function initRootSvg(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>) {
    if (!svg)
        return;
    const s = svg;
    s.append("g").attr("class", "background-layer");
    s.append("g").attr("class", "draw-layer");
    const viewbox = `0 0 0 0`; 
    s.attr("viewBox", viewbox);
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

function setPlutShapeParam(
    circle: d3.Selection<SVGCircleElement, PultD3Data, d3.BaseType, unknown>,
    text: d3.Selection<SVGTextElement, PultD3Data, d3.BaseType, unknown>
) {
    circle
        .attr("cx", "100")
        .attr("cy", "100")
        .attr("r", (d) => 100)
        .attr("fill", (d: any) => d.color ? d.color : "#000")
        .attr("class", (d) => "plut-drag-" + d.id);

    text.attr("x", "50%")
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("class", (d) => "plut-drag-" + d.id)
        .attr("font-size", "80")
        .attr("fill", "#fff")
        .text((d) => d.display);
}

function drawBackgroundImage(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    background?: BackgroundImageData
) {
    const width = background?.width ?? 0;
    const height = background?.height ?? 0;
    const viewbox = `0 0 ${width} ${height}`; 
    svg.attr("viewBox", viewbox);

    const chain = svg
        .select(".background-layer")
        .selectAll<SVGImageElement, unknown>("image")
        .data([background]);

    chain.exit().remove();
    const chainUpdate = chain.enter().append("image").merge(chain);

    chainUpdate
        .attr("x", "0")
        .attr("y", "0")
        .attr("href", (d) => d?.url ?? "");
}

function drawPult(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    data: PultD3Data[],
    handleContextMenu: (clientX: number, clientY: number, d: PultD3Data) => void
) {
    const layer = svg.select(".draw-layer");
    {
        const move = (d: PultD3Data) => {
            const data = [d];
            layer
                .select<SVGSVGElement>(".plut-g.plut-drag-" + d.id)
                .data(data)
                .attr("x", (d) => d.cx - 100)
                .attr("y", (d) => d.cy - 100);
        };

        const dragStarted = (e: any, d: PultD3Data) => {};

        const dragged = (e: any, d: PultD3Data) => {
            const dx = e.dx;
            const dy = e.dy;

            d.cx += dx;
            d.cy += dy;
            move(d);
        };
        const dragEnded = (e: any, d: PultD3Data) => {};
        const dragSvg = d3
            .drag<SVGSVGElement, PultD3Data>()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded);

        const handleOnContextMenu = (e: PointerEvent, d: PultD3Data) => {
            // プルトを文字で入力できるようにしたのでコンテキストメニューで削除をとりあえずしないようにする
            // TODO : ただ pultText から削除する処理を書けばできるのでそれも検討しておく
            e.preventDefault();

            // e の client のポジションが div と一致しているのでとりあえずこれをそのまま使う
            handleContextMenu(e.clientX, e.clientY, d);
        };

        const chain = layer
            .selectAll<SVGSVGElement, unknown>(".plut-g")
            .data(data);

        // exit の後は多い分のデータの処理なので remove で削除する
        chain.exit().remove();

        // enter の後は増えた分のデータの処理なので g を足しておく
        const newChainSvg = chain.enter().append("svg");

        // どんなターゲットでも共通の処理を初期化として与えておく
        newChainSvg.append("circle");
        // .on("contextmenu", handleOnContextMenu);
        newChainSvg.append("text");
        // .on("contextmenu", handleOnContextMenu);

        // 増えた分に merge で update 分(通常の select の後)を足して一緒に処理をする
        // type が変わったときにも更新できるように
        newChainSvg
            .merge(chain)
            .attr("class", (d) => "plut-g plut-drag-" + d.id)
            .attr("viewBox", "0 0 200 200")
            .attr("height", "200")
            .attr("width", "200")
            .attr("x", (d) => d.cx - 100)
            .attr("y", (d) => d.cy - 100)
            .call(dragSvg);

        // データが変わったときに必ず全体を更新する
        const circle = layer
            .selectAll<SVGCircleElement, unknown>(".plut-g > circle")
            .data(data);
        const text = layer
            .selectAll<SVGTextElement, unknown>(".plut-g > text")
            .data(data);
        setPlutShapeParam(circle, text);
    }
}

export function Content(props: ContentProps) {
    const { data, setData } = useAppContext();
    const backgroundImageData = useBackgroundImage();

    const { svg, contentRootRef } = useRootSvg();

    const pults = usePults();

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
        drawPult(svg, pults, handleTargetContextMenu);
    }, [svg, backgroundImageData, pults, handleTargetContextMenu]);

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
