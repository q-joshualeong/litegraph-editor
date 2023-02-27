# Litegraph Editor

Adaptation of [graph-editor](https://github.com/kldtz/graph-editor) with more features

## Usage

* Scroll to zoom in or out
* Drag whitespace to move graph  
* Shift-click on whitespace to create an entity
* Ctrl-click on whitespace to create a document 
* Shift-click on a node and drag to another node to connect them with a directed edge
* Click on node or edge and press delete to delete
* Click on node or edge to edit its attributes


## Issues / todo
- [X] Need to prohibit doc to doc and ent to ent links 
- [ ] Make output follow litegraph/scoring graph structure
- [X] edge attributes 
- [ ] some bug when creating entities causing it to be "sticky"
- [X] Add demo to github pages for easy access?
- [ ] Refactor objects into classes?
- [ ] Prettify output
- [ ] Ability to load a litegraph json
- [ ] Dont remove the graph on refresh. Only if explcitly click on delete button.

## License 

MIT-licensed, as the original.
