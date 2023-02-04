import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext } from "../contexts/AppContext";
import { useBackgroundImage } from "../hooks/useBackgroundImage";

export class ContentProps {}

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

    const sampleData = useMemo(
        () => [
            {
                x: 700,
                y: 500,
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
            svg.current = s;

            const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                console.log(event.transform);
                console.log("zoom");

                // globalScale.current = event.transform.k;
                // scaleCanvas();

                const chain = s
                    .selectAll<SVGCircleElement, unknown>("circle")
                    .data(sampleData);

                chain.exit().remove();
                const chainAdd = chain.enter().append("circle");

                const chainUpdate = chainAdd.merge(chain);
                console.log(event.transform.toString());
                chainUpdate.attr("transform", event.transform.toString());
            };
            const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", zoomed);

            s.call(zoom);

            debugLog("created svg");
        }
    }, []);

    useEffect(() => {
        // TODO d3 の描画処理など
        const s = svg.current;
        if (!s) return;
        debugLog("test");

        const drawSample = () => {
            const chain = s
                .selectAll<SVGCircleElement, unknown>("circle")
                .data(sampleData);

            chain.exit().remove();
            const chainAdd = chain.enter().append("circle");

            const chainUpdate = chainAdd.merge(chain);

            chainUpdate
                .attr("cx", (d) => d.x)
                .attr("cy", (d) => d.y)
                .attr("r", 100)
                .attr("fill", "#fff");
        };

        const drawImage = () => {
            const chain = s
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

        drawSample();
        drawImage();
    }, [svg.current, sampleData, backgroundImageList]);
    return <div className="content-root" ref={contentRootRef}></div>;
}
