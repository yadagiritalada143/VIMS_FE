import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddVaccinationComponent } from './add-vaccination.component';

describe('AddVaccinationComponent', () => {
  let component: AddVaccinationComponent;
  let fixture: ComponentFixture<AddVaccinationComponent>;
  CommonTestingModule.setUpTestBed(AddVaccinationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddVaccinationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVaccinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
