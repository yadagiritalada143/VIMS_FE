import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { WithdrawStatusCandidatesComponent } from './withdraw-status-candidates.component';

describe('WithdrawStatusCandidatesComponent', () => {
  let component: WithdrawStatusCandidatesComponent;
  let fixture: ComponentFixture<WithdrawStatusCandidatesComponent>;
  CommonTestingModule.setUpTestBed(WithdrawStatusCandidatesComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WithdrawStatusCandidatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawStatusCandidatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
