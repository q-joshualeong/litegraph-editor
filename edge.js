class GraphEdge {
    constructor(source, target, attributes, label) {
        const document = source.nodeType === GraphNode.nodeTypes.DOC ? source : target;
        const entity = source.nodeType === GraphNode.nodeTypes.ENT ? source : target;

        this.id = String(source.id) + "+" + String(target.id);
        this.source = source;
        this.target = target;
        this.type = document.type + '-' + entity.type;
        this.label = (label != "" && typeof label !== 'undefined') ? label : this.type + this.id;
        this.attributes = attributes;
    }

    getPathStartAndEndPoints() {
        const sourceX = this.source.nodeType === GraphNode.nodeTypes.DOC ? this.source.x + GraphNode.consts.RECT_WIDTH/2 : this.source.x;
        const sourceY = this.source.nodeType === GraphNode.nodeTypes.DOC ? this.source.y + GraphNode.consts.RECT_HEIGHT/2 : this.source.y;
        const targetX = this.target.nodeType === GraphNode.nodeTypes.DOC ? this.target.x + GraphNode.consts.RECT_WIDTH/2 : this.target.x;
        const targetY = this.target.nodeType === GraphNode.nodeTypes.DOC ? this.target.y + GraphNode.consts.RECT_HEIGHT/2 : this.target.y;
        return "M" + sourceX + "," + sourceY + "L" + targetX + "," + targetY;
    }

    static makeEdge(edges) {
        edges.append("path")
            .attr("id", e => e.id)
            .classed("line", true)
            .attr("d", e => {
                return e.getPathStartAndEndPoints();
            });

        edges.append("text")
            .attr("class", "edge-label")
            .attr("dy", - 15)
            .append("textPath")
            .attr("xlink:href", e => "#" + e.id)
            .attr("text-anchor", "middle")
            .attr("startOffset", "50%")
            .text(e => e.label);
    }

    editEdgeLabel(paths, plot) {
        const selection = paths.selectAll('g').filter(dval => {
            return dval.id === this.id;
        });
        // hide current label
        const text = selection.selectAll("text").classed("hidden", true);
        // add intermediate editable paragraph
        const d3txt = plot.selectAll("foreignObject")
            .data([this])
            .enter()
            .append("foreignObject")
            // TODO: rotate via transform: rotate(20deg);
            .attr("x", this.target.x - (this.target.x - this.source.x) / 2)
            .attr("y", this.target.y - (this.target.y - this.source.y) / 2)
            .attr("height", 100)
            .attr("width", 100)
            .append("xhtml:div")
            //.style("transform", "rotate(20deg)")
            .attr("id", "editable-p")
            .attr("contentEditable", "true")
            .style("text-align", "center")
            .text(this.label)
            .on("mousedown", (event, d) => {
                event.stopPropagation();
            });
        d3txt.node().focus();
    }
}
