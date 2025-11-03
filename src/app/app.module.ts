import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { AuthInterceptor } from '../app/core/interceptors/auth.interceptor';
import { ErrorHandlerInterceptor } from '../app/core/interceptors/error-handler.interceptor';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { NewSharedModule } from './new-shared/new-shared.module';
import { NotificationsModule } from './program-setup/notifications/notifications.module';
import { SvgIconsModule } from '@ngneat/svg-icon';
import { customFieldsIcons } from 'src/app/svg/custom-fields';
import { ConfigurationModule } from 'src/app/configuration/configuration.module';
import { I18NextModule } from 'angular-i18next';
import { I18N_PROVIDERS } from './i18nextHelper';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@NgModule({
  declarations: [AppComponent],
  imports: [
    InfiniteScrollModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgbModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgSelectModule,
    CoreModule,
    NewSharedModule,
    NotificationsModule,
    SvgIconsModule.forRoot({
      icons: customFieldsIcons,
    }),
    ConfigurationModule,
    I18NextModule.forRoot(),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlerInterceptor,
      multi: true,
    },
    I18N_PROVIDERS,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
