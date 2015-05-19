//MODEL
var $wikiElem = $('#wikipedia-links');

var initialLocations = [
  {
      name : 'Parc de Mon Repos',
      lat : 46.518889,
      lng : 6.642778,
      description: 'The Parc de Mon Repos is a public park of the city of Lausanne, Switzerland.',
      wikiLinks: {}

  },
  {
      name : 'Cantonal Museum of Fine Arts',
      lat : 46.5239,
      lng : 6.6341,
      description: 'The Cantonal Museum of Fine Arts is an art museum in Lausanne, Switzerland',
      wikiLinks: {}


  },
  {
      name : 'Le Flon',
      lat : 46.5140495,
      lng : 6.623333,
      description: 'Le Flon is a district of the city of Lausanne, in Switzerland. It is served by Lausanne Metro lines 1 and 2 from Lausanne-Flon station.',
      wikiLinks: {}
  },
  {
      name : 'The Olympic Museum',
      lat : 46.508611,
      lng : 6.633889,
      description: 'The Olympic Museum in Lausanne, Switzerland houses permanent and temporary exhibits relating to sport and the Olympic movement. With more than 10,000 pieces, the museum is the largest archive of Olympic Games in the world; and one of Lausannes prime tourist site draws; attracting more than 250,000 visitors each year.',
      wikiLinks: {}

  },
  {
      name : 'Rolex Learning Center',
      lat : 46.518333,
      lng: 6.568056,
      description: 'The Rolex Learning Center is the campus hub and library for the École polytechnique fédérale de Lausanne, in Lausanne, Switzerland. Designed by the architects SANAA, it opened on February 22nd, 2010.',
      wikiLinks: {}

  }
]


var ViewModel = function() {
  var self = this;
  //variable 
  var Location = function(data) {
    this.name = data.name;
    this.lat = data.lat;
    this.lng = data.lng;
    this.wikiLinks = ko.observableArray([]);
    // this.marker = ko.observable

  }

  //list of locations
  this.locationList = ko.observableArray([]);

  initialLocations.forEach(function(locItem){
    self.locationList.push( new Location(locItem));
  });

  this.currentLocation = ko.observable(this.locationList()[0]);

  //Selection of locations
  this.changeLoc = function(clickedLoc){
    self.currentLocation(clickedLoc);

    loadWiki();
  };

  //creates map
  var map;
  function initialize() {
    var mapOptions = {
      center: new google.maps.LatLng(46.5140491, 6.623334),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.SATELLITE
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    map.setTilt(45);

    //creates markers
    ko.utils.arrayForEach(self.locationList(), function(locItem){
      var myLatlng = new google.maps.LatLng(locItem.lat,locItem.lng);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        animation: google.maps.Animation.DROP,
        title: locItem.name
      });
      google.maps.event.addListener(marker, 'click', toggleBounce);

      function toggleBounce() {

        if (marker.getAnimation() != null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
      }
  });    
  }
  google.maps.event.addDomListener(window, 'load', initialize);
  // <-- end of map

//WIKI
function loadWiki() {
  $wikiElem.text("");

  var selfLoc = self.currentLocation().name;

  var wikiUrl = 'http://en.wikipedia.org/w/api.php?format=json&action=opensearch&search='+ selfLoc + '&callback=wikiCallback';

    var wikiRequestTimeout = setTimeout(function(){
      $wikiElem.text("Sorry, we couldn't find any wikipedia resources");
    }, 4000);

    $.ajax( {
    url: wikiUrl ,
    dataType: 'jsonp',
    success: function(response){
      console.log(response);
      var articleList = response[1];

      self.currentLocation().wikiLinks([]);

      $.each(articleList, function(i) {
      var articleTitle = articleList[i];
      var articleUrl = 'http://en.wikipedia.org/wiki/'+ articleTitle ;
      self.currentLocation().wikiLinks.push(articleUrl);

      });

      clearTimeout(wikiRequestTimeout);
    }     
} );

    return false;

  }
loadWiki();



};// <-- end of ViewModel



ko.applyBindings(new ViewModel());