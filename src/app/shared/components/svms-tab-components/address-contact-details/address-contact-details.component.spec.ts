import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddressContactDetailsComponent } from './address-contact-details.component';

describe('AddressContactDetailsComponent', () => {
  let component: AddressContactDetailsComponent;
  let fixture: ComponentFixture<AddressContactDetailsComponent>;
  CommonTestingModule.setUpTestBed(AddressContactDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddressContactDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddressContactDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
