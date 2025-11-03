import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { NoListingPageComponent } from './no-listing-page.component';

describe('NoListingPageComponent', () => {
  let component: NoListingPageComponent;
  let fixture: ComponentFixture<NoListingPageComponent>;
  CommonTestingModule.setUpTestBed(NoListingPageComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NoListingPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoListingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
