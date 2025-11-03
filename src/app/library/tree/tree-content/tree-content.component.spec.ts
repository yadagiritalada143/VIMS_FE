import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TreeContentComponent } from './tree-content.component';

describe('TreeContentComponent', () => {
  let component: TreeContentComponent;
  let fixture: ComponentFixture<TreeContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
