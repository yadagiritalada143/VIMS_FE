import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditReasonCodeComponent } from './edit-reason-code.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('EditReasonCodeComponent', () => {
  let component: EditReasonCodeComponent;
  let fixture: ComponentFixture<EditReasonCodeComponent>;
  CommonTestingModule.setUpTestBed(EditReasonCodeComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(EditReasonCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
