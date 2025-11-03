import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { HierarchyConfigurationComponent } from './hierarchy-configuration.component';

describe('HierarchyConfigurationComponent', () => {
  let component: HierarchyConfigurationComponent;
  let fixture: ComponentFixture<HierarchyConfigurationComponent>;
  CommonTestingModule.setUpTestBed(HierarchyConfigurationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HierarchyConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchyConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
