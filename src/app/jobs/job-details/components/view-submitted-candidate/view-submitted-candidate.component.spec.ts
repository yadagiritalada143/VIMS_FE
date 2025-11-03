import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ViewSubmittedCandidateComponent } from './view-submitted-candidate.component';

describe('ViewSubmittedCandidateComponent', () => {
  let component: ViewSubmittedCandidateComponent;
  let fixture: ComponentFixture<ViewSubmittedCandidateComponent>;
  CommonTestingModule.setUpTestBed(ViewSubmittedCandidateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewSubmittedCandidateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSubmittedCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
