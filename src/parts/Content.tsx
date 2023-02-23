import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext } from "../contexts/AppContext";
import { useBackgroundImage } from "../hooks/useBackgroundImage";
import { usePlutData } from "../hooks/usePlutData";

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

    const sampleData = useMemo<
        { x: number; y: number; type: "circle" | "rect" }[]
    >(
        () => [
            {
                x: 700,
                y: 500,
                type: "circle",
            },
            {
                x: 800,
                y: 600,
                type: "rect",
            },
        ],
        []
    );
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

        const drawSample = () => {
            // MOME : 同じデータの配列で要素を追加することでz-order を配列の順番にするために
            // 別々の要素を追加する方法を確認している
            const layer = s.select(".draw-layer");
            const chain = layer
                .selectAll<SVGCircleElement | SVGRectElement, unknown>(
                    ".object"
                )
                .data(sampleData);

            chain.exit().remove();

            const createNode = (d: {
                x: number;
                y: number;
                type: "circle" | "rect";
            }) => {
                switch (d.type) {
                    case "circle":
                        return document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "circle"
                        );
                    // こちらでは要素は生成されるが絵に反映がされなかった
                    // return d3.create("circle").node() as SVGCircleElement;
                    case "rect":
                        return document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "rect"
                        );
                    // return d3.create("rect").node() as SVGRectElement;
                }
            };

            const chainAdd = chain.enter().append(createNode);

            const chainUpdate = chainAdd.merge(chain);

            chainUpdate
                // TODO : すべての要素に同じ属性が追加されてしまうので属性を付けない方法を確認する
                .attr("class", "object")
                .attr("cx", (d) => d.x)
                .attr("cy", (d) => d.y)
                .attr("r", 100)
                .style("width", 100)
                .attr("height", 100)
                .attr("fill", "#000");
        };

        const drawPult = () => {
            const layer = s.select(".draw-layer");
            {
                const chain = layer
                    .selectAll<SVGGElement, unknown>(".plut-g")
                    .data(plutData);

                chain.exit().remove();
                chain
                    .enter()
                    .append("g")
                    .merge(chain)
                    .attr("class", (d) => "plut-g " + d.type);
            }
            {
                const type = "violin";
                const chain = layer
                    .selectAll(".plut-g." + type)
                    .data(plutData.filter((d) => d.type === type));

                chain
                    .append("circle")
                    .attr("cx", (d) => d.cx)
                    .attr("cy", (d) => d.cy)
                    .attr("r", (d) => 100)
                    .attr("fill", "#000");
                chain
                    .append("text")
                    .attr("x", (d) => d.cx + 100)
                    .attr("y", (d) => d.cy + 100)
                    .text((d) => d.type);
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

        // drawSample();
        drawImage();
        drawPult();
    }, [svg.current, sampleData, backgroundImageList, plutData]);
    return <div className="content-root" ref={contentRootRef}></div>;
}
