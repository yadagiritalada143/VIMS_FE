import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VendorAccountSetupComponent } from './vendor-account-setup.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';

describe('VendorAccountSetupComponent', () => {
  let component: VendorAccountSetupComponent;
  let fixture: ComponentFixture<VendorAccountSetupComponent>;
  CommonTestingModule.setUpTestBed(VendorAccountSetupComponent)

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [VendorAccountSetupComponent, SearchAddressComponent],
      imports: [RouterTestingModule, NgSelectModule, FormsModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorAccountSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should call secretQuestions', () => {
  //   const spyOne = spyOn<any>(component, 'secretQuestions');
  //   const el = fixture.debugElement.query(By.css('.account-btn.btn.btn-secondary.float-right'));
  //   el.nativeElement.click();
  //   fixture.detectChanges();
  //   expect(spyOne).toHaveBeenCalled();
  // });

  // it('should show error message for firstname', () => {
  //   const firstNameError = 'First name should not be blank';
  //   fixture.detectChanges();
  //   const errorText = fixture.debugElement.query(By.css('.validation-alert')).nativeElement.innerText;
  //   expect(errorText).toEqual(firstNameError);
  // });

});
