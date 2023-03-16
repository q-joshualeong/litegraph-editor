# Litegraph Editor

Adaptation of [graph-editor](https://github.com/kldtz/graph-editor) with more features


## Quick start 

Two possible ways to run:
### Launching webserver
1) Run `npm install`
2) To launch web server: `node src/server.js`
3) Open browser and navigate to `localhost:8000`

### Opening index.html
1) Open file explorer and click on index.html

## Usage
* Scroll to zoom in or out
* Drag whitespace to move graph  
* Shift-click on whitespace to create an entity
* Ctrl-click on whitespace to create a document 
* Shift-click on a node and drag to another node to connect them with a directed edge
* Click on node or edge and press delete to delete
* Click on node or edge to edit its attributes
* Download button to get graph as a LiteGraph json output


## Tests
Run the tests using: `npm run e2e`

## License
MIT-licensed, as the original.
