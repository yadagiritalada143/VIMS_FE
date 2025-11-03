import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { SelectHierarchyComponent } from './select-hierarchy.component';

describe('SelectHierarchyComponent', () => {
  let component: SelectHierarchyComponent;
  let fixture: ComponentFixture<SelectHierarchyComponent>;
  CommonTestingModule.setUpTestBed(SelectHierarchyComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectHierarchyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
