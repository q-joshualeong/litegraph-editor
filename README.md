# Graph Editor

Reimplementation of [directed-graph-creator](https://github.com/cjrd/directed-graph-creator) with [D3](https://d3js.org/) v6 and a few improvements.

## Usage

* Scroll to zoom in or out
* Drag whitespace to move graph  
* Shift-click on whitespace to create an entity
* Ctrl-click on whitespace to create a document 
* Shift-click on a node and drag to another node to connect them with a directed edge
* Click on node or edge and press delete to delete
* Click on node or edge to edit its attributes


## Issues / todo
- [ ] Need to prohibit doc to doc and ent to ent links 
- [ ] Make output follow litegraph/scoring graph structure
- [X] edge attributes 
- [ ] some bug when creating entities causing it to be "sticky"

## License 

MIT-licensed, as the original.
