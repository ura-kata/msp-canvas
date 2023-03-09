import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext } from "../contexts/AppContext";
import { useBackgroundImage } from "../hooks/useBackgroundImage";
import { usePlutData, PultD3Data } from "../hooks/usePlutData";

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
    const viewbox = `0 0 ${imageWidth} ${imageHeight}`;

    s.attr("width", width).attr("height", height).attr("viewBox", viewbox);

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
            const s = d3
                .select(".content-root")
                .append("svg")
                .attr("class", "svg-canvas");
            s.append("g").attr("class", "background-layer");
            s.append("g").attr("class", "draw-layer");
            svg.current = s;

            resizeRootSvg(svg.current, div.clientWidth, div.clientHeight, 0, 0);
        }
    }, []);

    return {
        svg: svg.current,
        contentRootRef: contentRootRef,
    };
}

interface BackgroundD3Data {
    x: number;
    y: number;
    imageUrl: string;
}

function drawBackgroundImage(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    data: BackgroundD3Data[]
) {
    const chain = svg
        .select(".background-layer")
        .selectAll<SVGImageElement, unknown>("image")
        .data(data);

    chain.exit().remove();
    const chainUpdate = chain.enter().append("image").merge(chain);

    chainUpdate
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .attr("href", (d) => d.imageUrl);
}

function drawPult(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    data: PultD3Data[]
) {
    const layer = svg.select(".draw-layer");
    {
        const move = (d: PultD3Data) => {
            const data = [d];
            layer
                .select(".plut-g." + d.type + " > circle.plut-drag-" + d.id)
                .data(data)
                .attr("cx", (d) => d.cx)
                .attr("cy", (d) => d.cy);
            layer
                .select(".plut-g." + d.type + " > text.plut-drag-" + d.id)
                .data(data)
                .attr("x", (d) => d.cx + 100)
                .attr("y", (d) => d.cy + 100);
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
        const drag = d3
            .drag<SVGCircleElement, PultD3Data>()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded);

        const chain = layer
            .selectAll<SVGGElement, unknown>(".plut-g")
            .data(data);

        // exit の後は多い分のデータの処理なので remove で削除する
        chain.exit().remove();

        // enter の後は増えた分のデータの処理なので g を足しておく
        const newChainG = chain.enter().append("g");
        newChainG
            .append("circle")
            .attr("cx", (d) => d.cx)
            .attr("cy", (d) => d.cy)
            .attr("r", (d) => 100)
            .attr("fill", (d: any) => (d.id === 0 ? "#000" : "#f00"))
            .attr("class", (d) => "plut-drag-" + d.id)
            .call(drag);
        newChainG
            .append("text")
            .attr("x", (d) => d.cx + 100)
            .attr("y", (d) => d.cy + 100)
            .attr("class", (d) => "plut-drag-" + d.id)
            .text((d) => d.type);

        // 増えた分に merge で update 分(通常の select の後)を足して一緒に処理をする
        // type が変わったときにも更新できるように
        newChainG.merge(chain).attr("class", (d) => "plut-g " + d.type);
    }
}

export function Content(props: ContentProps) {
    const backgroundImageData = useBackgroundImage();

    const { svg, contentRootRef } = useRootSvg();

    const plutData = usePlutData();

    const backgroundData = useMemo<BackgroundD3Data[]>(() => {
        if (backgroundImageData) {
            return [
                {
                    x: 0,
                    y: 0,
                    imageUrl: backgroundImageData.url,
                },
            ];
        }
        return [];
    }, [backgroundImageData]);

    useEffect(() => {
        // background image を設定する
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

    useEffect(() => {
        // d3 の描画処理など
        const s = svg;
        if (!s) return;

        drawBackgroundImage(svg, backgroundData);
        drawPult(svg, plutData);
    }, [svg, backgroundData, plutData]);

    return <div className="content-root" ref={contentRootRef}></div>;
}
