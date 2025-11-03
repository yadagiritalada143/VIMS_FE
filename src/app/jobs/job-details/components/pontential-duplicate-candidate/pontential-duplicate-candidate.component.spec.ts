import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { PontentialDuplicateCandidateComponent } from './pontential-duplicate-candidate.component';

describe('PontentialDuplicateCandidateComponent', () => {
  let component: PontentialDuplicateCandidateComponent;
  let fixture: ComponentFixture<PontentialDuplicateCandidateComponent>;
  CommonTestingModule.setUpTestBed(PontentialDuplicateCandidateComponent)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PontentialDuplicateCandidateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PontentialDuplicateCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
