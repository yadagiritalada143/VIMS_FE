import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

const appLoadStartTime = Date.now();
localStorage.removeItem('app-loaded');
removeLoader();
window.addEventListener("securitypolicyviolation", (e) => {
  console.log(e)
});
function removeLoader() {
  if (localStorage.getItem('app-loaded') === 'true') {
    console.log('Time taken to load the app: ' + (Date.now() - appLoadStartTime) / 1000 + ' seconds');
    document.getElementById('index-loader')?.remove();
  } else {
    setTimeout(() => {
      removeLoader();
    }, 500);
  }
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
