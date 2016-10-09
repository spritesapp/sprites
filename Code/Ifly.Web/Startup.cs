using Microsoft.AspNet.Identity;
using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(Ifly.Web.Startup))]

namespace Ifly.Web
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }

        public void ConfigureAuth(IAppBuilder app)
        {
            app.UseExternalSignInCookie(DefaultAuthenticationTypes.ExternalCookie);

            app.UseGoogleAuthentication(
                 clientId: "732432655752-sc8rnb18i0os9s6gg9ru3fnvbdghc6mf.apps.googleusercontent.com",
                 clientSecret: "rK7K4jw-5InCOPmPzoE8iLIM");
        }
    }
}
