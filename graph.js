//D3ok();

const CHORD_THRESHOLD = 0.1, OTHER_CHORDS_THRESHOLD = 1, MIN_NODE_SIZE = 15, MAX_NODE_SIZE = 25, OTHER_CHORDS_TEXT = 'Other chords';
const MAX_ZOOM_IN = 2.0, MAX_ZOOM_OUT = 0.2;


// variables for customizable containers and parameters
var colors = ['#ff0000', 'url(#color1)', '#ffb014', 'url(#color3)', '#EFE600', '#00D300', 'url(#color6)', '#4800FF', 'url(#color8)', '#B800E5', 'url(#color10)', '#FF00CB', '#cccccc']; // last color is for other chords
var chordDataByScale = [], selectedScale = '', selectedKey = '', linkDistance = 250, parentNodes = [];

// Initialize chord data
ChordData.init()
.catch(function() {
  console.error('chord data initialization failed')
})
.then(function() {
  console.log('Chord data is initialized');
  getScales();
})

function getScales() {

  // Get possible scales:
  var possibleScales = ChordData.getScaleOptions();
  // console.log('These are the supported scales: ' + possibleScales);

  d3.select("#scaleSelect")
  .on('change', function() {
    selectedScale = d3.select("#scaleSelect").property('value');
    getKeysByScale();
  })
  .selectAll("option")
  .data(possibleScales)
  .enter().append('option')
  .attr('value', function(d) {
    return d;
  })
  .text(function(d) {
    return d;
  });
}

function getKeysByScale() {

  // Get possible keys for the selected scale:
  var keysByScale = ChordData.getKeyOptions(selectedScale);
  // console.log('These are the supported keys by scale: ' + keysByScale);

  d3.select("#keySelect").selectAll("*").remove();

  d3.select("#keySelect")
  .append('option')
  .attr('selected', 'selected')
  .attr('disabled', 'disabled')
  .text('Select a Key');

  d3.select("#keySelect")
  .on('change', function() {
    selectedKey = d3.select("#keySelect").property('value');
    getChordDataByScaleAndKey();
  })
  .selectAll("option")
  .data(keysByScale)
  .enter().append('option')
  .attr('value', function(d) {
    return d;
  })
  .text(function(d) {
    return d;
  });
}

function getChordDataByScaleAndKey() {
  // Get chord data object for selected scale.  Can use any valid scale as defined above, but 'major' and 'minor' have the most data
  chordDataByScale = ChordData.getChordDataByScale(selectedScale);

  // Get starting chords nodes (depth-1) for scale.  Keep only those above a threshold
  var initialChords = ChordData.getChordsByPath([], chordDataByScale)
  .filter(function(chord) {
    return chord.percentage > CHORD_THRESHOLD;
  });

  parentNodes = [];
  drawForceGraph(getNodesFromChords(initialChords), []);
}

function getNodesFromChords(chords) {

  var nodes = [], otherPer = 0, otherNodes = [];

  // Get the chord node display names for key scale:
  var initialChordDisplayNames = chords.map(function(chord) {
    return ChordData.getChordDisplayName(chord.chordID, selectedKey, selectedScale);
  });

  // Get the chord node display colors for key scale:
  var initialChordDisplayColorIndices = chords.map(function(chord) {
    return ChordData.getChordDisplayColorIdx(chord.chordID, selectedKey, selectedScale);
  });

  for(var i=0; i<chords.length; i++) {
    var chord = chords[i];
    var percentage = chord.percentage;

    if(percentage >= OTHER_CHORDS_THRESHOLD) {
      chord.name = initialChordDisplayNames[i];
      chord.color = initialChordDisplayColorIndices[i];
      nodes.push(chord);
    } else if(percentage >= CHORD_THRESHOLD) {
      otherPer += percentage;
      otherNodes.push(chord)
    }
  }

  nodes.push({
    name: OTHER_CHORDS_TEXT,
    percentage: otherPer,
    color: 12,
    children: otherNodes
  });

  return nodes;
}

function getOtherNodesFromChords(chords) {
  var nodes = [];

  // Get the chord node display names for key scale:
  var initialChordDisplayNames = chords.map(function(chord) {
    return ChordData.getChordDisplayName(chord.chordID, selectedKey, selectedScale);
  });

  // Get the chord node display colors for key scale:
  var initialChordDisplayColorIndices = chords.map(function(chord) {
    return ChordData.getChordDisplayColorIdx(chord.chordID, selectedKey, selectedScale);
  });

  for(var i=0; i<chords.length; i++) {
    var chord = chords[i];
    var percentage = chord.percentage;

    chord.name = initialChordDisplayNames[i];
    chord.color = initialChordDisplayColorIndices[i];
    nodes.push(chord);
  }

  return nodes;
}

function drawForceGraph(nodes, links) {

  d3.selectAll('svg').remove();

  // set up SVG for D3
  var width  = window.innerWidth-25, height = window.innerHeight-45;

  var svg = d3.select('body')
  .append('svg')
  .attr('oncontextmenu', 'return false;')
  .attr('width', width)
  .attr('height', height);

  // define arrow markers for graph links and colors
  addMarkups();

  // init D3 force layout
  var force = d3.layout.force()
  .nodes(nodes)
  .links(links)
  .size([width, height])
  .linkDistance(linkDistance)
  .charge(-500)
  .on('tick', tick);

  // handles to link and node element groups
  var path = svg.append('svg:g').selectAll('path'), circle = svg.append('svg:g').selectAll('g');

  // path (link) group
  path = path.data(links);

  // update existing links
  path
  .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
  .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });


  // add new links
  path.enter().append('svg:path')
  .attr('class', function(d) { return d.hasOwnProperty('active') ? 'link active': 'link'; })
  .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
  .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  // remove old links
  path.exit().remove();

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.chordID; });

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
  .style('fill', function(d) { return colors[d.color]; });


  minNodeSize = Math.min.apply(null, nodes.map(function (n) { return n.percentage; }));
  maxNodeSize = Math.max.apply(null, nodes.map(function (n) { return n.percentage; }));

  var node_size = d3.scale.linear()
  .range([MIN_NODE_SIZE, MAX_NODE_SIZE])
  .domain([minNodeSize, maxNodeSize])
  .clamp(true);

  // add new nodes
  var g = circle.enter().append('svg:g');
  
  g.append('svg:circle')
  .attr('class', function(d) { return d.hasOwnProperty('depth') ? 'node active': 'node'; })
  .attr('r', function (d) { return node_size(d.percentage); })
  .style('fill', function(d) { return colors[d.color]; })
  .style('stroke', '#000')
  .on('click', function(d) {
    if (d3.event.defaultPrevented) return;

    var nodeChildren = [];

    if(d.name==OTHER_CHORDS_TEXT) {
      var chordChildren = d.children;
      nodeChildren = getOtherNodesFromChords(chordChildren);
    } else {
      if(d.hasOwnProperty('depth')) {
        parentNodes = parentNodes.slice(0, d.depth+1);
      } else {
        d.depth = parentNodes.length;
        parentNodes.push(d);      
      }
    }

    nodes = parentNodes.slice(0);
    links = [];

    var parentIds = [];

    for(var i=0; i<parentNodes.length-1; i++) {
      parentIds.push(parentNodes[i].chordID);
      links.push({source: parentNodes[i], target: parentNodes[i+1], left: false, right: true, active: true});
    }

    var chordChildren = ChordData.getChordsByPath(parentIds, chordDataByScale);      
    nodeChildren = nodeChildren.concat(getNodesFromChords(chordChildren));

    if(d.name==OTHER_CHORDS_TEXT) {
      nodeChildren = nodeChildren.filter(function(d) { return d.name!=OTHER_CHORDS_TEXT; });
    }

    // unenlarge target node
    d3.select(this).attr('transform', '');

    for(var i=0; i<nodeChildren.length; i++) {
      var point = d3.mouse(this);
      nodeChildren[i].x = point[0];
      nodeChildren[i].y = point[1];
      nodes.push(nodeChildren[i]);  

      var source = d, target = nodeChildren[i];

      if(d.name==OTHER_CHORDS_TEXT) {
        source = nodes[parentNodes.length-1];
      }

      links.push({source: source, target: target, left: false, right: true});
    }

    drawForceGraph(nodes, links);
  });

  // show node IDs
  var objBody = g.append('foreignObject')
  .attr('x', -50)
  .attr('y', function (d) { return node_size(d.percentage); })
  .attr('width', 100)
  .attr('height', 40)
  .append("xhtml:body");
  objBody.append('div')
  .attr('class', 'text')
  .html(function(d) { return d.name; });
  objBody.append('div')
  .attr('class', 'text')
  .html(function(d) { return d.percentage.toFixed(1) + '%'; });

  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();

  // update force layout (called automatically each iteration)
  function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
      var deltaX = d.target.x - d.source.x,
      deltaY = d.target.y - d.source.y,
      dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      normX = deltaX / dist,
      normY = deltaY / dist,
      sourcePadding = node_size(d.source.percentage),
      targetPadding = node_size(d.target.percentage) + 6,
      sourceX = d.source.x + (sourcePadding * normX),
      sourceY = d.source.y + (sourcePadding * normY),
      targetX = d.target.x - (targetPadding * normX),
      targetY = d.target.y - (targetPadding * normY);
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });

  }

  function addMarkups() {
    // define arrow markers for graph links and colors
    svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -10 20 20')
    .attr('refX', 6)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-10L20,0L0,10');
    //    .attr('fill', '#000');

    svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -10 20 20')
    .attr('refX', 4)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-10L0,0L20,10');
    //    .attr('fill', '#000');

    var grad1 = svg.append('svg:defs').append('svg:linearGradient')
    .attr('id', 'color1').attr('x1', "40%").attr('y1', "20%").attr('x2', "20%").attr('y2', "40%").attr('spreadMethod', 'repeat');
    grad1.append('stop').attr('offset', '0').attr('stop-color', '#F00');
    grad1.append('stop').attr('offset', '1').attr('stop-color', '#540000');

    var grad3 = svg.append('svg:defs').append('svg:linearGradient')
    .attr('id', 'color3').attr('x1', "40%").attr('y1', "20%").attr('x2', "20%").attr('y2', "40%").attr('spreadMethod', 'repeat');
    grad3.append('stop').attr('offset', '0').attr('stop-color', '#ffb014');
    grad3.append('stop').attr('offset', '1').attr('stop-color', '#540000');

    var grad6 = svg.append('svg:defs').append('svg:linearGradient')
    .attr('id', 'color6').attr('x1', "40%").attr('y1', "20%").attr('x2', "20%").attr('y2', "40%").attr('spreadMethod', 'repeat');
    grad6.append('stop').attr('offset', '0').attr('stop-color', '#00D300');
    grad6.append('stop').attr('offset', '1').attr('stop-color', '#003303');

    var grad8 = svg.append('svg:defs').append('svg:linearGradient')
    .attr('id', 'color8').attr('x1', "40%").attr('y1', "20%").attr('x2', "20%").attr('y2', "40%").attr('spreadMethod', 'repeat');
    grad8.append('stop').attr('offset', '0').attr('stop-color', '#4800FF');
    grad8.append('stop').attr('offset', '1').attr('stop-color', '#440038');

    var grad10 = svg.append('svg:defs').append('svg:linearGradient')
    .attr('id', 'color10').attr('x1', "40%").attr('y1', "20%").attr('x2', "20%").attr('y2', "40%").attr('spreadMethod', 'repeat');
    grad10.append('stop').attr('offset', '0').attr('stop-color', '#B800E5');
    grad10.append('stop').attr('offset', '1').attr('stop-color', '#002117');
  }

  //Create the zoom behavior to set for the draw
  var zoom = d3.behavior.zoom().scaleExtent([MAX_ZOOM_OUT, MAX_ZOOM_IN]).on('zoom', zoomed);

  //Function called on the zoom event. It translate the draw on the zoommed point and scale with a certain factor
  function zoomed() {
    svg.selectAll('svg > g').attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  //Create the drag and drop behavior to set for the objects crated
  var drag = d3.behavior.drag()
  .origin(function(d) { return d; });

  //Set the zoom and drag behavior on the svg    
  svg.call(zoom);
  d3.selectAll('svg > g').call(drag);
  d3.selectAll('circle').call(force.drag);
}