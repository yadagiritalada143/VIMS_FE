import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ApproveRehireCandidateComponent } from './approve-rehire-candidate.component';
import { NgSelectModule } from '@ng-select/ng-select';
describe('ApproveRehireCandidateComponent', () => {
  let component: ApproveRehireCandidateComponent;
  let fixture: ComponentFixture<ApproveRehireCandidateComponent>;
  CommonTestingModule.setUpTestBed(ApproveRehireCandidateComponent)
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApproveRehireCandidateComponent ],
      imports: [
        NgSelectModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveRehireCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
