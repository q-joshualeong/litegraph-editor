class Graph {
    constructor(opts) {
        this.svg = opts.svg;
        this.nodes = opts.nodes;
        // generate new IDs sequentially
        this.maxNodeId = this.nodes.reduce((acc, curr) => {
            return Math.max(acc, curr);
        }, 0);
        this.setEdges(opts.edges)
        this.state = {
            mouseOverNode: null,
            shiftNodeDrag: false,
            selectedNode: null,
            selectedEdge: null,
        }
        this.consts = {
            BACKSPACE_KEY: 8,
            DELETE_KEY: 46,
            CLICK_DISTANCE: 5,
            ENTER_KEY: 13,
            MAX_ZOOM: 5,
            MIN_ZOOM: 0.3
        }
        this.draw();
    }

    setEdges(edges) {
        // map source and target id to respective node
        this.edges = edges.map(e => {
            const sourceNode = this.nodes.find(n => n.id === e.source.id);
            const targetNode = this.nodes.find(n => n.id === e.target.id);
            return new GraphEdge(sourceNode, targetNode, e.attributes, e.label);
        });
    }

    draw() {
        d3.select(window).on("keydown", (event) => {
            switch (event.keyCode) {
                // case this.consts.BACKSPACE_KEY:
                case this.consts.DELETE_KEY:
                    if (this.state.selectedNode) {
                        event.preventDefault();
                        const selected = this.state.selectedNode;
                        this.nodes = this.nodes.filter(node => { return selected !== node; });
                        this.edges = this.edges.filter(edge => { return edge.source !== selected && edge.target !== selected; });
                        this.update();
                    } else if (this.state.selectedEdge) {
                        event.preventDefault();
                        const selected = this.state.selectedEdge;
                        this.edges = this.edges.filter(edge => { return selected !== edge; });
                        this.updateEdges();
                    }
                    break;
            }
        });

        // add zoom behavior to whole svg
        const zoom = d3.zoom()
            .scaleExtent([this.consts.MIN_ZOOM, this.consts.MAX_ZOOM])
            .clickDistance(this.consts.CLICK_DISTANCE)
            .on('zoom', (event) => {
                this.plot.attr('transform', event.transform);
            });
        // prepare SVG
        this.svg
            .on("mousedown", (event, d) => {
                if (event.shiftKey) {
                    event.stopImmediatePropagation(); // prevents nodes from sticking to cursor
                    const entityType = prompt("Enter entity type: ")
                    if (entityType === null || entityType === "") {
                        return;
                    }
                    const pos = d3.pointer(event, graph.plot.node())
                    const node = new GraphNode(++this.maxNodeId, GraphNode.nodeTypes.ENT, entityType, [], pos);
                    this.nodes.push(node);
                    this.updateNodes(GraphNode.nodeTypes.ENT);
                    event.stopImmediatePropagation();
                }

                if (event.ctrlKey) {
                    event.stopImmediatePropagation();
                    const docType = prompt("Enter document type: ")
                    if (docType === null || docType === "") {
                        return;
                    }
                    const pos = d3.pointer(event, graph.plot.node())
                    const node = new GraphNode(++this.maxNodeId, GraphNode.nodeTypes.DOC, docType, [{"key": "123", "value": "123", "type": "string"}], pos);
                    this.nodes.push(node);
                    this.updateNodes(GraphNode.nodeTypes.DOC);
                }
            })
            .on('click', () => {
                this.state.selectedNode = null;
                this.state.selectedEdge = null;
                d3.select('#node-attribute-data')?.style('display', 'none')
                d3.select('#node-data')?.style('display', 'none')
                this.update();
            })
            .call(zoom);

        this.defineMarkers();

        // drag behavior
        const graph = this;
        this.drag = d3.drag()
            .clickDistance(this.consts.CLICK_DISTANCE)
            .on("drag", function (event, d) {
                if (graph.state.shiftNodeDrag) {
                    const pos = d3.pointer(event, graph.plot.node());
                    // make line start from center of square when dragging a new edge
                    const lineStartPos = d.nodeType == GraphNode.nodeTypes.DOC ? [d.x + GraphNode.consts.RECT_WIDTH / 2, d.y + GraphNode.consts.RECT_HEIGHT / 2] : [d.x, d.y];
                    graph.dragLine.attr('d', 'M' + lineStartPos[0] + ',' + lineStartPos[1] + 'L' + pos[0] + ',' + pos[1]);
                    graph.dragLine.classed('hidden', false);
                } else {
                    d.x = event.x;
                    d.y = event.y;
                    d3.select(this).raise().attr("transform", d => "translate(" + [d.x, d.y] + ")");
                    graph.updateEdges();
                }
            })
            .on("end", (event, source) => {
                this.state.shiftNodeDrag = false;
                // hide line, remove arrow tip
                this.dragLine.classed("hidden", true);

                const target = this.state.mouseOverNode;

                if (!source || !target) return;

                if (source.nodeType === target.nodeType) return;

                // source and target are different
                if (source !== target) {
                    // remove edge between source and target (any order)
                    this.edges = this.edges.filter(edge => {
                        return !(edge.source === source && edge.target === target) &&
                            !(edge.source === target && edge.target === source);
                    });
                    var newEdge = new GraphEdge(source, target, []);
                    this.edges.push(newEdge);
                    this.updateEdges();
                }
            });

        // populate svg
        this.plot = this.svg.append('g');

        // displayed when dragging between nodes
        this.dragLine = this.plot.append('path')
            .classed('line', true)
            .classed('dragline', true)
            .classed('hidden', true)
            .attr('d', 'M0,0L0,0');

        // circles need to be added last to be drawn above the paths
        this.paths = this.plot.append('g').classed('edges', true);
        this.circles = this.plot.append('g').classed('nodes', true);

        this.update();
    }

    defineMarkers() {
        const defs = this.svg.append('defs');
        // arrow marker for edge
        defs.append('marker')
            .attr('id', 'end-arrow')
            // keep same scale
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('viewBox', '-20 -10 20 20')
            .attr('markerWidth', 20)
            .attr('markerHeight', 20)
            // tip of marker at circle (cut off part of tip that is thinner than line)
            .attr('refX', GraphNode.consts.NODE_RADIUS - 3)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M-20,-10L0,0L-20,10');
        // arrow marker for selected edge (to allow separate CSS styling)
        defs.append('marker')
            .attr('id', 'selected-end-arrow')
            // keep same scale
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('viewBox', '-20 -10 20 20')
            .attr('markerWidth', 20)
            .attr('markerHeight', 20)
            // tip of marker at circle (cut off part of tip that is thinner than line)
            .attr('refX', GraphNode.consts.NODE_RADIUS - 3)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M-20,-10L0,0L-20,10');
        // arrow marker for leading arrow
        defs.append('marker')
            .attr('id', 'mark-end-arrow')
            // keep same scale
            .attr('markerUnits', 'userSpaceOnUse')
            .attr('viewBox', '-20 -10 20 20')
            .attr('markerWidth', 20)
            .attr('markerHeight', 20)
            // tip of marker at end of line
            .attr('refX', -5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M-20,-10L0,0L-20,10');
    }

    update(nodeType) {
        this.updateEdges();
        this.updateNodes(nodeType);
    }

    updateNodes(nodeType) {
        // enter node groups
        const nodes = this.circles.selectAll("g")
            .data(this.nodes, d => { return d.id; })
            .join(
                enter => {
                    const nodes = enter.append("g")
                        .attr("class", "node")
                        .attr("transform", d => { return "translate(" + d.x + "," + d.y + ")"; })
                        .on("mousedown", (event, d) => {
                            event.stopPropagation();
                            if (event.shiftKey) {
                                this.state.shiftNodeDrag = true;
                            }
                        })
                        .on("mouseover", (event, d) => { this.state.mouseOverNode = d; })
                        .on("mouseout", () => { this.state.mouseOverNode = null; })
                        .on("click", (event, d) => {
                            event.stopPropagation();
                            if (event.shiftKey) {
                                d.editNodeLabel(this.circles, this.plot);
                            } else {
                                this.state.selectedNode = d;
                                this.state.selectedEdge = null;
                                this.showAttributes(d);
                                this.showData(d);
                                this.update();
                            }
                        })
                        .call(this.drag);

                    if (nodeType===GraphNode.nodeTypes.ENT) {
                        GraphNode.makeEntity(nodes);
                    }

                    if (nodeType===GraphNode.nodeTypes.DOC) {
                        GraphNode.makeDocument(nodes);
                    }

                },
                update => {
                    update.attr("transform", d => { return "translate(" + d.x + "," + d.y + ")"; })
                        .classed("selected", d => { return d === this.state.selectedNode; });

                    update.select("text")
                        .text(d => { return d.type; });
                },
                exit => exit.remove()
            );
    }

    updateEdges() {
        this.paths.selectAll(".edge")
            .data(this.edges, e => e.id)
            .join(
                enter => {
                    const edges = enter.append("g")
                        .classed("edge", true)
                        .on("click", (event, d) => {
                            event.stopPropagation();
                            if (event.shiftKey) {
                                d.editEdgeLabel(this.paths, this.plot);
                            } else {
                                this.state.selectedEdge = d;
                                this.state.selectedNode = null;
                                this.showAttributes(d);
                                this.showData(d);
                                this.update();
                            }
                        })
                        .on("mousedown", (event, d) => {
                            event.stopPropagation();
                        });

                    GraphEdge.makeEdge(edges);
                },
                update => {
                    update.classed("selected", d => { return d === this.state.selectedEdge; });

                    update.select("path")
                        .attr("d", d => {
                            return d.getPathStartAndEndPoints();
                        });

                    update.select("text").select("textPath").text(d => d.label);
                },
                exit => exit.remove()
            );
    }

    showData(nodeOrEdge) {
        function refreshTable() {
            // Remove the old table if it exists
            d3.select('#node-data').selectAll('*').remove();

            const table = d3.select("#node-data")
                .append("table")
                .classed("node-data-table", true)
                .append('tbody');

            // Add a row for the id
            const idRow = table.append("tr")
            idRow.append("td").text("ID:")
            idRow.append("td").text(nodeOrEdge.id);

            // Add a row for the type
            const typeRow = table.append("tr");
            typeRow.append("td").text("Type:");
            typeRow.append("td").append("input")
                .attr("type", "text")
                .attr("value", nodeOrEdge.type)
                .on("input", function() {
                    nodeOrEdge.type = this.value;
                });

            // Add a row for the label
            const labelRow = table.append("tr");
            labelRow.append("td").text("Label:");
            labelRow.append("td").append("input")
                .attr("type", "text")
                .attr("value", nodeOrEdge.label)
                .on("input", function() {
                    nodeOrEdge.label = this.value;
                });

            // Show the table in the node data element
            d3.select('#node-data')
                .style('display', 'block');

        }
        refreshTable();
    }

    showAttributes(nodeOrEdge) {
        function inputIsValid(key, val, type) {
            if (!key || !val || !type) return false;
            switch (type) {
                case 'long':
                case 'short':
                case 'int':
                    return /^([-+]?[0-9]*)$/.test(val);
                case 'double':
                case 'float':
                    return /^[-+]?[0-9]*(\.[0-9]+)$/.test(val);
                case 'boolean':
                    return (val === 'true') || (val === 'false');
            }
            return true;
        }

        function refreshTable() {
            // Remove the old table if it exists
            d3.select('#node-attribute-data').selectAll('*').remove();

            // Create the table with node data
            const table = d3.select('#node-attribute-data')
                .append('table')
                .classed('node-attribute-data-table', true)
                .append('tbody');

            // Add header row
            const headerRow = table.append('tr');
            headerRow.append('th').text('Attribute');
            headerRow.append('th').text('Value');
            headerRow.append('th').text('Attribute Type')
            headerRow.append('th');

            // Add other data rows (all the attributes)
            const attributeRows = table.selectAll('tr.attribute')
                .data(Object.entries(nodeOrEdge.attributes))
                .enter()
                .append('tr')
                .classed('attribute', true);

            attributeRows.each(function(d) {
                const row = d3.select(this);
                const attributeIndex = d[0];
                const rowData = d[1];
                row.append('td').text(rowData.key);
                row.append('td').text(rowData.value);
                row.append('td').text(rowData.type);
                row.append('td').append('button').text('x')
                    .on('click', () => {
                        delete nodeOrEdge.attributes[d[0]];
                        refreshTable(); // refresh the table after deleting an attribute
                    });
            });

            // Add button row
            const buttonRow = table.append('tr');
            let newKey = '';
            let newValue = '';
            let newType = '';
            buttonRow.append('td').append('input')
                .attr('type', 'text')
                .attr('name', 'key')
                .attr('placeholder', 'Enter key')
                .on('input', function() {
                    newKey = this.value;
                    newValue = buttonRow.select('input[type="text"][name="value"]:first-child').property('value');
                    newType = buttonRow.select('select[name="type"]').property('value');
                    const addButton = buttonRow.select('button');
                    addButton.property('disabled', !inputIsValid(newKey, newValue, newType));
                });

            buttonRow.append('td').append('input')
                .attr('type', 'text')
                .attr('name', 'value')
                .attr('placeholder', 'Enter value')
                .on('input', function() {
                    newValue = this.value;
                    const addButton = buttonRow.select('button');
                    addButton.property('disabled', !inputIsValid(newKey, newValue, newType));
                });

            buttonRow.append('td').append('select')
                .attr('name', 'type')
                .selectAll('option')
                .data(['string', 'boolean', 'long', 'short', 'float', 'int', 'double', 'date'])
                .enter()
                .append('option')
                .text(function(d) { return d; });

            buttonRow.select('select[name="type"]')
                .on('click', function() {
                    const addButton = buttonRow.select('button');
                    newType = this.value;
                    addButton.property('disabled', !inputIsValid(newKey, newValue, newType));
                });

            buttonRow.append('td').append('button').text('+')
                .attr('disabled', true)
                .on('click', function() {
                    const newKey = buttonRow.select('input[type="text"][name="key"]:first-child').property('value');
                    const newValue = buttonRow.select('input[type="text"][name="value"]:first-child').property('value');
                    const newType = buttonRow.select('select[name="type"]').property('value');
                    if (newKey && newValue) {
                        nodeOrEdge.attributes.push({"key": newKey, "value": newValue, "type": newType})
                        buttonRow.select('input[type="text"][name="key"]:first-child').property('value', '');
                        buttonRow.select('input[type="text"][name="value"]:first-child').property('value', '');
                        buttonRow.select('select[name="type"]').property('value', 'string');
                        refreshTable(); // refresh the table after adding a new attribute
                    }
                });



            // Show the table in the node data element
            d3.select('#node-attribute-data')
                .style('display', 'block');

            // Scroll the node data element to the top
            d3.select('#node-attribute-data').node().scrollTop = 0;
        }
        refreshTable();
    }

    clear(message) {
        if (this.nodes.length == 0) return true; // graph alr empty; don't ask for confirmation

        const doDelete =  window.confirm(message);
        if (doDelete) {
            this.nodes = [];
            this.edges = [];
            this.update();
        }

        return doDelete;
    }

    loadDocuments(nodes) {
        this.maxNodeId = nodes.reduce(function (prev, curr) {
            return Math.max(prev.id, curr.id);
        });
        this.nodes = this.nodes.concat(nodes);
        this.updateNodes(GraphNode.nodeTypes.DOC);
    }

    loadEntities(nodes) {
        this.maxNodeId = nodes.reduce(function (prev, curr) {
            return Math.max(prev.id, curr.id);
        });
        this.nodes = this.nodes.concat(nodes);
        this.updateNodes(GraphNode.nodeTypes.ENT);
    }

    loadEdges(edges) {
        this.setEdges(edges);
        this.updateEdges();
    }

    formatAttributes(attributes) {
        function convertStrToType(val, type) {
            switch (type) {
                case 'long':
                case 'short':
                case 'int':
                    const numericVal = parseInt(val);
                    return isNaN(numericVal) ? val : numericVal;
                case 'double':
                case 'float':
                    const floatVal = parseFloat(val);
                    return isNaN(floatVal) ? val : floatVal;
                case 'boolean':
                    return val === 'true' ? true : val === 'false' ? false : val;
            }
            return val;
        }

        const suffix = "Attributes";
        let attrMap = new Map();
        attributes.forEach(attr => {
            const attrType = attr.type + suffix;
            let attrObj = {};
            if (attrMap.has(attrType)) {
                attrObj = attrMap.get(attrType);
            }
            attrObj[attr.key] = convertStrToType(attr.value, attr.type);
            attrMap.set(attrType, attrObj);
        });
        return Object.fromEntries(attrMap);
    }

    toLiteGraph() {
        const saveEdges = this.edges.map(edge => {
            const document = edge.source.nodeType === GraphNode.nodeTypes.DOC ? edge.source : edge.target;
            const entity = edge.source.nodeType === GraphNode.nodeTypes.ENT ? edge.source : edge.target;
            return {
                edgeId: edge.id,
                edgeType: edge.type,
                label: edge.label,
                documentId: document.id,
                documentType: document.type,
                entityId: entity.id,
                entityType: entity.type,
                attributes: this.formatAttributes(edge.attributes)
            };
        });
        const documentsAndEntities = this.nodes.reduce((acc, node) => {
            if (node.nodeType === GraphNode.nodeTypes.DOC) {
                const doc = {
                    documentId: node.id,
                    documentType: node.type,
                    label: node.type + node.id,
                    attributes: this.formatAttributes(node.attributes)
                };
                acc.documents.push(doc);
            } else if (node.nodeType === GraphNode.nodeTypes.ENT) {
                const ent = {
                    entityId: node.id,
                    entityType: node.type,
                    label: node.type + node.id,
                    attributes: this.formatAttributes(node.attributes),
                    records: []
                };
                acc.entities.push(ent);
            }
            return acc;
        }, { documents: [], entities: [] });

        return new window.Blob([window.JSON.stringify(
            {
                "documents": documentsAndEntities.documents,
                "entities": documentsAndEntities.entities,
                "edges": saveEdges
            }
            , null, 2)], { type: "text/plain;charset=utf-8" });
    }
}

/* Main */

function convertLiteGraphAttributesToD3Attributes(attributes) {
    const result = [];
    // Iterate over all attribute types
    for (const [attrType, attrObj] of Object.entries(attributes)) {
        // Iterate over each attribute in the current type
        for (const [key, value] of Object.entries(attrObj)) {
            // Determine the type of the current attribute value
            const type = attrType.replace(/Attributes$/, '') ;
            // Construct a new object with the name, value, and type properties
            result.push({ key: key, value: value, type: type });
        }
    }
    return result
}

function loadGraph() {
    var files = document.getElementById('select-file').files;
    if (files.length <= 0) {
        return false;
    }

    var fr = new FileReader();

    fr.onload = function (e) {
        try {
            const result = JSON.parse(e.target.result);
            const docs = result.documents.map(doc => {
                const attributes = convertLiteGraphAttributesToD3Attributes(doc.attributes);
                return new GraphNode(doc.documentId, GraphNode.nodeTypes.DOC, doc.documentType, attributes, [100,100], doc.label);
            })
            const entities = result.entities.map(ent => {
                const attributes = convertLiteGraphAttributesToD3Attributes(ent.attributes);
                return new GraphNode(ent.entityId, GraphNode.nodeTypes.ENT, ent.entityType, attributes, [200, 200], ent.label);
            })
            const edges = result.edges.map( edge => {
                const attributes = convertLiteGraphAttributesToD3Attributes(edge.attributes);
                return new GraphEdge(
                    {id: edge.documentId, nodeType: GraphNode.nodeTypes.DOC, type: edge.documentType},
                    {id: edge.entityId, nodeType: GraphNode.nodeTypes.ENT, type: edge.entityType},
                    attributes,
                    edge.label);
                }
            );
            graph.loadDocuments(docs);
            graph.loadEntities(entities);
            graph.loadEdges(edges);
        } catch (err) {
            window.alert("Error loading graph from file!\nError message: " + err.message);
        }
    }

    fr.readAsText(files.item(0));
}

const graph = new Graph({
    svg: d3.select("#graph"),
    nodes: [],
    edges: []
})

d3.select("#delete-graph").on("click", () => {
    graph.clear("Do you really want to delete the whole graph?");
});

d3.select("#download-input").on("click", () => {
    saveAs(graph.toLiteGraph(), "dag-download.json");
});

d3.select("#select-file").on("input", function () {
    if (graph.clear("This will clear the current graph. Continue?")) {
        loadGraph();
        this.value = null; // Allow repeated uploads of the same file (same name)
    };
})
