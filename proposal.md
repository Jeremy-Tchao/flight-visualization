# Flight Visualization
## MVP
Map flight patterns between major airports for January 1st 2017.

- [ ] Animate flights
- [ ] Pause and reset animation.
- [ ] Change speed of animation
- [ ] Production README

##Layout

The app will consist of a map overlayed with animated flights. Controls will be located at the bottom of the board.

## Technologies and Architecture

* JavaScript
* Google Maps API
* d3.js

Data on airport location(latitude and longitude) can be found on NaturalEarthData.com
Found flight data transtats.bts.gov, includes, date, departure time, arrival time, airport ID, Airport 3 letter abbrev.


## Implementation Timeline
**Day 1: Map a flight**

Start by getting one flight to map. This will require familiarity with Google Maps API in order to visualize a trip.

**Day 2: Map many flights**

Visualize many flights at once.

**Day 3: Add user controls**

Allow users to pause, reset and change speed of animation.

**Bonus Features**

- [ ] Increase the number of days/flights animated.
- [ ] Add airport filters.
