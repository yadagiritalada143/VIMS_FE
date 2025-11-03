import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { TaxListingComponent } from './tax-listing.component';

describe('TaxListingComponent', () => {
  let component: TaxListingComponent;
  let fixture: ComponentFixture<TaxListingComponent>;
  CommonTestingModule.setUpTestBed(TaxListingComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
