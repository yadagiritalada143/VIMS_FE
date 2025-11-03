import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { WithdrawCandidateComponent } from './withdraw-candidate.component';
import { NgSelectModule } from '@ng-select/ng-select';

describe('WithdrawCandidateComponent', () => {
  let component: WithdrawCandidateComponent;
  let fixture: ComponentFixture<WithdrawCandidateComponent>;
  CommonTestingModule.setUpTestBed(WithdrawCandidateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WithdrawCandidateComponent ],
      imports: [
        NgSelectModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
