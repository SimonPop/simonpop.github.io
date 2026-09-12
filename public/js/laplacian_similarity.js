 var laplacian_colors = d3.scaleLinear([-1, 0, 1], ["#053e7a", "white", "#f7bf2c"])


// set the dimensions and margins of the graph
var margin = {top: 0, right: 10, bottom: 10, left: 10},
    width = 650 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#laplacian_similarity")
.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

function graph(data) {

    const pos_scale = 30;
    const posx_offset = 300;
    const posy_offset = 200;
    
    const idToNode = {};
    data.nodes.forEach(function (n) { idToNode[n.id] = n; });

    var link = svg
    .selectAll("line")
    .data(data.links)
    .enter()
    .append("line")
        .style("stroke", "#aaa")
        .style("stroke-width", 2)
        .attr("x1", function(d) { return posx_offset+pos_scale*idToNode[d.source].ox; })
        .attr("y1", function(d) { return posy_offset+pos_scale*idToNode[d.source].oy; })
        .attr("x2", function(d) { return posx_offset+pos_scale*idToNode[d.target].ox; })
        .attr("y2", function(d) { return posy_offset+pos_scale*idToNode[d.target].oy; });

    var nodes = svg
    .selectAll("circle")
    .data(data.nodes)
    .enter()
    .append("circle")
        .attr("r", 10)
        .attr("fill", "white")
        .attr("id", function(d,i) { return i; })
        .attr("stroke", "rgb(170, 170, 170)").style('stroke-width', 3)
        .attr("cx", function (d) { return posx_offset+pos_scale*d.ox; })
        .attr("cy", function(d) { return posy_offset+pos_scale*d.oy; });

    nodes
    .on('mouseover', function (d) {
        index=this.__data__.id;
        d3.select(this).style('stroke-width', 5).attr("r", 11)
        nodes.style("fill", function(d) {return laplacian_colors(d.laplacian_similarity[index])});
    }).on('mouseout', function (d) {d3.select(this).style('stroke-width', 3).attr("r", 10)})


}
graph(data)