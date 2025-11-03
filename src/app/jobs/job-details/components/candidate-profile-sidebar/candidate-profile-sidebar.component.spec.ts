import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateProfileSidebarComponent } from './candidate-profile-sidebar.component';

describe('CandidateProfileSidebarComponent', () => {
  let component: CandidateProfileSidebarComponent;
  let fixture: ComponentFixture<CandidateProfileSidebarComponent>;
  CommonTestingModule.setUpTestBed(CandidateProfileSidebarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateProfileSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateProfileSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
