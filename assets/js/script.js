function geoGlobe(pointColor, csvGeo) {
  //Inspired by https://habrahabr.ru/post/186532/
  var width = 500;
  var height = 500;
  var scrollSpeed = 50;
  var current = 180;
  // scale
  var longitudeScale = d3.scale.linear()
    .domain([0, width])
    .range([-180, 180]);
  // projection
  var planetProj = d3.geo.orthographic()
    .scale(200)
    .rotate([longitudeScale(current), 0])
    .translate([width / 2, height / 2])
    .clipAngle(90);
  var pointProj = d3.geo.orthographic()
    .scale(200)
    .rotate([longitudeScale(current), 0])
    .translate([width / 2, height / 2])
    .clipAngle(90);
  // path
  var path = d3.geo.path()
    .projection(planetProj);
  // svg
  var svg = d3.select(".globe").append("svg")
    .attr("width", width)
    .attr("height", height);
  // mask
  var center = planetProj.translate();   
  // get the center of the circle
  var edge = planetProj([-90, 90]); 
  // edge point 
  var r = Math.pow(Math.pow(center[0] - edge[0], 2) + Math.pow(center[1] - edge[1], 2), 0.5); // radius

  svg.append("defs")
      .append("clipPath")
      .append("circle")
      .attr("id", "edgeCircle")
      .attr("cx", center[0])
      .attr("cy", center[1])
      .attr("r", r)
  var mask = svg.append("mask").attr("id", "edge")
  mask.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");
  mask.append("use")
      .attr("xlink:href", "#edgeCircle")
      .attr("fill", "black");
  // import data/draw globe
  d3.json("/assets/data/world.json", function(error, world) {
    if (error) throw error;
    var planet = svg.append("path")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);
    d3.csv(csvGeo, function(error, data) {
      if (error) throw error;

      var max = d3.max(data, function(d) {
        return parseInt(d.Value);
      })
      var points = svg.selectAll(".point")
          .data(data)
          .enter()
          .append("circle")
          .attr("r", "3")
          .attr("fill", pointColor)
          .attr("class", "point")
          .attr("opacity", ".45");
      function bgscroll() {
        current += 1;
        planetProj.rotate([longitudeScale(current), 0]);
        pointProj.rotate([longitudeScale(current), 0]);
        planet.attr("d", path);
        // hide points at back
        points.attr("display", function(d) {
          var longitude = Number(d.Longitude) + 180;
          var startLongitude = 360 - ((longitudeScale(current) + 270) % 360);
          var endLongitude = (startLongitude + 180) % 360;
          if ((startLongitude < endLongitude && longitude > startLongitude && longitude < endLongitude) ||
              (startLongitude > endLongitude && (longitude > startLongitude || longitude < endLongitude)))
              return "block";
          else
              return "none";
      })
    .attr("cx", function(d) {
       return planetProj([d.Longitude, d.Latitude])[0];
     }).attr("cy", function(d) {
       return planetProj([d.Longitude, d.Latitude])[1];
     });
  }
       setInterval(bgscroll, scrollSpeed);  
    })
  })
}

function timeSeries(csvTime) {
  //svg
  var w = 1200, h = 500,
      svg = d3.selectAll("body")
              .append("svg")
              .attr("width", w)
              .attr("height", h),
      margin = {top: 20, right: 80, bottom: 100, left: 40},
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;

  var margin2 = {top: 420, right: 80, bottom: 20, left: 40},
      height2 = h - margin2.top - margin2.bottom;

  //parse time
  var parseTime = d3.timeParse("%H:%M");

  //scale
  var x = d3.scaleTime().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      z = d3.scaleOrdinal(d3.schemeCategory20);

  //brush scale
  var x2 = d3.scaleTime().range([0, width]),
      y2 = d3.scaleLinear().range([height2, 0]);  
 
  //axes
  var xAxis = d3.axisBottom(x),
      xAxis2 = d3.axisBottom(x2),
      yAxis = d3.axisLeft(y);

  //line
  var line = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.sum); });

  var line2 = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) { return x2(d.date); })
      .y(function(d) { return y2(d.sum); });

  svg.append("defs")
     .append("clipPath")
     .attr("id", "clip")
     .append("rect")
     .attr("width", width)
     .attr("height", height);
 
  var focus = svg.append("g")
                 .attr("class", "focus")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var context = svg.append("g")
                  .attr("class", "context")
                  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
  //get csv data
  d3.csv(csvTime, type, function(error, data) {
    if (error) throw error;

    var names = data.columns.slice(1).map(function(id) {
      return {
        id: id,
        values: data.map(function(d) {
          return {date: d.date, sum: d[id]};
        })
      };
    });

    //domain
    x.domain(d3.extent(data, function(d) { return d.date; }));
    x2.domain(x.domain());
    y.domain([
      d3.min(names, function(c) { return d3.min(c.values, function(d) { return d.sum; }); }),
      d3.max(names, function(c) { return d3.max(c.values, function(d) { return d.sum; }); })
    ]);
    y2.domain(y.domain());
    z.domain(names.map(function(c) { return c.id; }));


 
    //brush
    var brush = d3.brushX()
                  .extent([[0,0], [width, height2]])
                  .on("brush end", brushed);

    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Mentioned in Tweets");

    var name = focus.selectAll(".name")
      .data(names)
      .enter().append("g")
        .attr("class", "name");

    name.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.values); })
        .style("stroke", function(d) { return z(d.id); });

    name.append("text")
        .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.sum) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .text(function(d) { return d.id; });

    context.append("g")
           .attr("class", "axis axis--x")
           .attr("transform", "translate(0," + height2 + ")")
           .call(xAxis2);

    var name2 = context.selectAll(".name2")
      .data(names)
      .enter().append("g")
        .attr("class", "name2");

    name2.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return line2(d.values); })
        .style("stroke", function(d) { return z(d.id); });

    context.append("g")
           .attr("class", "brush")
           .call(brush)
           .call(brush.move, x.range())        
           .attr("y", -6)
           .attr("height", height2);

  

    function brushed() {
      var s = d3.event.selection || x2.range();
      x.domain(s.map(x2.invert, x2));
      focus.selectAll("path.line").attr("d", function(d) {return line(d.values)});
      focus.select(".axis--x").call(xAxis);
      focus.select(".axis--y").call(yAxis);
    }  


  });

  function type(d, _, columns) {
    d.date = parseTime(d.date);
    for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
    return d;
  }
  

}