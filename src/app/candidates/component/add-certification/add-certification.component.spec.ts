import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddCertificationComponent } from './add-certification.component';

describe('AddCertificationComponent', () => {
  let component: AddCertificationComponent;
  let fixture: ComponentFixture<AddCertificationComponent>;
  CommonTestingModule.setUpTestBed(AddCertificationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddCertificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCertificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
