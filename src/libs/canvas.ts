import * as d3 from "d3";
import { PultD3Data } from "../contexts/AppContext";
import { BackgroundImageData } from "../hooks/useBackgroundImage";

export function createSvg(parentTagSelector: string):d3.Selection<SVGSVGElement, unknown, HTMLElement, any> {
    const s = d3
            .select(parentTagSelector)
            .append("svg")
        .attr("class", "svg-canvas");
    return s;
}

export function initRootSvg(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>) {
    if (!svg)
        return;
    const s = svg;
    s.append("g").attr("class", "background-layer");
    s.append("g").attr("class", "draw-layer");
    const viewbox = `0 0 0 0`; 
    s.attr("viewBox", viewbox);
}


export function setPlutShapeParam(
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

export function drawBackgroundImage(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    background?: BackgroundImageData,
    isEmbedded: boolean = false
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
        .attr("href", (d) => {
            if (isEmbedded) {
                return d?.embeddedUrl ?? "";
            }
            return d?.url ?? ""; 
        } );
}

export function drawPult(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    data: PultD3Data[],
    handleContextMenu: (clientX: number, clientY: number, d: PultD3Data) => void,
    /** pixel/m */
    scale: number = 400
) {
    
    const calcHeight = (d: PultD3Data) => d.size * scale;
    const calcWidth = (d: PultD3Data) => d.size * scale;
    
    const layer = svg.select(".draw-layer");
    {
        const move = (d: PultD3Data) => {
            const data = [d];
            layer
                .select<SVGSVGElement>(".plut-g.plut-drag-" + d.id)
                .data(data)
                .attr("x", (d) => d.cx - (calcWidth(d) * 0.5))
                .attr("y", (d) => d.cy - (calcHeight(d) * 0.5));
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
            .attr("height", calcHeight)
            .attr("width", calcWidth)
            .attr("x", (d) => d.cx - (calcWidth(d) * 0.5))
            .attr("y", (d) => d.cy - (calcHeight(d) * 0.5))
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