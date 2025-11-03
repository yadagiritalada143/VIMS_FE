import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobDetailsSidebarCreateComponent } from './job-details-sidebar-create.component';

describe('JobDetailsSidebarCreateComponent', () => {
  let component: JobDetailsSidebarCreateComponent;
  let fixture: ComponentFixture<JobDetailsSidebarCreateComponent>;
  CommonTestingModule.setUpTestBed(JobDetailsSidebarCreateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDetailsSidebarCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDetailsSidebarCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
