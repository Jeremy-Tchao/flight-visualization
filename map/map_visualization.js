(function(){
  var margin = { top: 50, left: 50, right: 50, down: 50},
    height = 400 - margin.top - margin.down,
    width = 800 - margin.left - margin.right;
    // debugger
  var svg = d3.select("#map")
    .append("svg")
    .attr("height", height + margin.top + margin.down)
    .attr("width", width + margin.left + margin.right)
    .append("g")
    .attr("transform", "translate("+ margin.left + "," + margin.top +")");
    debugger
    d3.queue()
      .defer(d3.json, "map/countries.topojson")
      .await(ready)
      var projection = d3.geoMercator()
        .translate([ width / 2, height / 2 ])
        .scale(100)


      var path = d3.geoPath()
        .projection(projection)

    function ready(error, data) {
      // console.log(data)
      var countries = topojson.feature(data, data.objects.countries).features
      // debugger
      // console.log(countries)
      svg.selectAll(".country")
        .data(countries)
        .enter().append("path")
        .attr("class", "country")
        .attr("d", path)
    }
})();
