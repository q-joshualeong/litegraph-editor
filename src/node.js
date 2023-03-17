class GraphNode {
    static consts = {
        NODE_RADIUS: 50,
        RECT_WIDTH: 100,
        RECT_HEIGHT: 100,
        LABEL_FONT_SIZE: 22
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
            .attr("id", d => "type-" + d.id)
            .text(d => { return d.type; });

        nodes.append("text")
            .attr("id", d => "label-" + d.id)
            .attr("dy", this.consts.NODE_RADIUS + this.consts.LABEL_FONT_SIZE)
            .style("font-size", this.consts.LABEL_FONT_SIZE + "px")
            .text(d => d.label);
    }

    static makeDocument(nodes) {
        nodes.append("rect")
            .attr("width", this.consts.RECT_WIDTH)
            .attr("height", this.consts.RECT_HEIGHT);

        nodes.append("text")
            .attr("id", d => "type-" + d.id)
            .attr("dx", this.consts.RECT_WIDTH/2)
            .attr("dy", this.consts.RECT_HEIGHT/2)
            .text(d => { return d.type; });

        nodes.append("text")
            .attr("id", d => "label-" + d.id)
            .attr("dx", this.consts.RECT_WIDTH/2)
            .attr("dy", this.consts.RECT_HEIGHT + this.consts.LABEL_FONT_SIZE)
            .style("text-align", "center")
            .style("font-size", this.consts.LABEL_FONT_SIZE + "px")
            .text(d => d.label);
    }
}
