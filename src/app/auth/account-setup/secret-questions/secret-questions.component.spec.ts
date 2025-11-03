import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../shared/shared.module';
import { SecretQuestionsComponent } from './secret-questions.component';
const mockQuestions = [{
  "id": "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJiZjQ0OWE5LTY2YWMtNGQ0Yi05NmUxLTE2NGEzOTZjYTliYiIsInVhIjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg0LjAuNDE0Ny4xMDUgU2FmYXJpLzUzNy4zNiIsImlhdCI6MTU5NzAzODU0NCwiZXhwIjoxNTk5NTI0OTQ0fQ.EWl98ELouT3hfxLKUUL30dQg3FRFi0HfL_WVeYlfLVnDosVQj47Ih1HjtpkvPbLHdnnKMNa271sOseS2PWBk92et1Of2aRDBPAJlsxV20KNgYcbD2Xcol-Nq5WYJuIxYqxMtS8UYYnFBJq-ZU1I79LFZ7GTYt0-1f4mwXkuuvLf_lCSwLxH7t3XEIXTOtX7ZwJeAFZKv7eZMRPm5rlbL4I7efd9ozxR9VjItKRF19eOOA8pYa6w0CplBQv3qH53yz6FiHNe5tzu-DWCTGsXNE74F50R6UM4gFgT-6PJndRN0se1UcE7tgU_vK32WcrXJF7v6hIbCDB851q4pJT-zJA",
  "title": "what is your fav color?"
},
{
  "id": "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJiZjQ0OWE5LTY2YWMtNGQ0Yi05NmUxLTE2NGEzOTZjYTliYiIsInVhIjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg0LjAuNDE0Ny4xMDUgU2FmYXJpLzUzNy4zNiIsImlhdCI6MTU5NzAzODU0NCwiZXhwIjoxNTk5NTI0OTQ0fQ.EWl98ELouT3hfxLKUUL30dQg3FRFi0HfL_WVeYlfLVnDosVQj47Ih1HjtpkvPbLHdnnKMNa271sOseS2PWBk92et1Of2aRDBPAJlsxV20KNgYcbD2Xcol-Nq5WYJuIxYqxMtS8UYYnFBJq-ZU1I79LFZ7GTYt0-1f4mwXkuuvLf_lCSwLxH7t3XEIXTOtX7ZwJeAFZKv7eZMRPm5rlbL4I7efd9ozxR9VjItKRF19eOOA8pYa6w0CplBQv3qH53yz6FiHNe5tzu-DWCTGsXNE74F50R6UM4gFgT-6PJndRN0se1UcE7tgU_vK32WcrXJF7v6hIbCDB851q4pJT-zJB",
  "title": "what is your fav actor?"
},
{
  "id": "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJiZjQ0OWE5LTY2YWMtNGQ0Yi05NmUxLTE2NGEzOTZjYTliYiIsInVhIjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg0LjAuNDE0Ny4xMDUgU2FmYXJpLzUzNy4zNiIsImlhdCI6MTU5NzAzODU0NCwiZXhwIjoxNTk5NTI0OTQ0fQ.EWl98ELouT3hfxLKUUL30dQg3FRFi0HfL_WVeYlfLVnDosVQj47Ih1HjtpkvPbLHdnnKMNa271sOseS2PWBk92et1Of2aRDBPAJlsxV20KNgYcbD2Xcol-Nq5WYJuIxYqxMtS8UYYnFBJq-ZU1I79LFZ7GTYt0-1f4mwXkuuvLf_lCSwLxH7t3XEIXTOtX7ZwJeAFZKv7eZMRPm5rlbL4I7efd9ozxR9VjItKRF19eOOA8pYa6w0CplBQv3qH53yz6FiHNe5tzu-DWCTGsXNE74F50R6UM4gFgT-6PJndRN0se1UcE7tgU_vK32WcrXJF7v6hIbCDB851q4pJT-zJC",
  "title": "what is your nickname?"
},
{
  "id": "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJiZjQ0OWE5LTY2YWMtNGQ0Yi05NmUxLTE2NGEzOTZjYTliYiIsInVhIjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg0LjAuNDE0Ny4xMDUgU2FmYXJpLzUzNy4zNiIsImlhdCI6MTU5NzAzODU0NCwiZXhwIjoxNTk5NTI0OTQ0fQ.EWl98ELouT3hfxLKUUL30dQg3FRFi0HfL_WVeYlfLVnDosVQj47Ih1HjtpkvPbLHdnnKMNa271sOseS2PWBk92et1Of2aRDBPAJlsxV20KNgYcbD2Xcol-Nq5WYJuIxYqxMtS8UYYnFBJq-ZU1I79LFZ7GTYt0-1f4mwXkuuvLf_lCSwLxH7t3XEIXTOtX7ZwJeAFZKv7eZMRPm5rlbL4I7efd9ozxR9VjItKRF19eOOA8pYa6w0CplBQv3qH53yz6FiHNe5tzu-DWCTGsXNE74F50R6UM4gFgT-6PJndRN0se1UcE7tgU_vK32WcrXJF7v6hIbCDB851q4pJT-zJD",
  "title": "what is your fav book?"
},
{
  "id": "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJiZjQ0OWE5LTY2YWMtNGQ0Yi05NmUxLTE2NGEzOTZjYTliYiIsInVhIjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzg0LjAuNDE0Ny4xMDUgU2FmYXJpLzUzNy4zNiIsImlhdCI6MTU5NzAzODU0NCwiZXhwIjoxNTk5NTI0OTQ0fQ.EWl98ELouT3hfxLKUUL30dQg3FRFi0HfL_WVeYlfLVnDosVQj47Ih1HjtpkvPbLHdnnKMNa271sOseS2PWBk92et1Of2aRDBPAJlsxV20KNgYcbD2Xcol-Nq5WYJuIxYqxMtS8UYYnFBJq-ZU1I79LFZ7GTYt0-1f4mwXkuuvLf_lCSwLxH7t3XEIXTOtX7ZwJeAFZKv7eZMRPm5rlbL4I7efd9ozxR9VjItKRF19eOOA8pYa6w0CplBQv3qH53yz6FiHNe5tzu-DWCTGsXNE74F50R6UM4gFgT-6PJndRN0se1UcE7tgU_vK32WcrXJF7v6hIbCDB851q4pJT-zJE",
  "title": "what is your fav city?"
}]
xdescribe('SecretQuestionsComponent', () => {
  let component: SecretQuestionsComponent;
  let fixture: ComponentFixture<SecretQuestionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SecretQuestionsComponent],
      imports: [
        CommonModule,
        SharedModule,
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        FormsModule,
        RouterTestingModule,
        NgSelectModule,
      ],
      // providers:[
      //   { provide: SVG_ICONS_CONFIG, useValue: {} }
      // ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecretQuestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should disable Save button', fakeAsync(() => {
  //   component.security_questions = mockQuestions;
  //   component.security_questions1 = mockQuestions;
  //   component.security_questions2 = mockQuestions;
  //   component.original_security_questions = mockQuestions;
  //   component.original_security_questions1 = mockQuestions;
  //   component.original_security_questions2 = mockQuestions;
  //   tick(500);
  //   fixture.detectChanges();
  //   const el = fixture.debugElement.nativeElement
  //     .querySelector('.account-btn.btn.btn-secondary.float-right').disabled;
  //   expect(el).toBe(true);
  // }));



  // it('should emit onSkip', () => {
  //   fixture.whenStable().then(() => {
  //     const spyOne = spyOn<any>(component.onSkip, 'emit');
  //     const el = fixture.debugElement.query(By.css('.skip-btn')).nativeElement;
  //     el.click();
  //     fixture.detectChanges();
  //     expect(el).toHaveBeenCalled();
  //   });

  // });

  // it('should enable submit button', () => {
  //   component.questionform.patchValue({
  //     question1: 'what is your fav color?',
  //     awnser1: 'Test ans',
  //     question2: 'what is your fav actor?',
  //     awnser2: 'Test ans',
  //     question3: 'what is your nickname?',
  //     awnser3: 'Test ans'
  //   });
  //   fixture.detectChanges();
  //   const el = fixture.debugElement.nativeElement
  //     .querySelector('.account-btn.btn.btn-secondary.float-right').disabled;
  //   expect(el).toBe(false);


  // });
});
