#Music Chest
Thinkful (https://www.thinkful.com/) end of Frontend Web Development course portfolio project - a website showing any live events in a given radius for the artists found in the Discogs collection of a (Discogs) user.	   

##Introduction
The requirement for this website is that you have a collection maintained with Discogs (https://www.discogs.com/) and that this collection is maintained in the root folder (0). To sign in, a Discogs username must be provided. The collection in this site is organized by artist unlike the Discogs collection which is organized by releases.

##Use Case
This site will show a Discogs user if any of the artists in his/her Discogs collection are performing live within a given radius of the user's ip-address. The images of artists and releases are fetched from LastFM by consuming the artist and albums API's. Images on Discogs are uploaded by users and since the images must be free of any copyright, watermark, URL or other marks, this results in an inconsistent quality.


##Live Site
You can access the Music Chest site at https://robs0207.github.io/My-Music-Chest/

##Technical

* The front-end is built using HTML5, CSS3, JavaScript and Jquery.
* The UX is based upon Google's Material Design guidelines.
* The site is fully responsive, adapting for mobile, table and desktop viewports.

* The following endpoints are called:
- Location of user based upon ip-address: https:freegeoip.net/json/
- Username entered is valid Discogs username: https://api.discogs.com/users/
- Discogs collection: https://api.discogs.com/users/<user>/collection/folders/0/releases?
- Discogs artist: https://www.discogs.com/artist/
- LastFM images: http://ws.audioscrobbler.com/2.0/?
- Live events for artists within a certain radius: http://api.bandsintown.com/artists?

* Frameworks used:
- MaterializeCSS v0.97.8: http://materializecss.com/
- JQuery v2.2.3: https://code.jquery.com/
