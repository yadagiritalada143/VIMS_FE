import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SubmittedCandidateSidebarComponent } from './submitted-candidate-sidebar.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
describe('SubmittedCandidateSidebarComponent', () => {
  let component: SubmittedCandidateSidebarComponent;
  let fixture: ComponentFixture<SubmittedCandidateSidebarComponent>;
  CommonTestingModule.setUpTestBed(SubmittedCandidateSidebarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmittedCandidateSidebarComponent,
      LocalDateFormatPipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmittedCandidateSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
