# Maple

Maple is a flight traffic visualization application created using D3.js. It consists of a globe with major aiports plotted on top and flight animations on top.

# Overview

Maple is created using D3.js. D3 allows you to attach data to the DOM to create data based visualizations. I used d3 to create an orhographic rendering of the earth. I utilize D3 geoPath projections and geoOrthographic projections as well to create each individual country, airport and flight path.

## Download and parse data

The country and airport data comes from Natural Earth. They came in the form of shape files, which were translated into GeoJSON files and then stripped down to TopoJSON files. These were then parsed using the topojson.feature and turned into SVGs using data provided by D3.



# Codeworthy
