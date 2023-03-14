class GraphNode {
    constructor(id, nodeType, type, attributes, pos) {
        this.id = id;
        this.nodeType = nodeType;
        this.type = type;
        this.label = type + "-" + id;
        this.x = pos[0];
        this.y = pos[1];
        this.attributes = attributes;
    }
}
