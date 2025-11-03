import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ConfigCommonListingComponent } from './config-common-listing.component';

describe('ConfigCommonListingComponent', () => {
  let component: ConfigCommonListingComponent;
  let fixture: ComponentFixture<ConfigCommonListingComponent>;
  CommonTestingModule.setUpTestBed(ConfigCommonListingComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigCommonListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigCommonListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
