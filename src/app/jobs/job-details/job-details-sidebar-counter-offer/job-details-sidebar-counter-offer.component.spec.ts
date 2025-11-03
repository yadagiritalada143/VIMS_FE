import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { JobDetailsSidebarCounterOfferComponent } from './job-details-sidebar-counter-offer.component';

describe('JobDetailsSidebarCounterOfferComponent', () => {
  let component: JobDetailsSidebarCounterOfferComponent; 
  let fixture: ComponentFixture<JobDetailsSidebarCounterOfferComponent>;
  CommonTestingModule.setUpTestBed(JobDetailsSidebarCounterOfferComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JobDetailsSidebarCounterOfferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobDetailsSidebarCounterOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
