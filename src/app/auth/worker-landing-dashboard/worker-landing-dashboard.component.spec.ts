import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerLandingDashboardComponent } from './worker-landing-dashboard.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('WorkerLandingDashboardComponent', () => {
  let component: WorkerLandingDashboardComponent;
  let fixture: ComponentFixture<WorkerLandingDashboardComponent>;
  CommonTestingModule.setUpTestBed(WorkerLandingDashboardComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkerLandingDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
