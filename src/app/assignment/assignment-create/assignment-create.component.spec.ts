import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AssignmentCreateComponent } from './assignment-create.component';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
import { ViewOnboardingTasksComponent } from 'src/app/shared/components/view-onboarding-tasks/view-onboarding-tasks.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';

describe('AssignmentCreateComponent', () => {
  let component: AssignmentCreateComponent;
  let fixture: ComponentFixture<AssignmentCreateComponent>;
  CommonTestingModule.setUpTestBed(AssignmentCreateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentCreateComponent,SvmsDatepickerComponent,ViewOnboardingTasksComponent,AccuracyPipe],
      providers:[DecimalPipe]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
