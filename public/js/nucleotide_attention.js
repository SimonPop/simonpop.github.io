 // set the dimensions and margins of the graph
 var margin = {top: 0, right: 60, bottom: 50, left: 60},
 width = 650 - margin.left - margin.right,
 height = 200 - margin.top - margin.bottom;
 
 // append the svg object to the body of the page
 var svg = d3.select("#my_dataviz")
 .append("svg")
   .attr("width", width + margin.left + margin.right)
   .attr("height", height + margin.top + margin.bottom)
 .append("g")
   .attr("transform",
         "translate(" + margin.left + "," + margin.top + ")");
 
 // Read dummy data
 function Attention(data) {
 
 // List of node names
 var allNodes = data.nodes.map(function(d){return d.name})
 
 // List of groups
 var allGroups = data.nodes.map(function(d){return d.grp})
 allGroups = [...new Set(allGroups)]
 
 // A color scale for groups:
 var color = d3.scaleOrdinal()
   .domain(allGroups)
   .range(d3.schemeSet3);
 
 // A linear scale for node size
 var size = d3.scaleLinear()
   .domain([1,10])
   .range([2,10]);
 
 // A linear scale to position the nodes on the X axis
 var x = d3.scalePoint()
   .range([0, width])
   .domain(allNodes)
 
 // In my input data, links are provided between nodes -id-, NOT between node names.
 // So I have to do a link between this id and the name
 var idToNode = {};
 data.nodes.forEach(function (n) {
   idToNode[n.id] = n;
 });
 
 // Add the links
 var links = svg
   .selectAll('mylinks')
   .data(data.links)
   .enter()
   .append('path')
   .attr('d', function (d) {
     start = x(idToNode[d.source].name)    // X position of start node on the X axis
     end = x(idToNode[d.target].name)      // X position of end node
     return ['M', start, height-30,    // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
       'A',                            // This means we're gonna build an elliptical arc
       (start - end)/2, ',',    // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
       (start - end)/2, 0, 0, ',',
       start < end ? 1 : 0, end, ',', height-30] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
       .join(' ');
   })
   .style("fill", "none")
   .attr("stroke", "grey")
   .style("stroke-width", 1)
 
 // Add the circle for the nodes
 var nodes = svg
   .selectAll("mynodes")
   .data(data.nodes, function(d) { return d.name; }) // .sort(function(a,b) { return +b.n - +a.n })
   .join("circle")
     .attr("cx", function(d){ return(x(d.name))})
     .attr("cy", height-30)
     .attr("r", function(d){ return(size(d.n))})
     .style("fill", function(d){ return color(d.grp)})
     .attr("stroke", "white")
     .attr('d', function (d) {return d.id})
 
 // And give them a label
 var labels = svg
   .selectAll("mylabels")
   .data(data.nodes)
   .enter()
   .append("text")
     .attr("x", 0)
     .attr("y", 0)
     .text(function(d){ return(d.name)} )
     .style("text-anchor", "end")
     .attr("transform", function(d){ return( "translate(" + (x(d.name)) + "," + (height-15) + ")rotate(-45)")})
     .style("font-size", 6)
 


     function mouseover() {
      const d = this.__data__;
      labels.style('font-weight', function (label_d) {return label_d.id == d.id ? "bold" : "normal"})
      nodes
        .style('opacity', function (node_d) { return node_d.id === d.id ? 1 : .2})
      links
        .style('stroke', function (link_d) {  return link_d.source === d.id || link_d.target === d.id ? color(d.grp) : '#b8b8b8';})
        .style('stroke-opacity', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 1 : .2;})
        .style('stroke-width', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 4 : 1;})
    }

    function mouseout(d) {
      labels.style('font-weight', 'normal')
      nodes.style('opacity', 1)
      links
        .style('stroke', 'grey')
        .style('stroke-opacity', .8)
        .style('stroke-width', '1')
    }

 nodes
   .on('mouseover', mouseover)
   .on('mouseout', mouseout)

   labels
   .on('mouseover', mouseover)
   .on('mouseout', mouseout)
 }
 
 const data ={"directed": false, "multigraph": false, "graph": {}, "nodes": [{"name": "ATGAAT", "n": 3, "grp": 1, "id": 0}, {"name": "ATGAGA", "n": 3, "grp": 1, "id": 1}, {"name": "GGCAAC", "n": 3, "grp": 1, "id": 2}, {"name": "CACTGG", "n": 3, "grp": 1, "id": 3}, {"name": "ACCAGC", "n": 3, "grp": 1, "id": 4}, {"name": "TGCTTG", "n": 3, "grp": 1, "id": 5}, {"name": "GTCCTC", "n": 3, "grp": 1, "id": 6}, {"name": "ACCACC", "n": 3, "grp": 1, "id": 7}, {"name": "TCCTGC", "n": 3, "grp": 1, "id": 8}, {"name": "TTCTGC", "n": 3, "grp": 1, "id": 9}, {"name": "CAATCA", "n": 3, "grp": 1, "id": 10}, {"name": "GTGTGG", "n": 3, "grp": 1, "id": 11}, {"name": "GGAAAT", "n": 3, "grp": 1, "id": 12}, {"name": "CTCAAC", "n": 3, "grp": 1, "id": 13}, {"name": "AGTAAG", "n": 3, "grp": 1, "id": 14}, {"name": "GTGGCT", "n": 3, "grp": 1, "id": 15}, {"name": "TATATT", "n": 3, "grp": 1, "id": 16}, {"name": "CCCTGC", "n": 3, "grp": 1, "id": 17}, {"name": "CTGGCA", "n": 3, "grp": 1, "id": 18}, {"name": "GCCTCA", "n": 3, "grp": 1, "id": 19}], "links": [{"value": 14.079424858093262, "source": 0, "target": 0}, {"value": 9.610678672790527, "source": 0, "target": 1}, {"value": 5.67416524887085, "source": 0, "target": 2}, {"value": 13.099932670593262, "source": 1, "target": 1}, {"value": 8.72221851348877, "source": 1, "target": 2}, {"value": 6.548681735992432, "source": 1, "target": 3}, {"value": 5.475786209106445, "source": 1, "target": 4}, {"value": 12.412276268005371, "source": 2, "target": 2}, {"value": 8.482029914855957, "source": 2, "target": 3}, {"value": 5.469754219055176, "source": 2, "target": 4}, {"value": 10.488797187805176, "source": 3, "target": 3}, {"value": 7.666423320770264, "source": 3, "target": 4}, {"value": 5.253114700317383, "source": 3, "target": 5}, {"value": 10.05762004852295, "source": 4, "target": 4}, {"value": 7.246118068695068, "source": 4, "target": 5}, {"value": 5.838126182556152, "source": 4, "target": 6}, {"value": 11.038351058959961, "source": 5, "target": 5}, {"value": 7.329514026641846, "source": 5, "target": 6}, {"value": 5.145374298095703, "source": 5, "target": 7}, {"value": 12.199413299560547, "source": 6, "target": 6}, {"value": 9.042478561401367, "source": 6, "target": 7}, {"value": 6.7227067947387695, "source": 6, "target": 8}, {"value": 5.452264308929443, "source": 6, "target": 9}, {"value": 11.373558044433594, "source": 7, "target": 7}, {"value": 7.562961578369141, "source": 7, "target": 8}, {"value": 5.067957878112793, "source": 7, "target": 9}, {"value": 11.62516975402832, "source": 8, "target": 8}, {"value": 8.760519027709961, "source": 8, "target": 9}, {"value": 5.081593036651611, "source": 8, "target": 10}, {"value": 11.085769653320312, "source": 9, "target": 9}, {"value": 7.779297828674316, "source": 9, "target": 10}, {"value": 5.507758617401123, "source": 9, "target": 11}, {"value": 5.4201436042785645, "source": 9, "target": 12}, {"value": 10.750988960266113, "source": 10, "target": 10}, {"value": 7.016502857208252, "source": 10, "target": 11}, {"value": 5.051741123199463, "source": 10, "target": 12}, {"value": 11.566547393798828, "source": 11, "target": 11}, {"value": 8.766159057617188, "source": 11, "target": 12}, {"value": 5.54258918762207, "source": 11, "target": 13}, {"value": 5.414167404174805, "source": 11, "target": 14}, {"value": 5.370650291442871, "source": 11, "target": 15}, {"value": 13.752365112304688, "source": 12, "target": 12}, {"value": 8.638349533081055, "source": 12, "target": 13}, {"value": 7.051010608673096, "source": 12, "target": 14}, {"value": 6.336139678955078, "source": 12, "target": 15}, {"value": 5.591766357421875, "source": 12, "target": 16}, {"value": 11.10761547088623, "source": 13, "target": 13}, {"value": 7.490784645080566, "source": 13, "target": 14}, {"value": 5.277299404144287, "source": 13, "target": 15}, {"value": 13.596616744995117, "source": 14, "target": 14}, {"value": 8.484081268310547, "source": 14, "target": 15}, {"value": 6.039680004119873, "source": 14, "target": 16}, {"value": 5.0131516456604, "source": 14, "target": 17}, {"value": 5.3633222579956055, "source": 14, "target": 18}, {"value": 5.267733573913574, "source": 14, "target": 19}, {"value": 12.447599411010742, "source": 15, "target": 15}, {"value": 8.641986846923828, "source": 15, "target": 16}, {"value": 5.835555553436279, "source": 15, "target": 17}, {"value": 5.525477409362793, "source": 15, "target": 18}, {"value": 5.6785454750061035, "source": 15, "target": 19}, {"value": 13.401476860046387, "source": 16, "target": 16}, {"value": 8.066778182983398, "source": 16, "target": 17}, {"value": 5.661962509155273, "source": 16, "target": 18}, {"value": 5.348077297210693, "source": 16, "target": 19}, {"value": 12.130752563476562, "source": 17, "target": 17}, {"value": 8.734533309936523, "source": 17, "target": 18}, {"value": 6.57343053817749, "source": 17, "target": 19}, {"value": 12.550926208496094, "source": 18, "target": 18}, {"value": 8.78527545928955, "source": 18, "target": 19}, {"value": 14.581661224365234, "source": 19, "target": 19}]}
 
 Attention(data)