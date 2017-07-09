
(function(){
  var margin = { top: 50, left: 50, right: 50, down: 50},
    height = 400 - margin.top - margin.down,
    width = 800 - margin.left - margin.right;

  var svg = d3.select("#map")
    .append("svg")
    .attr("height", height + margin.top + margin.down)
    .attr("width", width + margin.left + margin.right)
    .append("g")
    .attr("transform", "translate("+ margin.left + "," + margin.top +")");

    d3.queue()
      .defer(d3.json, "countries.topojson")
      .defer(d3.json, "airports.topojson")
      .defer(d3.csv, "flights.csv")
      .await(ready);

    var projection = d3.geoMercator()
      .translate([ width / 2, height / 2 ])
      .scale(100);

    var path = d3.geoPath()
      .projection(projection);


    function ready(error, countriesData, airportsData, flightData) {
      console.log(flightData)
      var countriesParsed = topojson.feature(countriesData, countriesData.objects.countries).features;

      svg.selectAll(".country")
        .data(countriesParsed)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .on("mouseover", function(d){
          d3.select(this)
          .attr("class", "activeCountry")
          .attr("fill", "black");

          d3.select(this.parentNode.parentNode.parentNode.parentNode)
          .append("text")
          .attr("class", "countrydetails")
          .text(
            "Country: " + d.properties.NAME
          )
          d3.select(this.parentNode.parentNode.parentNode.parentNode)
          .append("text")
          .attr("class", "countrydetails")
          .text(
            "Continent: " + d.properties.CONTINENT
          )
          d3.select(this.parentNode.parentNode.parentNode.parentNode)
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




      var airports = topojson.feature(airportsData, airportsData.objects.airports).features;


      var airportsNameCoord = {};

      for (var i = 0; i < airports.length; i++) {
        let iata = airports[i].properties.iata_code;
        let coord = airports[i].geometry.coordinates
        airportsNameCoord[iata] = {coord: coord}
      }

      let flights = [];
      for (var i = 0; i < flightData.length; i++) {
        orgAir = flightData[i]["ORIGIN"];
        destAir = flightData[i]["DEST"];
        depTime = flightData[i]["DEP_TIME"]
        if (airportsNameCoord[orgAir] && airportsNameCoord[destAir] && depTime) {
          flightData[i]["type"] = "Point";
          flightData[i]["coordinates"] = airportsNameCoord[orgAir]["coord"];
          flightData[i]["DESTCOORD"] = airportsNameCoord[destAir]["coord"];
          flights.push(flightData[i])
        }
      }

      function transition(rect, route) {
        rect.attr('opacity', 1)
        .transition()
        .duration(1000)
        .attrTween("transform", translateAttr(route.node()))
        .attr("d", path.pointRadius(0))
        .remove()
        ;
      }

      function translateAttr(path) {
        let l = path.getTotalLength();
        return function(i) {
          return function(t) {
            let p = path.getPointAtLength(t * l);
            return "translate(" + (p.x-220) + "," + (p.y-73) + ")";
          }
        }
      }

      let timer = 0;

      time = setInterval(function(){

        console.log(timer)
        for (var i = 0; i < flights.length-1; i++) {
          if (parseInt(flights[i].DEP_TIME) === timer) {
            let route = svg
            .data([{type: "LineString", coordinates: [flights[i].coordinates, flights[i].DESTCOORD]}])
            .append("path")
            .attr("class", "route")
            .attr("d", path)
            .attr('opacity', 0.5)
            .attr('fill', "none")
            .attr('stroke-width', 0.01)
            .attr('stroke', '	#00FF00')
            .transition()
            .duration(1000)
            .remove();

            let rect = svg
            .data([flights[i]])
            .append("path")
            .attr("class", "rect")
            .attr("fill", "red")
            .attr("d", path)
            .attr("stroke-width", 0.5)

            transition(svg
            .data([flights[i]])
            .append("path")
            .attr("class", "rect")
            .attr("fill", "red")
            .attr("d", path)
            .attr("stroke-width", 0.5), svg
            .data([{type: "LineString", coordinates: [flights[i].coordinates, flights[i].DESTCOORD]}])
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
        if (timer > 2400) {
          clearInterval(time);
        }
      }, 100)

      svg.selectAll(".airport")
      .data(airports)
      .enter()
      .append("path")
      .attr("class", "airport")
      .attr("d", path.pointRadius(1.5))
      .attr("scale", 100)
      .on("mouseover", function(d){
        // debugger
        d3.select(this)
        .attr("class", "activeAirport")
        .attr("stroke", "blue")
        .attr("stroke-width", 0.5)
        .attr("fill", "red")
        .attr("d", path.pointRadius(5));

        d3.select(this.parentNode.parentNode.parentNode.parentNode)
        .append("text")
        .attr("class", "countrydetails")
        .text(
          "Airport: " + d.properties.name
        )
        d3.select(this.parentNode.parentNode.parentNode.parentNode)
        .append("text")
        .attr("class", "countrydetails")
        .text(
          "IATA: " + d.properties.iata_code
        )
        // debugger
      })
      .on("mouseout", function(d){
        d3.selectAll("text.countrydetails").remove()

        d3.selectAll(".activeAirport")
        .attr("class", "airport")
        .attr("d", path.pointRadius(1.5));

      });


    }
})();
