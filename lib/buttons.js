(function(){

  const interval = function(){
    //
    d3.select(".map").selectAll(".clock").remove();
    let minutes = timer%100;
    let hours = (timer-minutes)/100;

    if (hours < 10 && minutes < 10) {
      d3.select(".map").append("text")
      .attr("class", "clock")
      .text("Time: 0" +hours + ":0" + minutes );

    }else if (hours < 10) {
      d3.select(".map").append("text")
      .attr("class", "clock")
      .text("Time: 0" +hours + ":" + minutes )
    } else if (minutes < 10) {
      d3.select(".map").append("text")
      .attr("class", "clock")
      .text("Time: " +hours + ":0" + minutes )
    } else {
      d3.select(".map").append("text")
      .attr("class", "clock")
      .text("Time: " +hours + ":" + minutes )
    }
    d3.select(".map").selectAll(".clock")
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

  let flights = [];
  


  d3.select(".buttons")
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
    clearInterval(time)
    time = setInterval(interval, intSpeed)
  });


})();
