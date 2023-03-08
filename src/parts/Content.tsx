import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext } from "../contexts/AppContext";
import { useBackgroundImage } from "../hooks/useBackgroundImage";
import { usePlutData, PultData } from "../hooks/usePlutData";

export interface ContentProps {}

function debugLog(msg: string) {
    const d = new Date();
    console.log(`${d.toISOString()} : ${msg}`);
}

export function Content(props: ContentProps) {
    const backgroundImageData = useBackgroundImage();
    const contentRootRef = useRef<HTMLDivElement>(null);
    const svg = useRef(
        null as d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null
    );

    console.log(backgroundImageData?.url);

    const plutData = usePlutData();

    const backgroundImageList = useMemo(
        () =>
            [
                {
                    x: 0,
                    y: 0,
                    imageUrl: backgroundImageData?.url,
                },
            ].filter(
                (d): d is { x: number; y: number; imageUrl: string } =>
                    d.imageUrl != undefined
            ),
        [backgroundImageData]
    );

    const setZoom = (viewBoxWidth: number, viewBoxHeight: number) => {
        // 呼び出すたびに zoom を再定義する
        const s = svg.current;
        if (!s) return;
        const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
            s.selectAll<SVGGElement, unknown>(
                ".background-layer,.draw-layer"
            ).attr("transform", event.transform.toString());
            console.log("after resize");
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
    };

    useEffect(() => {
        const div = contentRootRef.current as HTMLDivElement;
        if (!svg.current) return;

        const resize = () => {
            const s = svg.current;
            if (!s) return;
            const imageWidth = backgroundImageData?.width ?? 0;
            const imageHeight = backgroundImageData?.height ?? 0;
            const clientWidth = Math.floor(div.clientWidth - 10);
            const clientHeight = Math.floor(div.clientHeight - 10);
            const scale = Math.min(
                clientWidth / imageWidth,
                clientHeight / imageHeight
            );
            const width = imageWidth === 0 ? 0 : imageWidth * scale;
            const height = imageHeight === 0 ? 0 : imageHeight * scale;
            const viewbox = `0 0 ${imageWidth} ${imageHeight}`;

            s.attr("width", width)
                .attr("height", height)
                .attr("viewBox", viewbox);

            setZoom(imageWidth, imageHeight);

            debugLog("resize div");
        };

        resize();

        const resizeObserver = new ResizeObserver((e) => {
            resize();
        });

        debugLog("create size observe");

        resizeObserver.observe(div);

        return () => {
            resizeObserver.unobserve(div);
        };
    }, [backgroundImageData]);

    useEffect(() => {
        const div = contentRootRef.current as HTMLDivElement;

        if (!svg.current) {
            const width = Math.floor(div.clientWidth - 10);
            const height = Math.floor(div.clientHeight - 10);
            const viewbox = `0 0 ${width} ${height}`;
            const s = d3
                .select(".content-root")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", viewbox)
                .attr("class", "svg-canvas");
            s.append("g").attr("class", "background-layer");
            s.append("g").attr("class", "draw-layer");
            svg.current = s;

            setZoom(width, height);

            debugLog("created svg");
        }
    }, []);

    useEffect(() => {
        // TODO d3 の描画処理など
        const s = svg.current;
        if (!s) return;
        debugLog("test");

        const drawPult = () => {
            const layer = s.select(".draw-layer");
            {
                const move = (type: string) => {
                    const filteredData = plutData.filter(
                        (d) => d.type === type
                    );
                    layer
                        .selectAll(".plut-g." + type + " > circle")
                        .data(filteredData)
                        .attr("cx", (d) => d.cx)
                        .attr("cy", (d) => d.cy);
                    layer
                        .selectAll(".plut-g." + type + " > text")
                        .data(filteredData)
                        .attr("x", (d) => d.cx + 100)
                        .attr("y", (d) => d.cy + 100);
                };

                let dragSubject: PultData | undefined = undefined;
                const dragStarted = (e: any, d: PultData) => {
                    dragSubject = e.subject;
                };

                const dragged = (e: any, d: PultData) => {
                    const dx = e.dx;
                    const dy = e.dy;
                    if (dragSubject) {
                        dragSubject.cx += dx;
                        dragSubject.cy += dy;
                        move(dragSubject.type);
                    }
                };
                const dragEnded = (e: any, d: PultData) => {
                    dragSubject = undefined;
                };
                const drag = d3
                    .drag<SVGCircleElement, PultData>()
                    .on("start", dragStarted)
                    .on("drag", dragged)
                    .on("end", dragEnded);

                const chain = layer
                    .selectAll<SVGGElement, unknown>(".plut-g")
                    .data(plutData);

                // exit の後は多い分のデータの処理なので remove で削除する
                chain.exit().remove();

                // enter の後は増えた分のデータの処理なので g を足しておく
                const newChainG = chain.enter().append("g");
                newChainG
                    .append("circle")
                    .attr("cx", (d) => d.cx)
                    .attr("cy", (d) => d.cy)
                    .attr("r", (d) => 100)
                    .attr("fill", "#000")
                    .call(drag);
                newChainG
                    .append("text")
                    .attr("x", (d) => d.cx + 100)
                    .attr("y", (d) => d.cy + 100)
                    .text((d) => d.type);

                // 増えた分に merge で update 分(通常の select の後)を足して一緒に処理をする
                // type が変わったときにも更新できるように
                newChainG.merge(chain).attr("class", (d) => "plut-g " + d.type);
            }
        };

        const drawImage = () => {
            const chain = s
                .select(".background-layer")
                .selectAll<SVGImageElement, unknown>("image")
                .data(backgroundImageList);

            chain.exit().remove();
            const chainAdd = chain.enter().append("image");

            const chainUpdate = chainAdd.merge(chain);

            chainUpdate
                .attr("x", (d) => d.x)
                .attr("y", (d) => d.y)
                .attr("href", (d) => d.imageUrl);
        };

        drawImage();
        drawPult();
    }, [svg.current, backgroundImageList, plutData]);
    return <div className="content-root" ref={contentRootRef}></div>;
}
