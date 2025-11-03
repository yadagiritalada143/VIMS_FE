import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HierarchyChildRendererComponent } from './hierarchy-child-renderer.component';

describe('HierarchyChildRendererComponent', () => {
  let component: HierarchyChildRendererComponent;
  let fixture: ComponentFixture<HierarchyChildRendererComponent>;
  
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HierarchyChildRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchyChildRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
