import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JobDetailSidebarComponent } from './job-detail-sidebar.component';

describe('JobDetailSidebarComponent', () => {
  let component: JobDetailSidebarComponent;
  let fixture: ComponentFixture<JobDetailSidebarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDetailSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDetailSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
