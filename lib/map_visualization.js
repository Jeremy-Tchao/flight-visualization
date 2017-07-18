
(function(){


  var margin = { top: 0, left: 0, right: 0, down: 0},
    height = 700 - margin.top - margin.down,
    width = 1500 - margin.left - margin.right;
    debugger

  var zoom = d3.zoom()
    .scaleExtent([.5, 8])
    .on("zoom", zoomed);

  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;


// Cross product calculates vector perpendicular to 2 given vectors
function cross(u, v) {
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

//Dot product returns scalar magnitude
function dot(u, v) {
    for (var i = 0, sum = 0; u.length > i; ++i) sum += u[i] * v[i];
    return sum;
}

// Helper function:
// This function converts a [lon, lat] coordinates into a [x,y,z] coordinate
// the [x, y, z] is Cartesian, with origin at lon/lat (0,0) center of the earth
function lonlat2xyz( coord ){

	var lon = coord[0] * toRad;
	var lat = coord[1] * toRad;

	var x = Math.cos(lat) * Math.cos(lon);

	var y = Math.cos(lat) * Math.sin(lon);

	var z = Math.sin(lat);

	return [x, y, z];
}

// Helper function:
// This function computes a quaternion representation for the rotation between to vectors
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quaternion(v0, v1) {

	if (v0 && v1) {

	    var w = cross(v0, v1),  // vector pendicular to v0 & v1
	        w_len = Math.sqrt(dot(w, w)); // length of w

        if (w_len == 0)
        	return;

        var theta = .5 * Math.acos(Math.max(-1, Math.min(1, dot(v0, v1))));

	       let qi  = w[2] * Math.sin(theta) / w_len;
	      let  qj  = - w[1] * Math.sin(theta) / w_len;
	       let qk  = w[0]* Math.sin(theta) / w_len;
	      let  qr  = Math.cos(theta);

	    return theta && [qr, qi, qj, qk];
	}
}

// Helper function:
// This functions converts euler angles to quaternion
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function euler2quat(e) {

	if(!e) return;

    var roll = .5 * e[0] * toRad,
        pitch = .5 * e[1] * toRad,
        yaw = .5 * e[2] * toRad,

        sr = Math.sin(roll),
        cr = Math.cos(roll),
        sp = Math.sin(pitch),
        cp = Math.cos(pitch),
        sy = Math.sin(yaw),
        cy = Math.cos(yaw),

        qi = sr*cp*cy - cr*sp*sy,
        qj = cr*sp*cy + sr*cp*sy,
        qk = cr*cp*sy - sr*sp*cy,
        qr = cr*cp*cy + sr*sp*sy;

    return [qr, qi, qj, qk];
}

// This functions computes a quaternion multiply
// Geometrically, it means combining two quant rotations
// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/arithmetic/index.htm
function quatMultiply(q1, q2) {
	if(!q1 || !q2) return;

    var a = q1[0],
        b = q1[1],
        c = q1[2],
        d = q1[3],
        e = q2[0],
        f = q2[1],
        g = q2[2],
        h = q2[3];

    return [
     a*e - b*f - c*g - d*h,
     b*e + a*f + c*h - d*g,
     a*g - b*h + c*e + d*f,
     a*h + b*g - c*f + d*e];

}

// This function computes quaternion to euler angles
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quat2euler(t){

	if(!t) return;

	return [ Math.atan2(2 * (t[0] * t[1] + t[2] * t[3]), 1 - 2 * (t[1] * t[1] + t[2] * t[2])) * toDeg,
			 Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) * toDeg,
			 Math.atan2(2 * (t[0] * t[3] + t[1] * t[2]), 1 - 2 * (t[2] * t[2] + t[3] * t[3])) * toDeg
			]
}

/*  This function computes the euler angles when given two vectors, and a rotation
	This is really the only math function called with d3 code.

	v0 - starting pos in lon/lat, commonly obtained by projection.invert
	v1 - ending pos in lon/lat, commonly obtained by projection.invert
	o0 - the projection rotation in euler angles at starting pos (v0), commonly obtained by projection.rotate
*/

function eulerAngles(v0, v1, o0) {

	/*
		The math behind this:
		- first calculate the quaternion rotation between the two vectors, v0 & v1
		- then multiply this rotation onto the original rotation at v0
		- finally convert the resulted quat angle back to euler angles for d3 to rotate
	*/

	var t = quatMultiply( euler2quat(o0), quaternion(lonlat2xyz(v0), lonlat2xyz(v1) ) );
	return quat2euler(t);
}


/**************end of math functions**********************/
  let drag = d3.drag()
                .on("start", dragstart)
                .on("drag", dragged)
                .on("end", dragend)

  let gpos0, o0;

  function dragstart(){
  	gpos0 = projection.invert(d3.mouse(this));
  	o0 = projection.rotate();

  	svg.insert("path")
               .datum({type: "Point", coordinates: gpos0})
               .attr("class", "point")
               .attr("d", path);
  }

  function dragged(){

  	var gpos1 = projection.invert(d3.mouse(this));

  	o0 = projection.rotate();

  	var o1 = eulerAngles(gpos0, gpos1, o0);
  	projection.rotate(o1);

  	svg.selectAll(".point")
  	 		.datum({type: "Point", coordinates: gpos1});
    svg.selectAll("path").attr("d", path);

  }

  function dragend(){
  	svg.selectAll(".point").remove();
  }
//


  let svg = d3.select("#map")
              .append("svg")
              .attr("height", height + margin.top + margin.down)
              .attr("width", width + margin.left + margin.right)


  let rectSVG = svg.append("pattern")
                    .attr("class", "rect-svg")
                    .attr("height", height + margin.top + margin.down)
                    .attr("width", width + margin.left + margin.right)


  let gMap = svg.append("g")
                .attr("class", "g-map")
                .attr("transform", "translate("+ margin.left + "," + margin.top +")")
  //
  // function startDrag(d){
  //   d3.select(this).
  // }

  let rectGMap = gMap.append("rect")
                .attr("class", "rect-g-map")
                .attr("height", 1250)
                .attr("width", width + margin.left + margin.right)
                .attr("transform", "translate("+ margin.left + "," + -400 +")")

  let projection = d3.geoOrthographic()
                .translate([ width / 2, height / 2 ])
                .rotate([100, 350, 7])
                .scale(250);

  let rectZoom = svg.append("rect")
                .data([projection])
                .attr("class", "rect-zoom")
                .attr("height", height + margin.top + margin.down)
                .attr("width", width + margin.left + margin.right)
                .style("fill", "none")
                .style("pointer-events", "all")
                .call(drag)
                .call(zoom)
                // .call(zoom)
                  // .on("mousedown.zoom", function(d){
                  //   // debugger
                  //   // d.rotate([50, 0, 0])
                  // })
                  // .on("touchstart.zoom", null)
                  // .on("touchmove.zoom", null)
                  // .on("touchend.zoom", null);


    function zoomed() {
      gMap.attr("transform", d3.event.transform );
    }

    d3.queue()
      .defer(d3.json, "countries.topojson")
      .defer(d3.json, "airports.topojson")
      .defer(d3.csv, "flights.csv")
      .await(ready);





    var path = d3.geoPath()
      .projection(projection);

    let intSpeed = 100


    function ready(error, countriesData, airportsData, flightData) {
      // console.log(flightData)
      var countriesParsed = topojson.feature(countriesData, countriesData.objects.countries).features;

      gMap.selectAll(".country")
        .data(countriesParsed)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .on("mouseover", function(d){
          d3.select(this)
          .attr("class", "activeCountry")
          .attr("fill", "black");

          d3.select(".map")
          .append("text")
          .attr("class", "countrydetails")
          .text(
            "Country: " + d.properties.NAME
          )
          d3.select(".map")
          .append("text")
          .attr("class", "countrydetails")
          .text(
            "Continent: " + d.properties.CONTINENT
          )
          d3.select(".map")
          .append("text")
          .attr("class", "countrydetails")
          .text(
            "GDP (in millions): " + d.properties.GDP_MD_EST
          )
        })
        .on("mouseout", function(d){
          d3.selectAll("text.countrydetails").remove()
          d3.selectAll(".activeCountry")
          .attr("class", "country")
        });




      let airports = topojson.feature(airportsData, airportsData.objects.airports).features;


      let airportsNameCoord = {};

      for (var i = 0; i < airports.length; i++) {
        let iata = airports[i].properties.iata_code;
        let coord = airports[i].geometry.coordinates
        airportsNameCoord[iata] = {coord: coord}
      }

      let flights = [];
      for (var i = 0; i < flightData.length; i++) {
        let orgAir = flightData[i]["ORIGIN"];
        let destAir = flightData[i]["DEST"];
        let depTime = flightData[i]["DEP_TIME"]
        if (airportsNameCoord[orgAir] && airportsNameCoord[destAir] && depTime) {
          flightData[i]["type"] = "Point";
          flightData[i]["coordinates"] = airportsNameCoord[orgAir]["coord"];
          flightData[i]["DESTCOORD"] = airportsNameCoord[destAir]["coord"];
          flights.push(flightData[i])
        }
      }

      function transition(plane, route) {
        let l = route.node().getTotalLength();
        plane.attr('opacity', 1)
              .transition()
              .duration(10*route.node().getTotalLength())
              .attrTween("transform", translateAttr(route.node()))
              .attr("d", path)
              .remove()
        ;
      }

      function translateAttr(path) {
        var l = path.getTotalLength();
        return function(d, i, a) {
          return function(t) {
            var p = path.getPointAtLength(t * l);
            var po = path.getPointAtLength(0);
            return "translate(" + (p.x-po.x) + "," + (p.y-po.y) + ")";
          };
        };
      }

      let timer = 0;

      const interval = function(){
        //
        gMap.selectAll(".clock").remove();
        let minutes = timer%100;
        let hours = (timer-minutes)/100;
        if (hours < 10 && minutes < 10) {
          gMap.append("text")
          .attr("class", "clock")
          .text("Time (hh/mm): 0" +hours + ":0" + minutes );

        }else if (hours < 10) {
          gMap.append("text")
          .attr("class", "clock")
          .text("Time (hh/mm): 0" +hours + ":" + minutes )
        } else if (minutes < 10) {
          gMap.append("text")
          .attr("class", "clock")
          .text("Time (hh/mm): " +hours + ":0" + minutes )
        } else {
          gMap.append("text")
          .attr("class", "clock")
          .text("Time (hh/mm): " +hours + ":" + minutes )
        }
        gMap.selectAll(".clock")
        .attr("height", 0)
        .attr("width", 10)

        for (var i = 0; i < flights.length-1; i++) {
          // let currFlight = {coordinates: flights[i]["coordinates"]}
          let currFlight = Object.assign({}, flights[i])
          // delete currFlight["DESTCOORD"]
          if (parseInt(flights[i].DEP_TIME) === timer) {
            transition(
              gMap.datum(currFlight)
                  .append("path")
                  .attr("class", "plane")
                  .attr("fill", "red")
                  .attr("d", path)
                  .attr("stroke-width", 0.5)
              ,
              gMap.datum({type: "LineString", coordinates: [flights[i].coordinates, flights[i].DESTCOORD]})
                  .append("path")
                  .attr("class", "route")
                  .attr("d", path)
                  .attr('opacity', 0.5)
                  .attr('fill', "none")
                  .attr('stroke-width', 0.01)
                  .attr('stroke', '	#00FF00')
                  .transition()
                  .duration(1000)
                  .remove());
          }

        }
        timer += 1
        if (timer%100 >= 60) {
          timer += 100 - timer%100
        }
        if (timer >= 2400) {
          timer = 0;
        }
      }


      let time = setInterval(
        interval, intSpeed)

      gMap.selectAll(".airport")
      .data(airports)
      .enter()
      .append("path")
      .attr("class", "airport")
      .attr("d", path.pointRadius(1.5))
      // .attr("scale", 100)
      .on("mouseover", function(d){
        //
        d3.select(this)
        .attr("class", "activeAirport")
        .attr("stroke", "blue")
        .attr("stroke-width", 0.5)
        .attr("fill", "red")
        .attr("d", path.pointRadius(5));

        d3.select(".map")
        .append("text")
        .attr("class", "countrydetails")
        .text(
          "Airport: " + d.properties.name
        )
        d3.select(".map")
        .append("text")
        .attr("class", "countrydetails")
        .text(
          "IATA: " + d.properties.iata_code
        )
        //
      })
      // .on("click", )
      .on("mouseout", function(d){
        d3.selectAll("text.countrydetails").remove()

        d3.selectAll(".activeAirport")
        .attr("class", "airport")
        .attr("d", path.pointRadius(1.5));

      });


      d3.select(".map")
      .append("input")
      .attr("type","button")
      .attr("class","pause")
      .attr("value","Pause")
      .on("click", function(){
          clearInterval(time)
      });

      d3.select(".map")
      .append("input")
      .attr("type","button")
      .attr("class","play")
      .attr("value","Play")
      .on("click", function(){
        clearInterval(time)
        time = setInterval(interval, intSpeed)
      });

      let speed = d3.select(".map")
      .append("text")
      .attr("class", "speed")
      .text(
        "Speed: 1 hour = " + (intSpeed/1000)*60 + " seconds"
      )

      d3.select(".map")
      .append("input")
      .attr("type","button")
      .attr("class","play")
      .attr("value","X2")
      .on("click", function(){
        intSpeed = intSpeed/2
        d3.select(".speed").text(
          "Speed: 1 hour = " + (intSpeed/1000)*60 + " seconds"
        )
        clearInterval(time)
        time = setInterval(interval, intSpeed)
      });

      d3.select(".map")
      .append("input")
      .attr("type","button")
      .attr("class","play")
      .attr("value","/2")
      .on("click", function(){
        intSpeed = intSpeed*2
        d3.select(".speed").text(
          "Speed: 1 hour = " + (intSpeed/1000)*60 + " seconds"
        )
        clearInterval(time)
        time = setInterval(interval, intSpeed)
      });

    }
})();
