class Graph {
    constructor(opts) {
        this.svg = opts.svg;
        this.nodes = opts.nodes;
        // current id == maximum id
        this.nodeId = this.nodes.reduce((acc, curr) => {
            return (acc > curr.id) ? acc : curr.id;
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
            NODE_RADIUS: 75,
            RECT_WIDTH: 150,
            RECT_HEIGHT: 150,
            CLICK_DISTANCE: 5,
            ENTER_KEY: 13,
        }
        this.draw();
    }

    setEdges(edges) {
        // map source and target id to respective node
        this.edges = edges.map(e => {
            const sourceNode = this.nodes.find(n => n.id === e.source);
            const targetNode = this.nodes.find(n => n.id === e.target);
            return {
                source: sourceNode,
                target: targetNode,
                attributes: [],
                label: e.label
            }
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
                    const node = { id: ++this.nodeId, nodeType: "entity", "type": entityType, label: "", x: pos[0], y: pos[1], attributes: [{"key": "123", "value": "123", "type": "string"}]}
                    node.label = node.type + "-" + node.id
                    this.nodes.push(node);
                    this.updateNodes("entity");
                    event.stopImmediatePropagation();
                }

                if (event.ctrlKey) {
                    event.stopImmediatePropagation();
                    const docType = prompt("Enter document type: ")
                    if (docType === null || docType === "") {
                        return;
                    }
                    const pos = d3.pointer(event, graph.plot.node())
                    const node = { id: ++this.nodeId, nodeType: "document", type: docType, label: "", x: pos[0]-this.consts.RECT_WIDTH/2, y: pos[1]-this.consts.RECT_HEIGHT/2, attributes:[{"key": "123", "value": "123", "type": "string"}, {"key": "abc", "value": "1", "type": "string"}]}
                    node.label = node.type + "-" + node.id
                    this.nodes.push(node);
                    this.updateNodes("document");
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
                    const lineStartPos = d.nodeType == "document" ? [d.x + graph.consts.RECT_WIDTH / 2, d.y + graph.consts.RECT_HEIGHT / 2] : [d.x, d.y];
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
                    var newEdge = { id: "", type: "", label: "", source: source, target: target, attributes: []};
                    this.populateEdgeDefaults(newEdge);
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
            .attr('refX', this.consts.NODE_RADIUS - 3)
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
            .attr('refX', this.consts.NODE_RADIUS - 3)
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

    update() {
        this.updateEdges();
        this.updateNodes();
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
                                this.editNodeLabel(d, nodeType);
                            } else {
                                this.state.selectedNode = d;
                                this.state.selectedEdge = null;
                                this.showAttributeData(d);
                                this.showNodeData(d);
                                this.update();
                            }
                        })
                        .call(this.drag);

                    if (nodeType==="entity") {
                        this.makeEntity(nodes)
                    }

                    if (nodeType==="document") {
                        this.makeDocument(nodes)
                    }

                },
                update => {
                    update.attr("transform", d => { return "translate(" + d.x + "," + d.y + ")"; })
                        .classed("selected", d => { return d === this.state.selectedNode; });

                    update.select("text")
                        .text(d => { return d.label; });
                },
                exit => exit.remove()
            );
    }

    makeEntity(nodes) {
        nodes.append("circle")
            .attr("r", String(this.consts.NODE_RADIUS));
        nodes.append("text")
            .text(d => { return d.label; });
    }

    makeDocument(nodes) {
        nodes.append("rect")
            .attr("width", this.consts.RECT_WIDTH)
            .attr("height", this.consts.RECT_HEIGHT);

        nodes.append("text")
            .attr("dx", this.consts.RECT_WIDTH/2)
            .attr("dy", this.consts.RECT_HEIGHT/2)
            .text(d => { return d.label; });
    }

    editNodeLabel(d, nodeType) {
        const selection = this.circles.selectAll('g').filter(function (dval) {
            return dval.id === d.id;
        });
        // hide current label
        const text = selection.selectAll("text").classed("hidden", true);
        // add intermediate editable paragraph
        if (nodeType==="entity") {
            const d3txt = this.plot.selectAll("foreignObject")
                .data([d])
                .enter()
                .append("foreignObject")
                .attr("x", d.x - this.consts.NODE_RADIUS)
                .attr("y", d.y - this.consts.NODE_RADIUS/2)
                .attr("height", 2 * this.consts.NODE_RADIUS)
                .attr("width", 2 * this.consts.NODE_RADIUS)
                .append("xhtml:div")
                .attr("id", "editable-p")
                .attr("contentEditable", "true")
                .style("text-align", "center")
                //.style("border", "1px solid")
                .text(d.label)
                .on("mousedown", (event, d) => {
                    event.stopPropagation();
                })
                .on("keydown", (event, d) => {
                    event.stopPropagation();
                    if (event.keyCode == this.consts.ENTER_KEY) {
                        event.target.blur();
                    }
                })
                .on("blur", (event, d) => {
                    d.label = event.target.textContent;
                    d3.select(event.target.parentElement).remove();
                    this.updateNodes();
                    text.classed("hidden", false);
                });
            d3txt.node().focus();
        }

        if (nodeType==="document") {
            const d3txt = this.plot.selectAll("foreignObject")
                .data([d])
                .enter()
                .append("foreignObject")
                .attr("x", d.x - this.consts.RECT_WIDTH/2)
                .attr("y", d.y + this.consts.RECT_HEIGHT/4)
                .attr("height", 2 * this.consts.RECT_HEIGHT)
                .attr("width", 2 * this.consts.RECT_WIDTH)
                .append("xhtml:div")
                .attr("id", "editable-p")
                .attr("contentEditable", "true")
                .style("text-align", "center")
                //.style("border", "1px solid")
                .text(d.label)
                .on("mousedown", (event, d) => {
                    event.stopPropagation();
                })
                .on("keydown", (event, d) => {
                    event.stopPropagation();
                    if (event.keyCode == this.consts.ENTER_KEY) {
                        event.target.blur();
                    }
                })
                .on("blur", (event, d) => {
                    d.label = event.target.textContent;
                    d3.select(event.target.parentElement).remove();
                    this.updateNodes();
                    text.classed("hidden", false);
                });
            d3txt.node().focus();
        }

    }

    getPathStartAndEndPoints(d) {
        const sourceX = d.source.nodeType === "document" ? d.source.x + this.consts.RECT_WIDTH/2 : d.source.x;
        const sourceY = d.source.nodeType === "document" ? d.source.y + this.consts.RECT_HEIGHT/2 : d.source.y;
        const targetX = d.target.nodeType === "document" ? d.target.x + this.consts.RECT_WIDTH/2 : d.target.x;
        const targetY = d.target.nodeType === "document" ? d.target.y + this.consts.RECT_HEIGHT/2 : d.target.y;
        return "M" + sourceX + "," + sourceY + "L" + targetX + "," + targetY;
    }

    edgeId(d) {
        return String(d.source.id) + "+" + String(d.target.id);
    }

    // Fill edges with edge ID and default label and type
    populateEdgeDefaults(edge) {
        const source = edge.source;
        const target = edge.target;
        const document = source.nodeType === "document" ? source : target;
        const entity = source.nodeType === "entity" ? source : target;
        edge.id = this.edgeId(edge);
        edge.type = document.type + '-' + entity.type;
        edge.label = document.type + '-' + entity.type + edge.id;
    }

    updateEdges() {
        this.paths.selectAll(".edge")
            .data(this.edges, this.edgeId)
            .join(
                enter => {
                    const edges = enter.append("g")
                        .classed("edge", true)
                        .on("click", (event, d) => {
                            event.stopPropagation();
                            if (event.shiftKey) {
                                this.editEdgeLabel(d);
                            } else {
                                this.state.selectedEdge = d;
                                this.state.selectedNode = null;
                                this.showAttributeData(d);
                                this.showNodeData(d);
                                this.update();
                            }
                        })
                        .on("mousedown", (event, d) => {
                            event.stopPropagation();
                        });

                    edges.append("path")
                        .attr("id", this.edgeId)
                        .classed("line", true)
                        .attr("d", d => {
                            return this.getPathStartAndEndPoints(d)
                        });

                    edges.append("text")
                        .attr("class", "edge-label")
                        .attr("dy", - 15)
                        .append("textPath")
                        .attr("xlink:href", d => "#" + this.edgeId(d))
                        .attr("text-anchor", "middle")
                        .attr("startOffset", "50%")
                        .text(d => d.label);
                },
                update => {
                    update.classed("selected", d => { return d === this.state.selectedEdge; });

                    update.select("path")
                        .attr("d", d => {
                            return this.getPathStartAndEndPoints(d)
                        });

                    update.select("text").select("textPath").text(d => d.label);
                },
                exit => exit.remove()
            );
    }

    editEdgeLabel(d) {
        const selection = this.paths.selectAll('g').filter(dval => {
            return this.edgeId(dval) === this.edgeId(d);
        });
        // hide current label
        const text = selection.selectAll("text").classed("hidden", true);
        // add intermediate editable paragraph
        const d3txt = this.plot.selectAll("foreignObject")
            .data([d])
            .enter()
            .append("foreignObject")
            // TODO: rotate via transform: rotate(20deg);
            .attr("x", d.target.x - (d.target.x - d.source.x) / 2)
            .attr("y", d.target.y - (d.target.y - d.source.y) / 2)
            .attr("height", 100)
            .attr("width", 100)
            .append("xhtml:div")
            //.style("transform", "rotate(20deg)")
            .attr("id", "editable-p")
            .attr("contentEditable", "true")
            .style("text-align", "center")
            //.style("border", "1px solid")
            .text(d.label)
            .on("mousedown", (event, d) => {
                event.stopPropagation();
            })
            .on("keydown", (event, d) => {
                event.stopPropagation();
                if (event.keyCode == this.consts.ENTER_KEY) {
                    event.target.blur();
                }
            })
            .on("blur", (event, d) => {
                d.label = event.target.textContent;
                d3.select(event.target.parentElement).remove();
                this.updateEdges();
                text.classed("hidden", false);
            });
        d3txt.node().focus();
    }

    showNodeData(nodeOrEdge) {
        function refreshTable() {
            // Remove the old table if it exists
            d3.select('#node-data').selectAll('*').remove();

            const table = d3.select("#node-data")
                .append("table")
                .classed("node-data-table", true)
                .append('tbody');

            // Add a row for the node id
            const idRow = table.append("tr")
            idRow.append("td").text("ID:")
            idRow.append("td").text(nodeOrEdge.id);

            // Add a row for the node type
            const typeRow = table.append("tr");
            typeRow.append("td").text("Type:");
            typeRow.append("td").append("input")
                .attr("type", "text")
                .attr("value", nodeOrEdge.type)
                .on("input", function() {
                    nodeOrEdge.type = this.value;
                });

            // Show the table in the node data element
            d3.select('#node-data')
                .style('display', 'block');

        }
        refreshTable();
    }

    // Define the function to show node data
    showAttributeData(nodeOrEdge) {
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
                const attributeIndex = d[0]
                const rowData = d[1]
                row.append('td').text(rowData.key);
                row.append('td').attr('contentEditable', true).text(rowData.value)
                    .on('input', function() {
                        nodeOrEdge.attributes[d[0]].value = this.innerText;
                    });
                row.append('td').attr('contentEditable', true).text(rowData.type)
                    .on('input', function() {
                        nodeOrEdge.attributes[d[0]].type = this.innerText;
                    });
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


    clear() {
        const doDelete = window.confirm("Do you really want to delete the whole graph?");
        if (doDelete) {
            this.nodes = []
            this.edges = []
            this.update();
        }
    }

    load(nodes, edges) {
        this.nodeId = nodes.reduce(function (prev, curr) {
            return (prev.id > curr.id) ? prev.id : curr.id
        });
        this.nodes = nodes;
        this.setEdges(edges);
        this.update();
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
            const document = edge.source.nodeType === "document" ? edge.source : edge.target;
            const entity = edge.source.nodeType === "entity" ? edge.source : edge.target;
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
            if (node.nodeType === "document") {
                const doc = {
                    documentId: node.id,
                    documentType: node.type,
                    label: node.type + node.id,
                    attributes: this.formatAttributes(node.attributes)
                };
                acc.documents.push(doc);
            } else if (node.nodeType === "entity") {
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

const graph = new Graph({
    svg: d3.select("#graph"),
    nodes: [],
    edges: []
})

d3.select("#delete-graph").on("click", () => {
    graph.clear();
});

d3.select("#download-input").on("click", () => {
    saveAs(graph.toLiteGraph(), "dag-download.json");
});


d3.select("#upload-input").on("click", function () {
    document.getElementById("select-file").click();
});

d3.select("#select-file").on("change", function () {
    var files = document.getElementById('select-file').files;
    if (files.length <= 0) {
        return false;
    }

    var fr = new FileReader();

    fr.onload = function (e) {
        try {
            const result = JSON.parse(e.target.result);
            graph.load(result.nodes, result.edges);
        } catch (err) {
            window.alert("Error loading graph from file!\nError message: " + err.message);
            return;
        }
    }

    fr.readAsText(files.item(0));
});