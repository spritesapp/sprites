Sprites
=======

Sprites is a free tool for creating beautiful animated infographics on the Web.

Setup
=====

The working name of the project is "Ifly", therefore the root namespace and the database is named that way. 

## Database

First of all, get and install RavenDB from here: https://ravendb.net/download. You can configure it in a development mode, but make sure you map it to port 8080 (e.g. http://localhost:8080). Note that this gets transformed when the app is pushed to production. I personally run RavenDB as a service but it's totally up to you how to host it. After you've installed it, go to http://localhost:8080 and create a new database called "Ifly". You're done with database setup.

## Application

Now go to IIS and create a new website called "local.spritesapp.com" (don't forget to add the appropriate bindings as well as necessary records to hosts file). The root of the website must be mapped to "Ifly.Web". Now add two more nested applications (right click on a website root -> "Add application..."). Call the first "Edit" and the other one "View" - they both must point to "Ifly.Web.Editor". As for the authentication, make sure "Forms authentication" is enabled for website root as well as for nested applications (leave anonymous enabled as well). The last thing is SSL certificates. Go to IIS root and choose "Server Certificates". In the right panel choose "Create Self-Signed Certificate..." and follow the steps. Then select "local.spritesapp.com", go to "Bindings" and configure  HTTPS binding with certificate you just created.

## Building and Running

Open the solution in Visual Studio (2015 at the moment), build. Make sure there're no errors/warnings. Now open "https://local.spritesapp.com/edit", verify that you're redirected to the main page. Log in and verify that the editor loads and works (no JavaScript errors).

You're all set. Happy coding!

License
=======

The source code is available under [GPL v3](https://www.gnu.org/licenses/gpl-3.0.en.html) license.
