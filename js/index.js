"use strict";

$(function() {

    // handle log in event
    $('#sign-in').submit(function(event) {

        event.preventDefault();
        var user = $('#username').val();
        var discogsUsersEndpoint = 'https://api.discogs.com/users/' + user;

        // check username entered is a valid Discogs username
        var discogsPayLoad = checkDiscogsIsValid(user, discogsUsersEndpoint);

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

        var userLocation = {};
        userLocation.city = data.city;
        userLocation.country = data.country_name;
        renderInfoBox(userLocation, discogsPayLoad);

    }).fail(function(data) {

    }).always(function() {

    });
}

function checkDiscogsIsValid(user, discogsUsersEndpoint) {

    $.getJSON(discogsUsersEndpoint, function() {
        // set visibility of log-in box elements to none
        $('.sign-in-page').css('display', 'none');
        
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
            loadDiscogsReleases(discogsPayLoad, user, 1, 20, 'asc');

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
                    artistObj.members = [];

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

        enrichDiscogsArtists(discogsPayLoad);

    }).fail(function(data, success) {

        renderLoadingErrorView('Discogs', data);

    }).always(function() {

    });
}

function enrichDiscogsArtists(discogsPayLoad) {

    $.each(discogsPayLoad.artists, function(i, data) {

        $.getJSON(discogsPayLoad.artists[i].url, function(data) {

        }).done(function(data) {

            var artistObj = {};
            artistObj.members = [];

            discogsPayLoad.artists[i].profile = data.profile;

            var activeMembersCount = 0;
            for (var j = data.members.length - 1; j >= 0; j--) {

                if (data.members[j].active === true) {

                    var membersObj = {};
                    membersObj.name = data.members[j].name;
                    membersObj.active = data.members[j].active;
                    artistObj.members.push(membersObj);

                    activeMembersCount++;
                }

                if (activeMembersCount >= 6) {
                    break; // only want to show 6 active members
                }

            }

            discogsPayLoad.artists[i].members = artistObj.members;

            loadLastFMImages(discogsPayLoad);

        }).fail(function(data, success) {

            renderLoadingErrorView('Discogs', data);

        }).always(function() {

        });

    });
}

function loadLastFMImages(discogsPayLoad) {

    $.each(discogsPayLoad.artists, function(i, data) {

        var lastFMScrobber = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + discogsPayLoad.artists[i].name + '&api_key=a9ec7949488cffd19b50fc457a7731d1&format=json';
        debugger;
        $.getJSON(lastFMScrobber, function(data) {

        }).done(function(data) {

            var keys = Object.keys(data.artist.image);
            var result = {};

            for (var j = data.artist.image.length - 1; j >= 0; j--) {

                if (data.artist.image[j].size === 'large') {

                    var str = JSON.stringify(data.artist.image[j]);
                    str = str.replace('#text', 'text');
                    data.artist.image[j] = JSON.parse(str);
                    discogsPayLoad.artists[i].image = data.artist.image[j].text;
                }
            }

            renderArtistCards(discogsPayLoad);
            loadUserLocation(discogsPayLoad);

        }).fail(function(data, success) {

            renderLoadingErrorView('LastFM', data);

        }).always(function() {

        });

    });
}

function renderInfoBox(userLocation, discogsPayLoad) {

    var infoBoxHTML = '';

    infoBoxHTML += '<div class="js-info-heading"><span><p class="black-text text-darken-2">Location Information:</p></span></div>';
    infoBoxHTML += '<p>City: ' + userLocation.city + '</p>';
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

    var messageHTML = '<div id="floater"></div>';

    messageHTML += '<div class="js-message"><span><h4 class="thin white-text text-darken-2">Empty Collection</h4></span>';
    messageHTML += '<p>No records are maintained in your Discogs collection</p>';
    messageHTML += '<p>and therefore nothing to show.</p></div>';

    // set visibility of main page element to none
    $('.js-main-page').css('display', 'none');
    // render empty collection message box
    $('.js-message-box').html(messageHTML).fadeIn();
    $('.js-message-box').css('visibility', 'visible');

}

function renderLoadingErrorView(api, data) {

    var messageHTML = '<div id="floater"></div>';

    messageHTML += '<div class="js-message"><span><h4 class="thin white-text text-darken-2">Load Error</h4></span>';
    messageHTML += '<p>Unable to load all information since ' + api + ' API returned following error:</p>';

    if (data.status != 0) {
        messageHTML += '<p>HTTP code ' + data.status + ' - ' + data.statusText + '</p></div>';
    } else {
        messageHTML += '<p>HTTP code 429 (Too Many Requests) No Access-Control-Allow-Origin present</p></div>';
    }

    // set visibility of main page element to none
    $('.js-main-page').css('display', 'none');
    // render empty collection message box  
    $('.js-message-box').html(messageHTML).fadeIn();
    $('.js-message-box').css('visibility', 'visible');

}

jQuery(function($) {
    var target = $('#target');

    $('.toggle-loading').click(function() {
        if (target.hasClass('loading')) {
            target.loadingOverlay('remove');
        } else {
            target.loadingOverlay();
        };
    });
});

function renderArtistCards(discogsPayLoad) {

    var artistHTML = '';
    var counter = 0;
    var noOfColumns = 4;

    // loop over Discogs data load and render page
    for (var i = discogsPayLoad.artists.length - 1; i >= 0; i--) {

        if (counter === 0) {

            artistHTML += '<div class="row">';
        }

        counter++;
        artistHTML += '<div class="col s3 z-depth-3">';
        //artistHTML += '<div class="white-text text-white thin"><span class="card-title"><h5>' + discogsPayLoad.artists[i].name + '<h5></span></div>';
        artistHTML += '<div class="card hoverable">';
        artistHTML += '<div class="card-image waves-effect waves-block waves-light">';
        artistHTML += '<div class="white-text text-white thin"><span class="card-title"><h5>' + discogsPayLoad.artists[i].name + '<h5></span></div>';

        if (discogsPayLoad.artists[i].image === '') {

            artistHTML += '<img class="activator responsive-img" src="./img/missing_image_default.png">';

        } else {

            artistHTML += '<img class="activator responsive-img" src=' + discogsPayLoad.artists[i].image + '>';
        }

        artistHTML += '</div>'; //  closing tag card image
        artistHTML += '<div class="card-content">';
        artistHTML += '<span class="card-title activator grey-text text-darken-4">' + 'Members' + '<i class="material-icons right">' + 'more_vert' + '</i></span>';

        if (discogsPayLoad.artists[i].members === undefined) {

            artistHTML += '<p>No active members found</p>';

        } else {

            artistHTML += '<table><tbody>';

            var memberCount = 0;
            for (var j = discogsPayLoad.artists[i].members.length - 1; j >= 0; j--) {

                if (memberCount === 0) { artistHTML += '<tr>'; }
                memberCount++;
                artistHTML += '<td>' + discogsPayLoad.artists[i].members[j].name + '</td>';
                if (memberCount === 2) {
                    artistHTML += '</tr>';
                    memberCount = 0;
                }
            }

            var emptyMembers = 6 - discogsPayLoad.artists[i].members.length
            if (discogsPayLoad.artists[i].members.length === 0) {
                artistHTML += '<tr><td></td></tr>';
                artistHTML += '<tr><td></td></tr>';
                artistHTML += '<tr><td></td></tr>';
            } else if (discogsPayLoad.artists[i].members.length === 1 || discogsPayLoad.artists[i].members.length === 2) {
                artistHTML += '<tr><td></td></tr>';
                artistHTML += '<tr><td></td></tr>';
            } else if (discogsPayLoad.artists[i].members.length === 3 || discogsPayLoad.artists[i].members.length === 4) {
                artistHTML += '<tr><td></td></tr>';
            }

            artistHTML += '</tbody></table>';
        }

        artistHTML += '</div>'; //  closing tag card content
        artistHTML += '<div class="card-reveal">';
        artistHTML += '<span class="card-title grey-text text-darken-4">' + 'Artist Profile' + '<i class="material-icons right">close</i></span>';
        artistHTML += '<p>' + discogsPayLoad.artists[i].profile + '</p>';
        artistHTML += '</div>'; //  closing tag card reveal
        artistHTML += '<div class="card-stacked">';
        artistHTML += '<div class="card-action">';
        artistHTML += '<a href="#">' + 'Live Events' + '</a>';
        artistHTML += '</div>'; //  closing tag card action
        artistHTML += '</div>'; //  closing tag card stacked
        artistHTML += '</div>'; //  closing tag card type
        artistHTML += '</div>'; //  closing tag column

        if (counter === noOfColumns) {

            counter = 0;
            artistHTML += '</div>'; // closing tag row
        }
    }

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

    loadUserLocation();

});
