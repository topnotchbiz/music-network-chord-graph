const CHORD_THRESHOLD = 0.1, OTHER_CHORDS_THRESHOLD = 1, MIN_NODE_SIZE = 15, MAX_NODE_SIZE = 25;
const CONTAINER_WIDTH = 350, CONTAINER_HEIGHT = 900;
const OTHER_CHORDS_TEXT = 'Other', OTHER_CHORDS_LIMIT = 10; // other chords text and count limit
const MAX_ZOOM_IN = 2.0, MAX_ZOOM_OUT = 0.2; // zoom scales
const ARROW_PAD = 10; // padding between circle and arrow link
const NAME_WIDTH = 50, NAME_HEIGHT = 40; // width and height of labels
const FORCE_STRENGTH = 0.3; // force link strength

// variables for customizable containers and parameters
var colors = ['#ff0000', 'url(#pattern1)', '#ffb014', 'url(#pattern3)', '#EFE600', '#00D300', 'url(#pattern6)', '#4800FF', 'url(#pattern8)', '#B800E5', 'url(#pattern10)', '#FF00CB', '#cccccc']; // last color is for other chords
var chordDataByScale = [], selectedScale = '', selectedKey = '', linkDistance = 150, parentNodes = [], parentIds = [];

// Initialize chord data
ChordData.init()
.catch(function() {
  console.error('chord data initialization failed')
})
.then(function() {
  console.log('Chord data is initialized');
  initBtnEvent();
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

    // Please call this function anytime a user clicks on a chord node to expand it:
    ChordData.onPathChange(parentIds, selectedKey, selectedScale);
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

  // Get Keys by major initially
  selectedScale = 'major';
  getKeysByScale();
}

function getKeysByScale() {

  // Get possible keys for the selected scale:
  var keysByScale = ChordData.getKeyOptions(selectedScale);
  // console.log('These are the supported keys by scale: ' + keysByScale);

  d3.select("#keySelect").selectAll("*").remove();

  d3.select("#keySelect")
  .on('change', function() {
    selectedKey = d3.select("#keySelect").property('value');
    changeChordKey();
  })
  .selectAll("option")
  .data(keysByScale)
  .enter().append('option')
  .attr('value', function(d) {
    return d;
  })
  .text(function(d) {
    return d;
  })
  .each(function(d) {

    // Select C key in dropdown initially
    if (d == "C") {
      d3.select(this).attr('selected', 'selected');
      selectedKey = 'C';
      getChordDataByScaleAndKey();      
    }
  });
}


function initBtnEvent() {
  d3.select('#arbor-reset-button').on('click', function() {
    getChordDataByScaleAndKey();

    // Please call this function anytime a user clicks on a chord node to expand it:
    ChordData.onPathChange(parentIds, selectedKey, selectedScale);
  });
}

function changeChordKey() {
  d3.selectAll('foreignObject').each(function(d) {
    if(d.name == 'Other chords') return;
    var chordID = d.chordID;
    var nameByKey = ChordData.getChordDisplayName(chordID, selectedKey, selectedScale);
    d3.select(this).select('body').select('div').html(nameByKey);
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

  if(otherNodes.length > 0) {
    nodes.push({
      name: OTHER_CHORDS_TEXT,
      percentage: otherPer,
      color: 12,
      children: otherNodes
    });    
  }

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

  for(var i=0; i<Math.min(OTHER_CHORDS_LIMIT, chords.length); i++) {
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
  var width  = CONTAINER_WIDTH, height = CONTAINER_HEIGHT-25;

  var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

  var simulation = d3.forceSimulation()
  //  .force("link", d3.forceLink().id(function(d) { return d.chordID; }).distance(function(d) {return linkDistance;}).strength(FORCE_STRENGTH))
  //  .force("charge", d3.forceManyBody())
  //  .force("cluster", function(alpha) {
  //    for (var i = 0, n = nodes.length, node, k = alpha * 1; i < n; ++i) {
  //      node = nodes[i];
  //      node.vx -= node.x * k;
  //      node.vy -= node.y * k;
  //    }
  //  })
  .force("collide", d3.forceCollide().radius(function(d) { return node_size(d.percentage)+20; }))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force('x', d3.forceX().x(function(d) {
    return width/2;
  }))
  .force("y",d3.forceY().y(function(d) {
    return height/2;
  }))
  .force("link", d3.forceLink().id(function(d) { return d.chordID; }))

  var container = svg.append("g")

  var link = container
  .selectAll("line")
  .data(links)
  .enter().append('svg:line')
  .attr('class', function(d) { return d.hasOwnProperty('active') ? 'link active': 'link'; })
  .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
  .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  minNodeSize = Math.min.apply(null, nodes.map(function (n) { return n.percentage; }));
  maxNodeSize = Math.max.apply(null, nodes.map(function (n) { return n.percentage; }));

  var node_size = d3.scaleLinear()
  .range([MIN_NODE_SIZE, MAX_NODE_SIZE])
  .domain([minNodeSize, maxNodeSize])
  .clamp(true);

  var node = container
  .selectAll("circle")
  .data(nodes)
  .enter();

  var circle = node.append("circle")
  .attr('class', function(d) { return d.hasOwnProperty('depth') ? 'node active': 'node'; })
  .attr('r', function (d) { return node_size(d.percentage); })
  .style('fill', function(d) { return colors[d.color]; })
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

    parentIds = [];

    for(var i=0; i<parentNodes.length; i++) {
      parentIds.push(parentNodes[i].chordID);

      if(i<parentNodes.length-1) {
        links.push({source: parentNodes[i], target: parentNodes[i+1], left: false, right: true, active: true});        
      }
    }

    var chordChildren = ChordData.getChordsByPath(parentIds, chordDataByScale);

    nodeChildren = nodeChildren.concat(getNodesFromChords(chordChildren));

    if(d.name==OTHER_CHORDS_TEXT) {
      nodeChildren = nodeChildren.filter(function(d) { return d.name!=OTHER_CHORDS_TEXT; });
    }

    for(var i=0; i<nodeChildren.length; i++) {
      var point = d3.mouse(this);

      nodeChildren[i].x = point[0];
      nodeChildren[i].y = point[1];
      nodes.push(nodeChildren[i]);  

      if(parentNodes.length>0) {
        var source = d, target = nodeChildren[i];

        if(d.name==OTHER_CHORDS_TEXT) {
          source = nodes[parentNodes.length-1];
        }

        links.push({source: source, target: target, left: false, right: true});        
      }
    }

    drawForceGraph(nodes, links);
  })
  .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

  // show node Names
  var textObj = node.append('foreignObject')
  .attr('width', NAME_WIDTH)
  .attr('height', function(d) {
    if(d.hasOwnProperty('depth')) {
      return NAME_HEIGHT/2;
    } else {
      return NAME_HEIGHT;
    }
  });
  objBody = textObj.append("xhtml:body");
  objBody.append('div')
  .attr('class', 'text')
  .html(function(d) { return d.name; });
  objBody.append('div')
  .attr('class', 'text')
  .html(function(d) {
    if(d.hasOwnProperty('depth')) {
      return '';
    } else {
      return d.percentage.toFixed(1) + '%';       
    }
  });

  simulation
  .nodes(nodes)
  .on("tick", ticked);

  simulation.force("link")
  .links(links);

  function ticked() {

    link
    .attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      var deltaX = d.target.x - d.source.x,
      deltaY = d.target.y - d.source.y,
      dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      normX = deltaX / dist,
      targetPadding = node_size(d.target.percentage) + ARROW_PAD,
      targetX = d.target.x - (targetPadding * normX);

      var deltaCrss = node_size(d.target.percentage)*deltaX/deltaY;
      var abDeltaCrss = Math.abs(deltaCrss);

      var obj = d3.selectAll('foreignObject').filter(function(fd){
        return fd==d.target;
      }).node();
      var objHei = obj ? obj.getBBox().height : 40;

      if(((NAME_WIDTH/2)>abDeltaCrss) && (0>deltaY)) {
        if(Math.abs(deltaX/deltaY) > (NAME_WIDTH/2/(node_size(d.target.percentage)+objHei))) {
          targetX = d.target.x + deltaCrss/abDeltaCrss*NAME_WIDTH/2;
        } else {
          targetX = d.target.x + (node_size(d.target.percentage)+objHei)*deltaX/deltaY;
        }

        targetX -= ARROW_PAD * normX;
      }

      return targetX;
    })
    .attr("y2", function(d) {
      var deltaX = d.target.x - d.source.x,
      deltaY = d.target.y - d.source.y,
      dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      normY = deltaY / dist,
      targetPadding = node_size(d.target.percentage) + ARROW_PAD,
      targetY = d.target.y - (targetPadding * normY);

      var deltaCrss = node_size(d.target.percentage)*deltaX/deltaY;
      var abDeltaCrss = Math.abs(deltaCrss);

      var obj = d3.selectAll('foreignObject').filter(function(fd){
        return fd==d.target;
      }).node();
      var objHei = obj ? obj.getBBox().height : 40;

      if(((NAME_WIDTH/2)>abDeltaCrss) && (0>deltaY)) {
        if(Math.abs(deltaX/deltaY) > (NAME_WIDTH/2/(node_size(d.target.percentage)+objHei))) {
          targetY = d.target.y + NAME_WIDTH/2*deltaY/deltaX*deltaCrss/abDeltaCrss;
        } else {
          targetY = d.target.y + node_size(d.target.percentage)+objHei;
        }

        targetY -= ARROW_PAD * normY;
      }

      return targetY;
    });

    circle
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

    textObj
    .attr("x", function(d) { return d.x - NAME_WIDTH/2; })
    .attr("y", function(d) { return d.y + node_size(d.percentage); });
  }

  // define arrow markers for graph links and colors
  addMarkups();

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

    var patt1 = svg.append('defs').append('pattern')
    .attr('id', 'pattern1').attr('width', "16").attr('height', "16").attr('patternUnits', "userSpaceOnUse").attr('patternTransform', "rotate(45)");
    patt1.append('rect').attr('width', '16').attr('height', '16').attr('fill', '#f00');
    patt1.append('line').attr('x1', '8').attr('y1', '0').attr('x2', '8').attr('y2', '16').attr('stroke', '#540000').attr('stroke-width', '8');

    var patt3 = svg.append('defs').append('pattern')
    .attr('id', 'pattern3').attr('width', "16").attr('height', "16").attr('patternUnits', "userSpaceOnUse").attr('patternTransform', "rotate(45)");
    patt3.append('rect').attr('width', '16').attr('height', '16').attr('fill', '#ffb014');
    patt3.append('line').attr('x1', '8').attr('y1', '0').attr('x2', '8').attr('y2', '16').attr('stroke', '#efe44c').attr('stroke-width', '8');

    var patt6 = svg.append('defs').append('pattern')
    .attr('id', 'pattern6').attr('width', "16").attr('height', "16").attr('patternUnits', "userSpaceOnUse").attr('patternTransform', "rotate(45)");
    patt6.append('rect').attr('width', '16').attr('height', '16').attr('fill', '#00D300');
    patt6.append('line').attr('x1', '8').attr('y1', '0').attr('x2', '8').attr('y2', '16').attr('stroke', '#4800FF').attr('stroke-width', '8');

    var patt8 = svg.append('defs').append('pattern')
    .attr('id', 'pattern8').attr('width', "16").attr('height', "16").attr('patternUnits', "userSpaceOnUse").attr('patternTransform', "rotate(45)");
    patt8.append('rect').attr('width', '16').attr('height', '16').attr('fill', '#4800FF');
    patt8.append('line').attr('x1', '8').attr('y1', '0').attr('x2', '8').attr('y2', '16').attr('stroke', '#B800E5').attr('stroke-width', '8');

    var patt10 = svg.append('defs').append('pattern')
    .attr('id', 'pattern10').attr('width', "16").attr('height', "16").attr('patternUnits', "userSpaceOnUse").attr('patternTransform', "rotate(45)");
    patt10.append('rect').attr('width', '16').attr('height', '16').attr('fill', '#B800E5');
    patt10.append('line').attr('x1', '8').attr('y1', '0').attr('x2', '8').attr('y2', '16').attr('stroke', '#ea3ac5').attr('stroke-width', '8');
  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}