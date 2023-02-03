import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";
import { useAppContext } from "../contexts/AppContext";

export class ContentProps {}

function debugLog(msg: string) {
    const d = new Date();
    console.log(`${d.toISOString()} : ${msg}`);
}

export function Content(props: ContentProps) {
    const { data, setData } = useAppContext();
    const contentRootRef = useRef<HTMLDivElement>(null);
    const svg = useRef(
        null as d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null
    );

    const globalScale = useMemo(() => 1.5, []);
    const globalLocation = useMemo(() => ({ x: -100, y: 0 }), []);

    useEffect(() => {
        const div = contentRootRef.current as HTMLDivElement;

        if (!svg.current) {
            const width = Math.floor(div.clientWidth - 10);
            const height = Math.floor(div.clientHeight - 10);
            const viewbox = `${globalLocation.x} ${globalLocation.y} ${
                width * globalScale
            } ${height * globalScale}`;
            const s = d3
                .select(".content-root")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", viewbox)
                .attr("class", "svg-canvas");
            svg.current = s;

            debugLog("created svg");
        }
        const resizeObserver = new ResizeObserver((e) => {
            const s = svg.current;
            if (!s) return;

            const width = Math.floor(div.clientWidth - 10);
            const height = Math.floor(div.clientHeight - 10);

            s.attr("width", width).attr("height", height);

            debugLog("resize div");
        });

        debugLog("create size observe");

        resizeObserver.observe(div);

        return () => {
            resizeObserver.unobserve(div);
        };
    }, []);

    useEffect(() => {
        const div = contentRootRef.current as HTMLDivElement;
        const s = svg.current;
        if (!s) return;

        const width = Math.floor(div.clientWidth - 10);
        const height = Math.floor(div.clientHeight - 10);
        const viewbox = `${globalLocation.x} ${globalLocation.y} ${
            width * globalScale
        } ${height * globalScale}`;
        s.transition().attr("viewBox", viewbox);

        debugLog("resize viewBox");
    }, [globalScale, globalLocation]);

    console.log(data.fileData);

    const sampleData = useMemo(
        () => [
            {
                x: 700,
                y: 500,
            },
        ],
        []
    );
    const imageData = useMemo(
        () =>
            [
                {
                    x: 0,
                    y: 0,
                    imageUrl: data.fileUrl,
                },
            ].filter(
                (d): d is { x: number; y: number; imageUrl: string } =>
                    d.imageUrl != undefined
            ),
        [data]
    );
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
                .data(imageData);

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
    }, [svg.current, sampleData, imageData]);
    return <div className="content-root" ref={contentRootRef}></div>;
}
