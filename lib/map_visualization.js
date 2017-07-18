(function(){


  var margin = { top: 0, left: 0, right: 0, down: 0},
    height = 700 - margin.top - margin.down,
    width = 1500 - margin.left - margin.right;
    // debugger


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


                // .call(zoom)
                  // .on("mousedown.zoom", function(d){
                  //   // debugger
                  //   // d.rotate([50, 0, 0])
                  // })
                  // .on("touchstart.zoom", null)
                  // .on("touchmove.zoom", null)
                  // .on("touchend.zoom", null);



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
