import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateCandidateComponent } from './create-candidate.component';
import { DobCalendarComponent } from 'src/app/shared/dob-calendar/dob-calendar.component';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
describe('CreateCandidateComponent', () => {
  let component: CreateCandidateComponent;
  let fixture: ComponentFixture<CreateCandidateComponent>;
  CommonTestingModule.setUpTestBed(CreateCandidateComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCandidateComponent , DobCalendarComponent , SearchAddressComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCandidateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
