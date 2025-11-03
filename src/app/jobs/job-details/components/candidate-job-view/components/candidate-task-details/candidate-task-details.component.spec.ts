import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CandidateTaskDetailsComponent } from './candidate-task-details.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
describe('CandidateTaskDetailsComponent', () => {
  let component: CandidateTaskDetailsComponent;
  let fixture: ComponentFixture<CandidateTaskDetailsComponent>;
  CommonTestingModule.setUpTestBed(CandidateTaskDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CandidateTaskDetailsComponent,
      LocalDateFormatPipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandidateTaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
