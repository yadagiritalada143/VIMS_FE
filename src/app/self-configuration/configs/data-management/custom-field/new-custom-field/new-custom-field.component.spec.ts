import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NewCustomFieldComponent } from './new-custom-field.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NewCustomFieldComponent', () => {
  let component: NewCustomFieldComponent;
  let fixture: ComponentFixture<NewCustomFieldComponent>;
  CommonTestingModule.setUpTestBed(NewCustomFieldComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NewCustomFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
