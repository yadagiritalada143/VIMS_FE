import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewHierarchyComponent } from './new-hierarchy.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NewHierarchyComponent', () => {
  let component: NewHierarchyComponent;
  let fixture: ComponentFixture<NewHierarchyComponent>;
  CommonTestingModule.setUpTestBed(NewHierarchyComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NewHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
