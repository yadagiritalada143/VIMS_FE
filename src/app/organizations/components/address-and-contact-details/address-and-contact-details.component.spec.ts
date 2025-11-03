import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddressAndContactDetailsComponent } from './address-and-contact-details.component';

describe('AddressAndContactDetailsComponent', () => {
  let component: AddressAndContactDetailsComponent;
  let fixture: ComponentFixture<AddressAndContactDetailsComponent>;
  CommonTestingModule.setUpTestBed(AddressAndContactDetailsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        FormsModule
      ],
      declarations: [AddressAndContactDetailsComponent,SearchAddressComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddressAndContactDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
