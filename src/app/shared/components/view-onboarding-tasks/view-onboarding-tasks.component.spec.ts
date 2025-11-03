import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ViewOnboardingTasksComponent } from './view-onboarding-tasks.component';

describe('ViewOnboardingTasksComponent', () => {
  let component: ViewOnboardingTasksComponent;
  let fixture: ComponentFixture<ViewOnboardingTasksComponent>;
  CommonTestingModule.setUpTestBed(ViewOnboardingTasksComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewOnboardingTasksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewOnboardingTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
