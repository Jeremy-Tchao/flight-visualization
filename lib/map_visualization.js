(function(){

  let header = document.getElementById("logo-buttons")

  let margin = { top: 0, left: 0, right: 0, down: 0},
    height = 690 - margin.top - margin.down,
    width = header.clientWidth;

  let zoom = d3.zoom()
    .scaleExtent([.5, 8])
    .translateExtent([[0, 0], [width, height]])
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


function lonlat2xyz(coord){

	var lon = coord[0] * toRad;
	var lat = coord[1] * toRad;

	var x = Math.cos(lat) * Math.cos(lon);

	var y = Math.cos(lat) * Math.sin(lon);

	var z = Math.sin(lat);

	return [x, y, z];
}

// Quaternion rotation between two vectors
function quaternion(v, u) {

	if (v && u) {

	    var w = cross(v, u),  // vector pendicular to v & u
	        w_len = Math.sqrt(dot(w, w)); // length of w
        if (w_len == 0){
          return [1,0,0,0];
        }

        let theta = .5 * Math.acos(Math.max(-1, Math.min(1, dot(v, u))));

	      let qi  = w[2] * Math.sin(theta) / w_len;
	      let  qj  = - w[1] * Math.sin(theta) / w_len;
	      let qk  = w[0]* Math.sin(theta) / w_len;
	      let  qr  = Math.cos(theta);


	    return [qr, qi, qj, qk];
	}
}

// Euler to quaternion
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

// Quaternion mutliplication, combining two rotations
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

// This function converts quaternion to euler angles
function quat2euler(t){

	if(!t) return;

	return [ Math.atan2(2 * (t[0] * t[1] + t[2] * t[3]), 1 - 2 * (t[1] * t[1] + t[2] * t[2])) * toDeg,
			 Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) * toDeg,
			 Math.atan2(2 * (t[0] * t[3] + t[1] * t[2]), 1 - 2 * (t[2] * t[2] + t[3] * t[3])) * toDeg
			]
}

/*  This function computes the euler angles when given two vectors, and a rotation
	This is really the only math function called with d3 code.

	v - starting pos in lon/lat, commonly obtained by projection.invert
	u - ending pos in lon/lat, commonly obtained by projection.invert
	o0 - the projection rotation in euler angles at starting pos (v), commonly obtained by projection.rotate
*/

function eulerAngles(v, u, o0) {

	/*
		The math behind this:
		- first calculate the quaternion rotation between the two vectors, v & u
		- then multiply this rotation onto the original rotation at v
		- finally convert the resulted quat angle back to euler angles for d3 to rotate
	*/
  var t = quatMultiply( euler2quat(o0), quaternion(lonlat2xyz(v), lonlat2xyz(u)));
	return quat2euler(t);
}


/************************************/
  let drag = d3.drag()
                .on("start", dragstart)
                .on("drag", dragged)
                .on("end", dragend)

  let vInit, o0;


  let play = true;

  function dragstart(){
  	vInit = projection.invert(d3.mouse(this));
  	svg.insert("path")
       .datum({type: "Point", coordinates: vInit})
       .attr("class", "point")
       .attr("d", path);

   gMap.selectAll(".plane").remove()
    if (play) {
      clearInterval(time)
    }

  }

  function dragged(){
  	var vFin = projection.invert(d3.mouse(this));
  	o0 = projection.rotate();

  	var o1 = eulerAngles(vInit, vFin, o0);
  	projection.rotate(o1);

  	svg.selectAll(".point")
  	 		.datum({type: "Point", coordinates: vFin});
    svg.selectAll("path").attr("d", path);

  }

  function dragend(){
  	svg.selectAll(".point").remove();
    if (play) {
      time = setInterval(
        interval, intSpeed)
    }
  }
//


  let svg = d3.select("#map")
              .append("svg")
              .attr("height", height + margin.top + margin.down)
              .attr("width", width + margin.left + margin.right)
              .call(drag)
              .call(zoom)


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

  let earthScale = 250;


  let circGMap = gMap.append("circle")
                .attr("class", "circ-g-map")
                .attr("height", 100)
                .attr("width", 100)
                .attr("cx", width/2)
                .attr("cy", height/2)
                .attr("r", earthScale)
                // .attr("stroke", "lightgrey")
                // .attr("stroke-width", "1")
                .attr("fill", "black")


  let projection = d3.geoOrthographic()
                .translate([ width / 2, height / 2 ])
                .rotate([100, -10, 7])
                .scale(earthScale);

  // let rectZoom = svg.append("rect")
  //               .data([projection])
  //               .attr("class", "rect-zoom")
  //               .attr("height", height + margin.top + margin.down)
  //               .attr("width", width + margin.left + margin.right)
  //               .style("fill", "none")
  //               .style("pointer-events", "all")

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



    let intSpeed = 10;

    let time;

    let timer = 0;
    let timeToFlight = {};
    let airport = 0;

    const interval = function(){
      // debugger
      //
      d3.selectAll(".clock").remove();
      let minutes = timer%100;
      let hours = (timer-minutes)/100;

      if (hours < 10 && minutes < 10) {
        d3.select(".time-speed").append("text")
        .attr("class", "clock")
        .text("Time: 0" +hours + ":0" + minutes );

      }else if (hours < 10) {
        d3.select(".time-speed").append("text")
        .attr("class", "clock")
        .text("Time: 0" +hours + ":" + minutes )
      } else if (minutes < 10) {
        d3.select(".time-speed").append("text")
        .attr("class", "clock")
        .text("Time: " +hours + ":0" + minutes )
      } else {
        d3.select(".time-speed").append("text")
        .attr("class", "clock")
        .text("Time: " +hours + ":" + minutes )
      }
      d3.select(".time-speed").selectAll(".clock")
      .attr("height", 0)
      .attr("width", 10)

        if (timeToFlight[timer]) {
          timeArr = timeToFlight[timer];
          for (var i = 0; i < timeArr.length; i++) {
            timeArr[i];
            flight = flightDatas[timeArr[i]]
            let currFlight = Object.assign({}, flight);
            // debugger
            // let randomFlight =
            transition(
              gMap.datum(currFlight)
                  .append("path")
                  .attr("class", "plane")
                  .attr("fill", "red")
                  .attr("d", path)
                  .attr("stroke-width", 0.5)
              ,
              gMap.datum({type: "LineString", coordinates: [flight.coordinates, flight.DESTCOORD]})
                  .append("path")
                  .attr("class", "route")
                  .attr("d", path)
                  .attr('opacity', 0.3)
                  .attr('fill', "none")
                  .attr('stroke-width', 0.007)
                  .attr('stroke', '	#00FF00')
                  .transition()
                  .duration(intSpeed*gMap.select(".route").node().getTotalLength())
                  .remove());

              // transition(
              //   gMap.datum(currFlight)
              //       .append("path")
              //       .attr("class", "plane")
              //       .attr("fill", "red")
              //       .attr("d", path)
              //       .attr("stroke-width", 0.5)
              //   ,
              //   gMap.datum({type: "LineString", coordinates: [flight.coordinates, flight.DESTCOORD]})
              //       .append("path")
              //       .attr("class", "route")
              //       .attr("d", path)
              //       .attr('opacity', 0.3)
              //       .attr('fill', "none")
              //       .attr('stroke-width', 0.007)
              //       .attr('stroke', '	#00FF00')
              //       .transition()
              //       .duration(intSpeed*gMap.select(".route").node().getTotalLength())
              //       .remove());
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

    // let flights = [];
    let flightDatas;


    function transition(plane, route) {
      let l = route.node().getTotalLength();
      plane.attr('opacity', 1)
            .transition()
            .duration(intSpeed*route.node().getTotalLength())
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

    function ready(error, countriesData, airportsData, flightData) {
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
          .attr("fill", "lightgrey");

          // debugger
          let dCoord;
          gDet= svg.append("g")
          .attr("class", "rect-details")
          .attr("transform", "translate(0, 0)")
          .style("pointer-events", "all")

          gDet.append("rect")
          .attr("height", 100)
          .attr("width", 250)
          .attr("x", 25)
          .attr("y", 25)
          // .style("stroke-width", 5)
          // .style("stroke", "white")
          .style("pointer-events", "all")

          gDet.append("text")
          .attr("class", "countrydetails")
          .attr("x", 30)
          .attr("y", 55)
          .text(
            "• Country: " + d.properties.NAME
          )
          gDet.append("text")
          .attr("class", "countrydetails")
          .attr("x", 30)
          .attr("y", 75)
          .text(
            "• Continent: " + d.properties.CONTINENT
          )
          gDet
          .append("text")
          .attr("class", "countrydetails")
          .attr("x", 30)
          .attr("y", 95)
          .text(
            "• GDP (in millions): " + d.properties.GDP_MD_EST
          )
        })
        .on("mouseout", function(d){
          d3.selectAll(".activeCountry")
          .attr("class", "country")

          d3.selectAll(".rect-details").remove()
        });




      let airports = topojson.feature(airportsData, airportsData.objects.airports).features;

      airport= airports

      let airportsNameCoord = {};

      for (var i = 0; i < airports.length; i++) {
        let iata = airports[i].properties.iata_code;
        let coord = airports[i].geometry.coordinates
        airportsNameCoord[iata] = {coord: coord}
      }

      flightDatas = flightData;
      for (var i = 0; i < flightData.length; i++) {
        let orgAir = flightData[i]["ORIGIN"];
        let destAir = flightData[i]["DEST"];
        let depTime = flightData[i]["DEP_TIME"]
        if (airportsNameCoord[orgAir] && airportsNameCoord[destAir] && depTime) {
          flightData[i]["type"] = "Point";
          flightData[i]["coordinates"] = airportsNameCoord[orgAir]["coord"];
          flightData[i]["DESTCOORD"] = airportsNameCoord[destAir]["coord"];
          // flights.push(flightData[i])
          if (!timeToFlight[parseInt(flightData[i].DEP_TIME)]) {
            timeToFlight[parseInt(flightData[i].DEP_TIME)] = []
          }
          timeToFlight[parseInt(flightData[i].DEP_TIME)].push(i)
        }
      }



      time = setInterval(
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
        .attr("fill", "red")

        gDet= svg.append("g")
        .attr("class", "rect-details")
        .attr("transform", "translate(0, 0)")
        .style("pointer-events", "all")

        gDet.append("rect")
        .attr("height", 100)
        .attr("width", 250)
        .attr("x", 25)
        .attr("y", 25)
        // .style("stroke-width", 5)
        // .style("stroke", "white")
        .style("pointer-events", "all")

        gDet
        .append("text")
        .attr("class", "countrydetails")
        .attr("x", 30)
        .attr("y", 55)
        .text(
          "• Airport: " + d.properties.name
        )
        gDet
        .append("text")
        .attr("class", "countrydetails")
        .attr("x", 30)
        .attr("y", 75)
        .text(
          "• IATA: " + d.properties.iata_code
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

      d3.select(".buttons")
      .append("input")
      .attr("type","button")
      .attr("class","play")
      .attr("value","Play")
      .on("click", function(){
        clearInterval(time)
        time = setInterval(interval, intSpeed)
        play = true;
      });

      d3.select(".buttons")
      .append("input")
      .attr("type","button")
      .attr("class","pause")
      .attr("value","Pause")
      .on("click", function(){
          clearInterval(time)
          play = false;
      });


      let speed = d3.select(".time-speed")
      .append("text")
      .attr("class", "speed")
      .text(
        "Speed: 1 hour = " + (intSpeed/1000)*60 + " seconds"
      )

      d3.select(".buttons")
      .append("input")
      .attr("type","button")
      .attr("class","play")
      .attr("value","X2")
      .on("click", function(){
        if (intSpeed > .2) {
          intSpeed = intSpeed/2
          d3.select(".speed").text(
            "Speed: 1 hour = " + (intSpeed/1000)*60 + " seconds"
          )
          if (play) {
            clearInterval(time)
            time = setInterval(interval, intSpeed)
          }

        }
      });

      d3.select(".buttons")
      .append("input")
      .attr("type","button")
      .attr("class","play")
      .attr("value","/2")
      .on("click", function(){
        intSpeed = intSpeed*2

        d3.select(".speed").text(
          "Speed: 1 hour = " + (intSpeed/1000)*60 + " seconds"
        )
        if (play) {
          clearInterval(time)
          time = setInterval(interval, intSpeed)
        }
      });

    }
})();
