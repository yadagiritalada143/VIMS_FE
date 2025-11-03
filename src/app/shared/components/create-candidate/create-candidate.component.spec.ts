import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateCandidateComponent } from './create-candidate.component';
import { COMPILER_ERRORS_WITH_GUIDES } from '@angular/compiler-cli/src/ngtsc/diagnostics';

describe('CreateCandidateComponent', () => {
  let component: CreateCandidateComponent;
  let fixture: ComponentFixture<CreateCandidateComponent>;
  CommonTestingModule.setUpTestBed(CreateCandidateComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateCandidateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
