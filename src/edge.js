class GraphEdge {
    constructor(source, target, attributes, label) {
        this.id = String(source.id) + "+" + String(target.id);
        this.source = source;
        this.target = target;
        this.type = this.generateType();
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

    generateType() {
        const document = this.source.nodeType === GraphNode.nodeTypes.DOC ? this.source : this.target;
        const entity = this.source.nodeType === GraphNode.nodeTypes.ENT ? this.source : this.target;
        return document.type + '-' + entity.type;
    }

    static makeEdge(edges) {
        edges.append("path")
            .attr("id", e => e.id)
            .classed("line", true)
            .attr("d", e => {
                return e.getPathStartAndEndPoints();
            });

        edges.append("text")
            .attr("dy", - 15)
            .append("textPath")
            .attr("id", e => "label-" + e.id)
            .attr("xlink:href", e => "#" + e.id)
            .attr("text-anchor", "middle")
            .attr("startOffset", "50%")
            .text(e => e.label);
    }
}
