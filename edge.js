class GraphEdge {
    constructor(source, target, attributes) {
        const document = source.nodeType === "document" ? source : target;
        const entity = source.nodeType === "entity" ? source : target;

        this.id = String(source.id) + "+" + String(target.id);
        this.source = source;
        this.target = target;
        this.type = document.type + '-' + entity.type;
        this.label = this.type + this.id;
        this.attributes = attributes;
    }
}
