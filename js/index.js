"use strict";

var userLocation = {};

$(function() {

    // handle log in event
    $('#sign-in').submit(function(event) {

        event.preventDefault();
        var user = $('#username').val();
        var discogsUsersEndpoint = 'https://api.discogs.com/users/' + user;

        // check username entered is a valid Discogs username
        checkDiscogsIsValid(user, discogsUsersEndpoint);

    });
});

// initialize error message, invoked upon click in input field[text]
function initializeError() {

    $('label').attr('data-error', ' ');
}

function loadUserLocation(discogsPayLoad) {

    // function to get location of user to use for jambase event lookup 
    $.get('https://freegeoip.net/json/', function() {

    }).done(function(data) {

        //var userLocation = {};
        userLocation.city = data.city;
        userLocation.region_code = data.region_code;
        userLocation.zip_code = data.zip_code;
        userLocation.country = data.country_name;
        renderInfoBox(userLocation, discogsPayLoad);
        return userLocation;

    }).fail(function(data) {

    }).always(function() {

    });
}

function checkDiscogsIsValid(user, discogsUsersEndpoint) {

    $.getJSON(discogsUsersEndpoint, function() {

        /// set display of sign-in view to none
        $('.js-sign-in-view').css('display', 'none');
        // display pre-loader
        $('.js-loading').css('display', 'inline');

    }).done(function(data) {

        var discogsPayLoad = new Object();
        discogsPayLoad.recordCount = data.num_collection;
        discogsPayLoad.forSaleCount = data.num_for_sale;
        discogsPayLoad.wantListCount = data.num_wantlist;
        discogsPayLoad.registered = data.registered;
        discogsPayLoad.username = data.username;
        discogsPayLoad.artists = [];

        if (discogsPayLoad.recordCount > 0) {
            // load Discogs collection of the user, page 1, limit 50, ascending sort by artist
            loadDiscogsReleases(discogsPayLoad, user, 1, 200, 'asc');

        } else {

            renderEmptyCollectionView();
        }

        return discogsPayLoad;

    }).fail(function(data) {

        if (data.responseJSON === undefined) {

            $('Label').attr('data-error', data.responseJSON.message);

        } else {

            $('Label').attr('data-error', data.responseJSON.message);

        }

        return false;

    }).always(function() {

    });
}

function loadDiscogsReleases(discogsPayLoad, user, page, limit, order) {

    var discogsCollectionEndpoint = 'https://api.discogs.com/users/' + user + '/collection/folders/0/releases?' + 'page=' + page + '&per_page=' + limit + '&sort=artist' + '&sort_order=' + order;

    // call Discogs collection/releases API
    $.getJSON(discogsCollectionEndpoint, function(data) {

    }).done(function(data) {

        var artistId = '';

        for (var i = data.releases.length - 1; i >= 0; i--) {

            for (var j = data.releases[i].basic_information.artists.length - 1; j >= 0; j--) {

                if (artistId != data.releases[i].basic_information.artists[j].id) {
                    artistId = data.releases[i].basic_information.artists[j].id;

                    if (artistObj != undefined) {

                        discogsPayLoad.artists.push(artistObj);
                        albumObj = {};
                    }

                    var artistObj = {};
                    artistObj.albums = [];
                    artistObj.tags = [];

                    artistId = data.releases[i].basic_information.artists[j].id;
                    artistObj.artistid = data.releases[i].basic_information.artists[j].id;
                    artistObj.name = data.releases[i].basic_information.artists[j].name.replace(/\(\d\)/, ""); // remove parenthesis + number
                    artistObj.name = artistObj.name.replace(/\s+$/, ''); // remove trailing space
                    artistObj.url = data.releases[i].basic_information.artists[j].resource_url;
                }
            }

            var albumObj = {};
            albumObj.artistId = artistId;
            albumObj.title = data.releases[i].basic_information.title;
            albumObj.year = data.releases[i].basic_information.year;
            albumObj.format = data.releases[i].basic_information.formats[0].name;
            artistObj.albums.push(albumObj);

        }

        discogsPayLoad.artists.push(artistObj);

        loadLastFMArtist(discogsPayLoad);


    }).fail(function(data, success) {

        renderLoadingErrorView('Discogs', data);

    }).always(function() {

    });
}

function loadLastFMArtist(discogsPayLoad) {

    $.each(discogsPayLoad.artists, function(i, data) {

        var lastFMScrobber = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + discogsPayLoad.artists[i].name + '&api_key=a9ec7949488cffd19b50fc457a7731d1&format=json';

        $.getJSON(lastFMScrobber, function(data) {

        }).done(function(data) {

            if (data.error === 6) {

                discogsPayLoad.artists[i].image = '';
                discogsPayLoad.artists[i].profile = data.message;

            } else {

                var keys = Object.keys(data.artist.image);

                discogsPayLoad.artists[i].profile = data.artist.bio.content;
                discogsPayLoad.artists[i].onTour = data.artist.ontour;

                for (var j = data.artist.image.length - 1; j >= 0; j--) {

                    if (data.artist.image[j].size === 'large') {

                        var str = JSON.stringify(data.artist.image[j]);
                        str = str.replace('#text', 'text');
                        data.artist.image[j] = JSON.parse(str);
                        discogsPayLoad.artists[i].image = data.artist.image[j].text;
                    }
                }

                var artistObj = {};
                artistObj.tags = [];

                for (var j = data.artist.tags.tag.length - 1; j >= 0; j--) {

                    var tagObj = {};
                    if ((data.artist.tags.tag[j].name != 'seen live') && (data.artist.tags.tag[j].name != 'stroboscopic trip') && (data.artist.tags.tag[j].name != 'Minnesota') && (data.artist.tags.tag[j].name != 'Canadian')) {
                        tagObj.name = data.artist.tags.tag[j].name;
                        tagObj.url = data.artist.tags.tag[j].url;
                        artistObj.tags.push(tagObj);
                    }
                }

                discogsPayLoad.artists[i].tags = artistObj.tags;

            }

            //         if (discogsPayLoad.artists[i].onTour === '1') {
            loadBandsInTown(i, discogsPayLoad, userLocation);
            //        }

        }).fail(function(data, success) {

            renderLoadingErrorView('LastFM', data);

        }).always(function() {

        });
    });
}

function loadBandsInTown(i, discogsPayLoad, userLocation) {

    var BandsInTownApi = 'https://api.bandsintown.com/artists/' + discogsPayLoad.artists[i].name + '/events/search.json?callback=?&api_version=2.0&app_id=my music chest&location=' + userLocation.city + ',' + userLocation.region_code + '&radius=50';
    $.getJSON(BandsInTownApi, function(data) {

    }).done(function(data) {

        if (data.length != 0) {
            var eventObj = data[0];
            discogsPayLoad.artists[i].event = eventObj;
        }

        // set display of pre-loader to none
        $('.js-loading').css('display', 'none');
        renderArtistCards(discogsPayLoad);
        renderInfoBox(userLocation, discogsPayLoad);

    }).fail(function(data) {

        if (data.status != '404') {

            renderLoadingErrorView('BandsInTown', data);
        }

    }).always(function() {

    });
}

function renderInfoBox(userLocation, discogsPayLoad) {

    var infoBoxHTML = '';

    infoBoxHTML += '<div class="js-info-heading"><span><p class="black-text text-darken-2">Location Information:</p></span></div>';
    infoBoxHTML += '<p>City: ' + userLocation.city + ' ' + userLocation.region_code + ' ' + userLocation.zip_code + '</p>';
    infoBoxHTML += '<p>Country: ' + userLocation.country + '</p>';

    if (discogsPayLoad != undefined) {

        infoBoxHTML += '<div class="js-info-heading"><span><p class="black-text text-darken-2">Discogs Information:</p></span></div>';
        infoBoxHTML += '<p>Discogs user name: ' + discogsPayLoad.username + '</p>';
        infoBoxHTML += '<p>Registered On: ' + discogsPayLoad.registered + '</p>';
        infoBoxHTML += '<p>Collection count: ' + discogsPayLoad.recordCount + '</p>';
        infoBoxHTML += '<p>Want List count: ' + discogsPayLoad.wantListCount + '</p>';
        infoBoxHTML += '<p>For Sale count: ' + discogsPayLoad.forSaleCount + '</p>';
    }

    // render info box
    $('.js-info-box').html(infoBoxHTML).fadeIn();
}

function renderEmptyCollectionView() {

    var messageHTML = '<div class="js-floater"></div>';

    messageHTML += '<div class="js-message"><span><h4 class="thin white-text text-darken-2">Empty Collection</h4></span>';
    messageHTML += '<p>No records are maintained in your Discogs collection</p>';
    messageHTML += '<p>and therefore nothing to show.</p></div>';

    // set display of main page and pre-loader to none
    $('.js-main-page').css('display', 'none');
    $('.js-loading').css('display', 'none');
    // render empty collection message box
    $('.js-message-box').html(messageHTML).fadeIn();
    $('.js-message-box').css('visibility', 'visible');

}

function renderLoadingErrorView(api, data) {

    var messageHTML = '<div class="js-floater"></div>';

    messageHTML += '<div class="js-message"><span><h4 class="thin white-text text-darken-2">Load Error</h4></span>';
    messageHTML += '<p>Unable to load all information since ' + api + ' API returned following error:</p>';


    messageHTML += '<p>HTTP code ' + data.status + ' - ' + data.statusText + '</p></div>';


    // set display of main page and pre-loader to none
    $('.js-main-page').css('display', 'none');
    $('.js-loading').css('display', 'none');
    // render empty collection message box  
    $('.js-message-box').html(messageHTML).fadeIn();
    $('.js-message-box').css('visibility', 'visible');

}

function renderArtistCards(discogsPayLoad) {

    var artistHTML = '';
    var counter = 0;
    var noOfColumns = 4;

    artistHTML += '<div class="row">';

    // loop over Discogs data load and render page
    for (var i = discogsPayLoad.artists.length - 1; i >= 0; i--) {

        counter++;
        artistHTML += '<div class="col s12 m4 l3 z-depth-3">';
        artistHTML += '<div class="card large hoverable">';
        artistHTML += '<div class="card-image waves-effect waves-block waves-light">';
        artistHTML += '<div class="white-text text-white thin"><span class="card-title"><h5>' + discogsPayLoad.artists[i].name + '<h5></span></div>';

        if (discogsPayLoad.artists[i].image === '') {

            artistHTML += '<img class="activator responsive-img" src="./img/missing_image_default.png">';

        } else {

            artistHTML += '<img class="activator responsive-img" src=' + discogsPayLoad.artists[i].image + '>';
        }

        artistHTML += '</div>'; //  closing tag card image
        artistHTML += '<div class="card-content">';

        if (discogsPayLoad.artists[i].tags === undefined) {

            artistHTML += '<p></p>';

        } else {

            for (var j = discogsPayLoad.artists[i].tags.length - 1; j >= 0; j--) {

                artistHTML += '<div class="chip"><a href="' + discogsPayLoad.artists[i].tags[j].url + '" target="newtab">' + discogsPayLoad.artists[i].tags[j].name + '</a></div>';
            }
        }

        artistHTML += '</div>'; //  closing tag card content
        artistHTML += '<div class="card-reveal">';
        artistHTML += '<span class="card-title grey-text text-darken-4">' + 'Artist Profile' + '<i class="material-icons right">close</i></span>';
        artistHTML += '<p>' + discogsPayLoad.artists[i].profile + '</p>';
        artistHTML += '</div>'; //  closing tag card reveal
        artistHTML += '<div class="card-stacked">';
        artistHTML += '<div class="card-action">';

        if (typeof discogsPayLoad.artists[i].event !== 'undefined') {

            artistHTML += '<a href="' + discogsPayLoad.artists[i].event.ticket_url + '" target="newtab">' + 'On Tour' + '</a>';
            artistHTML += discogsPayLoad.artists[i].event.title + ' on ' + discogsPayLoad.artists[i].event.datetime;
        }

        artistHTML += '</div>'; //  closing tag card action
        artistHTML += '</div>'; //  closing tag card stacked
        artistHTML += '</div>'; //  closing tag card type
        artistHTML += '</div>'; //  closing tag column
    }

    artistHTML += '</div>';

    // render artist cards
    $('.js-main-view').html(artistHTML).fadeIn();
}

function renderAlbumView(response, noOfColumns) {

    var counter = 0;
    $.each(response, function(index, value) {

        if (counter === 0) {

            musicState.albumHTML += '<div class="row">';
        }

        counter++;
        musicState.albumHTML += '<div class="col s4">';
        musicState.albumHTML += '<div class="card horizontal">';
        musicState.albumHTML += '<div class="card-image <img class="resize" src="./img/missing_image_default.png"></div>';
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
        musicState.albumHTML += '</div>'; //  closing tag card type

        if (counter === noOfColumns) {

            counter = 0;
            musicState.albumHTML += '</div>'; // closing tag row
        }
    });

    // render album page
    $('.js-album-view').html(musicState.albumHTML).fadeIn();
}

$(document).ready(function() {

    $('.js-loading').css('display', 'none');
    loadUserLocation();

});
