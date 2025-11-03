import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HierarchyConfigurationListingComponent } from './hierarchy-configuration-listing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('HierarchyConfigurationListingComponent', () => {
  let component: HierarchyConfigurationListingComponent;
  let fixture: ComponentFixture<HierarchyConfigurationListingComponent>;
  CommonTestingModule.setUpTestBed(HierarchyConfigurationListingComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HierarchyConfigurationListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchyConfigurationListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
