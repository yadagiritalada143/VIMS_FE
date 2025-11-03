import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: "root"
})
export class ConfigurationLoader {
  // private readonly CONFIGURATION_URL = "../../assets/json/configuration.json";
  private _configuration;

  constructor() { }

  public loadConfiguration() {
    const promise = new Promise(function (resolve, reject) {
      const configuration = {
        API_ENDPOINT: {
          "qa2-app.simplifysandbox.net": "https://qa-services.simplifysandbox.net",
          "wipro-global.simplifyvms.com": "https://services-eu.simplifyvms.com",
          "app-eu.simplifyvms.com": "https://services-eu.simplifyvms.com",
          "app-uk.simplifyvms.com": "https://services-uk.simplifyvms.com"
        },
        CMS_API_ENDPOINT: {
          "qa2-app.simplifysandbox.net": "https://qa-cms.simplifysandbox.net",
          "wipro-global.simplifyvms.com": "https://eu-prod-cms.simplifyvms.com",
          "app-eu.simplifyvms.com": "https://eu-prod-cms.simplifyvms.com"
        },
        REPORT_API_ENDPOINT: {
          "app-eu.simplifyvms.com": "https://reports-eu.simplifyvms.com",
          "wipro-global.simplifyvms.com": "https://reports-eu.simplifyvms.com",
          "app-uk.simplifyvms.com": "https://reports-uk.simplifyvms.com"
        },
        LOGIN_SETTING:{
          "uat-marriott.simplifyvmsapp.com": {
            ssoButton: {
              position: "top", // Accepts only 2 values `top` or `bottom`
              customError: {
                message: "<i>Invalid Username or Password.<br>Marriott Associates: Sign In With Single Sign On (SSO)<i>",
                // alignment: "center", // By default `left`, and the other values are `center` and `right`
              },
            }
          },
          "dev-app.simplifysandbox.net":{
            name: "RS Launch",
            supportText: "RS Launch",
            backgroundImage: "https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS+Client+login+screen.jpg",
            logo: 'https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS%20Client-logo.jpg',
            hideText: true,
            isOverlay: false,
            isPoweredBy: true,
            class: 'text-center'
          },
          "app-rslaunch.simplifyvms.com":{
            name: "RS Launch",
            supportText: "RS Launch",
            backgroundImage: "https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS+Client+login+screen.jpg",
            logo: 'https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS%20Client-logo.jpg',
            hideText: true,
            isOverlay: false,
            isPoweredBy: true,
            class: 'text-center'
          },
          "rslaunch-xerox.simplifyvmsapp.com":{
            name: "RS Launch",
            supportText: "RS Launch",
            backgroundImage: "https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS+Client+login+screen.jpg",
            logo: 'https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS%20Client-logo.jpg',
            hideText: true,
            isOverlay: false,
            isPoweredBy: true,
            class: 'text-center'
          },
          "rslaunch-ing.simplifyvmsapp.com":{
            name: "RS Launch",
            supportText: "RS Launch",
            backgroundImage: "https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS+Client+login+screen.jpg",
            logo: 'https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS%20Client-logo.jpg',
            hideText: true,
            isOverlay: false,
            isPoweredBy: true,
            class: 'text-center'
          },
          "rslaunch-aspen.simplifyvmsapp.com":{
            name: "RS Launch",
            supportText: "RS Launch",
            backgroundImage: "https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS+Client+login+screen.jpg",
            logo: 'https://d1mg94l94rtjhz.cloudfront.net/RS_CLIENT/RS%20Client-logo.jpg',
            hideText: true,
            isOverlay: false,
            isPoweredBy: true,
            class: 'text-center'
          }
        }
      }
      resolve(configuration);
    });
    promise.then((configuration: any) => {
      this._configuration = {
        API_ENDPOINT: configuration?.API_ENDPOINT[window.location.host] || environment.API_ENDPOINT,
        CMS_API_ENDPOINT: configuration?.CMS_API_ENDPOINT[window.location.host] || environment.CMS_ENDPOINT,
        REPORT_API_ENDPOINT: configuration?.REPORT_API_ENDPOINT[window.location.host] || environment.REPORT_API_ENDPOINT,
        LOGIN_SETTING: configuration?.LOGIN_SETTING[window.location.host]
      }
      return configuration;
    })
      .catch((error: any) => {
        console.error(error);
      });;
    /* return this._http
      .get(this.CONFIGURATION_URL)
      .toPromise()
      .then((configuration) => {
        this._configuration = {};
        this._configuration.API_ENDPOINT =configuration[window.location.host] || environment.API_ENDPOINT;
        return configuration;
      })
      .catch((error: any) => {
        console.error(error);
      }); */
  }

  getConfiguration() {
    return this._configuration;
  }
}
