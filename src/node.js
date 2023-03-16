class GraphNode {
    static consts = {
        NODE_RADIUS: 50,
        RECT_WIDTH: 100,
        RECT_HEIGHT: 100,
    }

    static nodeTypes = {
        ENT: "entity",
        DOC: "document"
    }

    constructor(id, nodeType, type, attributes, pos, label) {
        this.id = id;
        this.nodeType = nodeType;
        this.type = type;
        this.label = (label != "" && typeof label !== 'undefined') ? label : type + "-" + id;
        this.x = nodeType === GraphNode.nodeTypes.DOC ? pos[0]-GraphNode.consts.RECT_WIDTH/2 : pos[0];
        this.y = nodeType === GraphNode.nodeTypes.DOC ? pos[1]-GraphNode.consts.RECT_HEIGHT/2 : pos[1];
        this.attributes = attributes;
    }

    static makeEntity(nodes) {
        nodes.append("circle")
            .attr("r", String(this.consts.NODE_RADIUS));

        nodes.append("text")
            .text(d => { return d.type; });
    }

    static makeDocument(nodes) {
        nodes.append("rect")
            .attr("width", this.consts.RECT_WIDTH)
            .attr("height", this.consts.RECT_HEIGHT);

        nodes.append("text")
            .attr("dx", this.consts.RECT_WIDTH/2)
            .attr("dy", this.consts.RECT_HEIGHT/2)
            .text(d => { return d.type; });
    }

    editNodeLabel(circles, plot) {
        const selection = circles.selectAll('g').filter(function (dval) {
            return dval.id === this.id;
        });
        // hide current label
        const text = selection.selectAll("text").classed("hidden", true);
        // add intermediate editable paragraph
        if (this.nodeType===GraphNode.nodeTypes.ENT) {
            const d3txt = plot.selectAll("foreignObject")
                .data([this])
                .enter()
                .append("foreignObject")
                .attr("x", this.x - GraphNode.consts.NODE_RADIUS)
                .attr("y", this.y - GraphNode.consts.NODE_RADIUS/2)
                .attr("height", 2 * GraphNode.consts.NODE_RADIUS)
                .attr("width", 2 * GraphNode.consts.NODE_RADIUS)
                .append("xhtml:div")
                .attr("id", "editable-p")
                .attr("contentEditable", "true")
                .style("text-align", "center")
                .text(this.label)
                .on("mousedown", (event, d) => {
                    event.stopPropagation();
                });
            d3txt.node().focus();
        }

         else if (this.nodeType===GraphNode.nodeTypes.DOC) {
            const d3txt = plot.selectAll("foreignObject")
                .data([this])
                .enter()
                .append("foreignObject")
                .attr("x", this.x - GraphNode.consts.RECT_WIDTH/2)
                .attr("y", this.y + GraphNode.consts.RECT_HEIGHT/4)
                .attr("height", 2 * GraphNode.consts.RECT_HEIGHT)
                .attr("width", 2 * GraphNode.consts.RECT_WIDTH)
                .append("xhtml:div")
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
}
