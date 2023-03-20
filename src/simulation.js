class Simulation {
    constructor(docs, entities, edges) {
        this.nodes = docs.concat(entities);
        this.simulation = this.createSimulation(edges);
    }

    createSimulation(edges) {
        const simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(edges).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .force('collide', d3.forceCollide(d => 100))
            .force('center', d3.forceCenter(500, 400))
            .on("tick", function() {
                console.log("ticking");
            });

        return simulation;
    }

    startSim() {
        this.simulation.tick(100);
    }
}