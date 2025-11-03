import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { InterviewDetailsSidebarComponent } from './interview-details-sidebar.component';

describe('InterviewDetailsSidebarComponent', () => {
  let component: InterviewDetailsSidebarComponent;
  let fixture: ComponentFixture<InterviewDetailsSidebarComponent>;
  CommonTestingModule.setUpTestBed(InterviewDetailsSidebarComponent)
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InterviewDetailsSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterviewDetailsSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
