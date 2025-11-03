import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateHierarchyComponent } from './create-hierarchy.component';

describe('CreateHierarchyComponent', () => {
  let component: CreateHierarchyComponent;
  let fixture: ComponentFixture<CreateHierarchyComponent>;

  CommonTestingModule.setUpTestBed(CreateHierarchyComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
