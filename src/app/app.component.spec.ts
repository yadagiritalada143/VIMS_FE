// import { TestBed, waitForAsync } from '@angular/core/testing';
// import { RouterTestingModule } from '@angular/router/testing';
// import { AppComponent } from './app.component';
// import { BrowserModule } from '@angular/platform-browser';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { HttpClientModule, HttpClient } from '@angular/common/http';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// // AOT compilation support
// export function httpTranslateLoader(http: HttpClient) {
//   return new TranslateHttpLoader(http);
// }
// describe('AppComponent', () => {
//   beforeEach(waitForAsync(() => {
//     TestBed.configureTestingModule({
//       imports: [
//         RouterTestingModule,
//         BrowserModule,
//         FormsModule,
//         HttpClientModule,
//         ReactiveFormsModule,
//         NgSelectModule,
//         TranslateModule.forRoot({
//           defaultLanguage: 'English (United States)',
//           loader: {
//             provide: TranslateLoader,
//             useFactory: (httpTranslateLoader),
//             deps: [HttpClient]
//           }
//         })
//       ],
//       declarations: [
//         AppComponent
//       ],
//     }).compileComponents();
//   }));

//   it('should create the app', () => {
//     const fixture = TestBed.createComponent(AppComponent);
//     const app = fixture.componentInstance;
//     expect(app).toBeTruthy();
//   });

//   it(`should have as title 'svms-web'`, () => {
//     const fixture = TestBed.createComponent(AppComponent);
//     const app = fixture.componentInstance;
//     expect(app.title).toEqual('TalentIQ VMS 2.0');
//   });
// });
