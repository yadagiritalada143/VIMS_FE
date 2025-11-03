import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SubmittedCandidatesComponent } from './submitted-candidates.component';
describe('SubmittedCandidatesComponent', () => {
  let component: SubmittedCandidatesComponent;
  let fixture: ComponentFixture<SubmittedCandidatesComponent>;
  CommonTestingModule.setUpTestBed(SubmittedCandidatesComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SubmittedCandidatesComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmittedCandidatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
