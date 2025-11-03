import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewHierarchyChildRendererComponent } from './new-hierarchy-child-renderer.component';

describe('NewHierarchyChildRendererComponent', () => {
  let component: NewHierarchyChildRendererComponent;
  let fixture: ComponentFixture<NewHierarchyChildRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewHierarchyChildRendererComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewHierarchyChildRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
