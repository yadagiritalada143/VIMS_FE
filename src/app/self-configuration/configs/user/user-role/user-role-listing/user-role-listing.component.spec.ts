import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserRoleListingComponent } from './user-role-listing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('UserRoleListingComponent', () => {
  let component: UserRoleListingComponent;
  let fixture: ComponentFixture<UserRoleListingComponent>;
  CommonTestingModule.setUpTestBed(UserRoleListingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(UserRoleListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
