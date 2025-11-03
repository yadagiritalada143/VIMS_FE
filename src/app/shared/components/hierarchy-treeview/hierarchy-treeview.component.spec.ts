import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { HierarchyTreeviewComponent } from './hierarchy-treeview.component';

describe('HierarchyTreeviewComponent', () => {
  let component: HierarchyTreeviewComponent;
  let fixture: ComponentFixture<HierarchyTreeviewComponent>;
  CommonTestingModule.setUpTestBed(HierarchyTreeviewComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HierarchyTreeviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchyTreeviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
