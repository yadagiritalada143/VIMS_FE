import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateOffersComponent } from './create-offers.component';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe } from '@angular/common';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
import { ViewOnboardingTasksComponent } from 'src/app/shared/components/view-onboarding-tasks/view-onboarding-tasks.component';
describe('CreateOffersComponent', () => {
  let component: CreateOffersComponent;
  let fixture: ComponentFixture<CreateOffersComponent>;
  CommonTestingModule.setUpTestBed(CreateOffersComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateOffersComponent, AccuracyPipe, SvmsDatepickerComponent, ViewOnboardingTasksComponent ],
      providers: [
        DecimalPipe,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
