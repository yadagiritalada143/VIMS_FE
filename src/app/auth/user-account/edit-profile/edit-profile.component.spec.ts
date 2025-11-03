import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditProfileComponent } from './edit-profile.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';

describe('EditProfileComponent', () => {
  let component: EditProfileComponent;
  let fixture: ComponentFixture<EditProfileComponent>;
  CommonTestingModule.setUpTestBed(EditProfileComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditProfileComponent, SearchAddressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
