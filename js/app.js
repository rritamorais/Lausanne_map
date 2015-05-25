//MODEL
var $wikiElem = $('#wikipedia-links');

var initialLocations = [
  {
      name : 'Parc de Mon Repos',
      lat : 46.518889,
      lng : 6.642778,
      description: 'The Parc de Mon Repos is a public park of the city of Lausanne, Switzerland.',

  },
  {
      name : 'Cantonal Museum of Fine Arts',
      lat : 46.5239,
      lng : 6.6341,
      description: 'The Cantonal Museum of Fine Arts is an art museum in Lausanne, Switzerland',


  },
  {
      name : 'Le Flon',
      lat : 46.5140495,
      lng : 6.623333,
      description: 'Le Flon is a district of the city of Lausanne, in Switzerland. It is served by Lausanne Metro lines 1 and 2 from Lausanne-Flon station.',
  },
  {
      name : 'The Olympic Museum',
      lat : 46.508611,
      lng : 6.633889,
      description: 'The Olympic Museum in Lausanne, Switzerland houses permanent and temporary exhibits relating to sport and the Olympic movement. With more than 10,000 pieces, the museum is the largest archive of Olympic Games in the world; and one of Lausannes prime tourist site draws; attracting more than 250,000 visitors each year.',

  },
  {
      name : 'Rolex Learning Center',
      lat : 46.518333,
      lng: 6.568056,
      description: 'The Rolex Learning Center is the campus hub and library for the École polytechnique fédérale de Lausanne, in Lausanne, Switzerland. Designed by the architects SANAA, it opened on February 22nd, 2010.',

  }
]


var ViewModel = function() {
  var self = this;
  this.filter = ko.observable('');

  //variable 
  var Location = function(data) {
    this.name = data.name;
    this.lat = data.lat;
    this.lng = data.lng;
    this.wikiLinks = ko.observableArray([]);
    this.marker = new google.maps.Marker();

  }

  //list of locations
  this.locationList = ko.observableArray([]);

  initialLocations.forEach(function(locItem){
    self.locationList.push( new Location(locItem));
  });

  //initialize the currentLocation to none so nothing is displayed
  this.currentLocation = ko.observable(this.locationList()[null]);

  //Selection of locations
  this.changeLoc = function(clickedLoc){
    self.currentLocation(clickedLoc);
    loadWiki();
  };

  //FILTER
  ViewModel.filteredItems = ko.computed(function() {
      var filter = self.filter().toLowerCase();
      if (!filter) {
        
        setMarkers(self.locationList());
        return self.locationList();

      } else {
          //Hides any info windows while searching
          self.currentLocation(null);

          clearMarkers();

          var innerList = ko.utils.arrayFilter(self.locationList(), function(item) {
            return stringStartsWith(item.name.toLowerCase(), filter);
          });
          setMarkers(innerList);
          return innerList;
      }
  }, ViewModel);


  //creates map
  var map = initialize();
  var markerList = [];

function initialize() {
    var mapOptions = {
      center: new google.maps.LatLng(46.5140491, 6.623334),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.SATELLITE
    };
    return new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  };

  //creates markers
  function createMarkers() {
  ko.utils.arrayForEach(ViewModel.filteredItems(), function(locItem){
    var myLatlng = new google.maps.LatLng(locItem.lat,locItem.lng);
    var image = 'img/marker.png';
    marker = new google.maps.Marker({
      position: myLatlng,
      icon: image,
      map: map,
      animation: google.maps.Animation.DROP,
      title: locItem.name
    });

    markerList.push(marker);
    //push the right marker to the location list
    self.locationList()[markerList.length -1].marker = marker;

    google.maps.event.addListener(marker, 'click', (function(markerCopy) {
      return function() {
        self.currentLocation(self.locationList()[markerList.indexOf(markerCopy)]);
        loadWiki();
        self.toggleBounce(markerCopy);
      };
    })(marker));
  });  
};
createMarkers();


  function clearMarkers() {
    markerList.forEach(function(item) { 
      item.setMap(null);
    });
  };

  function setMarkers(listLoc) {
    listLoc.forEach(function(item) { 
      item.marker.setMap(map);
    });
  };




    this.toggleBounce = function(clickMarker) {
      markerList.forEach(function(item) { 
        item.setAnimation(null);        
      });


      if (clickMarker.getAnimation() != null) {
        clickMarker.setAnimation(null);
      } else {
        clickMarker.setAnimation(google.maps.Animation.BOUNCE);
      }
    };



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

  };


};// <-- end of ViewModel

var stringStartsWith = function (string, startsWith) {          
        string = string || "";
        if (startsWith.length > string.length)
            return false;
        return string.substring(0, startsWith.length) === startsWith;
    };



ko.applyBindings(new ViewModel());