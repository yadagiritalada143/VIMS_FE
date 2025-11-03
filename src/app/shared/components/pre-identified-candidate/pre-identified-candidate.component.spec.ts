import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { PreIdentifiedCandidateComponent } from './pre-identified-candidate.component';

describe('PreIdentifiedCandidateComponent', () => {
  let component: PreIdentifiedCandidateComponent;
  let fixture: ComponentFixture<PreIdentifiedCandidateComponent>;
  CommonTestingModule.setUpTestBed(PreIdentifiedCandidateComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreIdentifiedCandidateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreIdentifiedCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
