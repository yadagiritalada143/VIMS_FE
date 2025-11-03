import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MassAssignmentComponent } from './mass-assignment.component';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';

describe('MassAssignmentComponent', () => {
  let component: MassAssignmentComponent;
  let fixture: ComponentFixture<MassAssignmentComponent>;
  CommonTestingModule.setUpTestBed(MassAssignmentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MassAssignmentComponent , SvmsDatepickerComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MassAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
