//"use strict";

// single state object declaration
var musicState = {
    username: '',
    registered: '',
    recordCount: 0,
    salesCount: 0,
    wantListCount: 0,
    artistHTML: '',
    albumHTML: '',
    eventsHTML: '',
    suggestionsHTML: '',
    artists: [],
    discogsCollection: {},
};

var userState = {
    ipAddress: '',
    locationHTML: '',
    userCity: '',
};

$(function() {

    // handle log in event
    $('#sign-in').submit(function(event) {

        event.preventDefault();
        var user = $('#username').val();
        var user_API_Endpoint = 'https://api.discogs.com/users/' + user;

        // check if username is a valid Discogs username
        checkDiscogsUserExists(user_API_Endpoint);

        // load user location based upon IP address
        fetchUserLocation();
        // set sign up elements to hidden
        //$('.sign-in-page').css('visibility', 'hidden');
        $('.sign-in-page').css('display', 'none');
        // load Discogs collection of the user, no of columns, page 1, limit 50, ascending sort by artist
        fetchArtistInfo('https://api.discogs.com/artists/84752');
        fetchDiscogsCollection(user, 1, 1, 'asc');
        //renderArtistView(1);
    });
});

function handleErrors(response) {

    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

function checkDiscogsUserExists(user_API_Endpoint) {

    fetch(user_API_Endpoint)

    .then(handleErrors)

    .then($.get(user_API_Endpoint, function(data) {

        musicState.recordCount = data.num_collection;
        musicState.salesCount = data.num_for_sale;
        musicState.wantListCount = data.num_wantlist;
        musicState.registered = data.registered;
        musicState.username = data.username;

    })).catch(function(error) {

        console.log(error);

    });
}

// event listeners
function fetchUserLocation() {

    // function to get location of user to use for the event lookup 
    $.get('http:freegeoip.net/json/', function(response) {

        //        var Location_API_Endpoint = 'http://ip-api.com/json/' + response.ip + '?';
        userState.ipAddress = response.ip;
        userState.userCity = response.city;

        //       $.get(Location_API_Endpoint, function(response) {

        // userState.location = response;
        // userState.locationHTML += '<table><tr><td>IP Address</td>' + '<td>' + response.query + '</td></tr>';
        // userState.locationHTML += '<tr><td>City</td>' + '<td>' + response.city + '</td></tr>';
        // userState.locationHTML += '<tr><td>Region</td>' + '<td>' + response.region + '</td></tr>';
        // userState.locationHTML += '<tr><td>State</td>' + '<td>' + response.regionName + '</td></tr>';
        // userState.locationHTML += '<tr><td>Country</td>' + '<td>' + response.country + '</td></tr></table>';
        //  $('.js-user-location').html(userState.locationHTML).fadeIn();
        //       });

    });
}

function fetchDiscogsCollection(user, page, limit, order) {

    var discogsCollectionEndpoint = 'https://api.discogs.com/users/' + user + '/collection/folders/0/releases?' + 'page=' + page + '&per_page=' + limit + '&sort=artist' + '&sort_order=' + order;

    // call Discogs collection/releases API
    $.getJSON(discogsCollectionEndpoint, function(data) {

        musicState.discogsCollection = data;
        musicState.recordCount = data.pagination.items;
        renderArtistView(data.releases, 1);
        renderAlbumView(data.releases, 1);
    });
}

// function renderArtistView(noOfColumns) {

//     var artistName;
//     var artistCounter = 0;
// debugger;
//     // loop over API response and populate HTML elements with artist name  

//     for (var i = Things.length - 1; i >= 0; i--) {
//         Things[i]
//     }
//     $.each(releases, function(index, data) {

//         $.each(data.basic_information.artists, function(index, value) {

//             if (artistName != value.name) {

//                 if (artistCounter % noOfColumns === 0) {
//                     musicState.artistHTML += '<div class="row">';
//                 };

//                 artistCounter++;
//                 artistName = value.name;

//                 musicState.artistHTML += '<div class="col s12">';
//                 musicState.artistHTML += '<div class="card large">';
//                 musicState.artistHTML += '<div class="card-image">';
//                 musicState.artistHTML += '<img class="resize" src="./img/missing_image_default.png">';
//                 musicState.artistHTML += '</div>';
//                 musicState.artistHTML += '<div class="card-content">';
//                 musicState.artistHTML += '<span class="card-title activator grey-text text-darken-4">' + value.name + '<i class="material-icons right">more_vert</i></span>';

//                 musicState.artistHTML += '<h5 class="thin">Members:</h5>';

//                 musicState.artistHTML += '<p>' + 'Agnus Young' + '</p>';
//                 musicState.artistHTML += '<div class="grey-text text-lighten-1"><p>' + 'active' + '</p></div>';
//                 musicState.artistHTML += '<p>' + 'Bon Scott' + '</p>';
//                 musicState.artistHTML += '<div class="grey-text text-lighten-1"><p>' + 'inactive' + '</p></div>';
//                 musicState.artistHTML += '</div>';
//                 musicState.artistHTML += '<div class="card-reveal">';
//                 musicState.artistHTML += '<span class="card-title grey-text text-darken-4">Artist Profile<i class="material-icons right">close</i></span>'
//                 debugger;
//                 musicState.artistHTML += '<p>' + musicState.artists[0] + '</p>'
//                 musicState.artistHTML += '</div>';
//                 musicState.artistHTML += '</div>';
//                 musicState.artistHTML += '</div>';

//                 if (artistCounter % noOfColumns === 0) {
//                     artistCounter = 0;
//                     musicState.artistHTML += '</div>';
//                 };
//             }
//         });
//     });

//     // render artist page
//     $('.js-artist-view').html(musicState.artistHTML).fadeIn();
// };

function fetchArtistInfo(artistEndpoint) {

    $.get(artistEndpoint, function(response) {

        musicState.artists.push(response.profile);
    });
}

function renderArtistView(releases, noOfColumns) {

    var artistName;
    var artistCounter = 0;

    // loop over API response and populate HTML elements with artist name  
    $.each(releases, function(index, data) {

        $.each(data.basic_information.artists, function(index, value) {

            if (artistName != value.name) {

                if (artistCounter % noOfColumns === 0) {
                    musicState.artistHTML += '<div class="row">';
                };

                artistCounter++;
                artistName = value.name;

                musicState.artistHTML += '<div class="col s12">';
                musicState.artistHTML += '<div class="card large">';
                musicState.artistHTML += '<div class="card-image">';
                musicState.artistHTML += '<img class="resize" src="./img/missing_image_default.png">';
                musicState.artistHTML += '</div>';
                musicState.artistHTML += '<div class="card-content">';
                musicState.artistHTML += '<span class="card-title activator grey-text text-darken-4">' + value.name + '<i class="material-icons right">more_vert</i></span>';

                musicState.artistHTML += '<h5 class="thin">Members:</h5>';

                musicState.artistHTML += '<p>' + 'Agnus Young' + '</p>';
                musicState.artistHTML += '<div class="grey-text text-lighten-1"><p>' + 'active' + '</p></div>';
                musicState.artistHTML += '<p>' + 'Bon Scott' + '</p>';
                musicState.artistHTML += '<div class="grey-text text-lighten-1"><p>' + 'inactive' + '</p></div>';
                musicState.artistHTML += '</div>';
                musicState.artistHTML += '<div class="card-reveal">';
                musicState.artistHTML += '<span class="card-title grey-text text-darken-4">Artist Profile<i class="material-icons right">close</i></span>'
                debugger;
                musicState.artistHTML += '<p>' + musicState.artists[0] + '</p>'
                musicState.artistHTML += '</div>';
                musicState.artistHTML += '</div>';
                musicState.artistHTML += '</div>';

                if (artistCounter % noOfColumns === 0) {
                    artistCounter = 0;
                    musicState.artistHTML += '</div>';
                };
            }
        });
    });

    // render artist page
    $('.js-artist-view').html(musicState.artistHTML).fadeIn();
};

function renderAlbumView(response, noOfColumns) {

    $.each(response, function(index, value) {

        // $.each(value.basic_information.artists, function(index, value) {

        musicState.albumHTML += '<div class="row">';
        musicState.albumHTML += '<div class="col s12">';
        musicState.albumHTML += '<div class="card large">';
        musicState.albumHTML += '<div class="card-image">';
        musicState.albumHTML += '<img class="resize" src="./img/missing_image_default.png">';
        musicState.albumHTML += '</div>';
        musicState.albumHTML += '<div class="card-content">';
        musicState.albumHTML += '<span class="card-title activator grey-text text-darken-4">' + value.basic_information.title + '<i class="material-icons right">more_vert</i></span>';
        musicState.albumHTML += '<p>' + 'Year' + '</p>';
        musicState.albumHTML += '<div class="grey-text text-lighten-1"><p>' + value.basic_information.year + '</p></div>';
        musicState.albumHTML += '<p>' + 'Format' + '</p>';
        musicState.albumHTML += '<div class="grey-text text-lighten-1"><p>' + value.basic_information.formats[0].name + '</p></div>';
        musicState.albumHTML += '<div class="card-reveal">';
        musicState.albumHTML += '<span class="card-title grey-text text-darken-4">Card Title<i class="material-icons right">close</i></span>'
        musicState.albumHTML += '<p>Here is some more information about this product that is only revealed once clicked on.</p>'
        musicState.albumHTML += '</div>';
        musicState.albumHTML += '</div>';
        musicState.albumHTML += '</div>';
    });

    // render album page
    $('.js-album-view').html(musicState.albumHTML).fadeIn();
}

// function mergeArtistProfile(artist_api_endpoint, collectionHTML) {
//     debugger;
//     // call Discogs artist API

//     //last fm http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=Cher&api_key=YOUR_API_KEY&format=json    
//     //   $.get(artist_api_endpoint, function(data) {
//     debugger;
//     collectionHTML += '<p>' + 'Agnus Young' + '</p>';
//     collectionHTML += '<p>' + 'Bon Scott' + '</p>';
//     return collectionHTML;
//     //    var artistProfileHTML = data.profile;

//     // collectionHTML += '<table><tr><td>Members</td>' + '<td>' + response.query + '</td></tr>';
//     // $.each(value.basic_information.artists, function(index, value) {
//     //     collectionHTML += '<table><tr><td>Members</td>' + '<td>' + response.query + '</td></tr>';
//     //      });
//     // }
//     //   });


// $(document).ready(function() {

// //    handleLogIn();

//     //     getUserLocation();
//        debugger;

// });
