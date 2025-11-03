import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RoleListingComponent } from './role-listing.component';

describe('RoleListingComponent', () => {
  let component: RoleListingComponent;
  let fixture: ComponentFixture<RoleListingComponent>;
  CommonTestingModule.setUpTestBed(RoleListingComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RoleListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoleListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
