import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TreeNodeInfoFormComponent } from './tree-node-info-form.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TreeNodeInfoFormComponent', () => {
  let component: TreeNodeInfoFormComponent;
  let fixture: ComponentFixture<TreeNodeInfoFormComponent>;
  CommonTestingModule.setUpTestBed(TreeNodeInfoFormComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeNodeInfoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
