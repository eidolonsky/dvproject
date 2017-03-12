function geoGlobe(pointColor, csvGeo) {
  //follow http://jsfiddle.net/b12ryhda/
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