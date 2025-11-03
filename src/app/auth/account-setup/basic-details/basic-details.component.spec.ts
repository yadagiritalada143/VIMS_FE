import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BasicDetailsComponent } from './basic-details.component';
import { By } from '@angular/platform-browser';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('BasicDetailsComponent', () => {
  let component: BasicDetailsComponent;
  let fixture: ComponentFixture<BasicDetailsComponent>;
  CommonTestingModule.setUpTestBed(BasicDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call secretQuestions', () => {
    const spyOne = spyOn<any>(component, 'secretQuestions');
    const el = fixture.debugElement.query(By.css('.account-btn.btn.btn-secondary.float-right'));
    el.nativeElement.click();
    fixture.detectChanges();
    expect(spyOne).toHaveBeenCalled();
  });

  it('should show error message for firstname', () => {
    const firstNameError = 'First name should not be blank';
    component.secretQuestions();
    fixture.detectChanges();
    const errorText = fixture.debugElement.query(By.css('.validation-alert')).nativeElement.innerText;
    expect(errorText).toEqual(firstNameError);
  });

});
