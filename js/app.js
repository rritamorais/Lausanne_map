//MODEL
var $wikiElem = $('#wiki');
var $fourElem = $('#four');

var initialLocations = [
  {
      name : "Collection de l'art brut",
      lat : 46.527314,
      lng : 6.624636,
      tags: ["museum", "art", "culture", "gallery"]
  },
  {
      name : "Les Docs",
      lat : 46.522407,
      lng : 6.619252,
      tags: ["concert", "art", "bar", "cafe", "gallery"]
  },

  {
      name : 'Parc de Mon Repos',
      lat : 46.518889,
      lng : 6.642778,
      tags: ["parks", "nature", "gardens"]
  },
  {
      name : 'Cantonal Museum of Fine Arts',
      lat : 46.5239,
      lng : 6.6341,
      tags: ["museum", "art", "culture", "gallery"]
  },
  {
      name : 'Théâtre Vidy Lausanne',
      lat : 46.51275,
      lng : 6.611039,
      tags: ["museum", "art", "culture", "gallery"]
  },
  {
      name : 'Le Flon',
      lat : 46.5140495,
      lng : 6.623333,
      tags: ["shopping", "bars", "clothes"]
  },
  {
      name : "Le Zinema",
      lat : 46.524054,
      lng : 6.627342,
      tags: ["cinema", "art", "culture"]
  },
  {
      name : "Musée de l'Élysée",
      lat : 46.5098,
      lng : 6.63276,
      tags: ["museum", "art", "culture", "gallery"]
  },
  {
      name : "Béjart Ballet Lausanne",
      lat : 46.53023,
      lng : 6.622508,
      tags: ["dance", "art", "culture", "ballet"]

  },
  {
      name : 'The Olympic Museum',
      lat : 46.508611,
      lng : 6.633889,
      tags: ["museum", "olympic", "culture"]
  },
  {
      name : 'La tour de Sauvabelin',
      lat : 46.535246,
      lng: 6.638557,
      tags: ["architecture", "lybrary", "culture"]
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
    this.tags = data.tags;
    this.description = ko.observableArray([]);;
    this.wikiLinks = ko.observableArray([]);
    this.fourImgs = ko.observableArray([]);
    this.marker = new google.maps.Marker();

  }

  //list of locations
  this.locationList = ko.observableArray([]);

  initialLocations.forEach(function(locItem){
    self.locationList.push( new Location(locItem));
  });

  //initialize the currentLocation to none so nothing is displayed
  this.currentLocation = ko.observable(this.locationList()[null]);

  //Selects locations on click (list)
  this.changeLoc = function(clickedLoc){
    self.currentLocation(clickedLoc);
    loadWiki();
    loadFoursquare();
    //gives time for ajax request to finish before scrolling down the heigh of the div
    setTimeout(scrollDown, 800);
  };

  //Scrolls nav down to info div
  function scrollDown() {
    var infoDiv = document.getElementById("nav");
    infoDiv.scrollTop = infoDiv.scrollHeight;
  }

  //FILTER
  ViewModel.filteredItems = ko.computed(function() {
      var filter = self.filter().toLowerCase();
      if (!filter) {
        
        setMarkers(self.locationList());
        return self.locationList();

      } else {
          //hides any info windows while searching
          self.currentLocation(null);
          //clears map
          clearMarkers();
          //creates temporary variable 
          var innerList = ko.utils.arrayFilter(self.locationList(), function(item) {
            return (stringStartsWith(item.name.toLowerCase(), filter) || filterTags(item.tags, filter))
          });
          //uses temporary variable to set markers on the map while filtering
          setMarkers(innerList);
          return innerList;
      }
  }, ViewModel);

  //filters tags
  function filterTags(tagList, tagFilter) {
    for (i=0; i < tagList.length; i++) {
      //no need to address the (!filter) as it is only used inside the main filter function
      if (stringStartsWith(tagList[i].toLowerCase(), tagFilter)) {
        return true;
      }
    }
    return false;
  };

  //creates map
  var map = initialize();
  var markerList = [];

  function initialize() {
    var mapOptions = {
      center: new google.maps.LatLng(46.5240491, 6.613334),
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true
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
          scrollDown();

          self.toggleBounce(markerCopy);
        };
      })(marker));
    });  
  };
  createMarkers();

  //sets the markers on map - receives filtered list as it is filtered
  function setMarkers(listLoc) {
    listLoc.forEach(function(item) { 
      item.marker.setMap(map);
    });
  };

  //clears markers from map
  function clearMarkers() {
    markerList.forEach(function(item) { 
      item.setMap(null);
    });
  };

  //toggles bounce animation for markers
  this.toggleBounce = function(clickMarker) {
    //stops any bouncing before applying new one
    markerList.forEach(function(item) { 
      item.setAnimation(null);        
    });

    if (clickMarker.getAnimation() != null) {
      clickMarker.setAnimation(null);
    } else {
      clickMarker.setAnimation(google.maps.Animation.BOUNCE);
    }
  };

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
      if (response[1].length === 0) $( "#wikih4" ).text("No results found");
      else $( "#wikih4" ).text("Want more information?");

      var articleList = response[1];
      var descriptionList = response[2];
      var description = descriptionList[0];

      self.currentLocation().wikiLinks([]);
      self.currentLocation().description([]);
      self.currentLocation().description.push(description);



      $.each(articleList, function(i) {
      var articleTitle = articleList[i];
      self.currentLocation().wikiLinks.push(articleTitle);

      });

      clearTimeout(wikiRequestTimeout);
    }     
} );
    return false;
  };
  

  //FOURSQUARE
  function loadFoursquare() {
    var Latlng = self.currentLocation().lat+','+self.currentLocation().lng;
    $fourElem.text("");

    var selfLoc = self.currentLocation().name;

    var fourUrl = 'https://api.foursquare.com/v2/venues/search?ll='+Latlng+'&client_id=IL5PRAKZOFDNHJSIYQP0RIMSWWWTEJQVBPVWW3FXK4A42WIX&client_secret=EG3NSCRU3BVVWZN0MLK0MUFCJOV02MUSOTSY0ETZ4DITJ5H2&v=20150106';

      var fourRequestTimeout = setTimeout(function(){
        $fourElem.text("Sorry, we couldn't find any fourthsquare resources");
      }, 4000);

      $.ajax( {
      url: fourUrl ,
      dataType: 'jsonp',
      success: function(response){
        console.log(response);
        var venueId = response.response.venues[0].id;
        var photoUrl = 'https://api.foursquare.com/v2/venues/'+ venueId + '?oauth_token=D4PTDXIIRZ32ZDZEVRMPOAEQZEX1QSLWDFJKQ0Q4FDG42LPF&v=20150601';

        clearTimeout(fourRequestTimeout);

        $.ajax( {
        url: photoUrl ,
        dataType: 'jsonp',
        success: function(response){
          var fourimgUrl = response.response.venue.bestPhoto.prefix + '420x200' + response.response.venue.bestPhoto.suffix;
          //clears array
          self.currentLocation().fourImgs([]);
          //pushes results into array
          self.currentLocation().fourImgs.push(fourimgUrl);
        
        clearTimeout(fourRequestTimeout);
        }     
        } );
      }     
      } );
      return false;

  }; 


};//end of ViewModel

var stringStartsWith = function (string, startsWith) {          
        string = string || "";
        if (startsWith.length > string.length)
            return false;
        return string.substring(0, startsWith.length) === startsWith;
    };



ko.applyBindings(new ViewModel());